import { pgTable, text, timestamp, uuid, integer, real, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const evidenceIntegrityTable = pgTable("evidence_integrity", {
  id: uuid("id").primaryKey().defaultRandom(),
  evidence_photo_id: uuid("evidence_photo_id").notNull(),
  incident_id: uuid("incident_id").notNull(),
  image_hash: text("image_hash").notNull(),
  metadata_hash: text("metadata_hash").notNull(),
  chain_hash: text("chain_hash").notNull(),
  previous_chain_hash: text("previous_chain_hash"),
  sequence_number: integer("sequence_number").notNull().default(0),
  capture_timestamp: timestamp("capture_timestamp").notNull(),
  gps_lat: real("gps_lat"),
  gps_lon: real("gps_lon"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  manipulation_risk_score: real("manipulation_risk_score"),
  manipulation_flags: jsonb("manipulation_flags"),
  ai_manipulation_assessment: text("ai_manipulation_assessment"),
  gps_plausible: boolean("gps_plausible"),
  timestamp_plausible: boolean("timestamp_plausible"),
  duplicate_risk: boolean("duplicate_risk"),
  verification_status: text("verification_status").notNull().default("verified"),
  verification_note: text("verification_note"),
  last_verified_at: timestamp("last_verified_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogTable = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id"),
  evidence_photo_id: uuid("evidence_photo_id"),
  action: text("action").notNull(),
  actor: text("actor").notNull().default("system"),
  details: jsonb("details"),
  previous_entry_hash: text("previous_entry_hash"),
  entry_hash: text("entry_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertEvidenceIntegritySchema = createInsertSchema(evidenceIntegrityTable).omit({
  id: true,
  created_at: true,
});
export type InsertEvidenceIntegrity = z.infer<typeof insertEvidenceIntegritySchema>;
export type EvidenceIntegrity = typeof evidenceIntegrityTable.$inferSelect;

export const insertAuditLogSchema = createInsertSchema(auditLogTable).omit({
  id: true,
  created_at: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogTable.$inferSelect;
