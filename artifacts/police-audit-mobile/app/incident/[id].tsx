import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useIncidents, Incident, IncidentEvent } from "@/contexts/IncidentContext";

const C = Colors.light;

const EVENT_TYPES = [
  { key: "force_used", label: "Force Used", icon: "alert-octagon", color: C.statusRecording },
  { key: "weapon_drawn", label: "Weapon Drawn", icon: "target", color: C.statusRecording },
  { key: "verbal_aggression", label: "Verbal Aggression", icon: "volume-2", color: C.warning },
  { key: "unlawful_search", label: "Unlawful Search", icon: "search", color: C.warning },
  { key: "miranda_rights", label: "Miranda Rights", icon: "book-open", color: C.statusAnalyzed },
  { key: "obstruction", label: "Obstruction", icon: "slash", color: C.warning },
  { key: "other", label: "Other", icon: "more-horizontal", color: C.textMuted },
];

const STATUS_STEPS = ["pending", "analyzed", "reported"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatDuration(seconds?: number) {
  if (!seconds) return "Not recorded";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incidents, getIncidentEvents, addEvent, deleteIncident, generateReport, getReport, updateIncident } = useIncidents();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [eventDescription, setEventDescription] = useState("");

  const incident = incidents.find((i) => i.id === id);

  useEffect(() => {
    if (id) {
      getIncidentEvents(id).then((evts) => {
        setEvents(evts);
        setLoadingEvents(false);
      }).catch(() => setLoadingEvents(false));
    }
  }, [id]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Incident", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteIncident(id!);
          router.back();
        },
      },
    ]);
  }, [id, deleteIncident]);

  const handleGenerateReport = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingReport(true);
    try {
      await generateReport(id!);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: "/report/[incidentId]", params: { incidentId: id! } });
    } catch (err) {
      Alert.alert("Error", "Failed to generate report.");
    } finally {
      setGeneratingReport(false);
    }
  }, [id, generateReport]);

  const handleAddEvent = useCallback(async () => {
    if (!selectedEventType) return;
    try {
      const evt = await addEvent(id!, {
        type: selectedEventType as any,
        description: eventDescription.trim() || undefined,
      });
      setEvents((prev) => [...prev, evt]);
      setShowAddEvent(false);
      setSelectedEventType("");
      setEventDescription("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to add event.");
    }
  }, [id, selectedEventType, eventDescription, addEvent]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!incident) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={C.text} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.notFound}>Incident not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{incident.title}</Text>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Feather name="trash-2" size={20} color={C.statusRecording} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 84 + 34 : 120, paddingHorizontal: 20, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaBadge}>
          <Text style={styles.metaDate}>{formatDate(incident.created_at)}</Text>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(incident.status) + "22" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(incident.status) }]}>
              {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
            </Text>
          </View>
        </View>

        {incident.description ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DESCRIPTION</Text>
            <Text style={styles.cardText}>{incident.description}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>DETAILS</Text>
          <DetailRow icon="clock" label="Duration" value={formatDuration(incident.duration_seconds)} />
          {incident.location ? <DetailRow icon="map-pin" label="Location" value={incident.location} /> : null}
          {incident.officer_badge ? <DetailRow icon="shield" label="Badge #" value={incident.officer_badge} /> : null}
          {incident.officer_name ? <DetailRow icon="user" label="Officer" value={incident.officer_name} /> : null}
        </View>

        {incident.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NOTES</Text>
            <Text style={styles.cardText}>{incident.notes}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.eventsHeader}>
            <Text style={styles.cardLabel}>EVENTS LOGGED</Text>
            <Pressable
              style={styles.addEventBtn}
              onPress={() => setShowAddEvent(!showAddEvent)}
            >
              <Feather name={showAddEvent ? "minus" : "plus"} size={16} color={C.accent} />
            </Pressable>
          </View>

          {showAddEvent ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.addEventForm}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventTypeRow}>
                {EVENT_TYPES.map((et) => (
                  <Pressable
                    key={et.key}
                    style={[styles.eventTypeChip, selectedEventType === et.key && { backgroundColor: et.color + "33", borderColor: et.color }]}
                    onPress={() => setSelectedEventType(et.key)}
                  >
                    <Feather name={et.icon as any} size={12} color={selectedEventType === et.key ? et.color : C.textMuted} />
                    <Text style={[styles.eventTypeLabel, selectedEventType === et.key && { color: et.color }]}>{et.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                style={styles.eventDescInput}
                placeholder="Description (optional)"
                placeholderTextColor={C.textMuted}
                value={eventDescription}
                onChangeText={setEventDescription}
              />
              <Pressable
                style={[styles.addEventSubmit, !selectedEventType && styles.addEventSubmitDisabled]}
                onPress={handleAddEvent}
                disabled={!selectedEventType}
              >
                <Text style={styles.addEventSubmitText}>Log Event</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {loadingEvents ? (
            <ActivityIndicator color={C.accent} style={{ marginVertical: 16 }} />
          ) : events.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Feather name="list" size={24} color={C.border} />
              <Text style={styles.emptyEventsText}>No events logged yet</Text>
            </View>
          ) : (
            events.map((evt) => {
              const etCfg = EVENT_TYPES.find((e) => e.key === evt.type) || EVENT_TYPES[EVENT_TYPES.length - 1];
              return (
                <View key={evt.id} style={styles.eventRow}>
                  <View style={[styles.eventDot, { backgroundColor: etCfg.color }]} />
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventType, { color: etCfg.color }]}>{etCfg.label}</Text>
                    {evt.description ? <Text style={styles.eventDesc}>{evt.description}</Text> : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.reportBtn, { opacity: generatingReport || pressed ? 0.8 : 1 }]}
          onPress={handleGenerateReport}
          disabled={generatingReport}
        >
          {generatingReport ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="file-text" size={18} color="#fff" />
              <Text style={styles.reportBtnText}>
                {incident.status === "reported" ? "View Report" : "Generate Report"}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  const C = Colors.light;
  switch (status) {
    case "recording": return C.statusRecording;
    case "analyzed": return C.statusAnalyzed;
    case "reported": return C.statusReported;
    default: return C.statusPending;
  }
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Feather name={icon as any} size={14} color={C.textMuted} />
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  label: {
    fontSize: 13,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
    textAlign: "right",
    flex: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { color: C.textMuted, fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600" as const,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metaDate: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular" },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  eventsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  addEventBtn: { padding: 4 },
  addEventForm: {
    marginBottom: 12,
    gap: 10,
  },
  eventTypeRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  eventTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  eventTypeLabel: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  eventDescInput: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 12,
    color: C.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: C.border,
  },
  addEventSubmit: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  addEventSubmitDisabled: { opacity: 0.4 },
  addEventSubmitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  emptyEvents: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  emptyEventsText: {
    color: C.textMuted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  eventRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  eventInfo: { flex: 1 },
  eventType: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  eventDesc: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  reportBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
