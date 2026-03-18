import { pgTable, text, timestamp, uuid, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sosEventsTable = pgTable("sos_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").notNull().default("active"),
  situation_type: text("situation_type"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  location_text: text("location_text"),
  contacts_notified: integer("contacts_notified").default(0),
  notes: text("notes"),
  started_at: timestamp("started_at").defaultNow().notNull(),
  ended_at: timestamp("ended_at"),
});

export const insertSosEventSchema = createInsertSchema(sosEventsTable).omit({
  id: true,
  started_at: true,
  ended_at: true,
});
export type InsertSosEvent = z.infer<typeof insertSosEventSchema>;
export type SosEvent = typeof sosEventsTable.$inferSelect;
