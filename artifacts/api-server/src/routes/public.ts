import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable, reportsTable } from "@workspace/db/schema";
import { anonymizeIncident, anonymizeReport } from "../lib/anonymize";

const router: IRouter = Router();

router.get("/incidents", async (_req, res) => {
  try {
    const incidents = await db
      .select()
      .from(incidentsTable)
      .orderBy(incidentsTable.created_at)
      .limit(100);

    const anonymized = incidents.map(anonymizeIncident);
    res.json({ incidents: anonymized, total: anonymized.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public incidents", message: String(err) });
  }
});

router.get("/reports", async (_req, res) => {
  try {
    const reports = await db
      .select()
      .from(reportsTable)
      .orderBy(reportsTable.created_at)
      .limit(100);

    const anonymized = reports.map(anonymizeReport);
    res.json({ reports: anonymized, total: anonymized.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public reports", message: String(err) });
  }
});

export default router;
