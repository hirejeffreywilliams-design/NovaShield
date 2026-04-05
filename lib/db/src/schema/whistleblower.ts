import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whistleblowerTable = pgTable("whistleblower", {
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

export const insertWhistleblowerSchema = createInsertSchema(whistleblowerTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertWhistleblower = z.infer<typeof insertWhistleblowerSchema>;
export type Whistleblower = typeof whistleblowerTable.$inferSelect;
