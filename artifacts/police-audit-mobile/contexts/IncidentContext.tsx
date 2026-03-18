import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type IncidentStatus = "recording" | "pending" | "analyzed" | "reported";

export interface Incident {
  id: string;
  title: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: IncidentStatus;
  officer_badge?: string;
  officer_name?: string;
  duration_seconds?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  type: string;
  description?: string;
  timestamp_seconds?: number;
  wall_clock_time?: string | null;
  rights_violated?: string | null;
  confidence?: number;
  created_at: string;
}

export interface Officer {
  id: string;
  name?: string;
  badge_no?: string;
  agency?: string;
  rank?: string;
  department?: string;
  notes?: string;
  incident_count?: number;
  created_at: string;
}

export interface Report {
  id: string;
  incident_id: string;
  title: string;
  summary?: string;
  findings?: string[];
  recommendations?: string[];
  created_at: string;
}

export interface EvidenceIntegrityRecord {
  evidence_photo_id: string;
  verification_status: string;
  verification_note: string | null;
  manipulation_risk_score: number | null;
  image_hash: string;
  chain_hash: string;
  sequence_number: number;
  duplicate_risk: boolean | null;
  timestamp_plausible: boolean | null;
}

export interface EvidencePhoto {
  id: string;
  incident_id: string;
  source?: string | null;
  ai_analysis?: string | null;
  vehicle_unit?: string | null;
  license_plate?: string | null;
  officer_description?: string | null;
  department_markings?: string | null;
  scene_analysis?: any | null;
  person_count?: number | null;
  officer_count?: number | null;
  vehicle_count?: number | null;
  confidence_score?: number | null;
  integrity?: EvidenceIntegrityRecord | null;
  captured_at: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `HTTP ${res.status}`);
  }
  return res.json();
}

interface IncidentContextType {
  incidents: Incident[];
  officers: Officer[];
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  refreshIncidents: () => Promise<void>;
  refreshOfficers: () => Promise<void>;
  refreshReports: () => Promise<void>;
  createIncident: (data: Partial<Incident>) => Promise<Incident>;
  updateIncident: (id: string, data: Partial<Incident>) => Promise<Incident>;
  deleteIncident: (id: string) => Promise<void>;
  getIncidentEvents: (id: string) => Promise<IncidentEvent[]>;
  addEvent: (incidentId: string, event: Partial<IncidentEvent>) => Promise<IncidentEvent>;
  createOfficer: (data: Partial<Officer>) => Promise<Officer>;
  resolveOfficer: (badge: string) => Promise<{ found: boolean; officer: Officer | null; badge_number: string }>;
  generateReport: (incidentId: string) => Promise<Report>;
  getReport: (incidentId: string) => Promise<Report | null>;
  analyzeEvidence: (incidentId: string, image_base64: string, source?: string) => Promise<EvidencePhoto>;
  getEvidence: (incidentId: string) => Promise<EvidencePhoto[]>;
}

