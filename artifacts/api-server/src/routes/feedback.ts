import { Router, type IRouter, type Request } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import {
  db,
  activitiesTable,
  feedbackModerationHistoryTable,
  feedbackReportsTable,
  teacherFeedbackTable,
} from "@workspace/db";
import {
  CreateFeedbackReportBody,
  CreateFeedbackReportParams,
  CreateFeedbackReportResponse,
  CreateFeedbackBody,
  CreateFeedbackResponse,
  DeleteFeedbackParams,
  GetFeedbackStatsResponse,
  ListFeedbackHistoryParams,
  ListFeedbackHistoryResponse,
  ListFeedbackHistoryResponseItem,
  ListFeedbackResponse,
  ListFeedbackResponseItem,
  ListManagedFeedbackResponse,
  ListManagedFeedbackResponseItem,
  ListFeedbackReportsResponse,
  ListFeedbackReportsResponseItem,
  UpdateFeedbackBody,
  UpdateFeedbackParams,
  UpdateFeedbackResponse,
  UpdateFeedbackReportBody,
  UpdateFeedbackReportParams,
  UpdateFeedbackReportResponse,
} from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS_PER_SOURCE = 5;
const DUPLICATE_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const MAX_DUPLICATE_CANDIDATES = 200;
const submissionTimesBySource = new Map<string, number[]>();

function getRequestSource(req: Request): string {
  return req.ip || req.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
}

function takeSubmissionSlot(source: string, now: number): number | null {
  const recentSubmissions = (submissionTimesBySource.get(source) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_SOURCE) {
    submissionTimesBySource.set(source, recentSubmissions);
    return Math.max(1, Math.ceil((recentSubmissions[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
  }

  recentSubmissions.push(now);
  submissionTimesBySource.set(source, recentSubmissions);
  return null;
}

function normalizeForComparison(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }

  return previous[right.length];
}

function isNearDuplicate(candidate: string, existing: string): boolean {
  if (candidate === existing) return true;
  if (candidate.length < 24 || existing.length < 24) return false;

  const longest = Math.max(candidate.length, existing.length);
  return 1 - editDistance(candidate, existing) / longest >= 0.9;
}

router.get("/feedback", async (_req, res): Promise<void> => {
  const feedback = await db
    .select()
    .from(teacherFeedbackTable)
    .where(eq(teacherFeedbackTable.isVisible, true))
    .orderBy(desc(teacherFeedbackTable.createdAt))
    .limit(30);

  res.json(
    ListFeedbackResponse.parse(
      feedback.map((item) =>
        ListFeedbackResponseItem.parse({
          id: item.id,
          teacherName: item.teacherName,
          feedback: item.feedback,
          rating: item.rating,
          createdAt: item.createdAt,
        }),
      ),
    ),
  );
});

router.get("/feedback/stats", async (_req, res): Promise<void> => {
  const feedback = await db
    .select({ rating: teacherFeedbackTable.rating })
    .from(teacherFeedbackTable)
    .where(eq(teacherFeedbackTable.isVisible, true));

  const distribution = {
    oneStar: 0,
    twoStars: 0,
    threeStars: 0,
    fourStars: 0,
    fiveStars: 0,
  };

  let ratingTotal = 0;
  for (const item of feedback) {
    ratingTotal += item.rating;
    if (item.rating === 1) distribution.oneStar += 1;
    if (item.rating === 2) distribution.twoStars += 1;
    if (item.rating === 3) distribution.threeStars += 1;
    if (item.rating === 4) distribution.fourStars += 1;
    if (item.rating === 5) distribution.fiveStars += 1;
  }

  res.json(
    GetFeedbackStatsResponse.parse({
      averageRating:
        feedback.length > 0
          ? Math.round((ratingTotal / feedback.length) * 10) / 10
          : 0,
      totalCount: feedback.length,
      distribution,
    }),
  );
});

router.get("/feedback/manage", requireUser, async (_req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin", "moderator"])) {
    res.status(403).json({ error: "Admin or moderator role required" });
    return;
  }

  const feedback = await db
    .select()
    .from(teacherFeedbackTable)
    .orderBy(desc(teacherFeedbackTable.createdAt));

  res.json(
    ListManagedFeedbackResponse.parse(
      feedback.map((item) =>
        ListManagedFeedbackResponseItem.parse({
          id: item.id,
          teacherName: item.teacherName,
          feedback: item.feedback,
          rating: item.rating,
          isVisible: item.isVisible,
          createdAt: item.createdAt,
        }),
      ),
    ),
  );
});

router.get("/feedback/:feedbackId/history", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin", "moderator"])) {
    res.status(403).json({ error: "Admin or moderator role required" });
    return;
  }

  const params = ListFeedbackHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Ungültige Feedback-ID." });
    return;
  }

  const [feedback] = await db
    .select({ id: teacherFeedbackTable.id })
    .from(teacherFeedbackTable)
    .where(eq(teacherFeedbackTable.id, params.data.feedbackId));
  if (!feedback) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  const history = await db
    .select()
    .from(feedbackModerationHistoryTable)
    .where(eq(feedbackModerationHistoryTable.feedbackId, params.data.feedbackId))
    .orderBy(desc(feedbackModerationHistoryTable.createdAt));
  res.json(
    ListFeedbackHistoryResponse.parse(
      history.map((item) =>
        ListFeedbackHistoryResponseItem.parse({
          id: item.id,
          feedbackId: item.feedbackId,
          action: item.action,
          reason: item.reason,
          actorId: item.actorId,
          actorName: item.actorName,
          createdAt: item.createdAt,
        }),
      ),
    ),
  );
});

