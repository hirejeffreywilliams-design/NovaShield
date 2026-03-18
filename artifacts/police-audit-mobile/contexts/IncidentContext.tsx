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

  return (
    <IncidentContext.Provider value={{
      incidents, officers, reports, isLoading, error,
      refreshIncidents, refreshOfficers, refreshReports,
      createIncident, updateIncident, deleteIncident,
      getIncidentEvents, addEvent,
      createOfficer, resolveOfficer,
      generateReport, getReport,
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
