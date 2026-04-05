import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { complaintsTable } from "@workspace/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  try {
    const complaints = await db.select().from(complaintsTable);

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const c of complaints) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    }

    res.json({
      total: complaints.length,
      byStatus,
      byCategory,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get complaint stats", message: String(err) });
  }
});

router.get("/", async (req, res) => {
  try {
    const { status, department_id, officer_id } = req.query;
    const conditions: SQL[] = [];

    if (status) conditions.push(eq(complaintsTable.status, String(status)));
    if (department_id) conditions.push(eq(complaintsTable.department_id, String(department_id)));
    if (officer_id) conditions.push(eq(complaintsTable.officer_id, String(officer_id)));

    const complaints = conditions.length > 0
      ? await db.select().from(complaintsTable).where(and(...conditions)).orderBy(complaintsTable.created_at)
      : await db.select().from(complaintsTable).orderBy(complaintsTable.created_at);

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: "Failed to list complaints", message: String(err) });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const { title, description, category, priority, incident_id, reporter_id, officer_id, department_id, is_anonymous } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "title and description are required" });
      return;
    }

    const [complaint] = await db
      .insert(complaintsTable)
      .values({
        title,
        description,
        category: category || "other",
        priority: priority || "medium",
        incident_id,
        reporter_id,
        officer_id,
        department_id,
        is_anonymous: is_anonymous || false,
        status: "submitted",
      })
      .returning();

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: "Failed to create complaint", message: String(err) });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  try {
    const [complaint] = await db
      .select()
      .from(complaintsTable)
      .where(eq(complaintsTable.id, req.params.id));
    if (!complaint) { res.status(404).json({ error: "Complaint not found" }); return; }
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: "Failed to get complaint", message: String(err) });
  }
});

router.put("/:id", async (req, res): Promise<void> => {
  try {
    const { title, description, category, status, priority, resolution, assigned_to } = req.body;

    const [updated] = await db
      .update(complaintsTable)
      .set({
        title,
        description,
        category,
        status,
        priority,
        resolution,
        assigned_to,
        resolution_date: status === "resolved" ? new Date() : undefined,
        updated_at: new Date(),
      })
      .where(eq(complaintsTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Complaint not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update complaint", message: String(err) });
  }
});

export default router;
