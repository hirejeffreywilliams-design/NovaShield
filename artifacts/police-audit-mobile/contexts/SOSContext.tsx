import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { Linking, Platform, Alert } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "http://localhost:8080/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  notify_on_sos: boolean;
  created_at: string;
}

export interface SosEvent {
  id: string;
  status: string;
  situation_type?: string;
  latitude?: number;
  longitude?: number;
  location_text?: string;
  contacts_notified: number;
  notes?: string;
  started_at: string;
  ended_at?: string;
}

export type SituationType =
  | "police_encounter"
  | "traffic_stop"
  | "immigration"
  | "arrest"
  | "search_seizure"
  | "use_of_force"
  | "other";

interface SOSContextType {
  contacts: TrustedContact[];
  activeEvent: SosEvent | null;
  isLoading: boolean;
  sosElapsed: number;
  refreshContacts: () => Promise<void>;
  addContact: (data: Omit<TrustedContact, "id" | "created_at">) => Promise<TrustedContact>;
  updateContact: (id: string, data: Partial<TrustedContact>) => Promise<TrustedContact>;
  deleteContact: (id: string) => Promise<void>;
  triggerSOS: (situationType: SituationType) => Promise<SosEvent>;
  updateSOSStatus: (status: string) => Promise<void>;
  endSOS: () => Promise<void>;
  sendSMSToContacts: (body: string) => void;
  getLocationString: (lat?: number, lon?: number) => string;
}

const SOSContext = createContext<SOSContextType | null>(null);

export function SOSProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [activeEvent, setActiveEvent] = useState<SosEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sosElapsed, setSosElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((startedAt: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setSosElapsed(elapsed);
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSosElapsed(0);
  }, []);

  useEffect(() => {
    refreshContacts();
    refreshActiveEvent();
    return () => stopTimer();
  }, []);

  useEffect(() => {
    if (activeEvent && !activeEvent.ended_at) {
      startTimer(activeEvent.started_at);
    } else {
      stopTimer();
    }
  }, [activeEvent?.id, activeEvent?.ended_at]);

  const refreshContacts = useCallback(async () => {
    try {
      const data = await apiFetch<{ contacts: TrustedContact[] }>("/sos/contacts");
      setContacts(data.contacts);
    } catch {
      // ignore
    }
  }, []);

  const refreshActiveEvent = useCallback(async () => {
    try {
      const data = await apiFetch<{ event: SosEvent | null }>("/sos/active");
      setActiveEvent(data.event);
    } catch {
      // ignore
    }
  }, []);

  const addContact = useCallback(async (data: Omit<TrustedContact, "id" | "created_at">) => {
    const contact = await apiFetch<TrustedContact>("/sos/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setContacts((prev) => [...prev, contact]);
    return contact;
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<TrustedContact>) => {
    const contact = await apiFetch<TrustedContact>(`/sos/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setContacts((prev) => prev.map((c) => (c.id === id ? contact : c)));
    return contact;
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    await apiFetch(`/sos/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getLocationString = useCallback((lat?: number, lon?: number) => {
    if (lat != null && lon != null) {
      return `https://maps.google.com/?q=${lat},${lon}`;
    }
    return "Location unavailable";
  }, []);

  const sendSMSToContacts = useCallback(
    (body: string) => {
      const notifyContacts = contacts.filter((c) => c.notify_on_sos);
      if (notifyContacts.length === 0) return;
      const phones = notifyContacts.map((c) => c.phone).join(",");
      const encoded = encodeURIComponent(body);
      const url =
        Platform.OS === "ios"
          ? `sms:${phones}&body=${encoded}`
          : `sms:${phones}?body=${encoded}`;
      Linking.openURL(url).catch(() => {});
    },
    [contacts]
  );

  const triggerSOS = useCallback(
    async (situationType: SituationType): Promise<SosEvent> => {
      setIsLoading(true);
      let lat: number | undefined;
      let lon: number | undefined;
      let locationText: string | undefined;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
          const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (geo) {
            const parts = [geo.name, geo.street, geo.city, geo.region].filter(Boolean);
            locationText = parts.join(", ");
          }
        }
      } catch {
        // proceed without location
      }

      const notifyCount = contacts.filter((c) => c.notify_on_sos).length;
      const event = await apiFetch<SosEvent>("/sos/trigger", {
        method: "POST",
        body: JSON.stringify({
          situation_type: situationType,
          latitude: lat,
          longitude: lon,
          location_text: locationText,
          contacts_notified: notifyCount,
        }),
      });

      setActiveEvent(event);
      setIsLoading(false);
      return event;
    },
    [contacts]
  );

  const updateSOSStatus = useCallback(
    async (status: string) => {
      if (!activeEvent) return;
      const updated = await apiFetch<SosEvent>(`/sos/${activeEvent.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setActiveEvent(updated);
    },
    [activeEvent]
  );

  const endSOS = useCallback(async () => {
    if (!activeEvent) return;
    await apiFetch(`/sos/${activeEvent.id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "ended" }),
    });
    setActiveEvent(null);
    stopTimer();
  }, [activeEvent, stopTimer]);

  return (
    <SOSContext.Provider
      value={{
        contacts,
        activeEvent,
        isLoading,
        sosElapsed,
        refreshContacts,
        addContact,
        updateContact,
        deleteContact,
        triggerSOS,
        updateSOSStatus,
        endSOS,
        sendSMSToContacts,
        getLocationString,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
}

export function useSOS() {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error("useSOS must be used within SOSProvider");
  return ctx;
}
