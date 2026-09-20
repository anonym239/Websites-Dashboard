import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  activitiesTable,
  appUsersTable,
  db,
  memberNotificationsTable,
  memberRequestHistoryTable,
  memberRequestsTable,
  websiteFavoritesTable,
  websitesTable,
} from "@workspace/db";
import {
  CreateMemberFavoriteParams,
  CreateMemberFavoriteResponse,
  CreateMemberRequestBody,
  CreateMemberRequestResponse,
  DeleteManagedMemberRequestParams,
  GetMemberProfileResponse,
  ListMemberRequestHistoryParams,
  ListMemberRequestHistoryResponse,
  ListMemberRequestHistoryResponseItem,
  DeleteMemberFavoriteParams,
  ListManagedMemberRequestsResponse,
  ListManagedMemberRequestsResponseItem,
  ListMemberFavoritesResponse,
  ListMemberFavoritesResponseItem,
  ListMemberNotificationsResponse,
  ListMemberNotificationsResponseItem,
  ListMemberRequestsResponse,
  ListMemberRequestsResponseItem,
  MarkMemberNotificationReadParams,
  MarkMemberNotificationReadResponse,
  UpdateMemberProfileBody,
  UpdateMemberProfileResponse,
  UpdateMemberRequestBody,
  UpdateMemberRequestParams,
  UpdateMemberRequestResponse,
  WithdrawMemberRequestParams,
  WithdrawMemberRequestResponse,
  UpdateMemberRequestStatusBody,
  UpdateMemberRequestStatusParams,
  UpdateMemberRequestStatusResponse,
} from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();

function serializeWebsite(row: typeof websitesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    githubUrl: row.githubUrl,
    imageUrl: row.imageUrl,
    description: row.description,
    status: row.status,
    visits: row.visits,
    updatedAt: row.updatedAt,
    ownerName: row.ownerName,
  };
}

function serializeRequest(row: typeof memberRequestsTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeNotification(row: typeof memberNotificationsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

router.get("/member/favorites", requireUser, async (_req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const rows = await db
    .select({ website: websitesTable })
    .from(websiteFavoritesTable)
    .innerJoin(websitesTable, eq(websiteFavoritesTable.websiteId, websitesTable.id))
    .where(eq(websiteFavoritesTable.userId, user.id))
    .orderBy(desc(websiteFavoritesTable.createdAt));
  res.json(ListMemberFavoritesResponse.parse(rows.map(({ website }) => serializeWebsite(website))));
});

router.post("/member/favorites/:websiteId", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const params = CreateMemberFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [website] = await db.select().from(websitesTable).where(eq(websitesTable.id, params.data.websiteId));
  if (!website) {
    res.status(404).json({ error: "Website not found" });
    return;
  }
  await db
    .insert(websiteFavoritesTable)
    .values({ userId: user.id, websiteId: website.id })
    .onConflictDoNothing();
  res.status(201).json(CreateMemberFavoriteResponse.parse(serializeWebsite(website)));
});

router.delete("/member/favorites/:websiteId", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const params = DeleteMemberFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(websiteFavoritesTable)
    .where(and(eq(websiteFavoritesTable.userId, user.id), eq(websiteFavoritesTable.websiteId, params.data.websiteId)));
  res.sendStatus(204);
});

router.get("/member/requests", requireUser, async (_req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const requests = await db
    .select()
    .from(memberRequestsTable)
    .where(eq(memberRequestsTable.userId, user.id))
    .orderBy(desc(memberRequestsTable.createdAt));
  res.json(ListMemberRequestsResponse.parse(requests.map(serializeRequest)));
});

router.post("/member/requests", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const body = CreateMemberRequestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [request] = await db
    .insert(memberRequestsTable)
    .values({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      message: body.data.message.trim(),
    })
    .returning();
  await db.insert(memberRequestHistoryTable).values({
    requestId: request.id,
    status: request.status,
    message: request.message,
    actorId: user.id,
    actorName: user.name,
  });
  await db.insert(activitiesTable).values({
    type: "member_request_created",
    message: `${user.name} hat eine neue Projektanfrage gesendet`,
    actorName: user.name,
  });
  res.status(201).json(CreateMemberRequestResponse.parse(serializeRequest(request)));
});

router.get("/member/notifications", requireUser, async (_req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const notifications = await db
    .select()
    .from(memberNotificationsTable)
    .where(eq(memberNotificationsTable.userId, user.id))
    .orderBy(desc(memberNotificationsTable.createdAt));
  res.json(ListMemberNotificationsResponse.parse(notifications.map(serializeNotification)));
});

router.patch("/member/notifications/:notificationId/read", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const params = MarkMemberNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [notification] = await db
    .update(memberNotificationsTable)
    .set({ isRead: true })
    .where(and(eq(memberNotificationsTable.id, params.data.notificationId), eq(memberNotificationsTable.userId, user.id)))
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkMemberNotificationReadResponse.parse(serializeNotification(notification)));
});

router.get("/member/profile", requireUser, async (_req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  res.json(GetMemberProfileResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    profileVisibility: user.profileVisibility,
  }));
});

router.patch("/member/profile", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const body = UpdateMemberProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Ungültige Profileinstellung." });
    return;
  }
  const [updated] = await db
    .update(appUsersTable)
    .set({ profileVisibility: body.data.profileVisibility })
    .where(eq(appUsersTable.id, user.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db.insert(activitiesTable).values({
    type: "profile_updated",
    message: `${user.name} hat die Profil-Sichtbarkeit geändert`,
    actorName: user.name,
  });
  res.json(UpdateMemberProfileResponse.parse({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    avatarUrl: updated.avatarUrl,
    role: user.role,
    profileVisibility: updated.profileVisibility,
  }));
});

