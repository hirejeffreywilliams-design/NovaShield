import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  systemHealthChecksTable,
  analysisResultsTable,
  policyKnowledgeTable,
  analysisFeedbackTable,
} from "@workspace/db/schema";
import { desc, gte, eq, sql } from "drizzle-orm";
import { runMonitorCycle, getLatestHealthCheck, getHealthHistory } from "../lib/monitor";

const router: IRouter = Router();

router.get("/health", async (req, res): Promise<void> => {
  try {
    const latest = await getLatestHealthCheck();
    const staleMs = latest ? Date.now() - new Date(latest.checked_at).getTime() : Infinity;
    const isStale = staleMs > 10 * 60 * 1000;

    if (!latest || isStale) {
      const fresh = await runMonitorCycle();
      res.json({
        ...fresh,
        source: "live",
        next_check_in_seconds: 300,
      });
      return;
    }

    res.json({
      ...latest,
      source: "cached",
      age_seconds: Math.floor(staleMs / 1000),
      next_check_in_seconds: Math.max(0, 300 - Math.floor(staleMs / 1000)),
    });
    return;
  } catch (err) {
    res.status(500).json({ error: "Health check failed", message: String(err) });
  }
});

router.post("/check", async (req, res) => {
  try {
    const result = await runMonitorCycle();
    res.json({ ...result, source: "manual_trigger" });
  } catch (err) {
    res.status(500).json({ error: "Manual check failed", message: String(err) });
  }
});

router.get("/metrics", async (req, res) => {
  try {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [analyses7d] = await db
      .select({
        total: sql<number>`count(*)::int`,
        avg_conf: sql<number>`avg(overall_confidence)`,
        avg_manip: sql<number>`avg(manipulation_risk)`,
      })
      .from(analysisResultsTable)
      .where(gte(analysisResultsTable.created_at, since7d));

    const [analyses24h] = await db
      .select({
        total: sql<number>`count(*)::int`,
        avg_conf: sql<number>`avg(overall_confidence)`,
      })
      .from(analysisResultsTable)
      .where(gte(analysisResultsTable.created_at, since24h));

    const [policyStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        federal: sql<number>`sum(case when jurisdiction_type='federal' then 1 else 0 end)::int`,
        state: sql<number>`sum(case when jurisdiction_type='state' then 1 else 0 end)::int`,
        learned: sql<number>`sum(case when policy_type='learned_pattern' then 1 else 0 end)::int`,
      })
      .from(policyKnowledgeTable);

    const statesCovered = await db
      .selectDistinct({ state: policyKnowledgeTable.state_code })
      .from(policyKnowledgeTable)
      .where(sql`state_code is not null`);

    const categoryBreakdown = await db
      .select({
        category: policyKnowledgeTable.category,
        cnt: sql<number>`count(*)::int`,
      })
      .from(policyKnowledgeTable)
      .groupBy(policyKnowledgeTable.category)
      .orderBy(sql`count(*) desc`);

    const feedbackStats = await db
      .select({
        type: analysisFeedbackTable.feedback_type,
        cnt: sql<number>`count(*)::int`,
      })
      .from(analysisFeedbackTable)
      .groupBy(analysisFeedbackTable.feedback_type);

    const totalFeedback = feedbackStats.reduce((s, f) => s + f.cnt, 0);
    const confirmedCount = feedbackStats.find((f) => f.type === "confirmed")?.cnt ?? 0;
    const accuracy = totalFeedback > 0 ? (confirmedCount / totalFeedback) * 100 : null;

    const healthHistory = await db
      .select({ status: systemHealthChecksTable.status, checked_at: systemHealthChecksTable.checked_at })
      .from(systemHealthChecksTable)
      .orderBy(desc(systemHealthChecksTable.checked_at))
      .limit(48);

    res.json({
      analysis: {
        last_24h: {
          total: analyses24h?.total ?? 0,
          avg_confidence: analyses24h?.avg_conf ? Math.round(parseFloat(String(analyses24h.avg_conf)) * 100) : null,
        },
        last_7d: {
          total: analyses7d?.total ?? 0,
          avg_confidence: analyses7d?.avg_conf ? Math.round(parseFloat(String(analyses7d.avg_conf)) * 100) : null,
          avg_manipulation_risk: analyses7d?.avg_manip ? parseFloat(String(analyses7d.avg_manip)).toFixed(3) : null,
        },
      },
      knowledge_base: {
        total: policyStats?.total ?? 0,
        federal_policies: policyStats?.federal ?? 0,
        state_policies: policyStats?.state ?? 0,
        learned_patterns: policyStats?.learned ?? 0,
        states_covered: statesCovered.length,
        categories: categoryBreakdown,
      },
      guardian_feedback: {
        total: totalFeedback,
        breakdown: feedbackStats,
        accuracy_rate: accuracy ? Math.round(accuracy) : null,
      },
      uptime: {
        checks_logged: healthHistory.length,
        status_history: healthHistory.slice(0, 24).map((h) => ({
          status: h.status,
          at: h.checked_at,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Metrics failed", message: String(err) });
  }
});

router.get("/history", async (req, res) => {
  try {
    const limit = parseInt((req.query["limit"] as string) ?? "24");
    const history = await getHealthHistory(Math.min(limit, 100));
    res.json({ history, count: history.length });
  } catch (err) {
    res.status(500).json({ error: "History fetch failed", message: String(err) });
  }
});

export default router;
