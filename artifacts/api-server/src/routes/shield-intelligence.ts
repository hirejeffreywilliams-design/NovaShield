import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { detectedPatternsTable, intelligenceAlertsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import { runFullAnalysis, getAnonymousAggregate } from "../services/shield-intelligence";
import { logRouteAccess } from "../lib/audit-trail";

const router: IRouter = Router();

router.get("/patterns", authenticate, async (req, res) => {
  try {
    await logRouteAccess(req, "patterns_read", "shield_intelligence");

    const patterns = await db
      .select()
      .from(detectedPatternsTable)
      .where(eq(detectedPatternsTable.status, "active"))
      .orderBy(desc(detectedPatternsTable.created_at))
      .limit(50);

    res.json({ patterns, total: patterns.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patterns", message: String(err) });
  }
});

router.get("/trends", authenticate, async (req, res) => {
  try {
    await logRouteAccess(req, "trends_read", "shield_intelligence");

    const aggregate = await getAnonymousAggregate();
    res.json({ trends: aggregate });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trends", message: String(err) });
  }
});

router.get("/alerts", authenticate, async (req, res) => {
  try {
    await logRouteAccess(req, "alerts_read", "shield_intelligence");

    const alerts = await db
      .select()
      .from(intelligenceAlertsTable)
      .orderBy(desc(intelligenceAlertsTable.created_at))
      .limit(50);

    res.json({ alerts, total: alerts.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts", message: String(err) });
  }
});

router.post("/analyze", authenticate, requireRole("auditor", "admin"), async (req, res) => {
  try {
    await logRouteAccess(req, "intelligence_analyze", "shield_intelligence");

    const result = await runFullAnalysis();
    res.json({
      message: "Analysis complete",
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: "Analysis failed", message: String(err) });
  }
});

router.get("/aggregate", async (_req, res) => {
  try {
    const aggregate = await getAnonymousAggregate();
    res.json({ aggregate });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch aggregate data", message: String(err) });
  }
});

export default router;
