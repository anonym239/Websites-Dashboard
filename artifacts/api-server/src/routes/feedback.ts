import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, teacherFeedbackTable } from "@workspace/db";
import {
  CreateFeedbackBody,
  CreateFeedbackResponse,
  DeleteFeedbackParams,
  ListFeedbackResponse,
  ListFeedbackResponseItem,
  ListManagedFeedbackResponse,
  ListManagedFeedbackResponseItem,
  UpdateFeedbackBody,
  UpdateFeedbackParams,
  UpdateFeedbackResponse,
} from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();

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