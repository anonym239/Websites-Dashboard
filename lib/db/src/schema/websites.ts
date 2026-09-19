import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const websitesTable = pgTable("websites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  githubUrl: text("github_url"),
  imageUrl: text("image_url"),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  visits: integer("visits").notNull().default(0),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWebsiteSchema = createInsertSchema(websitesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type Website = typeof websitesTable.$inferSelect;