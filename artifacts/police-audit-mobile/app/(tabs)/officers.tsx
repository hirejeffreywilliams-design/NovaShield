import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useIncidents, Officer } from "@/contexts/IncidentContext";

const C = Colors.light;

function OfficerCard({ officer, index }: { officer: Officer; index: number }) {
  const initials = [officer.name?.split(" ")[0]?.[0], officer.name?.split(" ")[1]?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={styles.officerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.officerInfo}>
          <Text style={styles.officerName}>{officer.name || "Unknown Officer"}</Text>
          <View style={styles.officerMetaRow}>
            {officer.badge_no ? (
              <View style={styles.badgeChip}>
                <Feather name="shield" size={11} color={C.textMuted} />
                <Text style={styles.badgeText}>#{officer.badge_no}</Text>
              </View>
            ) : null}
            {officer.agency ? (
              <Text style={styles.officerAgency} numberOfLines={1}>{officer.agency}</Text>
            ) : null}
          </View>
          {officer.rank || officer.department ? (
            <Text style={styles.officerRank}>
              {[officer.rank, officer.department].filter(Boolean).join(" • ")}
            </Text>
          ) : null}
        </View>
        {(officer.incident_count ?? 0) > 0 ? (
          <View style={styles.incidentCountBadge}>
            <Text style={styles.incidentCount}>{officer.incident_count}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function LookupBadgeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { resolveOfficer, createOfficer } = useIncidents();
  const [badgeInput, setBadgeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const insets = useSafeAreaInsets();

  const handleLookup = useCallback(async () => {
    if (!badgeInput.trim()) return;
    setLoading(true);
    try {
      const res = await resolveOfficer(badgeInput.trim());
      setResult(res);
    } catch {
      Alert.alert("Error", "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }, [badgeInput, resolveOfficer]);

  const handleClose = () => {
    setBadgeInput("");
    setResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Badge Lookup</Text>
          <Text style={styles.modalSub}>Enter a badge number to look up officer records</Text>
          <View style={styles.lookupRow}>
            <TextInput
              style={styles.lookupInput}
              placeholder="Badge number"
              placeholderTextColor={C.textMuted}
              value={badgeInput}
              onChangeText={setBadgeInput}
              keyboardType="number-pad"
              returnKeyType="search"
              onSubmitEditing={handleLookup}
            />
            <Pressable
              style={[styles.lookupBtn, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleLookup}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={18} color="#fff" />}
            </Pressable>
          </View>

          {result ? (
            <View style={styles.resultCard}>
              {result.found ? (
                <>
                  <Feather name="check-circle" size={20} color={C.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{result.officer?.name || "Unknown"}</Text>
                    <Text style={styles.resultMeta}>{result.officer?.agency} • #{result.badge_number}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Feather name="alert-circle" size={20} color={C.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>Badge #{result.badge_number} not found</Text>
                    <Text style={styles.resultMeta}>No records found in database</Text>
                  </View>
                </>
              )}
            </View>
          ) : null}

          <Pressable
            style={[styles.closeModalBtn, { marginTop: result ? 12 : 24 }]}
            onPress={handleClose}
          >
            <Text style={styles.closeModalText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AddOfficerModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const { createOfficer } = useIncidents();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [agency, setAgency] = useState("");
  const [rank, setRank] = useState("");
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim() && !badge.trim()) {
      Alert.alert("Required", "Please enter a name or badge number.");
      return;
    }
    setLoading(true);
    try {
      await createOfficer({ name: name.trim() || undefined, badge_no: badge.trim() || undefined, agency: agency.trim() || undefined, rank: rank.trim() || undefined, department: dept.trim() || undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName(""); setBadge(""); setAgency(""); setRank(""); setDept("");
      onSaved();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save officer.");
    } finally {
      setLoading(false);
    }
  }, [name, badge, agency, rank, dept, createOfficer, onClose, onSaved]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Officer</Text>

          <View style={styles.modalInputGroup}>
            {[
              { placeholder: "Full name", value: name, setter: setName, key: "name" },
              { placeholder: "Badge number", value: badge, setter: setBadge, key: "badge" },
              { placeholder: "Agency / Department", value: agency, setter: setAgency, key: "agency" },
              { placeholder: "Rank (e.g. Sergeant)", value: rank, setter: setRank, key: "rank" },
              { placeholder: "Division / Unit", value: dept, setter: setDept, key: "dept" },
            ].map((field, i, arr) => (
              <React.Fragment key={field.key}>
                <TextInput
                  style={styles.modalInput}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.textMuted}
                  value={field.value}
                  onChangeText={field.setter}
                  returnKeyType={i < arr.length - 1 ? "next" : "done"}
                />
                {i < arr.length - 1 ? <View style={styles.modalDivider} /> : null}
              </React.Fragment>
            ))}
          </View>

          <Pressable
            style={[styles.saveOfficerBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveOfficerText}>Save Officer</Text>}
          </Pressable>

          <Pressable style={styles.closeModalBtn} onPress={onClose}>
            <Text style={styles.closeModalText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function OfficersScreen() {
  const { officers, refreshOfficers } = useIncidents();
  const [refreshing, setRefreshing] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOfficers();
    setRefreshing(false);
  }, [refreshOfficers]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Officers</Text>
          <Text style={styles.headerSub}>{officers.length} records</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setShowLookup(true)}
          >
            <Feather name="search" size={20} color={C.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setShowAdd(true)}
          >
            <Feather name="plus" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {officers.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="users" size={56} color={C.border} />
          <Text style={styles.emptyTitle}>No Officers Recorded</Text>
          <Text style={styles.emptyText}>Add officer records or use badge lookup to find public records</Text>
          <View style={styles.emptyActions}>
            <Pressable style={styles.emptyBtn} onPress={() => setShowLookup(true)}>
              <Feather name="search" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Badge Lookup</Text>
            </Pressable>
            <Pressable style={[styles.emptyBtn, styles.emptyBtnSecondary]} onPress={() => setShowAdd(true)}>
              <Feather name="user-plus" size={16} color={C.text} />
              <Text style={[styles.emptyBtnText, { color: C.text }]}>Add Officer</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={officers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <OfficerCard officer={item} index={index} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === "web" ? 84 + 34 : 120 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!officers.length}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        />
      )}

      <LookupBadgeModal visible={showLookup} onClose={() => setShowLookup(false)} />
      <AddOfficerModal visible={showAdd} onClose={() => setShowAdd(false)} onSaved={refreshOfficers} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  officerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: C.accent,
    fontFamily: "Inter_700Bold",
  },
  officerInfo: { flex: 1, gap: 4 },
  officerName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  officerMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  officerAgency: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  officerRank: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
  },
  incidentCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  incidentCount: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: C.accent,
    fontFamily: "Inter_700Bold",
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
  emptyActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: C.accent,
    borderRadius: 12,
  },
  emptyBtnSecondary: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: C.navyMid ?? C.backgroundMid,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  modalSub: {
    fontSize: 14,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  lookupRow: { flexDirection: "row", gap: 10 },
  lookupInput: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    color: C.text,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: C.border,
  },
  lookupBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultName: { fontSize: 15, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  resultMeta: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeModalBtn: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  closeModalText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  modalInputGroup: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  modalInput: {
    padding: 14,
    color: C.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  modalDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  saveOfficerBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveOfficerText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
