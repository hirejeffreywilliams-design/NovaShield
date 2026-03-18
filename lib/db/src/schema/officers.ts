import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const officersTable = pgTable("officers", {
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

export const insertOfficerSchema = createInsertSchema(officersTable).omit({
  id: true,
  created_at: true,
});
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;
export type Officer = typeof officersTable.$inferSelect;
