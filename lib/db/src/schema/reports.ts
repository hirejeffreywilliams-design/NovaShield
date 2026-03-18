import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  incident_id: uuid("incident_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  findings: jsonb("findings").$type<string[]>().default([]),
  recommendations: jsonb("recommendations").$type<string[]>().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  created_at: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
