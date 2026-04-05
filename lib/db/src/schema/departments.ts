import { pgTable, text, timestamp, uuid, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const departmentsTable = pgTable("departments", {
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

export const insertDepartmentSchema = createInsertSchema(departmentsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departmentsTable.$inferSelect;
