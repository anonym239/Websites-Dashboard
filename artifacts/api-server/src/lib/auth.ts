import type { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { appUsersTable, db } from "@workspace/db";

export type AppRole = "admin" | "moderator" | "member";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: AppRole;
  joinedAt: Date;
  lastActiveAt: Date;
};

function normalizeRole(role: string): AppRole {
  return role === "admin" || role === "moderator" ? role : "member";
}

export async function getCurrentUser(req: Request): Promise<CurrentUser | null> {
  const auth = getAuth(req);
  if (!auth.userId) return null;

  const clerkUser = await clerkClient.users.getUser(auth.userId);
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    primaryEmail.split("@")[0];
  const isBootstrapAdmin =
    primaryEmail.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

  const [user] = await db
    .insert(appUsersTable)
    .values({
      id: auth.userId,
      name,
      email: primaryEmail,
      avatarUrl: clerkUser.imageUrl ?? null,
      role: isBootstrapAdmin ? "admin" : "member",
    })
    .onConflictDoUpdate({
      target: appUsersTable.id,
      set: {
        name,
        email: primaryEmail,
        avatarUrl: clerkUser.imageUrl ?? null,
        lastActiveAt: new Date(),
        ...(isBootstrapAdmin ? { role: "admin" } : {}),
      },
    })
    .returning();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: normalizeRole(user.role),
    joinedAt: user.joinedAt,
    lastActiveAt: user.lastActiveAt,
  };
}

export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    res.locals.currentUser = user;
    next();
  } catch (error) {
    req.log.error({ error }, "Unable to resolve current user");
    res.status(401).json({ error: "Authentication required" });
  }
}

export function hasRole(user: CurrentUser, allowed: AppRole[]): boolean {
  return allowed.includes(user.role);
}

export async function findUserById(id: string): Promise<CurrentUser | null> {
  const [user] = await db
    .select()
    .from(appUsersTable)
    .where(and(eq(appUsersTable.id, id)));
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: normalizeRole(user.role),
    joinedAt: user.joinedAt,
    lastActiveAt: user.lastActiveAt,
  };
}