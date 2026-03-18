import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useIncidents } from "@/contexts/IncidentContext";

const C = Colors.light;

export default function OfficerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { officers } = useIncidents();
  const insets = useSafeAreaInsets();
  const officer = officers.find((o) => o.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!officer) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.notFound}>Officer not found</Text>
        </View>
      </View>
    );
  }

  const initials = [officer.name?.split(" ")[0]?.[0], officer.name?.split(" ")[1]?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Officer Record</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{officer.name || "Unknown Officer"}</Text>
        {officer.rank ? <Text style={styles.rank}>{officer.rank}</Text> : null}
        {officer.badge_no ? (
          <View style={styles.badgePill}>
            <Feather name="shield" size={13} color={C.accent} />
            <Text style={styles.badgePillText}>Badge #{officer.badge_no}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.detailsCard}>
        {officer.agency ? <DetailRow label="Agency" value={officer.agency} /> : null}
        {officer.department ? <DetailRow label="Division" value={officer.department} /> : null}
        <DetailRow label="Incidents" value={String(officer.incident_count || 0)} />
        {officer.notes ? <DetailRow label="Notes" value={officer.notes} /> : null}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  label: { fontSize: 14, color: C.textMuted, fontFamily: "Inter_400Regular" },
  value: { fontSize: 14, color: C.text, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { color: C.textMuted, fontSize: 16 },
  backBtn: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.accent + "22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: C.accent,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  rank: {
    fontSize: 15,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accent + "22",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgePillText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: C.accent,
    fontFamily: "Inter_600SemiBold",
  },
  detailsCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
});
