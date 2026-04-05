import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const ecosystemLinksTable = pgTable("ecosystem_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bridge_id: text("bridge_id"),
  ecosystem_user_id: text("ecosystem_user_id"),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  linked_at: timestamp("linked_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type EcosystemLink = typeof ecosystemLinksTable.$inferSelect;
export type InsertEcosystemLink = typeof ecosystemLinksTable.$inferInsert;
