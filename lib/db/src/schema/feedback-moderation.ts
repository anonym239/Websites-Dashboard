import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const feedbackModerationHistoryTable = pgTable("feedback_moderation_history", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").notNull(),
  action: text("action").notNull(),
  reason: text("reason"),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedbackModerationHistorySchema = createInsertSchema(feedbackModerationHistoryTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFeedbackModerationHistory = z.infer<typeof insertFeedbackModerationHistorySchema>;
export type FeedbackModerationHistory = typeof feedbackModerationHistoryTable.$inferSelect;