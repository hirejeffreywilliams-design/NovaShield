import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const accessAuditLogTable = pgTable("access_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id"),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resource_id: text("resource_id"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  details: jsonb("details"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type AccessAuditLog = typeof accessAuditLogTable.$inferSelect;
export type InsertAccessAuditLog = typeof accessAuditLogTable.$inferInsert;
