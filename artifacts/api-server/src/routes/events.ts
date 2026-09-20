import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { activitiesTable, db, eventsTable } from "@workspace/db";
import {
  CreateEventBody,
  CreateEventResponse,
  DeleteEventParams,
  ListActiveEventsResponse,
  ListActiveEventsResponseItem,
  ListManagedEventsResponse,
  ListManagedEventsResponseItem,
  UpdateEventBody,
  UpdateEventParams,
  UpdateEventResponse,
} from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();

function serializeEvent(row: typeof eventsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    imageUrl: row.imageUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/events/active", async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.isActive, true))
    .orderBy(desc(eventsTable.createdAt))
    .limit(1);

  res.json(
    ListActiveEventsResponse.parse(
      events.map((event) => ListActiveEventsResponseItem.parse(serializeEvent(event))),
    ),
  );
});

router.get("/events/manage", requireUser, async (_req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const events = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));
  res.json(
    ListManagedEventsResponse.parse(
      events.map((event) => ListManagedEventsResponseItem.parse(serializeEvent(event))),
    ),
  );
});

router.post("/events", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const body = CreateEventBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Bitte Titel und Nachricht für das Event angeben." });
    return;
  }

  const [created] = await db
    .insert(eventsTable)
    .values({
      title: body.data.title.trim(),
      message: body.data.message.trim(),
      imageUrl: body.data.imageUrl ?? null,
      isActive: body.data.isActive ?? true,
    })
    .returning();

  await db.insert(activitiesTable).values({
    type: "event_created",
    message: `Event veröffentlicht: ${created.title}`,
    actorName: currentUser.name,
  });

  res.status(201).json(CreateEventResponse.parse(serializeEvent(created)));
});

router.patch("/events/:eventId", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const params = UpdateEventParams.safeParse(req.params);
  const body = UpdateEventBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Ungültige Event-Einstellungen." });
    return;
  }

  const [updated] = await db
    .update(eventsTable)
    .set({
      ...(body.data.title === undefined ? {} : { title: body.data.title.trim() }),
      ...(body.data.message === undefined ? {} : { message: body.data.message.trim() }),
      ...(body.data.imageUrl === undefined ? {} : { imageUrl: body.data.imageUrl ?? null }),
      ...(body.data.isActive === undefined ? {} : { isActive: body.data.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(eventsTable.id, params.data.eventId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(UpdateEventResponse.parse(serializeEvent(updated)));
});

router.delete("/events/:eventId", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Ungültige Event-ID." });
    return;
  }

  const [deleted] = await db
    .delete(eventsTable)
    .where(eq(eventsTable.id, params.data.eventId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;