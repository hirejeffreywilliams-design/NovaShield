import { db } from "@workspace/db";
import {
  systemHealthChecksTable,
  policyKnowledgeTable,
  analysisResultsTable,
  analysisFeedbackTable,
} from "@workspace/db/schema";
import { eq, desc, gte, and, sql, count } from "drizzle-orm";

export interface HealthAlert {
  level: "warn" | "error";
  code: string;
  message: string;
  detail?: string;
}

export interface MonitorResult {
  status: "ok" | "warn" | "error";
  db_ok: boolean;
  analysis_pipeline_ok: boolean;
  policies_count: number;
  analyses_24h: number;
  avg_confidence_24h: number | null;
  confirmed_feedback_count: number;
  disputed_feedback_count: number;
  auto_learned: boolean;
  new_patterns_learned: number;
  alerts: HealthAlert[];
  notes: string | null;
  checked_at: Date;
}

const CONFIDENCE_WARN_THRESHOLD = 0.55;
const MIN_POLICY_COUNT = 20;
const AUTO_LEARN_THRESHOLD = 3;
const DISPUTE_RATE_WARN = 0.40;

async function autoLearnPatterns(): Promise<number> {
  try {
    const groups = await db
      .select({
        concern_type: analysisFeedbackTable.concern_type,
        concern_description: analysisFeedbackTable.concern_description,
        applicable_amendment: analysisFeedbackTable.applicable_amendment,
        cnt: sql<number>`count(*)::int`,
      })
      .from(analysisFeedbackTable)
      .where(eq(analysisFeedbackTable.feedback_type, "confirmed"))
      .groupBy(
        analysisFeedbackTable.concern_type,
        analysisFeedbackTable.concern_description,
        analysisFeedbackTable.applicable_amendment
      )
      .having(sql`count(*) >= ${AUTO_LEARN_THRESHOLD}`);

    if (groups.length === 0) return 0;

    const existingLearned = await db
      .select({ title: policyKnowledgeTable.title })
      .from(policyKnowledgeTable)
      .where(eq(policyKnowledgeTable.policy_type, "learned_pattern"));

    const existingTitles = new Set(existingLearned.map((r) => r.title));

    const toInsert = groups
      .filter((g) => {
        const title = `GUARDIAN VERIFIED PATTERN — ${(g.concern_type ?? "VIOLATION").toUpperCase()}`;
        return !existingTitles.has(title);
      })
      .map((g) => ({
        category: mapConcernToCategory(g.concern_type ?? "civil_rights"),
        jurisdiction_type: "learned",
        jurisdiction_name: "Guardian Network — Community Verified",
        state_code: null as string | null,
        title: `GUARDIAN VERIFIED PATTERN — ${(g.concern_type ?? "VIOLATION").toUpperCase()}`,
        content: buildLearnedContent(g),
        legal_authority: g.applicable_amendment ?? null,
        source_url: null as string | null,
        policy_type: "learned_pattern",
        tags: ["learned", "guardian_verified", g.concern_type ?? "unknown"].filter(Boolean) as string[],
        effective_date: new Date().getFullYear().toString(),
      }));

    if (toInsert.length === 0) return 0;

    await db.insert(policyKnowledgeTable).values(toInsert);
    console.log(`[SIE Monitor] Auto-learned ${toInsert.length} new pattern(s) from Guardian feedback.`);
    return toInsert.length;
  } catch (err) {
    console.error("[SIE Monitor] Auto-learn failed:", err);
    return 0;
  }
}

function mapConcernToCategory(concernType: string): string {
  const c = concernType.toLowerCase();
  if (c.includes("force") || c.includes("choke") || c.includes("assault")) return "use_of_force";
  if (c.includes("search") || c.includes("seizure") || c.includes("warrant")) return "search_seizure";
  if (c.includes("miranda") || c.includes("arrest")) return "arrest_procedure";
  if (c.includes("discriminat") || c.includes("racial") || c.includes("profil")) return "civil_rights";
  if (c.includes("corruption") || c.includes("misconduct")) return "misconduct";
  return "civil_rights";
}

