import { pgTable, text, real, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const systemHealthChecksTable = pgTable("system_health_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  checked_at: timestamp("checked_at").defaultNow().notNull(),
  status: text("status").notNull(),
  db_ok: boolean("db_ok").notNull().default(true),
  analysis_pipeline_ok: boolean("analysis_pipeline_ok").notNull().default(true),
  policies_count: integer("policies_count").default(0),
  analyses_24h: integer("analyses_24h").default(0),
  avg_confidence_24h: real("avg_confidence_24h"),
  confirmed_feedback_count: integer("confirmed_feedback_count").default(0),
  disputed_feedback_count: integer("disputed_feedback_count").default(0),
  auto_learned: boolean("auto_learned").default(false),
  new_patterns_learned: integer("new_patterns_learned").default(0),
  alerts: jsonb("alerts"),
  notes: text("notes"),
});

export type SystemHealthCheck = typeof systemHealthChecksTable.$inferSelect;
export type InsertSystemHealthCheck = typeof systemHealthChecksTable.$inferInsert;
