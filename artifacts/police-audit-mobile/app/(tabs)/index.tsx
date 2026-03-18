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
import { useIncidents, Incident } from "@/contexts/IncidentContext";
import { IncidentCard } from "@/components/IncidentCard";

const C = Colors.light;

export default function IncidentsScreen() {
  const { incidents, isLoading, refreshIncidents } = useIncidents();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshIncidents();
    setRefreshing(false);
  }, [refreshIncidents]);

  const handleNewIncident = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/incident/new");
  }, []);

  const handleIncidentPress = useCallback((incident: Incident) => {
    Haptics.selectionAsync();
    router.push({ pathname: "/incident/[id]", params: { id: incident.id } });
  }, []);

  const handleEncounterMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/encounter");
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Incidents</Text>
          <Text style={styles.headerSub}>{incidents.length} recorded</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={handleNewIncident}
        >
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.encounterBanner, { opacity: pressed ? 0.9 : 1 }]}
        onPress={handleEncounterMode}
      >
        <View style={styles.encounterIconWrap}>
          <Feather name="shield" size={22} color="#fff" />
        </View>
        <View style={styles.encounterText}>
          <Text style={styles.encounterTitle}>Encounter Mode</Text>
          <Text style={styles.encounterSub}>Scripts · Demands · Rights — flip the power dynamic</Text>
        </View>
        <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {incidents.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Feather name="shield" size={56} color={C.border} />
          <Text style={styles.emptyTitle}>No Incidents Yet</Text>
          <Text style={styles.emptyText}>
            Tap + to record your first police encounter
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleNewIncident}
          >
            <Text style={styles.emptyBtnText}>Record Incident</Text>
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
    paddingBottom: 12,
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
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  encounterBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  encounterIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  encounterText: { flex: 1, gap: 2 },
  encounterTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  encounterSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: C.accent,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
