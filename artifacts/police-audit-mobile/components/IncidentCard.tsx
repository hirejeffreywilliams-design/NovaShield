import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { Incident } from "@/contexts/IncidentContext";

const C = Colors.light;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  recording: { label: "Recording", color: C.statusRecording, icon: "radio" },
  pending: { label: "Pending", color: C.statusPending, icon: "clock" },
  analyzed: { label: "Analyzed", color: C.statusAnalyzed, icon: "cpu" },
  reported: { label: "Reported", color: C.statusReported, icon: "check-circle" },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface Props {
  incident: Incident;
  onPress: () => void;
}

export function IncidentCard({ incident, onPress }: Props) {
  const statusCfg = STATUS_CONFIG[incident.status] || STATUS_CONFIG.pending;
  const duration = formatDuration(incident.duration_seconds);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={1}>{incident.title}</Text>
          <Text style={styles.date}>{formatDate(incident.created_at)}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={C.textMuted} />
      </View>

      {incident.description ? (
        <Text style={styles.description} numberOfLines={2}>{incident.description}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + "22" }]}>
          <Feather name={statusCfg.icon as any} size={11} color={statusCfg.color} />
          <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
        {incident.location ? (
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={11} color={C.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{incident.location}</Text>
          </View>
        ) : null}
        {duration ? (
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={C.textMuted} />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
        ) : null}
        {incident.officer_badge ? (
          <View style={styles.metaItem}>
            <Feather name="shield" size={11} color={C.textMuted} />
            <Text style={styles.metaText}>#{incident.officer_badge}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    maxWidth: 100,
  },
});