router.get("/feedback/reports", requireUser, async (_req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin", "moderator"])) {
    res.status(403).json({ error: "Admin or moderator role required" });
    return;
  }

  const reports = await db.select().from(feedbackReportsTable).orderBy(desc(feedbackReportsTable.createdAt));
  res.json(
    ListFeedbackReportsResponse.parse(
      reports.map((report) =>
        ListFeedbackReportsResponseItem.parse({
          id: report.id,
          feedbackId: report.feedbackId,
          reason: report.reason,
          details: report.details,
          status: report.status,
          reviewedBy: report.reviewedBy,
          reviewedAt: report.reviewedAt,
          createdAt: report.createdAt,
        }),
      ),
    ),
  );
});

router.post("/feedback/:feedbackId/report", async (req, res): Promise<void> => {
  const params = CreateFeedbackReportParams.safeParse(req.params);
  const body = CreateFeedbackReportBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Bitte einen gültigen Meldegrund angeben." });
    return;
  }

  const [feedback] = await db
    .select({ id: teacherFeedbackTable.id })
    .from(teacherFeedbackTable)
    .where(and(eq(teacherFeedbackTable.id, params.data.feedbackId), eq(teacherFeedbackTable.isVisible, true)));
  if (!feedback) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  const [existing] = await db
    .select({ id: feedbackReportsTable.id })
    .from(feedbackReportsTable)
    .where(
      and(
        eq(feedbackReportsTable.feedbackId, params.data.feedbackId),
        eq(feedbackReportsTable.reason, body.data.reason),
        eq(feedbackReportsTable.status, "open"),
      ),
    )
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "Diese Meldung liegt bereits vor." });
    return;
  }

  const [report] = await db
    .insert(feedbackReportsTable)
    .values({
      feedbackId: params.data.feedbackId,
      reason: body.data.reason,
      details: body.data.details?.trim() || null,
    })
    .returning();
  await db.insert(activitiesTable).values({
    type: "feedback_reported",
    message: `Feedback wurde gemeldet (${body.data.reason})`,
    actorName: "Öffentlicher Nutzer",
  });
  res.status(201).json(
    CreateFeedbackReportResponse.parse({
      id: report.id,
      feedbackId: report.feedbackId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
    }),
  );
});

router.patch("/feedback/reports/:reportId", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin", "moderator"])) {
    res.status(403).json({ error: "Admin or moderator role required" });
    return;
  }
  const params = UpdateFeedbackReportParams.safeParse(req.params);
  const body = UpdateFeedbackReportBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Ungültiger Meldungsstatus." });
    return;
  }
  const [report] = await db
    .update(feedbackReportsTable)
    .set({
      status: body.data.status,
      reviewedBy: currentUser.name,
      reviewedAt: new Date(),
    })
    .where(eq(feedbackReportsTable.id, params.data.reportId))
    .returning();
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  await db.insert(activitiesTable).values({
    type: "feedback_report_resolved",
    message: `Feedback-Meldung #${report.id} wurde ${body.data.status === "reviewed" ? "geprüft" : "verworfen"}`,
    actorName: currentUser.name,
  });
  res.json(
    UpdateFeedbackReportResponse.parse({
      id: report.id,
      feedbackId: report.feedbackId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
    }),
  );
});

