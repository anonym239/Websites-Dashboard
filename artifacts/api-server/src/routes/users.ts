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
import { getCurrentUser, hasRole, isBootstrapAdminEmail, requireUser } from "../lib/auth";

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
           role: isBootstrapAdminEmail(user.email) ? "admin" : user.role,
           profileVisibility: user.profileVisibility,
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
  const existingUser = await db
    .select()
    .from(appUsersTable)
    .where(eq(appUsersTable.id, params.data.userId))
    .then((rows) => rows[0]);
  if (!existingUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const enforcedRole = isBootstrapAdminEmail(existingUser.email) ? "admin" : body.data.role;
  const [user] = await db
    .update(appUsersTable)
    .set({ role: enforcedRole })
    .where(eq(appUsersTable.id, params.data.userId))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db.insert(activitiesTable).values({
    type: "role_changed",
    message: `Changed ${user.name} to ${enforcedRole}`,
    actorName: currentUser.name,
  });
  res.json(
    UpdateUserRoleResponse.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      profileVisibility: user.profileVisibility,
      joinedAt: user.joinedAt,
      lastActiveAt: user.lastActiveAt,
    }),
  );
});

export default router;