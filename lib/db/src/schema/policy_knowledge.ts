import { pgTable, text, real, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const policyKnowledgeTable = pgTable("policy_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  jurisdiction_type: text("jurisdiction_type").notNull(),
  jurisdiction_name: text("jurisdiction_name"),
  state_code: text("state_code"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  legal_authority: text("legal_authority"),
  source_url: text("source_url"),
  policy_type: text("policy_type"),
  tags: text("tags").array(),
  effective_date: text("effective_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type PolicyKnowledge = typeof policyKnowledgeTable.$inferSelect;
export type InsertPolicyKnowledge = typeof policyKnowledgeTable.$inferInsert;
