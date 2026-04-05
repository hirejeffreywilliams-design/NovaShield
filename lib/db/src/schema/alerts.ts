import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
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

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  id: true,
  created_at: true,
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
