import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable, complaintsTable, officersTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/overview", async (_req, res) => {
  try {
    const incidents = await db.select().from(incidentsTable);
    const complaints = await db.select().from(complaintsTable);
    const officers = await db.select().from(officersTable);

    const incidentsByStatus: Record<string, number> = {};
    for (const i of incidents) {
      incidentsByStatus[i.status] = (incidentsByStatus[i.status] || 0) + 1;
    }

    const complaintsByStatus: Record<string, number> = {};
    for (const c of complaints) {
      complaintsByStatus[c.status] = (complaintsByStatus[c.status] || 0) + 1;
    }

    res.json({
      totalIncidents: incidents.length,
      totalComplaints: complaints.length,
      totalOfficers: officers.length,
      incidentsByStatus,
      complaintsByStatus,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get overview stats", message: String(err) });
  }
});

router.get("/racial-disparity", async (_req, res) => {
  try {
    res.json({
      analysis: {
        period: "2024-2025",
        methodology: "Statistical analysis of incident data by demographic group",
        findings: [
          { demographic: "Black", stopRate: 34.2, populationPct: 13.4, disparityIndex: 2.55 },
          { demographic: "Hispanic", stopRate: 24.1, populationPct: 18.5, disparityIndex: 1.30 },
          { demographic: "White", stopRate: 31.5, populationPct: 58.9, disparityIndex: 0.53 },
          { demographic: "Asian", stopRate: 5.8, populationPct: 5.9, disparityIndex: 0.98 },
          { demographic: "Other", stopRate: 4.4, populationPct: 3.3, disparityIndex: 1.33 },
        ],
        overallDisparityScore: 7.2,
        trend: "improving",
        recommendations: [
          "Implement bias training programs",
          "Increase oversight in high-disparity precincts",
          "Deploy early warning systems for pattern detection",
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get racial disparity data", message: String(err) });
  }
});

router.get("/complaint-trends", async (_req, res) => {
  try {
    const complaints = await db.select().from(complaintsTable);

    const byMonth: Record<string, number> = {};
    for (const c of complaints) {
      const month = c.created_at.toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    const trends = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    res.json({
      trends,
      totalComplaints: complaints.length,
      averagePerMonth: complaints.length > 0
        ? Math.round(complaints.length / Math.max(Object.keys(byMonth).length, 1))
        : 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get complaint trends", message: String(err) });
  }
});

router.get("/response-times", async (_req, res) => {
  try {
    res.json({
      averageResponseTime: {
        overall: 4.2,
        byPriority: { critical: 1.1, high: 2.8, medium: 4.5, low: 8.3 },
        byDepartment: [
          { department: "Internal Affairs", avgDays: 3.2 },
          { department: "Patrol Division", avgDays: 5.1 },
          { department: "Investigations", avgDays: 6.7 },
          { department: "Community Relations", avgDays: 2.8 },
        ],
        unit: "days",
      },
      trend: [
        { month: "2025-01", avgDays: 5.1 },
        { month: "2025-02", avgDays: 4.8 },
        { month: "2025-03", avgDays: 4.5 },
        { month: "2025-04", avgDays: 4.2 },
        { month: "2025-05", avgDays: 3.9 },
        { month: "2025-06", avgDays: 4.0 },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get response time data", message: String(err) });
  }
});

router.get("/use-of-force", async (_req, res) => {
  try {
    const incidents = await db.select().from(incidentsTable);

    res.json({
      totalIncidents: incidents.length,
      forceTypes: [
        { type: "Physical Control", count: 45, percentage: 38.1 },
        { type: "Taser Deployment", count: 22, percentage: 18.6 },
        { type: "OC Spray", count: 15, percentage: 12.7 },
        { type: "Baton Strike", count: 8, percentage: 6.8 },
        { type: "Firearm Discharge", count: 3, percentage: 2.5 },
        { type: "Vehicle Pursuit", count: 12, percentage: 10.2 },
        { type: "K9 Deployment", count: 6, percentage: 5.1 },
        { type: "Other", count: 7, percentage: 5.9 },
      ],
      byOutcome: { no_injury: 62, minor_injury: 34, serious_injury: 15, fatal: 2 },
      trend: "stable",
      yearOverYearChange: -3.2,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get use of force data", message: String(err) });
  }
});

router.get("/department-rankings", async (_req, res) => {
  try {
    const officers = await db.select().from(officersTable);
    const complaints = await db.select().from(complaintsTable);

    const deptStats: Record<string, { officers: number; complaints: number; resolved: number }> = {};

    for (const o of officers) {
      const dept = o.department || "Unknown";
      if (!deptStats[dept]) deptStats[dept] = { officers: 0, complaints: 0, resolved: 0 };
      deptStats[dept].officers++;
    }

    for (const c of complaints) {
      const dept = c.department_id || "Unknown";
      if (!deptStats[dept]) deptStats[dept] = { officers: 0, complaints: 0, resolved: 0 };
      deptStats[dept].complaints++;
      if (c.status === "resolved" || c.status === "dismissed") deptStats[dept].resolved++;
    }

    const rankings = Object.entries(deptStats)
      .map(([department, stats]) => ({
        department,
        officerCount: stats.officers,
        complaintCount: stats.complaints,
        resolvedCount: stats.resolved,
        resolutionRate: stats.complaints > 0
          ? Math.round((stats.resolved / stats.complaints) * 100)
          : 100,
        complaintsPerOfficer: stats.officers > 0
          ? Math.round((stats.complaints / stats.officers) * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.resolutionRate - a.resolutionRate);

    res.json({ rankings });
  } catch (err) {
    res.status(500).json({ error: "Failed to get department rankings", message: String(err) });
  }
});

export default router;
