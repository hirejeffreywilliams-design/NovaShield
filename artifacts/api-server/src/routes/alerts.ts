import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db/schema";
import { eq, and, type SQL } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  try {
    const alerts = await db.select().from(alertsTable);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let unread = 0;
    let dismissed = 0;

    for (const a of alerts) {
      byType[a.type] = (byType[a.type] || 0) + 1;
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
      if (!a.is_read) unread++;
      if (a.is_dismissed) dismissed++;
    }

    res.json({
      total: alerts.length,
      unread,
      dismissed,
      byType,
      bySeverity,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get alert stats", message: String(err) });
  }
});

router.get("/", async (req, res) => {
  try {
    const { type, severity, is_read } = req.query;
    const conditions: SQL[] = [];

    if (type) conditions.push(eq(alertsTable.type, String(type)));
    if (severity) conditions.push(eq(alertsTable.severity, String(severity)));
    if (is_read === "true") conditions.push(eq(alertsTable.is_read, true));
    if (is_read === "false") conditions.push(eq(alertsTable.is_read, false));

    const alerts = conditions.length > 0
      ? await db.select().from(alertsTable).where(and(...conditions)).orderBy(alertsTable.created_at)
      : await db.select().from(alertsTable).orderBy(alertsTable.created_at);

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: "Failed to list alerts", message: String(err) });
  }
});

router.post("/", async (req, res): Promise<void> => {
  try {
    const { title, description, type, severity, department_id, officer_id, related_incident_ids, metadata } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "title and description are required" });
      return;
    }

    const [alert] = await db
      .insert(alertsTable)
      .values({
        title,
        description,
        type: type || "pattern_detected",
        severity: severity || "info",
        department_id,
        officer_id,
        related_incident_ids,
        metadata,
        is_read: false,
        is_dismissed: false,
      })
      .returning();

    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: "Failed to create alert", message: String(err) });
  }
});

router.put("/:id/read", async (req, res): Promise<void> => {
  try {
    const [updated] = await db
      .update(alertsTable)
      .set({ is_read: true })
      .where(eq(alertsTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Alert not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark alert as read", message: String(err) });
  }
});

router.put("/:id/dismiss", async (req, res): Promise<void> => {
  try {
    const [updated] = await db
      .update(alertsTable)
      .set({ is_dismissed: true, is_read: true })
      .where(eq(alertsTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Alert not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to dismiss alert", message: String(err) });
  }
});

export default router;
