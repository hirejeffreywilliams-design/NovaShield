import crypto from "crypto";

export interface AnonymizedIncident {
  id: string;
  title: string;
  description: string | null;
  location_area: string | null;
  status: string;
  date: string;
  officer_badge: null;
  officer_name: null;
}

export interface AnonymizedReport {
  id: string;
  title: string;
  summary: string | null;
  findings: string[];
  recommendations: string[];
  date: string;
}

function anonymizeId(id: string): string {
  return crypto.createHash("sha256").update(id).digest("hex").substring(0, 12);
}

function generalizeLocation(location: string | null): string | null {
  if (!location) return null;
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) return parts.slice(-2).join(", ");
  return location.replace(/\d+/g, "***");
}

function redactNames(text: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/Officer\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/g, "Officer [REDACTED]")
    .replace(/Badge\s*(#|number|no\.?)\s*\w+/gi, "Badge [REDACTED]")
    .replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, (match) => {
      if (["United States", "New York", "Los Angeles", "San Francisco"].includes(match)) return match;
      return "[NAME REDACTED]";
    });
}

export function anonymizeIncident(incident: {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  status: string;
  created_at: Date;
  officer_badge: string | null;
  officer_name: string | null;
}): AnonymizedIncident {
  return {
    id: anonymizeId(incident.id),
    title: redactNames(incident.title) || incident.title,
    description: redactNames(incident.description),
    location_area: generalizeLocation(incident.location),
    status: incident.status,
    date: incident.created_at.toISOString().split("T")[0],
    officer_badge: null,
    officer_name: null,
  };
}

export function anonymizeReport(report: {
  id: string;
  title: string;
  summary: string | null;
  findings: string[] | null;
  recommendations: string[] | null;
  created_at: Date;
}): AnonymizedReport {
  return {
    id: anonymizeId(report.id),
    title: redactNames(report.title) || report.title,
    summary: redactNames(report.summary),
    findings: (report.findings || []).map((f) => redactNames(f) || f),
    recommendations: (report.recommendations || []).map((r) => redactNames(r) || r),
    date: report.created_at.toISOString().split("T")[0],
  };
}
