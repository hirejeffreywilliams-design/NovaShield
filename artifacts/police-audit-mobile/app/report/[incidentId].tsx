import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useIncidents, Report } from "@/contexts/IncidentContext";

const C = Colors.light;

export default function ReportDetailScreen() {
  const { incidentId } = useLocalSearchParams<{ incidentId: string }>();
  const { getReport, incidents } = useIncidents();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const incident = incidents.find((i) => i.id === incidentId);

  useEffect(() => {
    if (incidentId) {
      getReport(incidentId).then((r) => {
        setReport(r);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [incidentId]);

  const handleShare = async () => {
    if (!report) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = [
      `=== ${report.title} ===`,
      `Date: ${new Date(report.created_at).toLocaleString()}`,
      "",
      report.summary || "",
      "",
      "FINDINGS:",
      ...(report.findings || []).map((f, i) => `${i + 1}. ${f}`),
      "",
      "RECOMMENDATIONS:",
      ...(report.recommendations || []).map((r, i) => `${i + 1}. ${r}`),
    ].join("\n");
    try {
      await Share.share({ title: report.title, message: text });
    } catch {}
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }, styles.center]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={C.text} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Feather name="file-x" size={48} color={C.border} />
          <Text style={styles.notFoundTitle}>Report Not Found</Text>
          <Text style={styles.notFoundText}>Generate a report from the incident detail screen</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>Report</Text>
        <Pressable onPress={handleShare} hitSlop={12}>
          <Feather name="share-2" size={20} color={C.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 84 + 34 : 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(300)} style={styles.reportHeader}>
          <View style={styles.reportIconBig}>
            <Feather name="file-text" size={32} color={C.statusReported} />
          </View>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportDate}>
            Generated {new Date(report.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Text>
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={13} color={C.statusReported} />
            <Text style={styles.verifiedText}>Evidence-grade documentation</Text>
          </View>
        </Animated.View>

        {report.summary ? (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
            <Text style={styles.sectionLabel}>SUMMARY</Text>
            <View style={styles.card}>
              <Text style={styles.summaryText}>{report.summary}</Text>
            </View>
          </Animated.View>
        ) : null}

        {incident ? (
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.section}>
            <Text style={styles.sectionLabel}>INCIDENT DETAILS</Text>
            <View style={styles.card}>
              <InfoRow label="Title" value={incident.title} />
              <InfoRow label="Status" value={incident.status} />
              {incident.location ? <InfoRow label="Location" value={incident.location} /> : null}
              {incident.officer_badge ? <InfoRow label="Badge #" value={incident.officer_badge} /> : null}
              {incident.officer_name ? <InfoRow label="Officer" value={incident.officer_name} /> : null}
            </View>
          </Animated.View>
        ) : null}

        {(report.findings || []).length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.section}>
            <Text style={styles.sectionLabel}>FINDINGS</Text>
            <View style={styles.card}>
              {(report.findings || []).map((finding, i) => (
                <View key={i} style={[styles.findingRow, i < (report.findings!.length - 1) && styles.findingBorder]}>
                  <View style={styles.findingNum}>
                    <Text style={styles.findingNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.findingText}>{finding}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {(report.recommendations || []).length > 0 ? (
          <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.section}>
            <Text style={styles.sectionLabel}>RECOMMENDATIONS</Text>
            <View style={styles.card}>
              {(report.recommendations || []).map((rec, i) => (
                <View key={i} style={[styles.findingRow, i < (report.recommendations!.length - 1) && styles.findingBorder]}>
                  <View style={[styles.findingNum, { backgroundColor: C.statusAnalyzed + "22" }]}>
                    <Feather name="alert-triangle" size={12} color={C.statusAnalyzed} />
                  </View>
                  <Text style={styles.findingText}>{rec}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Pressable
            style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Share Report</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  label: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular" },
  value: {
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontSize: 20, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  notFoundText: { fontSize: 14, color: C.textMuted, textAlign: "center", fontFamily: "Inter_400Regular" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600" as const,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  reportHeader: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
    marginBottom: 8,
  },
  reportIconBig: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.statusReported + "22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 30,
  },
  reportDate: {
    fontSize: 13,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.statusReported + "22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    color: C.statusReported,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryText: {
    fontSize: 15,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    paddingVertical: 16,
  },
  findingRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  findingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  findingNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.statusReported + "22",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  findingNumText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: C.statusReported,
    fontFamily: "Inter_700Bold",
  },
  findingText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
