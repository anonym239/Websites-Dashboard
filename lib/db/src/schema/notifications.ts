import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const memberNotificationsTable = pgTable("member_notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMemberNotificationSchema = createInsertSchema(memberNotificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMemberNotification = z.infer<typeof insertMemberNotificationSchema>;
export type MemberNotification = typeof memberNotificationsTable.$inferSelect;