function buildLearnedContent(g: {
  concern_type: string | null;
  concern_description: string | null;
  applicable_amendment: string | null;
  cnt: number;
}): string {
  return [
    `GUARDIAN NETWORK VERIFIED VIOLATION PATTERN — confirmed by ${g.cnt} independent Guardian reports.`,
    g.concern_description ? `Pattern description: ${g.concern_description}` : null,
    g.applicable_amendment
      ? `Constitutional basis: ${g.applicable_amendment}`
      : null,
    `This pattern was automatically extracted from Guardian field feedback and added to the Shield Intelligence knowledge base. AI analysis now weights this pattern when scanning evidence images in similar contexts.`,
    `Confidence in pattern: HIGH (${g.cnt} confirmations ≥ threshold of ${AUTO_LEARN_THRESHOLD}).`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function runMonitorCycle(): Promise<MonitorResult> {
  const checkedAt = new Date();
  const alerts: HealthAlert[] = [];
  let dbOk = true;
  let pipelineOk = true;
  let policiesCount = 0;
  let analyses24h = 0;
  let avgConfidence: number | null = null;
  let confirmedFeedback = 0;
  let disputedFeedback = 0;
  let patternsLearned = 0;

  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [polRow] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(policyKnowledgeTable);
    policiesCount = polRow?.cnt ?? 0;

    const [anaRow] = await db
      .select({
        cnt: sql<number>`count(*)::int`,
        avg_conf: sql<number>`avg(overall_confidence)`,
      })
      .from(analysisResultsTable)
      .where(gte(analysisResultsTable.created_at, since24h));
    analyses24h = anaRow?.cnt ?? 0;
    avgConfidence =
      anaRow?.avg_conf != null ? parseFloat(String(anaRow.avg_conf)) : null;

    const [confRow] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(analysisFeedbackTable)
      .where(eq(analysisFeedbackTable.feedback_type, "confirmed"));
    confirmedFeedback = confRow?.cnt ?? 0;

    const [dispRow] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(analysisFeedbackTable)
      .where(eq(analysisFeedbackTable.feedback_type, "disputed"));
    disputedFeedback = dispRow?.cnt ?? 0;
  } catch (err) {
    dbOk = false;
    pipelineOk = false;
    alerts.push({
      level: "error",
      code: "DB_UNREACHABLE",
      message: "Database connection failed",
      detail: String(err),
    });
  }

  if (dbOk) {
    if (policiesCount < MIN_POLICY_COUNT) {
      alerts.push({
        level: "warn",
        code: "LOW_POLICY_COUNT",
        message: `Only ${policiesCount} policies loaded`,
        detail: "Run the policy seed to restore full knowledge base coverage.",
      });
    }

    if (avgConfidence !== null && avgConfidence < CONFIDENCE_WARN_THRESHOLD) {
      alerts.push({
        level: "warn",
        code: "LOW_CONFIDENCE",
        message: `Avg analysis confidence ${(avgConfidence * 100).toFixed(0)}% — below ${(CONFIDENCE_WARN_THRESHOLD * 100).toFixed(0)}% threshold`,
        detail: "AI confidence is lower than expected. Check image quality or policy coverage.",
      });
    }

    const totalFeedback = confirmedFeedback + disputedFeedback;
    if (totalFeedback >= 5) {
      const disputeRate = disputedFeedback / totalFeedback;
      if (disputeRate >= DISPUTE_RATE_WARN) {
        alerts.push({
          level: "warn",
          code: "HIGH_DISPUTE_RATE",
          message: `${(disputeRate * 100).toFixed(0)}% of feedback disputes AI findings`,
          detail: "High dispute rate may indicate policy coverage gaps or model calibration drift.",
        });
      }
    }

    patternsLearned = await autoLearnPatterns();
  }

  const status: "ok" | "warn" | "error" = alerts.some((a) => a.level === "error")
    ? "error"
    : alerts.length > 0
    ? "warn"
    : "ok";

  const result: MonitorResult = {
    status,
    db_ok: dbOk,
    analysis_pipeline_ok: pipelineOk,
    policies_count: policiesCount,
    analyses_24h: analyses24h,
    avg_confidence_24h: avgConfidence,
    confirmed_feedback_count: confirmedFeedback,
    disputed_feedback_count: disputedFeedback,
    auto_learned: patternsLearned > 0,
    new_patterns_learned: patternsLearned,
    alerts,
    notes: patternsLearned > 0
      ? `Auto-learned ${patternsLearned} new pattern(s) from Guardian feedback this cycle.`
      : null,
    checked_at: checkedAt,
  };

  try {
    await db.insert(systemHealthChecksTable).values({
      checked_at: checkedAt,
      status,
      db_ok: dbOk,
      analysis_pipeline_ok: pipelineOk,
      policies_count: policiesCount,
      analyses_24h: analyses24h,
      avg_confidence_24h: avgConfidence,
      confirmed_feedback_count: confirmedFeedback,
      disputed_feedback_count: disputedFeedback,
      auto_learned: patternsLearned > 0,
      new_patterns_learned: patternsLearned,
      alerts: alerts as any,
      notes: result.notes,
    });
  } catch (err) {
    console.error("[SIE Monitor] Failed to persist health check:", err);
  }

  const icon = status === "ok" ? "✅" : status === "warn" ? "⚠️" : "🚨";
  console.log(
    `[SIE Monitor] ${icon} Status: ${status.toUpperCase()} | Policies: ${policiesCount} | Analyses (24h): ${analyses24h} | Avg Confidence: ${avgConfidence != null ? (avgConfidence * 100).toFixed(0) + "%" : "N/A"} | Patterns learned: ${patternsLearned}`
  );
  if (alerts.length > 0) {
    alerts.forEach((a) => console.log(`  [${a.level.toUpperCase()}] ${a.code}: ${a.message}`));
  }

  return result;
}

export async function getLatestHealthCheck(): Promise<MonitorResult | null> {
  try {
    const [latest] = await db
      .select()
      .from(systemHealthChecksTable)
      .orderBy(desc(systemHealthChecksTable.checked_at))
      .limit(1);

    if (!latest) return null;

    return {
      status: latest.status as "ok" | "warn" | "error",
      db_ok: latest.db_ok,
      analysis_pipeline_ok: latest.analysis_pipeline_ok,
      policies_count: latest.policies_count ?? 0,
      analyses_24h: latest.analyses_24h ?? 0,
      avg_confidence_24h: latest.avg_confidence_24h ?? null,
      confirmed_feedback_count: latest.confirmed_feedback_count ?? 0,
      disputed_feedback_count: latest.disputed_feedback_count ?? 0,
      auto_learned: latest.auto_learned ?? false,
      new_patterns_learned: latest.new_patterns_learned ?? 0,
      alerts: (latest.alerts as HealthAlert[]) ?? [],
      notes: latest.notes,
      checked_at: latest.checked_at,
    };
  } catch {
    return null;
  }
}

export async function getHealthHistory(limit = 24): Promise<typeof systemHealthChecksTable.$inferSelect[]> {
  try {
    return await db
      .select()
      .from(systemHealthChecksTable)
      .orderBy(desc(systemHealthChecksTable.checked_at))
      .limit(limit);
  } catch {
    return [];
  }
}

export function startMonitoringLoop(intervalMs = 5 * 60 * 1000) {
  console.log("[SIE Monitor] Shield Intelligence Engine monitoring loop started.");
  runMonitorCycle().catch((err) => console.error("[SIE Monitor] Initial cycle error:", err));
  return setInterval(() => {
    runMonitorCycle().catch((err) => console.error("[SIE Monitor] Cycle error:", err));
  }, intervalMs);
}
