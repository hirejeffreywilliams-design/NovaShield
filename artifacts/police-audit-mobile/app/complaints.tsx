import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Linking,
  FlatList,
  SectionList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import {
  FEDERAL_RESOURCES,
  STATE_RESOURCES,
  TYPE_META,
  type ComplaintResource,
  type ResourceType,
} from "@/constants/complaints";

const BG      = "#0D1B2A";
const CARD_BG = "#0f2035";
const BORDER  = "#1a3050";
const TEXT    = "#F0F4F8";
const MUTED   = "#7a9ab8";
const ACCENT  = "#6366f1";

type FilterType = "all" | ResourceType;

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "ag",           label: "AG" },
  { id: "civil_rights", label: "Civil Rights" },
  { id: "oversight",    label: "Oversight" },
  { id: "legal_aid",    label: "Legal Aid" },
  { id: "immigration",  label: "Immigration" },
];

function ResourceCard({ resource, index }: { resource: ComplaintResource; index: number }) {
  const meta = TYPE_META[resource.type];

  const handlePhone = useCallback(() => {
    if (resource.phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${resource.phone.replace(/[^0-9]/g, "")}`);
    }
  }, [resource.phone]);

  const handleWeb = useCallback((url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  }, []);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.typeChip, { backgroundColor: meta.color + "22", borderColor: meta.color + "44" }]}>
            <Feather name={meta.icon as any} size={11} color={meta.color} />
            <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {resource.phone && (
            <Pressable onPress={handlePhone} style={styles.phonePill} hitSlop={8}>
              <Feather name="phone" size={12} color="#22c55e" />
              <Text style={styles.phoneText}>{resource.phone}</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.cardName}>{resource.name}</Text>
        <Text style={styles.cardDesc}>{resource.description}</Text>

        <View style={styles.cardActions}>
          {resource.complaintUrl && (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: meta.color + "22", borderColor: meta.color + "44" }]}
              onPress={() => handleWeb(resource.complaintUrl!)}
            >
              <Feather name="edit-3" size={13} color={meta.color} />
              <Text style={[styles.actionBtnText, { color: meta.color }]}>File Complaint</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.actionBtnGhost}
            onPress={() => handleWeb(resource.url)}
          >
            <Feather name="external-link" size={13} color={MUTED} />
            <Text style={styles.actionBtnGhostText}>Website</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ComplaintsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [searchText, setSearchText]   = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [typeFilter, setTypeFilter]   = useState<FilterType>("all");
  const [showStatePicker, setShowStatePicker] = useState(false);

  const filteredFederal = useMemo(() => {
    return FEDERAL_RESOURCES.filter((r) => {
      const filter: string = typeFilter;
      if (filter !== "all" && r.type !== filter) {
        return false;
      }
      if (searchText) {
        const q = searchText.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [typeFilter, searchText]);

  const filteredStateResources = useMemo(() => {
    const stateData = selectedState
      ? STATE_RESOURCES.filter((s) => s.stateCode === selectedState)
      : STATE_RESOURCES;

    return stateData
      .map((s) => ({
        ...s,
        resources: s.resources.filter((r) => {
          const typeOk = typeFilter === "all" || r.type === typeFilter;
          const searchOk = !searchText || r.name.toLowerCase().includes(searchText.toLowerCase()) || r.description.toLowerCase().includes(searchText.toLowerCase());
          return typeOk && searchOk;
        }),
      }))
      .filter((s) => s.resources.length > 0);
  }, [selectedState, typeFilter, searchText]);

  const selectedStateName = selectedState
    ? STATE_RESOURCES.find((s) => s.stateCode === selectedState)?.stateName
    : null;

  const totalCount =
    filteredFederal.length +
    filteredStateResources.reduce((acc, s) => acc + s.resources.length, 0);

  if (showStatePicker) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowStatePicker(false)} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle}>Select Your State</Text>
        </View>
        <Pressable
          style={[styles.stateRow, !selectedState && styles.stateRowActive]}
          onPress={() => { setSelectedState(null); setShowStatePicker(false); }}
        >
          <Feather name="globe" size={16} color={!selectedState ? ACCENT : MUTED} />
          <Text style={[styles.stateRowText, !selectedState && { color: ACCENT }]}>All States (Federal + All)</Text>
          {!selectedState && <Feather name="check" size={16} color={ACCENT} />}
        </Pressable>
        <FlatList
          data={STATE_RESOURCES}
          keyExtractor={(item) => item.stateCode}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.stateRow, selectedState === item.stateCode && styles.stateRowActive]}
              onPress={() => { setSelectedState(item.stateCode); setShowStatePicker(false); }}
            >
              <View style={styles.stateCodeBadge}>
                <Text style={styles.stateCode}>{item.stateCode}</Text>
              </View>
              <Text style={[styles.stateRowText, selectedState === item.stateCode && { color: ACCENT }]}>
                {item.stateName}
              </Text>
              <Text style={styles.stateCount}>{item.resources.length} resources</Text>
              {selectedState === item.stateCode && <Feather name="check" size={16} color={ACCENT} />}
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={TEXT} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Complaint Directory</Text>
          <Text style={styles.headerSub}>
            {totalCount} resources · All 50 states + DC + Federal
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={styles.stateSelector}
          onPress={() => setShowStatePicker(true)}
        >
          <Feather name="map-pin" size={15} color={selectedState ? ACCENT : MUTED} />
          <Text style={[styles.stateSelectorText, selectedState && { color: ACCENT }]}>
            {selectedStateName || "All States"}
          </Text>
          <Feather name="chevron-down" size={15} color={MUTED} />
        </Pressable>

        <View style={styles.searchBox}>
          <Feather name="search" size={15} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search organizations..."
            placeholderTextColor={MUTED}
            value={searchText}
            onChangeText={setSearchText}
            clearButtonMode="while-editing"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <Feather name="x" size={14} color={MUTED} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ maxHeight: 48, flexGrow: 0 }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.filterChip, typeFilter === opt.id && styles.filterChipActive]}
            onPress={() => setTypeFilter(opt.id)}
          >
            {opt.id !== "all" && (
              <View style={[styles.filterDot, { backgroundColor: TYPE_META[opt.id as ResourceType]?.color }]} />
            )}
            <Text style={[styles.filterChipText, typeFilter === opt.id && styles.filterChipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.mainContent, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredFederal.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#3b82f622" }]}>
                <Feather name="flag" size={14} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Federal Agencies</Text>
                <Text style={styles.sectionSub}>Apply in all 50 states · {filteredFederal.length} agencies</Text>
              </View>
            </View>
            {filteredFederal.map((r, i) => (
              <ResourceCard key={r.name} resource={r} index={i} />
            ))}
          </View>
        )}

        {filteredStateResources.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: ACCENT + "22" }]}>
                <Feather name="map" size={14} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>
                  {selectedStateName ? `${selectedStateName} Resources` : "State Resources"}
                </Text>
                <Text style={styles.sectionSub}>
                  {filteredStateResources.reduce((a, s) => a + s.resources.length, 0)} resources
                  {!selectedState && ` across ${filteredStateResources.length} states`}
                </Text>
              </View>
            </View>
            {filteredStateResources.map((stateData) => (
              <View key={stateData.stateCode} style={styles.stateGroup}>
                {!selectedState && (
                  <View style={styles.stateGroupHeader}>
                    <Text style={styles.stateGroupName}>{stateData.stateName}</Text>
                    <View style={styles.stateGroupCode}>
                      <Text style={styles.stateGroupCodeText}>{stateData.stateCode}</Text>
                    </View>
                  </View>
                )}
                {stateData.resources.map((r, i) => (
                  <ResourceCard key={r.name} resource={r} index={i} />
                ))}
              </View>
            ))}
          </View>
        )}

        {filteredFederal.length === 0 && filteredStateResources.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={44} color={BORDER} />
            <Text style={styles.emptyText}>No matching resources</Text>
            <Text style={styles.emptySub}>Try a different search or filter</Text>
          </View>
        )}

        <View style={styles.disclaimer}>
          <Feather name="info" size={12} color={MUTED} />
          <Text style={styles.disclaimerText}>
            All resources are verified government agencies, official civil rights bodies, or established legal aid organizations. Phone numbers and URLs are based on official government sources. Always verify current contact information before filing a formal complaint, as details can change.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", marginTop: 1 },

  controls: { paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  stateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: BORDER,
  },
  stateSelectorText: { flex: 1, fontSize: 14, color: MUTED, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular" },

  filterRow: { paddingHorizontal: 16, gap: 8, alignItems: "center", paddingBottom: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterChipActive: { backgroundColor: ACCENT + "22", borderColor: ACCENT + "66" },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterChipText: { fontSize: 13, color: MUTED, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  filterChipTextActive: { color: ACCENT },

  mainContent: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },

  stateGroup: { gap: 8 },
  stateGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 2,
  },
  stateGroupName: { fontSize: 14, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold", flex: 1 },
  stateGroupCode: { backgroundColor: ACCENT + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stateGroupCodeText: { fontSize: 11, fontWeight: "700" as const, color: ACCENT, fontFamily: "Inter_700Bold" },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeLabel: { fontSize: 10, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#22c55e18",
    borderWidth: 1,
    borderColor: "#22c55e44",
  },
  phoneText: { fontSize: 12, color: "#22c55e", fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  cardName: { fontSize: 15, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  cardDesc: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cardActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" as const },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  actionBtnText: { fontSize: 12, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  actionBtnGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
  },
  actionBtnGhostText: { fontSize: 12, color: MUTED, fontFamily: "Inter_500Medium", fontWeight: "500" as const },

  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  stateRowActive: { backgroundColor: ACCENT + "11" },
  stateRowText: { flex: 1, fontSize: 15, color: TEXT, fontFamily: "Inter_400Regular" },
  stateCodeBadge: {
    width: 36,
    height: 28,
    backgroundColor: CARD_BG,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  stateCode: { fontSize: 11, fontWeight: "700" as const, color: MUTED, fontFamily: "Inter_700Bold" },
  stateCount: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular" },

  disclaimer: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingTop: 4 },
  disclaimerText: { flex: 1, fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
