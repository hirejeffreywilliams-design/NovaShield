import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forumsTable = pgTable("forums", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  is_pinned: boolean("is_pinned").notNull().default(false),
  author_id: uuid("author_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const forumPostsTable = pgTable("forum_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  forum_id: uuid("forum_id").notNull(),
  author_id: uuid("author_id"),
  content: text("content").notNull(),
  is_solution: boolean("is_solution").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertForumSchema = createInsertSchema(forumsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertForum = z.infer<typeof insertForumSchema>;
export type Forum = typeof forumsTable.$inferSelect;

export const insertForumPostSchema = createInsertSchema(forumPostsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPostsTable.$inferSelect;
