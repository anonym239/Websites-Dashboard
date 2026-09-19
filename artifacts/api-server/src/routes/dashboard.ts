import { Router, type IRouter } from "express";
import { count, desc, eq, sql, sum } from "drizzle-orm";
import { activitiesTable, appUsersTable, db, websitesTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetCurrentUserResponse,
  ListActivityResponse,
  ListActivityResponseItem,
} from "@workspace/api-zod";
import { requireUser } from "../lib/auth";

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

  res.json(
    GetDashboardSummaryResponse.parse({
      totalWebsites: Number(websiteStats?.total ?? 0),
      liveWebsites: Number(websiteStats?.live ?? 0),
      totalVisits: Number(websiteStats?.visits ?? 0),
      registeredUsers: Number(userStats?.total ?? 0),
      uptime: "99.98%",
    }),
  );
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