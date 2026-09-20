import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const websiteFavoritesTable = pgTable(
  "website_favorites",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    websiteId: integer("website_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userWebsiteUnique: uniqueIndex("website_favorites_user_website_unique").on(table.userId, table.websiteId),
  }),
);

export const insertWebsiteFavoriteSchema = createInsertSchema(websiteFavoritesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertWebsiteFavorite = z.infer<typeof insertWebsiteFavoriteSchema>;
export type WebsiteFavorite = typeof websiteFavoritesTable.$inferSelect;