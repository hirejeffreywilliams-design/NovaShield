import { pgTable, text, real, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";

export const analysisResultsTable = pgTable("analysis_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id"),
  evidence_photo_id: uuid("evidence_photo_id"),
  state_code: text("state_code"),
  policy_ids_used: text("policy_ids_used").array(),
  policy_count_injected: integer("policy_count_injected").default(0),
  scene_analysis: jsonb("scene_analysis"),
  potential_concerns: jsonb("potential_concerns"),
  overall_confidence: real("overall_confidence"),
  manipulation_risk: real("manipulation_risk"),
  model_version: text("model_version"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type AnalysisResult = typeof analysisResultsTable.$inferSelect;
export type InsertAnalysisResult = typeof analysisResultsTable.$inferInsert;
