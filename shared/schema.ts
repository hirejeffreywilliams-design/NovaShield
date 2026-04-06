import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, real, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

// ─── Users ───
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  full_name: text("full_name").notNull(),
  role: text("role").notNull().default("citizen"),
  avatar_url: text("avatar_url"),
  department_id: uuid("department_id"),
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password_hash: z.string().min(1),
  full_name: z.string().min(1),
  role: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// ─── Incidents ───
export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: text("status").notNull().default("pending"),
  officer_badge: text("officer_badge"),
  officer_name: text("officer_name"),
  duration_seconds: real("duration_seconds"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIncidentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  status: z.string().optional(),
  officer_badge: z.string().optional(),
  officer_name: z.string().optional(),
  duration_seconds: z.number().optional(),
  notes: z.string().optional(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

// ─── Officers ───
export const officers = pgTable("officers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  badge_no: text("badge_no"),
  agency: text("agency"),
  rank: text("rank"),
  department: text("department"),
  notes: text("notes"),
  incident_count: integer("incident_count").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertOfficerSchema = z.object({
  name: z.string().optional(),
  badge_no: z.string().optional(),
  agency: z.string().optional(),
  rank: z.string().optional(),
  department: z.string().optional(),
  notes: z.string().optional(),
  incident_count: z.number().optional(),
});

export type Officer = typeof officers.$inferSelect;
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;

// ─── Reports ───
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  findings: jsonb("findings").$type<string[]>().default([]),
  recommendations: jsonb("recommendations").$type<string[]>().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── Incident Events ───
export const incidentEvents = pgTable("incident_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  timestamp_seconds: real("timestamp_seconds"),
  wall_clock_time: timestamp("wall_clock_time"),
  rights_violated: text("rights_violated"),
  confidence: real("confidence"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type IncidentEvent = typeof incidentEvents.$inferSelect;
export type InsertIncidentEvent = typeof incidentEvents.$inferInsert;

// ─── Evidence Photos ───
export const evidencePhotos = pgTable("evidence_photos", {
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

export type EvidencePhoto = typeof evidencePhotos.$inferSelect;
export type InsertEvidencePhoto = typeof evidencePhotos.$inferInsert;

// ─── Evidence Integrity ───
export const evidenceIntegrity = pgTable("evidence_integrity", {
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

export type EvidenceIntegrity = typeof evidenceIntegrity.$inferSelect;
export type InsertEvidenceIntegrity = typeof evidenceIntegrity.$inferInsert;

// ─── Audit Log ───
export const auditLog = pgTable("audit_log", {
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

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ─── Analysis Results ───
export const analysisResults = pgTable("analysis_results", {
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

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;

// ─── Analysis Feedback ───
export const analysisFeedback = pgTable("analysis_feedback", {
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

export type AnalysisFeedback = typeof analysisFeedback.$inferSelect;
export type InsertAnalysisFeedback = typeof analysisFeedback.$inferInsert;

// ─── Alerts ───
export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  department_id: uuid("department_id"),
  officer_id: uuid("officer_id"),
  related_incident_ids: text("related_incident_ids").array(),
  is_read: boolean("is_read").notNull().default(false),
  is_dismissed: boolean("is_dismissed").notNull().default(false),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ─── Body Camera ───
export const bodyCamera = pgTable("body_camera", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id"),
  officer_id: uuid("officer_id"),
  department_id: uuid("department_id"),
  footage_url: text("footage_url").notNull(),
  duration_seconds: integer("duration_seconds"),
  start_time: timestamp("start_time"),
  end_time: timestamp("end_time"),
  status: text("status").notNull().default("pending_review"),
  reviewer_id: uuid("reviewer_id"),
  review_notes: text("review_notes"),
  is_public: boolean("is_public").notNull().default(false),
  request_count: integer("request_count").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type BodyCamera = typeof bodyCamera.$inferSelect;
export type InsertBodyCamera = typeof bodyCamera.$inferInsert;

// ─── Complaints ───
export const complaints = pgTable("complaints", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id"),
  reporter_id: uuid("reporter_id"),
  officer_id: uuid("officer_id"),
  department_id: uuid("department_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("submitted"),
  priority: text("priority").notNull().default("medium"),
  resolution: text("resolution"),
  resolution_date: timestamp("resolution_date"),
  assigned_to: uuid("assigned_to"),
  is_anonymous: boolean("is_anonymous").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;

// ─── Departments ───
export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  state: text("state").notNull(),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  chief_name: text("chief_name"),
  officer_count: integer("officer_count").notNull().default(0),
  complaint_count: integer("complaint_count").notNull().default(0),
  use_of_force_count: integer("use_of_force_count").notNull().default(0),
  accountability_score: real("accountability_score"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// ─── Disciplinary Records ───
export const disciplinaryRecords = pgTable("disciplinary_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  officer_id: uuid("officer_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  incident_date: text("incident_date"),
  source_name: text("source_name").notNull(),
  source_url: text("source_url"),
  outcome: text("outcome"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type DisciplinaryRecord = typeof disciplinaryRecords.$inferSelect;
export type InsertDisciplinaryRecord = typeof disciplinaryRecords.$inferInsert;

// ─── Forums ───
export const forums = pgTable("forums", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  is_pinned: boolean("is_pinned").notNull().default(false),
  author_id: uuid("author_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const forumPosts = pgTable("forum_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  forum_id: uuid("forum_id").notNull(),
  author_id: uuid("author_id"),
  content: text("content").notNull(),
  is_solution: boolean("is_solution").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Forum = typeof forums.$inferSelect;
export type InsertForum = typeof forums.$inferInsert;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;

// ─── Conversations ───
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;

// ─── Messages ───
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

// ─── Petitions ───
export const petitions = pgTable("petitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  target_department_id: uuid("target_department_id"),
  target_policy: text("target_policy"),
  author_id: uuid("author_id"),
  signature_count: integer("signature_count").notNull().default(0),
  signature_goal: integer("signature_goal").notNull().default(1000),
  status: text("status").notNull().default("active"),
  category: text("category").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Petition = typeof petitions.$inferSelect;
export type InsertPetition = typeof petitions.$inferInsert;

// ─── Policy Knowledge ───
export const policyKnowledge = pgTable("policy_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  jurisdiction_type: text("jurisdiction_type").notNull(),
  jurisdiction_name: text("jurisdiction_name"),
  state_code: text("state_code"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  legal_authority: text("legal_authority"),
  source_url: text("source_url"),
  policy_type: text("policy_type"),
  tags: text("tags").array(),
  effective_date: text("effective_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type PolicyKnowledge = typeof policyKnowledge.$inferSelect;
export type InsertPolicyKnowledge = typeof policyKnowledge.$inferInsert;

// ─── SOS Events ───
export const sosEvents = pgTable("sos_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").notNull().default("active"),
  situation_type: text("situation_type"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  location_text: text("location_text"),
  contacts_notified: integer("contacts_notified").default(0),
  notes: text("notes"),
  started_at: timestamp("started_at").defaultNow().notNull(),
  ended_at: timestamp("ended_at"),
});

export type SosEvent = typeof sosEvents.$inferSelect;
export type InsertSosEvent = typeof sosEvents.$inferInsert;

// ─── System Health ───
export const systemHealthChecks = pgTable("system_health_checks", {
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

export type SystemHealthCheck = typeof systemHealthChecks.$inferSelect;
export type InsertSystemHealthCheck = typeof systemHealthChecks.$inferInsert;

// ─── Trusted Contacts ───
export const trustedContacts = pgTable("trusted_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  relationship: text("relationship"),
  notify_on_sos: boolean("notify_on_sos").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type TrustedContact = typeof trustedContacts.$inferSelect;
export type InsertTrustedContact = typeof trustedContacts.$inferInsert;

// ─── Whistleblower ───
export const whistleblower = pgTable("whistleblower", {
  id: uuid("id").primaryKey().defaultRandom(),
  submission_code: text("submission_code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  department_id: uuid("department_id"),
  evidence_urls: text("evidence_urls").array(),
  is_anonymous: boolean("is_anonymous").notNull().default(true),
  status: text("status").notNull().default("received"),
  priority: text("priority").notNull().default("medium"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Whistleblower = typeof whistleblower.$inferSelect;
export type InsertWhistleblower = typeof whistleblower.$inferInsert;
