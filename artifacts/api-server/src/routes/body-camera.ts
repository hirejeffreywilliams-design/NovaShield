import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bodyCameraTable } from "@workspace/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  try {
    const footage = await db.select().from(bodyCameraTable);

    const byStatus: Record<string, number> = {};
    let totalRequests = 0;

    for (const f of footage) {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
      totalRequests += f.request_count || 0;
    }

    res.json({
      total: footage.length,
      totalPublicRequests: totalRequests,
      byStatus,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get footage stats", message: String(err) });
  }
});

router.get("/", async (req, res) => {
  try {
    const { status, department_id, officer_id } = req.query;
    const conditions: SQL[] = [];

    if (status) conditions.push(eq(bodyCameraTable.status, String(status)));
    if (department_id) conditions.push(eq(bodyCameraTable.department_id, String(department_id)));
    if (officer_id) conditions.push(eq(bodyCameraTable.officer_id, String(officer_id)));

    const footage = conditions.length > 0
      ? await db.select().from(bodyCameraTable).where(and(...conditions)).orderBy(bodyCameraTable.created_at)
      : await db.select().from(bodyCameraTable).orderBy(bodyCameraTable.created_at);

    res.json({ footage });
  } catch (err) {
    res.status(500).json({ error: "Failed to list footage", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const { incident_id, officer_id, department_id, footage_url, duration_seconds, start_time, end_time } = req.body;

    const [record] = await db
      .insert(bodyCameraTable)
      .values({
        incident_id,
        officer_id,
        department_id,
        footage_url: footage_url || "",
        duration_seconds,
        start_time: start_time ? new Date(start_time) : null,
        end_time: end_time ? new Date(end_time) : null,
        status: "pending_review",
      })
      .returning();

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to add footage record", message: String(err) });
  }
});

router.get("/:id", async (req, res): Promise<void> => {
  try {
    const [record] = await db
      .select()
      .from(bodyCameraTable)
      .where(eq(bodyCameraTable.id, req.params.id));
    if (!record) { res.status(404).json({ error: "Footage not found" }); return; }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to get footage", message: String(err) });
  }
});

router.put("/:id", async (req, res): Promise<void> => {
  try {
    const { status, review_notes, reviewer_id, is_public } = req.body;

    const [updated] = await db
      .update(bodyCameraTable)
      .set({ status, review_notes, reviewer_id, is_public, updated_at: new Date() })
      .where(eq(bodyCameraTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Footage not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update footage", message: String(err) });
  }
});

router.post("/:id/request", async (req, res): Promise<void> => {
  try {
    const [record] = await db
      .select()
      .from(bodyCameraTable)
      .where(eq(bodyCameraTable.id, req.params.id));
    if (!record) { res.status(404).json({ error: "Footage not found" }); return; }

    const [updated] = await db
      .update(bodyCameraTable)
      .set({
        request_count: (record.request_count || 0) + 1,
        updated_at: new Date(),
      })
      .where(eq(bodyCameraTable.id, req.params.id))
      .returning();

    res.json({ message: "Public request recorded", record: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to record request", message: String(err) });
  }
});

export default router;
