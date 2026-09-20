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
  profileVisibility: "private" | "public";
};

const FALLBACK_ADMIN_EMAILS = new Set(["alexanderfuchs304@gmail.com"]);

function normalizeRole(role: string): AppRole {
  return role === "admin" || role === "moderator" ? role : "member";
}

function normalizeProfileVisibility(value: string): "private" | "public" {
  return value === "public" ? "public" : "private";
}

function normalizeEmail(email: string): string {
  return email.normalize("NFKC").trim().toLowerCase();
}

function getAdminEmailAllowlist(): Set<string> {
  const configuredEmails = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .flatMap((value) => value!.split(","));

  return new Set([
    ...FALLBACK_ADMIN_EMAILS,
    ...configuredEmails.map(normalizeEmail).filter(Boolean),
  ]);
}

export function isBootstrapAdminEmail(email: string): boolean {
  return getAdminEmailAllowlist().has(normalizeEmail(email));
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
  const isBootstrapAdmin = clerkUser.emailAddresses.some((address) =>
    isBootstrapAdminEmail(address.emailAddress),
  );

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

  const effectiveRole = isBootstrapAdmin ? "admin" : normalizeRole(user.role);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: effectiveRole,
    joinedAt: user.joinedAt,
    lastActiveAt: user.lastActiveAt,
    profileVisibility: normalizeProfileVisibility(user.profileVisibility),
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
  const effectiveRole = isBootstrapAdminEmail(user.email) ? "admin" : normalizeRole(user.role);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: effectiveRole,
    joinedAt: user.joinedAt,
    lastActiveAt: user.lastActiveAt,
    profileVisibility: normalizeProfileVisibility(user.profileVisibility),
  };
}