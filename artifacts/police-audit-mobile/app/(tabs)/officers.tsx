import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  SectionList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import Colors from "@/constants/colors";
import { useIncidents, Officer } from "@/contexts/IncidentContext";

const C = Colors.light;

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface Department {
  id: string;
  name: string;
  operator?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  distance_miles?: number | null;
}

interface PostBoard {
  state: string;
  stateName: string;
  boardName: string;
  lookupUrl: string;
  boardUrl: string;
  phone?: string;
  notes: string;
}

function OfficerCard({ officer, index, onPress }: { officer: Officer; index: number; onPress?: () => void }) {
  const initials = [officer.name?.split(" ")[0]?.[0], officer.name?.split(" ")[1]?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
      <Pressable style={({ pressed }) => [styles.officerCard, { opacity: pressed ? 0.85 : 1 }]} onPress={onPress}>
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
              {[officer.rank, officer.department].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {(officer.incident_count ?? 0) > 1 ? (
            <View style={[styles.incidentCountBadge, { backgroundColor: "#ef444422" }]}>
              <Feather name="alert-triangle" size={10} color="#ef4444" />
              <Text style={[styles.incidentCount, { color: "#ef4444" }]}>{officer.incident_count}</Text>
            </View>
          ) : (officer.incident_count ?? 0) === 1 ? (
            <View style={styles.incidentCountBadge}>
              <Text style={styles.incidentCount}>{officer.incident_count}</Text>
            </View>
          ) : null}
          <Feather name="chevron-right" size={16} color={C.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DepartmentCard({ dept, index, onPress }: { dept: Department; index: number; onPress: () => void }) {
  const distanceLabel = dept.distance_miles != null
    ? `${dept.distance_miles} mi`
    : dept.distance_km != null
      ? `${dept.distance_km} km`
      : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(280)}>
      <Pressable
        style={({ pressed }) => [styles.deptCard, { opacity: pressed ? 0.85 : 1 }]}
        onPress={onPress}
      >
        <View style={styles.deptIconWrap}>
          <Feather name="shield" size={18} color={C.accent} />
        </View>
        <View style={styles.deptInfo}>
          <Text style={styles.deptName} numberOfLines={1}>{dept.name}</Text>
          {dept.operator && dept.operator !== dept.name ? (
            <Text style={styles.deptOperator} numberOfLines={1}>{dept.operator}</Text>
          ) : null}
          {dept.address ? (
            <Text style={styles.deptAddress} numberOfLines={1}>{dept.address}</Text>
          ) : null}
        </View>
        <View style={styles.deptRight}>
          {distanceLabel && (
            <Text style={styles.deptDistance}>{distanceLabel}</Text>
          )}
          <Feather name="chevron-right" size={16} color={C.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DepartmentDetailModal({
  dept,
  visible,
  onClose,
  stateCode,
}: {
  dept: Department | null;
  visible: boolean;
  onClose: () => void;
  stateCode?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const [postBoard, setPostBoard] = useState<PostBoard | null>(null);
  const [accountability, setAccountability] = useState<any[]>([]);
  const [loadingFoia, setLoadingFoia] = useState(false);
  const [foiaLetter, setFoiaLetter] = useState<string | null>(null);
  const [showFoia, setShowFoia] = useState(false);

  useEffect(() => {
    if (!visible || !dept) return;
    if (stateCode) {
      apiFetch<{ board: PostBoard }>(`/departments/post-board?state=${stateCode}`)
        .then((d) => setPostBoard(d.board))
        .catch(() => {});
      apiFetch<{ resources: any[] }>(`/departments/accountability?state=${stateCode}`)
        .then((d) => setAccountability(d.resources || []))
        .catch(() => {});
    } else {
      apiFetch<{ resources: any[] }>("/departments/accountability")
        .then((d) => setAccountability(d.resources || []))
        .catch(() => {});
    }
  }, [visible, dept, stateCode]);

  const generateFoia = useCallback(async () => {
    if (!dept) return;
    setLoadingFoia(true);
    try {
      const data = await apiFetch<{ letter: string }>("/departments/foia-request", {
        method: "POST",
        body: JSON.stringify({ department_name: dept.name, state: stateCode }),
      });
      setFoiaLetter(data.letter);
      setShowFoia(true);
    } catch {
      Alert.alert("Error", "Failed to generate FOIA letter. Please try again.");
    } finally {
      setLoadingFoia(false);
    }
  }, [dept, stateCode]);

  const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

  if (!dept) return null;

  if (showFoia && foiaLetter) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.sheetContainer, { paddingTop: insets.top + 16 }]}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>FOIA Request Letter</Text>
            <Pressable onPress={() => setShowFoia(false)} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={C.text} />
            </Pressable>
          </View>
          <Text style={styles.sheetSub}>Send via certified mail to records custodian</Text>
          <ScrollView style={{ flex: 1, marginTop: 12 }} showsVerticalScrollIndicator={false}>
            <View style={styles.foiaCard}>
              <Text style={styles.foiaText}>{foiaLetter}</Text>
            </View>
            <View style={styles.foiaNote}>
              <Feather name="info" size={14} color="#3b82f6" />
              <Text style={styles.foiaNoteText}>
                Most agencies must respond within 10–30 days. You can appeal denials to your state's attorney general.
              </Text>
            </View>
            <Pressable style={styles.accentBtn} onPress={() => openUrl("https://www.muckrock.com/foi/create/")}>
              <Feather name="external-link" size={16} color="#fff" />
              <Text style={styles.accentBtnText}>File via MuckRock (Free)</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.sheetContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.sheetHeaderRow}>
          <View style={styles.deptIconWrapLg}>
            <Feather name="shield" size={22} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle} numberOfLines={2}>{dept.name}</Text>
            {dept.operator && dept.operator !== dept.name && (
              <Text style={styles.sheetSub}>{dept.operator}</Text>
            )}
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={C.text} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1, marginTop: 12 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={styles.deptDetailSection}>
            {dept.address ? (
              <View style={styles.deptDetailRow}>
                <Feather name="map-pin" size={15} color={C.textMuted} />
                <Text style={styles.deptDetailText}>{dept.address}</Text>
              </View>
            ) : null}
            {dept.phone ? (
              <Pressable style={styles.deptDetailRow} onPress={() => Linking.openURL(`tel:${dept.phone}`)}>
                <Feather name="phone" size={15} color={C.textMuted} />
                <Text style={[styles.deptDetailText, { color: C.accent }]}>{dept.phone}</Text>
              </Pressable>
            ) : null}
            {dept.website ? (
              <Pressable style={styles.deptDetailRow} onPress={() => openUrl(dept.website!)}>
                <Feather name="globe" size={15} color={C.textMuted} />
                <Text style={[styles.deptDetailText, { color: C.accent }]} numberOfLines={1}>{dept.website}</Text>
              </Pressable>
            ) : null}
            {dept.distance_miles != null ? (
              <View style={styles.deptDetailRow}>
                <Feather name="navigation" size={15} color={C.textMuted} />
                <Text style={styles.deptDetailText}>{dept.distance_miles} miles away</Text>
              </View>
            ) : null}
            <View style={styles.osmNote}>
              <Feather name="info" size={12} color={C.textMuted} />
              <Text style={styles.osmNoteText}>Location data from OpenStreetMap — verified public geographic data</Text>
            </View>
          </View>

          {dept.latitude && dept.longitude ? (
            <Pressable
              style={styles.mapBtn}
              onPress={() => openUrl(`https://maps.google.com/?q=${dept.latitude},${dept.longitude}`)}
            >
              <Feather name="map" size={16} color={C.accent} />
              <Text style={styles.mapBtnText}>Open in Maps</Text>
            </Pressable>
          ) : null}

          {postBoard && (
            <>
              <Text style={styles.sectionLabel}>OFFICER CERTIFICATION VERIFICATION</Text>
              <View style={styles.postCard}>
                <Text style={styles.postBoardName}>{postBoard.boardName}</Text>
                <Text style={styles.postNotes}>{postBoard.notes}</Text>
                {postBoard.phone && (
                  <Pressable style={styles.postRow} onPress={() => Linking.openURL(`tel:${postBoard.phone}`)}>
                    <Feather name="phone" size={14} color={C.accent} />
                    <Text style={[styles.postRowText, { color: C.accent }]}>{postBoard.phone}</Text>
                  </Pressable>
                )}
                <Pressable style={styles.postLookupBtn} onPress={() => openUrl(postBoard.lookupUrl)}>
                  <Feather name="external-link" size={15} color="#fff" />
                  <Text style={styles.postLookupBtnText}>Verify Officer Certification →</Text>
                </Pressable>
              </View>
              <View style={styles.postWarning}>
                <Feather name="alert-circle" size={13} color="#f59e0b" />
                <Text style={styles.postWarningText}>
                  POST boards maintain official records of officer certifications, disciplinary actions, and decertifications. This is a verified government database.
                </Text>
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>ACCOUNTABILITY RESOURCES</Text>
          {accountability.slice(0, 6).map((r, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.resourceRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => openUrl(r.url)}
            >
              <View style={styles.resourceLeft}>
                <View style={styles.resourceTypeBadge}>
                  <Text style={styles.resourceTypeText}>{r.type}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resourceName} numberOfLines={1}>{r.name}</Text>
                  <Text style={styles.resourceDesc} numberOfLines={2}>{r.description}</Text>
                </View>
              </View>
              <Feather name="external-link" size={14} color={C.accent} />
            </Pressable>
          ))}

          <Text style={styles.sectionLabel}>FILE A RECORDS REQUEST (FOIA)</Text>
          <View style={styles.foiaBanner}>
            <Feather name="file-text" size={16} color="#8b5cf6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.foiaBannerTitle}>Request Officer Records</Text>
              <Text style={styles.foiaBannerText}>
                Generate a formal FOIA / public records request for officer disciplinary history, use-of-force reports, and body camera footage from this department.
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.accentBtn, { backgroundColor: "#8b5cf6", opacity: loadingFoia ? 0.7 : 1 }]}
            onPress={generateFoia}
            disabled={loadingFoia}
          >
            {loadingFoia ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="edit-3" size={16} color="#fff" />
                <Text style={styles.accentBtnText}>Generate FOIA Request Letter</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function LookupBadgeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { resolveOfficer } = useIncidents();
  const [badgeInput, setBadgeInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [postBoard, setPostBoard] = useState<PostBoard | null>(null);
  const insets = useSafeAreaInsets();

  const handleLookup = useCallback(async () => {
    if (!badgeInput.trim()) return;
    setLoading(true);
    try {
      const res = await resolveOfficer(badgeInput.trim());
      setResult(res);
      if (stateInput.trim()) {
        apiFetch<{ board: PostBoard }>(`/departments/post-board?state=${stateInput.trim().toUpperCase()}`)
          .then((d) => setPostBoard(d.board))
          .catch(() => {});
      }
    } catch {
      Alert.alert("Error", "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }, [badgeInput, stateInput, resolveOfficer]);

  const handleClose = () => {
    setBadgeInput("");
    setStateInput("");
    setResult(null);
    setPostBoard(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Officer Lookup</Text>
          <Text style={styles.modalSub}>Check badge number against incident records and verify officer certification via your state's POST board</Text>

          <View style={styles.lookupRow}>
            <TextInput
              style={[styles.lookupInput, { flex: 2 }]}
              placeholder="Badge number"
              placeholderTextColor={C.textMuted}
              value={badgeInput}
              onChangeText={setBadgeInput}
              keyboardType="number-pad"
              returnKeyType="search"
              onSubmitEditing={handleLookup}
            />
            <TextInput
              style={[styles.lookupInput, { flex: 1 }]}
              placeholder="State (e.g. CA)"
              placeholderTextColor={C.textMuted}
              value={stateInput}
              onChangeText={setStateInput}
              autoCapitalize="characters"
              maxLength={2}
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
                    <Text style={styles.resultMeta}>{result.officer?.agency} · #{result.badge_number}</Text>
                    {(result.officer?.incident_count ?? 0) > 1 && (
                      <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontFamily: "Inter_600SemiBold" }}>
                        ⚠ {result.officer.incident_count} incidents on file — pattern flagged
                      </Text>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Feather name="alert-circle" size={20} color={C.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>Badge #{result.badge_number} — not in local records</Text>
                    <Text style={styles.resultMeta}>Not yet recorded in this app's database</Text>
                  </View>
                </>
              )}
            </View>
          ) : null}

          {postBoard ? (
            <View style={styles.postCardSmall}>
              <Text style={styles.postBoardNameSm}>{postBoard.boardName}</Text>
              <Pressable
                style={styles.postLookupBtnSm}
                onPress={() => Linking.openURL(postBoard.lookupUrl).catch(() => {})}
              >
                <Feather name="external-link" size={13} color={C.accent} />
                <Text style={styles.postLookupBtnSmText}>Verify via Official POST Board →</Text>
              </Pressable>
            </View>
          ) : stateInput.trim().length === 2 && result ? (
            <View style={styles.postCardSmall}>
              <Text style={styles.postBoardNameSm}>Verify officer certification at your state's Peace Officer Standards & Training board — the official government certification database.</Text>
            </View>
          ) : null}

          <Pressable style={[styles.closeModalBtn, { marginTop: 8 }]} onPress={handleClose}>
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
          <Pressable style={[styles.saveOfficerBtn, { opacity: loading ? 0.7 : 1 }]} onPress={handleSave} disabled={loading}>
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
  const [activeTab, setActiveTab] = useState<"officers" | "departments">("officers");
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [locationState, setLocationState] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOfficers();
    setRefreshing(false);
  }, [refreshOfficers]);

  const findNearbyDepartments = useCallback(async () => {
    setDeptLoading(true);
    setDeptError(null);
    try {
      let lat: number, lng: number;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setDeptError("Location permission required to find nearby departments.");
        setDeptLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = loc.coords.latitude;
      lng = loc.coords.longitude;
      setLastLocation({ lat, lng });

      const reverseGeo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reverseGeo[0]?.region) {
        const stateAbbr = reverseGeo[0].region;
        setLocationState(stateAbbr.length === 2 ? stateAbbr.toUpperCase() : null);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const data = await apiFetch<{ departments: Department[] }>(`/departments/nearby?lat=${lat}&lng=${lng}&radius=12000`);
      setDepartments(data.departments || []);
    } catch (err: any) {
      setDeptError("Could not find nearby departments. Check your connection and try again.");
    } finally {
      setDeptLoading(false);
    }
  }, []);

  const patternOfficers = officers.filter((o) => (o.incident_count ?? 0) > 1);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Badge Registry</Text>
          <Text style={styles.headerSub}>{officers.length} records · {departments.length > 0 ? `${departments.length} nearby depts` : "tap Departments"}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={() => setShowLookup(true)}>
            <Feather name="search" size={20} color={C.text} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={() => setShowAdd(true)}>
            <Feather name="plus" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabRow}>
        {(["officers", "departments"] as const).map((tab) => (
          <Pressable key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
            <Feather
              name={tab === "officers" ? "users" : "shield"}
              size={14}
              color={activeTab === tab ? "#fff" : C.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === "officers" ? "Officers" : "Departments"}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "officers" ? (
        <>
          {patternOfficers.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.patternAlert}>
              <Feather name="alert-triangle" size={14} color="#ef4444" />
              <Text style={styles.patternAlertText}>
                {patternOfficers.length} officer{patternOfficers.length > 1 ? "s" : ""} flagged — multiple Shield Reports filed
              </Text>
            </Animated.View>
          )}
          {officers.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="users" size={56} color={C.border} />
              <Text style={styles.emptyTitle}>No Badges in Registry</Text>
              <Text style={styles.emptyText}>Add officer records manually or use badge lookup</Text>
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
              renderItem={({ item, index }) => (
                <OfficerCard
                  officer={item}
                  index={index}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({ pathname: "/officer/[id]", params: { id: item.id } });
                  }}
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === "web" ? 84 + 34 : 120 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
            />
          )}
        </>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Platform.OS === "web" ? 84 + 34 : 120, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.deptSearchBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deptSearchTitle}>Find Nearby Police Departments</Text>
              <Text style={styles.deptSearchSub}>
                Uses your GPS to locate departments via OpenStreetMap — a verified public geographic database. Tap a department for POST board verification and accountability resources.
              </Text>
            </View>
            <Pressable
              style={[styles.gpsBtn, { opacity: deptLoading ? 0.7 : 1 }]}
              onPress={findNearbyDepartments}
              disabled={deptLoading}
            >
              {deptLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="navigation" size={15} color="#fff" />
                  <Text style={styles.gpsBtnText}>Search</Text>
                </>
              )}
            </Pressable>
          </View>

          {deptError && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{deptError}</Text>
            </View>
          )}

          {departments.length > 0 && (
            <>
              <View style={styles.deptResultHeader}>
                <Text style={styles.deptResultCount}>{departments.length} departments found nearby</Text>
                <Text style={styles.deptResultSource}>OpenStreetMap · OSM contributors</Text>
              </View>
              {departments.map((d, i) => (
                <DepartmentCard
                  key={d.id}
                  dept={d}
                  index={i}
                  onPress={() => setSelectedDept(d)}
                />
              ))}
            </>
          )}

          {departments.length === 0 && !deptLoading && !deptError && (
            <View style={styles.deptEmptyState}>
              <Feather name="shield" size={48} color={C.border} />
              <Text style={styles.deptEmptyTitle}>Search Your Area</Text>
              <Text style={styles.deptEmptyText}>
                Tap Search to find police departments near you. Each department shows contact info, officer verification links, and accountability resources.
              </Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>NATIONAL ACCOUNTABILITY DATABASES</Text>
          {[
            { name: "National Decertification Index", url: "https://thelearningportal.net/ndi/ndi-search", desc: "IADLEST database of decertified officers across all states", color: "#ef4444" },
            { name: "Mapping Police Violence", url: "https://mappingpoliceviolence.org", desc: "Comprehensive national database of police use-of-force", color: "#f97316" },
            { name: "ProPublica – Police Records", url: "https://projects.propublica.org/credibility", desc: "Officers with documented credibility issues — searchable", color: "#8b5cf6" },
            { name: "MuckRock – File FOIA Requests", url: "https://www.muckrock.com", desc: "Free platform for filing and tracking public records requests", color: "#3b82f6" },
            { name: "The Marshall Project", url: "https://www.themarshallproject.org", desc: "Investigative journalism tracking criminal justice accountability", color: "#22c55e" },
          ].map((r, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.nationalResourceRow, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => Linking.openURL(r.url).catch(() => {})}
            >
              <View style={[styles.nationalDot, { backgroundColor: r.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nationalName}>{r.name}</Text>
                <Text style={styles.nationalDesc}>{r.desc}</Text>
              </View>
              <Feather name="external-link" size={14} color={C.textMuted} />
            </Pressable>
          ))}

          <View style={styles.dataNote}>
            <Feather name="info" size={13} color={C.textMuted} />
            <Text style={styles.dataNoteText}>
              Department locations from OpenStreetMap (openstreetmap.org). POST board links are official government sources. Accountability databases are maintained by verified civic organizations and news outlets.
            </Text>
          </View>
        </ScrollView>
      )}

      <LookupBadgeModal visible={showLookup} onClose={() => setShowLookup(false)} />
      <AddOfficerModal visible={showAdd} onClose={() => setShowAdd(false)} onSaved={refreshOfficers} />
      <DepartmentDetailModal
        dept={selectedDept}
        visible={!!selectedDept}
        onClose={() => setSelectedDept(null)}
        stateCode={locationState}
      />
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
    paddingBottom: 12,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  newBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabBtnText: { fontSize: 13, fontWeight: "600" as const, color: C.textMuted, fontFamily: "Inter_600SemiBold" },
  tabBtnTextActive: { color: "#fff" },
  patternAlert: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10, padding: 10, backgroundColor: "#ef444418", borderRadius: 10, borderWidth: 1, borderColor: "#ef444433" },
  patternAlertText: { fontSize: 13, color: "#ef4444", fontFamily: "Inter_500Medium", fontWeight: "500" as const, flex: 1 },
  officerCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent + "22", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "700" as const, color: C.accent, fontFamily: "Inter_700Bold" },
  officerInfo: { flex: 1, gap: 4 },
  officerName: { fontSize: 15, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  officerMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  officerAgency: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", flex: 1 },
  officerRank: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  incidentCountBadge: { flexDirection: "row", gap: 3, alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: C.accent + "22" },
  incidentCount: { fontSize: 12, fontWeight: "700" as const, color: C.accent, fontFamily: "Inter_700Bold" },
  deptCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  deptIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accent + "18", alignItems: "center", justifyContent: "center" },
  deptIconWrapLg: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.accent + "18", alignItems: "center", justifyContent: "center" },
  deptInfo: { flex: 1, gap: 3 },
  deptName: { fontSize: 14, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  deptOperator: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  deptAddress: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  deptRight: { alignItems: "flex-end", gap: 4 },
  deptDistance: { fontSize: 12, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  deptSearchBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  deptSearchTitle: { fontSize: 14, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold", marginBottom: 4 },
  deptSearchSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18 },
  gpsBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignSelf: "flex-start" },
  gpsBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  deptResultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  deptResultCount: { fontSize: 13, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  deptResultSource: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
  deptEmptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  deptEmptyTitle: { fontSize: 18, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  deptEmptyText: { fontSize: 13, color: C.textMuted, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20 },
  errorBanner: { flexDirection: "row", gap: 8, backgroundColor: "#ef444418", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ef444433" },
  errorText: { flex: 1, fontSize: 13, color: "#ef4444", fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 11, fontWeight: "600" as const, color: C.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  nationalResourceRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  nationalDot: { width: 8, height: 8, borderRadius: 4 },
  nationalName: { fontSize: 13, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  nationalDesc: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  dataNote: { flexDirection: "row", gap: 8, backgroundColor: C.card, borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: C.border },
  dataNoteText: { flex: 1, fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 17 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
  emptyTitle: { fontSize: 22, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 15, color: C.textMuted, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 22 },
  emptyActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: C.accent, borderRadius: 12 },
  emptyBtnSecondary: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: C.navyMid ?? C.backgroundMid, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: -8, lineHeight: 18 },
  lookupRow: { flexDirection: "row", gap: 8 },
  lookupInput: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, fontFamily: "Inter_400Regular", borderWidth: 1, borderColor: C.border },
  lookupBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  resultCard: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  resultName: { fontSize: 15, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  resultMeta: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  postCardSmall: { backgroundColor: C.card, borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: C.accent + "44" },
  postBoardNameSm: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 17 },
  postLookupBtnSm: { flexDirection: "row", gap: 6, alignItems: "center" },
  postLookupBtnSmText: { fontSize: 13, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  closeModalBtn: { backgroundColor: C.card, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: C.border },
  closeModalText: { color: C.text, fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  modalInputGroup: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" as const },
  modalInput: { padding: 14, color: C.text, fontSize: 15, fontFamily: "Inter_400Regular" },
  modalDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  saveOfficerBtn: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveOfficerText: { color: "#fff", fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  sheetContainer: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
  sheetHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  sheetTitle: { fontSize: 18, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold", flex: 1 },
  sheetSub: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  deptDetailSection: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 10, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  deptDetailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  deptDetailText: { fontSize: 14, color: C.text, fontFamily: "Inter_400Regular", flex: 1 },
  osmNote: { flexDirection: "row", gap: 6, alignItems: "center", paddingTop: 4 },
  osmNoteText: { flex: 1, fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
  mapBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, justifyContent: "center", marginBottom: 20 },
  mapBtnText: { fontSize: 14, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  postCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, gap: 10, marginBottom: 12, borderWidth: 1, borderColor: C.accent + "44" },
  postBoardName: { fontSize: 14, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  postNotes: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18 },
  postRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  postRowText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  postLookupBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: C.accent, borderRadius: 10, paddingVertical: 12 },
  postLookupBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  postWarning: { flexDirection: "row", gap: 8, backgroundColor: "#f59e0b18", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#f59e0b33" },
  postWarningText: { flex: 1, fontSize: 12, color: "#f59e0b", fontFamily: "Inter_400Regular", lineHeight: 17 },
  resourceRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  resourceLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  resourceTypeBadge: { backgroundColor: C.accent + "22", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  resourceTypeText: { fontSize: 10, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  resourceName: { fontSize: 13, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  resourceDesc: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  foiaBanner: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: "#8b5cf618", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#8b5cf633" },
  foiaBannerTitle: { fontSize: 14, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  foiaBannerText: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 3 },
  accentBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, marginBottom: 8 },
  accentBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  foiaCard: { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  foiaText: { fontSize: 13, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 21 },
  foiaNote: { flexDirection: "row", gap: 8, backgroundColor: "#3b82f618", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#3b82f633" },
  foiaNoteText: { flex: 1, fontSize: 12, color: "#3b82f6", fontFamily: "Inter_400Regular", lineHeight: 17 },
});
