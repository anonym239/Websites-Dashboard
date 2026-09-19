import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { activitiesTable, appUsersTable, db } from "@workspace/db";
import {
  ListUsersResponse,
  ListUsersResponseItem,
  UpdateUserRoleBody,
  UpdateUserRoleParams,
  UpdateUserRoleResponse,
} from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", requireUser, async (_req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const users = await db.select().from(appUsersTable).orderBy(desc(appUsersTable.lastActiveAt));
  res.json(
    ListUsersResponse.parse(
      users.map((user) =>
        ListUsersResponseItem.parse({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          joinedAt: user.joinedAt,
          lastActiveAt: user.lastActiveAt,
        }),
      ),
    ),
  );
});

router.patch("/users/:userId/role", requireUser, async (req, res): Promise<void> => {
  const currentUser = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!currentUser || !hasRole(currentUser, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const params = UpdateUserRoleParams.safeParse(req.params);
  const body = UpdateUserRoleBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [user] = await db
    .update(appUsersTable)
    .set({ role: body.data.role })
    .where(eq(appUsersTable.id, params.data.userId))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db.insert(activitiesTable).values({
    type: "role_changed",
    message: `Changed ${user.name} to ${user.role}`,
    actorName: currentUser.name,
  });
  res.json(
    UpdateUserRoleResponse.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      joinedAt: user.joinedAt,
      lastActiveAt: user.lastActiveAt,
    }),
  );
});

export default router;