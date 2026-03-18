import { pgTable, text, real, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("incident_events", {
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

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  id: true,
  created_at: true,
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type IncidentEvent = typeof eventsTable.$inferSelect;
