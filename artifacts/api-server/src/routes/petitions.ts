import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { petitionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const petitions = await db
      .select()
      .from(petitionsTable)
      .orderBy(petitionsTable.created_at);
    res.json({ petitions });
  } catch (err) {
    res.status(500).json({ error: "Failed to list petitions", message: String(err) });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const { title, description, category, target_department_id, target_policy, signature_goal, author_id } = req.body;
    if (!title || !description || !category) {
      res.status(400).json({ error: "title, description, and category are required" });
      return;
    }

    const [petition] = await db
      .insert(petitionsTable)
      .values({
        title,
        description,
        category,
        target_department_id,
        target_policy,
        signature_goal: signature_goal || 1000,
        author_id,
        status: "active",
      })
      .returning();

    res.status(201).json(petition);
  } catch (err) {
    res.status(500).json({ error: "Failed to create petition", message: String(err) });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  try {
    const [petition] = await db
      .select()
      .from(petitionsTable)
      .where(eq(petitionsTable.id, req.params.id));
    if (!petition) { res.status(404).json({ error: "Petition not found" }); return; }
    res.json(petition);
  } catch (err) {
    res.status(500).json({ error: "Failed to get petition", message: String(err) });
  }
});

router.post("/:id/sign", async (req, res): Promise<void> => {
  try {
    const [petition] = await db
      .select()
      .from(petitionsTable)
      .where(eq(petitionsTable.id, req.params.id));
    if (!petition) { res.status(404).json({ error: "Petition not found" }); return; }

    const newCount = (petition.signature_count || 0) + 1;
    const newStatus = newCount >= petition.signature_goal ? "achieved" : petition.status;

    const [updated] = await db
      .update(petitionsTable)
      .set({
        signature_count: newCount,
        status: newStatus,
        updated_at: new Date(),
      })
      .where(eq(petitionsTable.id, req.params.id))
      .returning();

    res.json({ message: "Petition signed", petition: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to sign petition", message: String(err) });
  }
});

router.put("/:id", async (req, res): Promise<void> => {
  try {
    const { title, description, category, target_department_id, target_policy, status, signature_goal } = req.body;

    const [updated] = await db
      .update(petitionsTable)
      .set({
        title,
        description,
        category,
        target_department_id,
        target_policy,
        status,
        signature_goal,
        updated_at: new Date(),
      })
      .where(eq(petitionsTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Petition not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update petition", message: String(err) });
  }
});

export default router;
