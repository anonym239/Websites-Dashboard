import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const memberRequestHistoryTable = pgTable("member_request_history", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  status: text("status").notNull(),
  message: text("message").notNull(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMemberRequestHistorySchema = createInsertSchema(memberRequestHistoryTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMemberRequestHistory = z.infer<typeof insertMemberRequestHistorySchema>;
export type MemberRequestHistory = typeof memberRequestHistoryTable.$inferSelect;