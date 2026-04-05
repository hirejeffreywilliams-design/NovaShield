import { db } from "@workspace/db";
import {
  incidentsTable,
  officersTable,
  detectedPatternsTable,
  intelligenceAlertsTable,
} from "@workspace/db/schema";
import { sql, desc, gte, eq } from "drizzle-orm";

interface PatternResult {
  id: string;
  pattern_type: string;
  title: string;
  description: string | null;
  severity: string;
  confidence: number | null;
  occurrence_count: number | null;
  created_at: Date;
}

export async function detectRepeatedOfficerPatterns(): Promise<PatternResult[]> {
  const results = await db
    .select({
      officer_badge: incidentsTable.officer_badge,
      officer_name: incidentsTable.officer_name,
      cnt: sql<number>`count(*)::int`,
      incident_ids: sql<string[]>`array_agg(${incidentsTable.id}::text)`,
    })
    .from(incidentsTable)
    .where(sql`${incidentsTable.officer_badge} is not null`)
    .groupBy(incidentsTable.officer_badge, incidentsTable.officer_name)
    .having(sql`count(*) >= 2`);

  const patterns: PatternResult[] = [];
  for (const row of results) {
    const [existing] = await db
      .select()
      .from(detectedPatternsTable)
      .where(
        sql`${detectedPatternsTable.pattern_type} = 'repeated_officer' AND ${detectedPatternsTable.title} LIKE ${"%" + row.officer_badge + "%"}`
      );

    if (existing) {
      await db
        .update(detectedPatternsTable)
        .set({
          occurrence_count: row.cnt,
          incident_ids: row.incident_ids,
          updated_at: new Date(),
        })
        .where(eq(detectedPatternsTable.id, existing.id));
      patterns.push({ ...existing, occurrence_count: row.cnt });
    } else {
      const severity = row.cnt >= 5 ? "high" : row.cnt >= 3 ? "medium" : "low";
      const [pattern] = await db
        .insert(detectedPatternsTable)
        .values({
          pattern_type: "repeated_officer",
          title: `Repeated officer involvement: Badge ${row.officer_badge}`,
          description: `Officer ${row.officer_name || row.officer_badge} has been involved in ${row.cnt} incidents.`,
          severity,
          confidence: Math.min(0.5 + row.cnt * 0.1, 0.95),
          incident_ids: row.incident_ids,
          occurrence_count: row.cnt,
        })
        .returning();
      patterns.push(pattern as PatternResult);
    }
  }

  return patterns;
}

export async function detectGeographicClusters(): Promise<PatternResult[]> {
  const clusters = await db
    .select({
      lat_bucket: sql<number>`round(${incidentsTable.latitude}::numeric, 2)`,
      lon_bucket: sql<number>`round(${incidentsTable.longitude}::numeric, 2)`,
      cnt: sql<number>`count(*)::int`,
      incident_ids: sql<string[]>`array_agg(${incidentsTable.id}::text)`,
      locations: sql<string[]>`array_agg(distinct ${incidentsTable.location})`,
    })
    .from(incidentsTable)
    .where(sql`${incidentsTable.latitude} is not null AND ${incidentsTable.longitude} is not null`)
    .groupBy(
      sql`round(${incidentsTable.latitude}::numeric, 2)`,
      sql`round(${incidentsTable.longitude}::numeric, 2)`
    )
    .having(sql`count(*) >= 3`);

  const patterns: PatternResult[] = [];
  for (const cluster of clusters) {
    const [existing] = await db
      .select()
      .from(detectedPatternsTable)
      .where(
        sql`${detectedPatternsTable.pattern_type} = 'geographic_cluster' AND (${detectedPatternsTable.geographic_data}->>'lat_bucket')::numeric = ${cluster.lat_bucket}`
      );

    if (!existing) {
      const severity = cluster.cnt >= 10 ? "high" : cluster.cnt >= 5 ? "medium" : "low";
      const [pattern] = await db
        .insert(detectedPatternsTable)
        .values({
          pattern_type: "geographic_cluster",
          title: `Geographic cluster: ${cluster.cnt} incidents near (${cluster.lat_bucket}, ${cluster.lon_bucket})`,
          description: `${cluster.cnt} incidents concentrated in area. Locations: ${(cluster.locations || []).filter(Boolean).join(", ")}`,
          severity,
          confidence: Math.min(0.6 + cluster.cnt * 0.05, 0.95),
          incident_ids: cluster.incident_ids,
          geographic_data: { lat_bucket: cluster.lat_bucket, lon_bucket: cluster.lon_bucket, locations: cluster.locations },
          occurrence_count: cluster.cnt,
        })
        .returning();
      patterns.push(pattern as PatternResult);
    }
  }

  return patterns;
}

