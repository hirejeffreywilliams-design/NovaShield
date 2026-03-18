import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reportsTable, incidentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const reports = await db.select().from(reportsTable).orderBy(reportsTable.created_at);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: "Failed to list reports", message: String(err) });
  }
});

router.post("/:incidentId", async (req, res) => {
  try {
    const { incidentId } = req.params;
    const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, incidentId));
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    const findings: string[] = [];
    const recommendations: string[] = [];

    if (incident.officer_badge) {
      findings.push(`Officer badge number ${incident.officer_badge} was documented at the scene.`);
    }
    if (incident.officer_name) {
      findings.push(`Officer ${incident.officer_name} was identified in this incident.`);
    }
    if (incident.duration_seconds) {
      const mins = Math.round(incident.duration_seconds / 60);
      findings.push(`Encounter lasted approximately ${mins} minute(s).`);
    }
    if (incident.location) {
      findings.push(`Incident occurred at: ${incident.location}.`);
    }
    findings.push("Recording was created and stored with tamper-evident hash.");
    recommendations.push("Preserve all evidence and media files in a secure location.");
    recommendations.push("Consult with a civil rights attorney if constitutional violations occurred.");
    recommendations.push("File a formal complaint with the department's internal affairs if applicable.");

    const title = `Audit Report: ${incident.title}`;
    const summary = `This report documents a police-public encounter recorded on ${new Date(incident.created_at).toLocaleDateString()}. ${incident.description || "No additional description provided."}`;

    const [existing] = await db.select().from(reportsTable).where(eq(reportsTable.incident_id, incidentId));
    let report;
    if (existing) {
      [report] = await db.update(reportsTable)
        .set({ title, summary, findings, recommendations })
        .where(eq(reportsTable.incident_id, incidentId))
        .returning();
    } else {
      [report] = await db.insert(reportsTable)
        .values({ incident_id: incidentId, title, summary, findings, recommendations })
        .returning();
    }

    await db.update(incidentsTable).set({ status: "reported", updated_at: new Date() }).where(eq(incidentsTable.id, incidentId));

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report", message: String(err) });
  }
});

router.get("/:incidentId", async (req, res) => {
  try {
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.incident_id, req.params.incidentId));
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to get report", message: String(err) });
  }
});

export default router;
