import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const petitionsTable = pgTable("petitions", {
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

export const insertPetitionSchema = createInsertSchema(petitionsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertPetition = z.infer<typeof insertPetitionSchema>;
export type Petition = typeof petitionsTable.$inferSelect;
