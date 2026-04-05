import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const syncedAchievementsTable = pgTable("synced_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  achievement_type: text("achievement_type").notNull(),
  achievement_id: text("achievement_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  synced_at: timestamp("synced_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type SyncedAchievement = typeof syncedAchievementsTable.$inferSelect;
export type InsertSyncedAchievement = typeof syncedAchievementsTable.$inferInsert;
