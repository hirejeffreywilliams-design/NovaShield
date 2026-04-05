import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const intelligenceAlertsTable = pgTable("intelligence_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  pattern_id: uuid("pattern_id"),
  alert_type: text("alert_type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  metadata: jsonb("metadata"),
  acknowledged: text("acknowledged").default("false"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type IntelligenceAlert = typeof intelligenceAlertsTable.$inferSelect;
export type InsertIntelligenceAlert = typeof intelligenceAlertsTable.$inferInsert;
