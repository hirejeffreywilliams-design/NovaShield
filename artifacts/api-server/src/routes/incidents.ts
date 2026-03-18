import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable, eventsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const incidents = await db
      .select()
      .from(incidentsTable)
      .orderBy(incidentsTable.created_at);
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: "Failed to list incidents", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, location, latitude, longitude, officer_badge, officer_name, duration_seconds, notes } = req.body;
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }
    const [incident] = await db
      .insert(incidentsTable)
      .values({ title, description, location, latitude, longitude, officer_badge, officer_name, duration_seconds, notes, status: "pending" })
      .returning();
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: "Failed to create incident", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [incident] = await db
      .select()
      .from(incidentsTable)
      .where(eq(incidentsTable.id, req.params.id));
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: "Failed to get incident", message: String(err) });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, description, location, latitude, longitude, status, officer_badge, officer_name, duration_seconds, notes } = req.body;
    const [updated] = await db
      .update(incidentsTable)
      .set({ title, description, location, latitude, longitude, status, officer_badge, officer_name, duration_seconds, notes, updated_at: new Date() })
      .where(eq(incidentsTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Incident not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update incident", message: String(err) });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(incidentsTable)
      .where(eq(incidentsTable.id, req.params.id))
      .returning();
    if (!deleted) return res.status(404).json({ error: "Incident not found" });
    res.json({ message: "Incident deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete incident", message: String(err) });
  }
});

router.get("/:id/events", async (req, res) => {
  try {
    const events = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.incident_id, req.params.id))
      .orderBy(eventsTable.created_at);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: "Failed to list events", message: String(err) });
  }
});

router.post("/:id/events", async (req, res) => {
  try {
    const { type, description, timestamp_seconds, confidence, wall_clock_time, rights_violated } = req.body;
    if (!type) return res.status(400).json({ error: "type is required" });
    const [event] = await db
      .insert(eventsTable)
      .values({
        incident_id: req.params.id,
        type,
        description,
        timestamp_seconds,
        confidence,
        wall_clock_time: wall_clock_time ? new Date(wall_clock_time) : new Date(),
        rights_violated: rights_violated || null,
      })
      .returning();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to add event", message: String(err) });
  }
});

export default router;
