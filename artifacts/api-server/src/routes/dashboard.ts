import { Router, type IRouter } from "express";
import { count, desc, eq, sql, sum } from "drizzle-orm";
import {
  activitiesTable,
  appUsersTable,
  db,
  eventsTable,
  memberRequestsTable,
  teacherFeedbackTable,
  websitesTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetCurrentUserResponse,
  ListActivityResponse,
  ListActivityResponseItem,
} from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/session/me", requireUser, async (_req, res): Promise<void> => {
  const user = res.locals.currentUser;
  res.json(GetCurrentUserResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    joinedAt: user.joinedAt,
    lastActiveAt: user.lastActiveAt,
    profileVisibility: user.profileVisibility,
  }));
});

router.get("/dashboard/summary", requireUser, async (_req, res): Promise<void> => {
  const [websiteStats] = await db
    .select({
      total: count(websitesTable.id),
      live: sql<number>`count(*) filter (where ${websitesTable.status} = 'live')`,
      visits: sum(websitesTable.visits),
    })
    .from(websitesTable);
  const [userStats] = await db.select({ total: count(appUsersTable.id) }).from(appUsersTable);
  const [openRequestStats] = await db
    .select({ total: count(memberRequestsTable.id) })
    .from(memberRequestsTable)
    .where(sql`${memberRequestsTable.status} in ('open', 'in_progress')`);
  const [pendingFeedbackStats] = await db
    .select({ total: count(teacherFeedbackTable.id) })
    .from(teacherFeedbackTable)
    .where(eq(teacherFeedbackTable.isVisible, false));
  const [activeEventStats] = await db
    .select({ total: count(eventsTable.id) })
    .from(eventsTable)
    .where(eq(eventsTable.isActive, true));
  const [newMemberStats] = await db
    .select({ total: count(appUsersTable.id) })
    .from(appUsersTable)
    .where(sql`${appUsersTable.joinedAt} >= now() - interval '30 days'`);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalWebsites: Number(websiteStats?.total ?? 0),
      liveWebsites: Number(websiteStats?.live ?? 0),
      totalVisits: Number(websiteStats?.visits ?? 0),
      registeredUsers: Number(userStats?.total ?? 0),
      openRequests: Number(openRequestStats?.total ?? 0),
      pendingFeedback: Number(pendingFeedbackStats?.total ?? 0),
      activeEvents: Number(activeEventStats?.total ?? 0),
      newMembers: Number(newMemberStats?.total ?? 0),
      uptime: "99.98%",
    }),
  );
});

router.get("/admin/activity", requireUser, async (_req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const activities = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.createdAt))
    .limit(50);
  res.json(ListActivityResponse.parse(activities.map((activity) =>
    ListActivityResponseItem.parse({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      actorName: activity.actorName,
      createdAt: activity.createdAt,
    }),
  )));
});

router.get("/dashboard/activity", requireUser, async (_req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.createdAt))
    .limit(12);
  const parsed = activities.map((activity) =>
    ListActivityResponseItem.parse({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      actorName: activity.actorName,
      createdAt: activity.createdAt,
    }),
  );
  res.json(ListActivityResponse.parse(parsed));
});

export default router;