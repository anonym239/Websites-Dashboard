import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const memberRequestsTable = pgTable("member_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMemberRequestSchema = createInsertSchema(memberRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMemberRequest = z.infer<typeof insertMemberRequestSchema>;
export type MemberRequest = typeof memberRequestsTable.$inferSelect;