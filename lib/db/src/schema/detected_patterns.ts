import { pgTable, text, timestamp, uuid, jsonb, integer, real } from "drizzle-orm/pg-core";

export const detectedPatternsTable = pgTable("detected_patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  pattern_type: text("pattern_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull().default("medium"),
  confidence: real("confidence"),
  incident_ids: jsonb("incident_ids").$type<string[]>().default([]),
  officer_ids: jsonb("officer_ids").$type<string[]>().default([]),
  geographic_data: jsonb("geographic_data"),
  time_data: jsonb("time_data"),
  occurrence_count: integer("occurrence_count").default(1),
  status: text("status").notNull().default("active"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type DetectedPattern = typeof detectedPatternsTable.$inferSelect;
export type InsertDetectedPattern = typeof detectedPatternsTable.$inferInsert;
