import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bodyCameraTable = pgTable("body_camera", {
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

export const insertBodyCameraSchema = createInsertSchema(bodyCameraTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertBodyCamera = z.infer<typeof insertBodyCameraSchema>;
export type BodyCamera = typeof bodyCameraTable.$inferSelect;
