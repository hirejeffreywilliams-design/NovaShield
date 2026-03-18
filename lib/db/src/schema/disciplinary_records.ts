import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { officersTable } from "./officers";

export const disciplinaryRecordsTable = pgTable("disciplinary_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  officer_id: uuid("officer_id").notNull().references(() => officersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  incident_date: text("incident_date"),
  source_name: text("source_name").notNull(),
  source_url: text("source_url"),
  outcome: text("outcome"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertDisciplinaryRecordSchema = createInsertSchema(disciplinaryRecordsTable).omit({
  id: true,
  created_at: true,
});
export type InsertDisciplinaryRecord = z.infer<typeof insertDisciplinaryRecordSchema>;
export type DisciplinaryRecord = typeof disciplinaryRecordsTable.$inferSelect;