const IncidentContext = createContext<IncidentContextType | null>(null);

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshIncidents = useCallback(async () => {
    try {
      const data = await apiFetch<{ incidents: Incident[] }>("/incidents");
      setIncidents(data.incidents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const refreshOfficers = useCallback(async () => {
    try {
      const data = await apiFetch<{ officers: Officer[] }>("/officers");
      setOfficers(data.officers);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const refreshReports = useCallback(async () => {
    try {
      const data = await apiFetch<{ reports: Report[] }>("/reports");
      setReports(data.reports);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([refreshIncidents(), refreshOfficers(), refreshReports()]).finally(() => setIsLoading(false));
  }, []);

  const createIncident = useCallback(async (data: Partial<Incident>): Promise<Incident> => {
    const incident = await apiFetch<Incident>("/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setIncidents((prev) => [incident, ...prev]);
    return incident;
  }, []);

  const updateIncident = useCallback(async (id: string, data: Partial<Incident>): Promise<Incident> => {
    const incident = await apiFetch<Incident>(`/incidents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setIncidents((prev) => prev.map((i) => (i.id === id ? incident : i)));
    return incident;
  }, []);

  const deleteIncident = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/incidents/${id}`, { method: "DELETE" });
    setIncidents((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const getIncidentEvents = useCallback(async (id: string): Promise<IncidentEvent[]> => {
    const data = await apiFetch<{ events: IncidentEvent[] }>(`/incidents/${id}/events`);
    return data.events;
  }, []);

  const addEvent = useCallback(async (incidentId: string, event: Partial<IncidentEvent>): Promise<IncidentEvent> => {
    return apiFetch<IncidentEvent>(`/incidents/${incidentId}/events`, {
      method: "POST",
      body: JSON.stringify(event),
    });
  }, []);

  const createOfficer = useCallback(async (data: Partial<Officer>): Promise<Officer> => {
    const officer = await apiFetch<Officer>("/officers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setOfficers((prev) => [officer, ...prev]);
    return officer;
  }, []);

  const resolveOfficer = useCallback(async (badge: string) => {
    return apiFetch<{ found: boolean; officer: Officer | null; badge_number: string }>("/officers/resolve", {
      method: "POST",
      body: JSON.stringify({ badge_number: badge }),
    });
  }, []);

  const generateReport = useCallback(async (incidentId: string): Promise<Report> => {
    const report = await apiFetch<Report>(`/reports/${incidentId}`, { method: "POST" });
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.incident_id === incidentId);
      if (idx >= 0) { const next = [...prev]; next[idx] = report; return next; }
      return [report, ...prev];
    });
    await refreshIncidents();
    return report;
  }, [refreshIncidents]);

  const getReport = useCallback(async (incidentId: string): Promise<Report | null> => {
    try {
      return await apiFetch<Report>(`/reports/${incidentId}`);
    } catch {
      return null;
    }
  }, []);

  const analyzeEvidence = useCallback(async (incidentId: string, image_base64: string, source = "camera"): Promise<EvidencePhoto> => {
    const result = await apiFetch<{
      photo_id: string;
      evidence_summary?: string;
      scene_analysis?: any;
      integrity?: {
        image_hash: string;
        chain_hash: string;
        sequence_number: number;
        verification_status: string;
        verification_notes: string[];
        manipulation_risk: number;
        manipulation_assessment?: string;
        manipulation_flags?: string[];
        timestamp_plausible: boolean;
        duplicate_risk: boolean;
      };
      counts?: {
        persons?: number;
        law_enforcement?: number;
        civilians?: number;
        vehicles?: number;
      };
      confidence?: {
        overall?: number;
      };
      extracted: {
        vehicle_unit?: string | null;
        license_plate?: string | null;
        officer_description?: string | null;
        department_markings?: string | null;
      };
    }>(`/incidents/${incidentId}/analyze-image`, {
      method: "POST",
      body: JSON.stringify({ image_base64, source }),
    });
    return {
      id: result.photo_id,
      incident_id: incidentId,
      source,
      ai_analysis: result.evidence_summary || null,
      vehicle_unit: result.extracted.vehicle_unit,
      license_plate: result.extracted.license_plate,
      officer_description: result.extracted.officer_description,
      department_markings: result.extracted.department_markings,
      scene_analysis: result.scene_analysis || null,
      person_count: result.counts?.persons ?? null,
      officer_count: result.counts?.law_enforcement ?? null,
      vehicle_count: result.counts?.vehicles ?? null,
      confidence_score: result.confidence?.overall ?? null,
      integrity: result.integrity ? {
        evidence_photo_id: result.photo_id,
        verification_status: result.integrity.verification_status,
        verification_note: result.integrity.verification_notes?.join("; ") || null,
        manipulation_risk_score: result.integrity.manipulation_risk,
        image_hash: result.integrity.image_hash,
        chain_hash: result.integrity.chain_hash,
        sequence_number: result.integrity.sequence_number,
        duplicate_risk: result.integrity.duplicate_risk,
        timestamp_plausible: result.integrity.timestamp_plausible,
      } : null,
      captured_at: new Date().toISOString(),
    };
  }, []);

  const getEvidence = useCallback(async (incidentId: string): Promise<EvidencePhoto[]> => {
    const data = await apiFetch<{ evidence: EvidencePhoto[] }>(`/incidents/${incidentId}/evidence`);
    return data.evidence;
  }, []);

  return (
    <IncidentContext.Provider value={{
      incidents, officers, reports, isLoading, error,
      refreshIncidents, refreshOfficers, refreshReports,
      createIncident, updateIncident, deleteIncident,
      getIncidentEvents, addEvent,
      createOfficer, resolveOfficer,
      generateReport, getReport,
      analyzeEvidence, getEvidence,
    }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error("useIncidents must be used within IncidentProvider");
  return ctx;
}