export async function detectTimePatterns(): Promise<PatternResult[]> {
  const timeGroups = await db
    .select({
      hour: sql<number>`extract(hour from ${incidentsTable.created_at})::int`,
      dow: sql<number>`extract(dow from ${incidentsTable.created_at})::int`,
      cnt: sql<number>`count(*)::int`,
      incident_ids: sql<string[]>`array_agg(${incidentsTable.id}::text)`,
    })
    .from(incidentsTable)
    .groupBy(
      sql`extract(hour from ${incidentsTable.created_at})`,
      sql`extract(dow from ${incidentsTable.created_at})`
    )
    .having(sql`count(*) >= 3`);

  const patterns: PatternResult[] = [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const tg of timeGroups) {
    const [existing] = await db
      .select()
      .from(detectedPatternsTable)
      .where(
        sql`${detectedPatternsTable.pattern_type} = 'time_pattern' AND (${detectedPatternsTable.time_data}->>'hour')::int = ${tg.hour} AND (${detectedPatternsTable.time_data}->>'dow')::int = ${tg.dow}`
      );

    if (!existing) {
      const [pattern] = await db
        .insert(detectedPatternsTable)
        .values({
          pattern_type: "time_pattern",
          title: `Time pattern: ${tg.cnt} incidents on ${dayNames[tg.dow]}s at ${tg.hour}:00`,
          description: `Recurring pattern of ${tg.cnt} incidents during this time window.`,
          severity: tg.cnt >= 5 ? "medium" : "low",
          confidence: Math.min(0.5 + tg.cnt * 0.08, 0.9),
          incident_ids: tg.incident_ids,
          time_data: { hour: tg.hour, dow: tg.dow, day_name: dayNames[tg.dow] },
          occurrence_count: tg.cnt,
        })
        .returning();
      patterns.push(pattern as PatternResult);
    }
  }

  return patterns;
}

export async function generateAlerts(patterns: PatternResult[]): Promise<void> {
  for (const pattern of patterns) {
    if (pattern.severity === "high" || (pattern.occurrence_count && pattern.occurrence_count >= 5)) {
      const [existing] = await db
        .select()
        .from(intelligenceAlertsTable)
        .where(eq(intelligenceAlertsTable.pattern_id, pattern.id));

      if (!existing) {
        await db.insert(intelligenceAlertsTable).values({
          pattern_id: pattern.id,
          alert_type: pattern.pattern_type,
          title: `Alert: ${pattern.title}`,
          message: pattern.description || "Pattern requires attention.",
          severity: pattern.severity,
          metadata: { occurrence_count: pattern.occurrence_count, confidence: pattern.confidence },
        });
      }
    }
  }
}

export async function runFullAnalysis(): Promise<{
  repeated_officers: PatternResult[];
  geographic_clusters: PatternResult[];
  time_patterns: PatternResult[];
  alerts_generated: number;
}> {
  const repeatedOfficers = await detectRepeatedOfficerPatterns();
  const geographicClusters = await detectGeographicClusters();
  const timePatterns = await detectTimePatterns();

  const allPatterns = [...repeatedOfficers, ...geographicClusters, ...timePatterns];
  await generateAlerts(allPatterns);

  const alertCount = allPatterns.filter(
    (p) => p.severity === "high" || (p.occurrence_count && p.occurrence_count >= 5)
  ).length;

  return {
    repeated_officers: repeatedOfficers,
    geographic_clusters: geographicClusters,
    time_patterns: timePatterns,
    alerts_generated: alertCount,
  };
}

export async function getAnonymousAggregate(): Promise<{
  total_incidents: number;
  total_patterns: number;
  severity_breakdown: { severity: string; count: number }[];
  top_pattern_types: { type: string; count: number }[];
}> {
  const [incidentCount] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(incidentsTable);

  const [patternCount] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(detectedPatternsTable);

  const severityBreakdown = await db
    .select({
      severity: detectedPatternsTable.severity,
      cnt: sql<number>`count(*)::int`,
    })
    .from(detectedPatternsTable)
    .groupBy(detectedPatternsTable.severity);

  const typeBreakdown = await db
    .select({
      pattern_type: detectedPatternsTable.pattern_type,
      cnt: sql<number>`count(*)::int`,
    })
    .from(detectedPatternsTable)
    .groupBy(detectedPatternsTable.pattern_type)
    .orderBy(sql`count(*) desc`);

  return {
    total_incidents: incidentCount?.cnt ?? 0,
    total_patterns: patternCount?.cnt ?? 0,
    severity_breakdown: severityBreakdown.map((s) => ({ severity: s.severity, count: s.cnt })),
    top_pattern_types: typeBreakdown.map((t) => ({ type: t.pattern_type, count: t.cnt })),
  };
}
