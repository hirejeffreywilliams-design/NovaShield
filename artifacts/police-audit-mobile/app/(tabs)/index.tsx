import React, { useState, useCallback, useEffect } from "react";
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
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useIncidents, Incident } from "@/contexts/IncidentContext";
import { useSOS } from "@/contexts/SOSContext";
import { IncidentCard } from "@/components/IncidentCard";

const C = Colors.light;

const POWER_TOOLS = [
  {
    id: "encounter",
    title: "Shield Protocol",
    sub: "Scripts · Demands · Rights",
    icon: "shield",
    color: "#E53935",
    bg: "#E5393518",
    border: "#E5393544",
    route: "/encounter",
  },
  {
    id: "corruption",
    title: "Expose & Report",
    sub: "Document · Report · Expose",
    icon: "target",
    color: "#f59e0b",
    bg: "#f59e0b18",
    border: "#f59e0b44",
    route: "/corruption",
  },
  {
    id: "immigration",
    title: "Sanctuary Rights",
    sub: "ICE · CBP · Detention",
    icon: "globe",
    color: "#0891b2",
    bg: "#0891b218",
    border: "#0891b244",
    route: "/immigration",
  },
  {
    id: "complaints",
    title: "Guardian Complaint",
    sub: "All 50 states + Federal",
    icon: "folder",
    color: "#6366f1",
    bg: "#6366f118",
    border: "#6366f144",
    route: "/complaints",
  },
  {
    id: "intelligence",
    title: "Shield Intelligence",
    sub: "Self-Learning AI Engine",
    icon: "cpu",
    color: "#a855f7",
    bg: "#a855f718",
    border: "#a855f744",
    route: "/intelligence",
  },
];

export default function IncidentsScreen() {
  const { incidents, isLoading, refreshIncidents } = useIncidents();
  const { activeEvent } = useSOS();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const sosGlow = useSharedValue(0.6);
  const sosScale = useSharedValue(1);

  useEffect(() => {
    sosGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    sosScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const sosGlowStyle = useAnimatedStyle(() => ({
    opacity: sosGlow.value,
    transform: [{ scale: sosScale.value }],
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshIncidents();
    setRefreshing(false);
  }, [refreshIncidents]);

  const handleNewIncident = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/incident/new");
  }, []);

  const handleSOS = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/sos");
  }, []);

  const handleIncidentPress = useCallback((incident: Incident) => {
    Haptics.selectionAsync();
    router.push({ pathname: "/incident/[id]", params: { id: incident.id } });
  }, []);

  const handleTool = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CivilShield</Text>
          <Text style={styles.headerSub}>The Shield is yours · {incidents.length} Shield Report{incidents.length !== 1 ? "s" : ""} filed</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={handleNewIncident}
        >
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.sosButton, { opacity: pressed ? 0.9 : 1 }]}
        onPress={handleSOS}
      >
        <Animated.View style={[styles.sosGlow, sosGlowStyle]} />
        <Feather name="zap" size={20} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.sosLabel}>
            {activeEvent ? "SHIELD ALERT ACTIVE — Tap to manage" : "Shield Alert — Emergency Button"}
          </Text>
          <Text style={styles.sosSub}>
            {activeEvent ? "Alert sent · Timer running · Tap for status options" : "Instant location alert to your Guardian Network · Know your rights"}
          </Text>
        </View>
        {activeEvent && (
          <View style={styles.sosActiveDot} />
        )}
        <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
      </Pressable>

      <View style={styles.powerGrid}>
        {POWER_TOOLS.map((tool) => (
          <Pressable
            key={tool.id}
            style={({ pressed }) => [
              styles.powerCard,
              { backgroundColor: tool.bg, borderColor: tool.border, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => handleTool(tool.route)}
          >
            <View style={[styles.powerIcon, { backgroundColor: tool.color + "22" }]}>
              <Feather name={tool.icon as any} size={22} color={tool.color} />
            </View>
            <Text style={[styles.powerTitle, { color: tool.color }]}>{tool.title}</Text>
            <Text style={styles.powerSub}>{tool.sub}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.incidentsHeader}>
        <Text style={styles.incidentsTitle}>Shield Reports</Text>
        {incidents.length > 0 && (
          <Pressable onPress={handleNewIncident} style={styles.incidentAddBtn}>
            <Feather name="plus" size={14} color={C.accent} />
            <Text style={styles.incidentAddText}>New</Text>
          </Pressable>
        )}
      </View>

      {incidents.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shield" size={36} color={C.accent} />
          </View>
          <Text style={styles.emptyTitle}>Your Shield Log is Clear</Text>
          <Text style={styles.emptyText}>
            Use the tools above to activate Shield Protocol, expose corruption, or access your Guardian Code. Tap + to file your first Shield Report.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleNewIncident}
          >
            <Feather name="edit-3" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Raise Your Shield</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
              <IncidentCard incident={item} onPress={() => handleIncidentPress(item)} />
            </Animated.View>
          )}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 84 + 34 : 120 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!incidents.length}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.accent}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#E53935",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    position: "relative",
  },
  sosGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ff000030",
    borderRadius: 16,
  },
  sosLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  sosSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 15,
  },
  sosActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginRight: 4,
  },

  powerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 10,
  },
  powerCard: {
    width: "47.5%",
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    minHeight: 110,
  },
  powerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  powerTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  powerSub: {
    fontSize: 11,
    color: "#7a9ab8",
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },

  incidentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  incidentsTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: C.textMuted,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  incidentAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  incidentAddText: {
    fontSize: 13,
    color: C.accent,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.accent + "18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.accent + "33",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
    textAlign: "center" as const,
  },
  emptyText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center" as const,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  emptyBtn: {
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: C.accent,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