router.get("/member/requests/:requestId/history", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const params = ListMemberRequestHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Ungültige Anfrage-ID." });
    return;
  }
  const [request] = await db
    .select()
    .from(memberRequestsTable)
    .where(eq(memberRequestsTable.id, params.data.requestId));
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (request.userId !== user.id && !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Not allowed to view this request" });
    return;
  }
  const history = await db
    .select()
    .from(memberRequestHistoryTable)
    .where(eq(memberRequestHistoryTable.requestId, request.id))
    .orderBy(desc(memberRequestHistoryTable.createdAt));
  res.json(ListMemberRequestHistoryResponse.parse(history.map((item) => ListMemberRequestHistoryResponseItem.parse({
    id: item.id,
    requestId: item.requestId,
    status: item.status,
    message: item.message,
    actorId: item.actorId,
    actorName: item.actorName,
    createdAt: item.createdAt,
  }))));
});

router.patch("/member/requests/:requestId", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const params = UpdateMemberRequestParams.safeParse(req.params);
  const body = UpdateMemberRequestBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Bitte eine gültige Nachricht eingeben." });
    return;
  }
  const [existing] = await db.select().from(memberRequestsTable).where(eq(memberRequestsTable.id, params.data.requestId));
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (existing.userId !== user.id) {
    res.status(403).json({ error: "Not allowed to edit this request" });
    return;
  }
  if (existing.status === "closed" || existing.status === "withdrawn") {
    res.status(400).json({ error: "Diese Anfrage kann nicht mehr ergänzt werden." });
    return;
  }
  const [updated] = await db.update(memberRequestsTable)
    .set({ message: body.data.message.trim() })
    .where(eq(memberRequestsTable.id, existing.id))
    .returning();
  await db.insert(memberRequestHistoryTable).values({
    requestId: updated.id,
    status: updated.status,
    message: updated.message,
    actorId: user.id,
    actorName: user.name,
  });
  res.json(UpdateMemberRequestResponse.parse(serializeRequest(updated)));
});

router.delete("/member/requests/:requestId", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user) return;
  const params = WithdrawMemberRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Ungültige Anfrage-ID." });
    return;
  }
  const [existing] = await db.select().from(memberRequestsTable).where(eq(memberRequestsTable.id, params.data.requestId));
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (existing.userId !== user.id) {
    res.status(403).json({ error: "Not allowed to withdraw this request" });
    return;
  }
  if (existing.status === "closed" || existing.status === "withdrawn") {
    res.status(400).json({ error: "Diese Anfrage kann nicht zurückgezogen werden." });
    return;
  }
  const [updated] = await db.update(memberRequestsTable)
    .set({ status: "withdrawn" })
    .where(eq(memberRequestsTable.id, existing.id))
    .returning();
  await db.insert(memberRequestHistoryTable).values({
    requestId: updated.id,
    status: updated.status,
    message: updated.message,
    actorId: user.id,
    actorName: user.name,
  });
  await db.insert(memberNotificationsTable).values({
    userId: user.id,
    title: "Anfrage zurückgezogen",
    message: "Deine Projektanfrage wurde zurückgezogen.",
  });
  await db.insert(activitiesTable).values({
    type: "member_request_withdrawn",
    message: `${user.name} hat eine Projektanfrage zurückgezogen`,
    actorName: user.name,
  });
  res.json(WithdrawMemberRequestResponse.parse(serializeRequest(updated)));
});

router.get("/requests/manage", requireUser, async (_req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const requests = await db.select().from(memberRequestsTable).orderBy(desc(memberRequestsTable.createdAt));
  res.json(
    ListManagedMemberRequestsResponse.parse(
      requests.map((request) => ListManagedMemberRequestsResponseItem.parse(serializeRequest(request))),
    ),
  );
});

router.patch("/requests/:requestId/status", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const params = UpdateMemberRequestStatusParams.safeParse(req.params);
  const body = UpdateMemberRequestStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Ungültiger Anfragenstatus." });
    return;
  }
  const [request] = await db
    .update(memberRequestsTable)
    .set({ status: body.data.status })
    .where(eq(memberRequestsTable.id, params.data.requestId))
    .returning();
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  await db.insert(memberNotificationsTable).values({
    userId: request.userId,
    title: "Projektanfrage aktualisiert",
    message: `Deine Anfrage wurde auf „${body.data.status === "in_progress" ? "In Bearbeitung" : body.data.status === "closed" ? "Erledigt" : "Offen"}“ gesetzt.`,
  });
  await db.insert(memberRequestHistoryTable).values({
    requestId: request.id,
    status: request.status,
    message: request.message,
    actorId: user.id,
    actorName: user.name,
  });
  await db.insert(activitiesTable).values({
    type: "member_request_updated",
    message: `Projektanfrage von ${request.userName} wurde aktualisiert`,
    actorName: user.name,
  });
  res.json(UpdateMemberRequestStatusResponse.parse(serializeRequest(request)));
});

router.delete("/requests/:requestId", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const params = DeleteManagedMemberRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Ungültige Anfrage-ID." });
    return;
  }
  const [deleted] = await db
    .delete(memberRequestsTable)
    .where(eq(memberRequestsTable.id, params.data.requestId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  await db.delete(memberRequestHistoryTable).where(eq(memberRequestHistoryTable.requestId, deleted.id));
  await db.insert(activitiesTable).values({
    type: "member_request_updated",
    message: `Projektanfrage von ${deleted.userName} wurde gelöscht`,
    actorName: user.name,
  });
  res.sendStatus(204);
});

export default router;