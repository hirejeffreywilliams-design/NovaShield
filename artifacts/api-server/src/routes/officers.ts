import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { officersTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const officers = await db.select().from(officersTable).orderBy(officersTable.created_at);
    res.json({ officers });
  } catch (err) {
    res.status(500).json({ error: "Failed to list officers", message: String(err) });
  }
});

router.post("/resolve", async (req, res) => {
  try {
    const { badge_number, badge_text } = req.body;
    const badge = badge_number || badge_text;
    if (!badge) {
      return res.json({ found: false, badge_number: badge || "", officer: null });
    }
    const [officer] = await db
      .select()
      .from(officersTable)
      .where(eq(officersTable.badge_no, badge));
    res.json({ found: !!officer, badge_number: badge, officer: officer || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve officer", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, badge_no, agency, rank, department, notes } = req.body;
    const [officer] = await db
      .insert(officersTable)
      .values({ name, badge_no, agency, rank, department, notes })
      .returning();
    res.status(201).json(officer);
  } catch (err) {
    res.status(500).json({ error: "Failed to create officer", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [officer] = await db
      .select()
      .from(officersTable)
      .where(eq(officersTable.id, req.params.id));
    if (!officer) return res.status(404).json({ error: "Officer not found" });
    res.json(officer);
  } catch (err) {
    res.status(500).json({ error: "Failed to get officer", message: String(err) });
  }
});

export default router;
