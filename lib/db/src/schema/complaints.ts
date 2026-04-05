import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complaintsTable = pgTable("complaints", {
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

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