router.patch("/feedback/:feedbackId", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin", "moderator"])) {
    res.status(403).json({ error: "Admin or moderator role required" });
    return;
  }

  const params = UpdateFeedbackParams.safeParse(req.params);
  const body = UpdateFeedbackBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Ungültige Feedback-Einstellungen." });
    return;
  }

  const [updated] = await db
    .update(teacherFeedbackTable)
    .set({ isVisible: body.data.isVisible })
    .where(eq(teacherFeedbackTable.id, params.data.feedbackId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  await db.insert(feedbackModerationHistoryTable).values({
    feedbackId: updated.id,
    action: body.data.isVisible ? "published" : "hidden",
    reason: body.data.reason?.trim() || null,
    actorId: currentUser.id,
    actorName: currentUser.name,
  });
  await db.insert(activitiesTable).values({
    type: body.data.isVisible ? "feedback_published" : "feedback_hidden",
    message: `${currentUser.name} hat Feedback von ${updated.teacherName} ${body.data.isVisible ? "veröffentlicht" : "ausgeblendet"}`,
    actorName: currentUser.name,
  });

  res.json(
    UpdateFeedbackResponse.parse({
      id: updated.id,
      teacherName: updated.teacherName,
      feedback: updated.feedback,
      rating: updated.rating,
      isVisible: updated.isVisible,
      createdAt: updated.createdAt,
    }),
  );
});

router.delete("/feedback/:feedbackId", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const params = DeleteFeedbackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(teacherFeedbackTable)
    .where(eq(teacherFeedbackTable.id, params.data.feedbackId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }

  await db.insert(feedbackModerationHistoryTable).values({
    feedbackId: deleted.id,
    action: "deleted",
    reason: "Von einem Admin gelöscht",
    actorId: currentUser.id,
    actorName: currentUser.name,
  });

  res.sendStatus(204);
});

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bitte Name, Feedback und eine Bewertung von 1 bis 5 Sternen angeben." });
    return;
  }

  const teacherName = parsed.data.teacherName.trim();
  const feedback = parsed.data.feedback.trim();
  if (teacherName.length < 2 || feedback.length < 3) {
    res.status(400).json({ error: "Bitte einen gültigen Namen und ein gültiges Feedback eingeben." });
    return;
  }

  const retryAfterSeconds = takeSubmissionSlot(getRequestSource(req), Date.now());
  if (retryAfterSeconds !== null) {
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      error: "Du hast gerade mehrere Rückmeldungen gesendet. Bitte versuche es in ein paar Minuten erneut.",
    });
    return;
  }

  const normalizedFeedback = normalizeForComparison(feedback);
  const recentFeedback = await db
    .select({
      feedback: teacherFeedbackTable.feedback,
    })
    .from(teacherFeedbackTable)
    .where(gte(teacherFeedbackTable.createdAt, new Date(Date.now() - DUPLICATE_LOOKBACK_MS)))
    .orderBy(desc(teacherFeedbackTable.createdAt))
    .limit(MAX_DUPLICATE_CANDIDATES);

  if (
    recentFeedback.some(
      (item) => isNearDuplicate(normalizedFeedback, normalizeForComparison(item.feedback)),
    )
  ) {
    res.status(409).json({
      error: "Diese Rückmeldung wurde bereits sehr ähnlich eingereicht. Bitte sende nur eine Version davon.",
    });
    return;
  }

  const [created] = await db
    .insert(teacherFeedbackTable)
    .values({
      teacherName,
      feedback,
      rating: parsed.data.rating,
    })
    .returning();

  res.status(201).json(
    CreateFeedbackResponse.parse({
      id: created.id,
      teacherName: created.teacherName,
      feedback: created.feedback,
      rating: created.rating,
      createdAt: created.createdAt,
    }),
  );
});

export default router;