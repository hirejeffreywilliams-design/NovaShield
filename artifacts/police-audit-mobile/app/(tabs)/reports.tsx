import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useIncidents, Report } from "@/contexts/IncidentContext";

const C = Colors.light;

function ReportCard({ report, index, onPress }: { report: Report; index: number; onPress: () => void }) {
  const date = new Date(report.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <Pressable
        style={({ pressed }) => [styles.reportCard, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        onPress={onPress}
      >
        <View style={styles.reportTop}>
          <View style={styles.reportIconWrap}>
            <Feather name="file-text" size={20} color={C.statusReported} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={2}>{report.title}</Text>
            <Text style={styles.reportDate}>{date}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={C.textMuted} />
        </View>
        {report.summary ? (
          <Text style={styles.reportSummary} numberOfLines={2}>{report.summary}</Text>
        ) : null}
        <View style={styles.reportMeta}>
          <View style={styles.metaChip}>
            <Feather name="list" size={11} color={C.textMuted} />
            <Text style={styles.metaChipText}>{(report.findings || []).length} findings</Text>
          </View>
          <View style={styles.metaChip}>
            <Feather name="alert-triangle" size={11} color={C.textMuted} />
            <Text style={styles.metaChipText}>{(report.recommendations || []).length} recommendations</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ReportsScreen() {
  const { reports, refreshReports } = useIncidents();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshReports();
    setRefreshing(false);
  }, [refreshReports]);

  const handleReportPress = (report: Report) => {
    Haptics.selectionAsync();
    router.push({ pathname: "/report/[incidentId]", params: { incidentId: report.incident_id } });
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSub}>{reports.length} generated</Text>
        </View>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="file-text" size={56} color={C.border} />
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptyText}>
            Generate a report from any incident to create evidence-grade documentation
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ReportCard report={item} index={index} onPress={() => handleReportPress(item)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === "web" ? 84 + 34 : 120 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!reports.length}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  reportCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  reportTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  reportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.statusReported + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  reportInfo: { flex: 1, gap: 3 },
  reportTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 21,
  },
  reportDate: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
  },
  reportSummary: {
    fontSize: 13,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  reportMeta: { flexDirection: "row", gap: 10 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
