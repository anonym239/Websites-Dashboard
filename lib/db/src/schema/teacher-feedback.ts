import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const teacherFeedbackTable = pgTable("teacher_feedback", {
  id: serial("id").primaryKey(),
  teacherName: text("teacher_name").notNull(),
  feedback: text("feedback").notNull(),
  rating: integer("rating").notNull(),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeacherFeedbackSchema = createInsertSchema(teacherFeedbackTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTeacherFeedback = z.infer<typeof insertTeacherFeedbackSchema>;
export type TeacherFeedback = typeof teacherFeedbackTable.$inferSelect;