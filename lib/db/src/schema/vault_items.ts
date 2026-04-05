import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const vaultItemsTable = pgTable("vault_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  encrypted_data: text("encrypted_data").notNull(),
  encryption_iv: text("encryption_iv").notNull(),
  data_type: text("data_type").notNull().default("evidence"),
  title: text("title"),
  release_conditions: jsonb("release_conditions"),
  trusted_contacts: jsonb("trusted_contacts").$type<string[]>().default([]),
  status: text("status").notNull().default("sealed"),
  released_at: timestamp("released_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type VaultItem = typeof vaultItemsTable.$inferSelect;
export type InsertVaultItem = typeof vaultItemsTable.$inferInsert;
