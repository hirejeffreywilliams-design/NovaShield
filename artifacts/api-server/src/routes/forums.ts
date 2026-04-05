import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { forumsTable, forumPostsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const threads = await db
      .select()
      .from(forumsTable)
      .orderBy(forumsTable.created_at);
    res.json({ threads });
  } catch (err) {
    res.status(500).json({ error: "Failed to list threads", message: String(err) });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const { title, description, author_id, category } = req.body;
    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    const [thread] = await db
      .insert(forumsTable)
      .values({
        title,
        description,
        author_id,
        category: category || "general",
      })
      .returning();

    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ error: "Failed to create thread", message: String(err) });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  try {
    const [thread] = await db
      .select()
      .from(forumsTable)
      .where(eq(forumsTable.id, req.params.id));
    if (!thread) { res.status(404).json({ error: "Thread not found" }); return; }

    const posts = await db
      .select()
      .from(forumPostsTable)
      .where(eq(forumPostsTable.forum_id, req.params.id))
      .orderBy(forumPostsTable.created_at);

    res.json({ thread, posts });
  } catch (err) {
    res.status(500).json({ error: "Failed to get thread", message: String(err) });
  }
});

router.post("/:id/posts", async (req, res): Promise<void> => {
  try {
    const { content, author_id } = req.body;
    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const [thread] = await db
      .select()
      .from(forumsTable)
      .where(eq(forumsTable.id, req.params.id));
    if (!thread) { res.status(404).json({ error: "Thread not found" }); return; }

    const [post] = await db
      .insert(forumPostsTable)
      .values({
        forum_id: req.params.id,
        content,
        author_id,
      })
      .returning();

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to add post", message: String(err) });
  }
});

router.put("/posts/:id/upvote", async (req, res): Promise<void> => {
  try {
    const [post] = await db
      .select()
      .from(forumPostsTable)
      .where(eq(forumPostsTable.id, req.params.id));
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }

    const [updated] = await db
      .update(forumPostsTable)
      .set({
        upvotes: (post.upvotes || 0) + 1,
        updated_at: new Date(),
      })
      .where(eq(forumPostsTable.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to upvote post", message: String(err) });
  }
});

export default router;
