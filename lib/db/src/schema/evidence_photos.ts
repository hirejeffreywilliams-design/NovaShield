import { pgTable, text, timestamp, uuid, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const evidencePhotosTable = pgTable("evidence_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id").notNull(),
  image_base64: text("image_base64"),
  source: text("source").default("camera"),
  ai_analysis: text("ai_analysis"),
  vehicle_unit: text("vehicle_unit"),
  license_plate: text("license_plate"),
  officer_description: text("officer_description"),
  department_markings: text("department_markings"),
  additional_findings: text("additional_findings"),
  scene_analysis: jsonb("scene_analysis"),
  person_count: integer("person_count"),
  officer_count: integer("officer_count"),
  vehicle_count: integer("vehicle_count"),
  confidence_score: real("confidence_score"),
  captured_at: timestamp("captured_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertEvidencePhotoSchema = createInsertSchema(evidencePhotosTable).omit({
  id: true,
  created_at: true,
});
export type InsertEvidencePhoto = z.infer<typeof insertEvidencePhotoSchema>;
export type EvidencePhoto = typeof evidencePhotosTable.$inferSelect;
