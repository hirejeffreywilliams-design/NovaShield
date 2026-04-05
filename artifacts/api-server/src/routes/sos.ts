import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trustedContactsTable, sosEventsTable } from "@workspace/db/schema";
import { eq, desc, isNull } from "drizzle-orm";

const router: IRouter = Router();

router.get("/contacts", async (_req, res) => {
  try {
    const contacts = await db.select().from(trustedContactsTable).orderBy(trustedContactsTable.created_at);
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: "Failed to list contacts", message: String(err) });
  }
});

router.post("/contacts", async (req, res): Promise<void> => {
  try {
    const { name, phone, email, relationship, notify_on_sos } = req.body;
    if (!name || !phone) {
      res.status(400).json({ error: "name and phone are required" });
      return;
    }
    const [contact] = await db
      .insert(trustedContactsTable)
      .values({ name, phone, email, relationship, notify_on_sos: notify_on_sos !== false })
      .returning();
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: "Failed to create contact", message: String(err) });
  }
});

router.put("/contacts/:id", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, email, relationship, notify_on_sos } = req.body;
    const [contact] = await db
      .update(trustedContactsTable)
      .set({ name, phone, email, relationship, notify_on_sos })
      .where(eq(trustedContactsTable.id, id))
      .returning();
    if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: "Failed to update contact", message: String(err) });
  }
});

router.delete("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(trustedContactsTable).where(eq(trustedContactsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete contact", message: String(err) });
  }
});

router.get("/active", async (_req, res) => {
  try {
    const [event] = await db
      .select()
      .from(sosEventsTable)
      .where(isNull(sosEventsTable.ended_at))
      .orderBy(desc(sosEventsTable.started_at))
      .limit(1);
    res.json({ event: event || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch active SOS", message: String(err) });
  }
});

router.post("/trigger", async (req, res) => {
  try {
    const { situation_type, latitude, longitude, location_text, contacts_notified, notes } = req.body;
    await db
      .update(sosEventsTable)
      .set({ ended_at: new Date(), status: "ended" })
      .where(isNull(sosEventsTable.ended_at));
    const [event] = await db
      .insert(sosEventsTable)
      .values({
        situation_type,
        latitude,
        longitude,
        location_text,
        contacts_notified: contacts_notified || 0,
        notes,
        status: "active",
      })
      .returning();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to trigger SOS", message: String(err) });
  }
});

router.put("/:id/status", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, contacts_notified } = req.body;
    const updates: Record<string, unknown> = { status };
    if (contacts_notified !== undefined) updates.contacts_notified = contacts_notified;
    if (status === "ended") updates.ended_at = new Date();
    const [event] = await db
      .update(sosEventsTable)
      .set(updates as any)
      .where(eq(sosEventsTable.id, id))
      .returning();
    if (!event) { res.status(404).json({ error: "SOS event not found" }); return; }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to update SOS status", message: String(err) });
  }
});

router.get("/history", async (_req, res) => {
  try {
    const events = await db.select().from(sosEventsTable).orderBy(desc(sosEventsTable.started_at)).limit(20);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch SOS history", message: String(err) });
  }
});

export default router;
