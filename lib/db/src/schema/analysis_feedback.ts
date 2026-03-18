import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const analysisFeedbackTable = pgTable("analysis_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysis_result_id: uuid("analysis_result_id"),
  incident_id: uuid("incident_id"),
  concern_type: text("concern_type"),
  concern_description: text("concern_description"),
  applicable_amendment: text("applicable_amendment"),
  feedback_type: text("feedback_type").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type AnalysisFeedback = typeof analysisFeedbackTable.$inferSelect;
export type InsertAnalysisFeedback = typeof analysisFeedbackTable.$inferInsert;
