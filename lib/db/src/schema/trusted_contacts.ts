import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trustedContactsTable = pgTable("trusted_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  relationship: text("relationship"),
  notify_on_sos: boolean("notify_on_sos").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrustedContactSchema = createInsertSchema(trustedContactsTable).omit({
  id: true,
  created_at: true,
});
export type InsertTrustedContact = z.infer<typeof insertTrustedContactSchema>;
export type TrustedContact = typeof trustedContactsTable.$inferSelect;
