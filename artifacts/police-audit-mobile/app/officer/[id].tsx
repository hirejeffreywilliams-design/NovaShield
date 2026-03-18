import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Linking,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useIncidents } from "@/contexts/IncidentContext";

const BG      = "#0a1020";
const CARD    = "#0d1a2a";
const BORDER  = "#1a2e40";
const TEXT    = "#F0F4F8";
const MUTED   = "#7a9ab8";
const RED     = "#E53935";
const AMBER   = "#f59e0b";
const GREEN   = "#22c55e";
const BLUE    = "#3b82f6";
const PURPLE  = "#8b5cf6";
const CYAN    = "#0891b2";
const INDIGO  = "#6366f1";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const DISCIPLINE_TYPES = [
  { id: "sustained_complaint", label: "Sustained Complaint", color: RED },
  { id: "dismissed_complaint", label: "Dismissed Complaint", color: MUTED },
  { id: "suspension", label: "Suspension", color: AMBER },
  { id: "demotion", label: "Demotion", color: AMBER },
  { id: "termination", label: "Termination", color: RED },
  { id: "criminal_charge", label: "Criminal Charge", color: RED },
  { id: "civil_judgment", label: "Civil Judgment / Settlement", color: AMBER },
  { id: "decertification", label: "Decertification", color: RED },
  { id: "use_of_force_finding", label: "Use of Force Finding", color: AMBER },
  { id: "other", label: "Other Finding", color: MUTED },
];

const SOURCE_TYPES = [
  "FOIA Request",
  "Court Records",
  "News Article",
  "DOJ Investigation",
  "State AG Report",
  "Civilian Oversight Board",
  "Department Annual Report",
  "ProPublica Database",
  "National Police Index",
  "50-a.org (NYPD)",
  "Invisible Institute CPDP",
  "Other Public Record",
];

interface DisciplinaryRecord {
  id: string;
  officer_id: string;
  type: string;
  title: string;
  description?: string;
  incident_date?: string;
  source_name: string;
  source_url?: string;
  outcome?: string;
  created_at: string;
}

interface PublicLink {
  name: string;
  url: string;
  description: string;
  category: string;
  covered: boolean;
}

function AddRecordModal({
  visible,
  officerId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  officerId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState("sustained_complaint");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [sourceName, setSourceName] = useState("FOIA Request");
  const [sourceUrl, setSourceUrl] = useState("");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a title for this record.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/officers/${officerId}/disciplinary`, {
        method: "POST",
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          incident_date: incidentDate.trim() || undefined,
          source_name: sourceName,
          source_url: sourceUrl.trim() || undefined,
          outcome: outcome.trim() || undefined,
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle(""); setDescription(""); setIncidentDate(""); setSourceUrl(""); setOutcome("");
      onSaved();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save record. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [officerId, type, title, description, incidentDate, sourceName, sourceUrl, outcome, onSaved, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[m.sheet, { paddingTop: Platform.OS === "web" ? 32 : insets.top + 16, paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 24 }]}>
        <View style={m.sheetHeader}>
          <Text style={m.sheetTitle}>Log Disciplinary Record</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={TEXT} />
          </Pressable>
        </View>
        <Text style={m.sheetSub}>Add records found via FOIA requests, court documents, news coverage, or official databases</Text>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
          <View style={m.fieldGroup}>
            <Text style={m.fieldLabel}>RECORD TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {DISCIPLINE_TYPES.map((dt) => (
                <Pressable
                  key={dt.id}
                  style={[m.typeChip, { borderColor: type === dt.id ? dt.color : BORDER, backgroundColor: type === dt.id ? dt.color + "22" : CARD }]}
                  onPress={() => { setType(dt.id); Haptics.selectionAsync(); }}
                >
                  <Text style={[m.typeChipText, { color: type === dt.id ? dt.color : MUTED }]}>{dt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={m.fieldGroup}>
            <Text style={m.fieldLabel}>TITLE *</Text>
            <TextInput style={m.input} placeholder="e.g. Excessive force complaint — sustained" placeholderTextColor={MUTED} value={title} onChangeText={setTitle} multiline />
          </View>

          <View style={m.fieldGroup}>
            <Text style={m.fieldLabel}>DESCRIPTION</Text>
            <TextInput style={[m.input, { minHeight: 80 }]} placeholder="Details of the incident and finding..." placeholderTextColor={MUTED} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
          </View>

          <View style={m.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={m.fieldLabel}>INCIDENT DATE</Text>
              <TextInput style={m.input} placeholder="YYYY-MM-DD" placeholderTextColor={MUTED} value={incidentDate} onChangeText={setIncidentDate} />
            </View>
          </View>

          <View style={m.fieldGroup}>
            <Text style={m.fieldLabel}>DATA SOURCE *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {SOURCE_TYPES.map((s) => (
                <Pressable
                  key={s}
                  style={[m.typeChip, { borderColor: sourceName === s ? BLUE : BORDER, backgroundColor: sourceName === s ? BLUE + "22" : CARD }]}
                  onPress={() => { setSourceName(s); Haptics.selectionAsync(); }}
                >
                  <Text style={[m.typeChipText, { color: sourceName === s ? BLUE : MUTED }]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={m.fieldGroup}>
            <Text style={m.fieldLabel}>SOURCE URL (optional)</Text>
            <TextInput style={m.input} placeholder="https://..." placeholderTextColor={MUTED} value={sourceUrl} onChangeText={setSourceUrl} autoCapitalize="none" keyboardType="url" />
          </View>

          <View style={m.fieldGroup}>
            <Text style={m.fieldLabel}>OUTCOME</Text>
            <TextInput style={m.input} placeholder="e.g. 5-day suspension, officer resigned, charges dropped..." placeholderTextColor={MUTED} value={outcome} onChangeText={setOutcome} />
          </View>

          <Pressable style={[m.saveBtn, { opacity: loading ? 0.7 : 1 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Feather name="save" size={16} color="#fff" />
                <Text style={m.saveBtnText}>Save Disciplinary Record</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function OfficerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { officers, incidents } = useIncidents();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const officer = officers.find((o) => o.id === id);
  const [disciplinaryRecords, setDisciplinaryRecords] = useState<DisciplinaryRecord[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const relatedIncidents = incidents.filter(
    (inc) =>
      (inc.officer_badge && officer?.badge_no && inc.officer_badge === officer.badge_no) ||
      (inc.officer_name && officer?.name && inc.officer_name.toLowerCase().includes(officer.name.toLowerCase().split(" ")[0]))
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoadingRecords(true);
    try {
      const { records } = await apiFetch<{ records: DisciplinaryRecord[] }>(`/officers/${id}/disciplinary`);
      setDisciplinaryRecords(records);
    } catch {}

    try {
      const params = new URLSearchParams();
      if (officer?.agency) params.set("agency", officer.agency);
      if (officer?.name) params.set("name", officer.name);
      const { links } = await apiFetch<{ links: PublicLink[] }>(`/officers/${id}/public-links?${params.toString()}`);
      setPublicLinks(links);
    } catch {}
    setLoadingRecords(false);
  }, [id, officer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    Alert.alert("Delete Record", "Remove this disciplinary record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(recordId);
          try {
            await apiFetch(`/officers/${id}/disciplinary/${recordId}`, { method: "DELETE" });
            setDisciplinaryRecords((prev) => prev.filter((r) => r.id !== recordId));
          } catch {
            Alert.alert("Error", "Failed to delete record.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }, [id]);

  if (!officer) {
    return (
      <View style={[s.container, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 20 }} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={TEXT} />
        </Pressable>
        <View style={s.center}>
          <Text style={s.muted}>Officer not found</Text>
        </View>
      </View>
    );
  }

  const initials = [officer.name?.split(" ")[0]?.[0], officer.name?.split(" ")[1]?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  const sustainedCount = disciplinaryRecords.filter(r => r.type === "sustained_complaint" || r.type === "termination" || r.type === "criminal_charge").length;
  const riskLevel = sustainedCount >= 3 ? "high" : sustainedCount >= 1 ? "elevated" : relatedIncidents.length >= 3 ? "flagged" : "low";
  const riskColor = riskLevel === "high" ? RED : riskLevel === "elevated" ? AMBER : riskLevel === "flagged" ? AMBER : GREEN;

  const groupedLinks: Record<string, PublicLink[]> = {};
  for (const link of publicLinks) {
    if (!groupedLinks[link.category]) groupedLinks[link.category] = [];
    groupedLinks[link.category].push(link);
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={TEXT} />
        </Pressable>
        <Text style={s.headerTitle}>Officer Profile</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/complaints"); }}
          hitSlop={12}
        >
          <Feather name="folder" size={20} color={INDIGO} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(200)}>
          <View style={s.profileCard}>
            <View style={[s.avatar, { borderColor: riskColor + "44" }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <Text style={s.name}>{officer.name || "Unknown Officer"}</Text>
            {officer.rank ? <Text style={s.rank}>{officer.rank}</Text> : null}
            {officer.badge_no ? (
              <View style={[s.badgePill, { backgroundColor: RED + "22", borderColor: RED + "44" }]}>
                <Feather name="shield" size={13} color={RED} />
                <Text style={[s.badgePillText, { color: RED }]}>Badge #{officer.badge_no}</Text>
              </View>
            ) : null}
            {officer.agency ? <Text style={s.agency}>{officer.agency}</Text> : null}

            <View style={[s.riskBadge, { backgroundColor: riskColor + "18", borderColor: riskColor + "44" }]}>
              <Feather name={riskLevel === "low" ? "check-circle" : "alert-triangle"} size={13} color={riskColor} />
              <Text style={[s.riskText, { color: riskColor }]}>
                {riskLevel === "high" ? "HIGH RISK — Multiple Sustained Records"
                  : riskLevel === "elevated" ? "ELEVATED — Disciplinary Records on File"
                  : riskLevel === "flagged" ? "FLAGGED — Multiple App Incidents"
                  : "No Known Records"}
              </Text>
            </View>
          </View>

          <View style={s.statRow}>
            <View style={s.statCard}>
              <Text style={[s.statNum, { color: relatedIncidents.length > 0 ? AMBER : GREEN }]}>{relatedIncidents.length}</Text>
              <Text style={s.statLabel}>App Incidents</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statNum, { color: disciplinaryRecords.length > 0 ? RED : GREEN }]}>{disciplinaryRecords.length}</Text>
              <Text style={s.statLabel}>Discipline Records</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statNum, { color: sustainedCount > 0 ? RED : GREEN }]}>{sustainedCount}</Text>
              <Text style={s.statLabel}>Sustained Findings</Text>
            </View>
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionLabel}>DISCIPLINARY RECORDS</Text>
              <Pressable
                style={s.addRecordBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAddRecord(true); }}
              >
                <Feather name="plus" size={14} color={AMBER} />
                <Text style={s.addRecordText}>Log Record</Text>
              </Pressable>
            </View>
            <Text style={s.sectionSub}>Manually log disciplinary records found via FOIA requests, court documents, or public databases</Text>

            {loadingRecords ? (
              <ActivityIndicator color={AMBER} style={{ marginVertical: 20 }} />
            ) : disciplinaryRecords.length === 0 ? (
              <View style={s.emptyCard}>
                <Feather name="file-text" size={28} color={MUTED} />
                <Text style={s.emptyTitle}>No Records Logged</Text>
                <Text style={s.emptyText}>Use the public databases below to search for this officer, then log any disciplinary records you find.</Text>
                <Pressable style={s.emptyAddBtn} onPress={() => setShowAddRecord(true)}>
                  <Feather name="plus" size={14} color={AMBER} />
                  <Text style={s.emptyAddText}>Log First Record</Text>
                </Pressable>
              </View>
            ) : (
              disciplinaryRecords.map((rec, i) => {
                const typeInfo = DISCIPLINE_TYPES.find(dt => dt.id === rec.type) || { label: rec.type, color: MUTED };
                return (
                  <Animated.View key={rec.id} entering={FadeInDown.delay(i * 40).duration(200)}>
                    <View style={[s.disciplineCard, { borderColor: typeInfo.color + "44" }]}>
                      <View style={s.disciplineTop}>
                        <View style={[s.typeTag, { backgroundColor: typeInfo.color + "20" }]}>
                          <Text style={[s.typeTagText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                        </View>
                        {deletingId === rec.id ? (
                          <ActivityIndicator size="small" color={RED} />
                        ) : (
                          <Pressable onPress={() => handleDeleteRecord(rec.id)} hitSlop={8}>
                            <Feather name="trash-2" size={14} color={MUTED} />
                          </Pressable>
                        )}
                      </View>
                      <Text style={s.disciplineTitle}>{rec.title}</Text>
                      {rec.description ? <Text style={s.disciplineDesc}>{rec.description}</Text> : null}
                      <View style={s.disciplineMeta}>
                        {rec.incident_date ? (
                          <View style={s.metaChip}>
                            <Feather name="calendar" size={11} color={MUTED} />
                            <Text style={s.metaText}>{rec.incident_date}</Text>
                          </View>
                        ) : null}
                        <View style={s.metaChip}>
                          <Feather name="database" size={11} color={BLUE} />
                          <Text style={[s.metaText, { color: BLUE }]}>{rec.source_name}</Text>
                        </View>
                      </View>
                      {rec.outcome ? (
                        <View style={s.outcomeBox}>
                          <Text style={s.outcomeLabel}>OUTCOME</Text>
                          <Text style={s.outcomeText}>{rec.outcome}</Text>
                        </View>
                      ) : null}
                      {rec.source_url ? (
                        <Pressable style={s.sourceLink} onPress={() => Linking.openURL(rec.source_url!)}>
                          <Feather name="external-link" size={12} color={BLUE} />
                          <Text style={s.sourceLinkText}>View Source Document</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </Animated.View>
                );
              })
            )}
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>SEARCH PUBLIC DATABASES</Text>
            <Text style={s.sectionSub}>Access official government and investigative databases that contain officer records, disciplinary history, and misconduct data</Text>

            {Object.keys(groupedLinks).length === 0 && !loadingRecords ? (
              <ActivityIndicator color={BLUE} style={{ marginVertical: 20 }} />
            ) : (
              Object.entries(groupedLinks).map(([category, links]) => (
                <View key={category} style={{ gap: 8 }}>
                  <Text style={[s.sectionLabel, { color: BLUE, fontSize: 9 }]}>{category.toUpperCase()}</Text>
                  {links.map((link, i) => (
                    <Animated.View key={i} entering={FadeInDown.delay(i * 30).duration(200)}>
                      <Pressable
                        style={[s.linkCard, { borderColor: link.covered ? BLUE + "44" : BORDER }]}
                        onPress={() => Linking.openURL(link.url)}
                      >
                        <View style={[s.linkIcon, { backgroundColor: link.covered ? BLUE + "18" : CARD }]}>
                          <Feather name={link.covered ? "external-link" : "x-circle"} size={16} color={link.covered ? BLUE : MUTED} />
                        </View>
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={[s.linkName, { color: link.covered ? TEXT : MUTED }]}>{link.name}</Text>
                          <Text style={s.linkDesc}>{link.description}</Text>
                        </View>
                        {link.covered ? <Feather name="chevron-right" size={16} color={BLUE + "88"} /> : null}
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              ))
            )}

            <View style={[s.npiNote, { borderColor: GREEN + "33" }]}>
              <Feather name="info" size={13} color={GREEN} />
              <Text style={s.npiNoteText}>
                The National Police Index covers 24 states and tracks employment history, certification status, and disciplinary actions obtained from state police training boards via public records law. Federal NLEAD (the national misconduct database) was decommissioned in January 2025 after Executive Order revocation.
              </Text>
            </View>
          </View>

          {relatedIncidents.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>INCIDENTS IN THIS APP ({relatedIncidents.length})</Text>
              {relatedIncidents.map((inc, i) => (
                <Animated.View key={inc.id} entering={FadeInDown.delay(i * 50).duration(200)}>
                  <Pressable
                    style={s.incidentRow}
                    onPress={() => router.push({ pathname: "/incident/[id]", params: { id: inc.id } })}
                  >
                    <View style={[s.incidentDot, { backgroundColor: inc.status === "pending" ? AMBER : inc.status === "resolved" ? GREEN : BLUE }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.incidentTitle}>{inc.title}</Text>
                      <Text style={s.incidentMeta}>{new Date(inc.created_at).toLocaleDateString()} · {inc.location || "No location"}</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={MUTED} />
                  </Pressable>
                </Animated.View>
              ))}
              {relatedIncidents.length >= 3 && (
                <View style={[s.patternAlert, { borderColor: AMBER + "44" }]}>
                  <Feather name="alert-triangle" size={14} color={AMBER} />
                  <Text style={s.patternAlertText}>
                    This officer appears in {relatedIncidents.length} incidents — this pattern qualifies for a formal DOJ pattern-of-practice complaint and should be filed with your state AG.
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={s.section}>
            <Text style={s.sectionLabel}>TAKE ACTION</Text>
            <View style={s.actionsGrid}>
              <Pressable style={[s.actionBtn, { backgroundColor: INDIGO + "18", borderColor: INDIGO + "44" }]} onPress={() => router.push("/complaints")}>
                <Feather name="folder" size={18} color={INDIGO} />
                <Text style={[s.actionText, { color: INDIGO }]}>File Formal Complaint</Text>
              </Pressable>
              <Pressable style={[s.actionBtn, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "44" }]} onPress={() => router.push("/(tabs)/reports")}>
                <Feather name="file-text" size={18} color={PURPLE} />
                <Text style={[s.actionText, { color: PURPLE }]}>Generate FOIA Request</Text>
              </Pressable>
              <Pressable style={[s.actionBtn, { backgroundColor: RED + "18", borderColor: RED + "44" }]} onPress={() => router.push("/corruption")}>
                <Feather name="target" size={18} color={RED} />
                <Text style={[s.actionText, { color: RED }]}>Report Corruption</Text>
              </Pressable>
              <Pressable style={[s.actionBtn, { backgroundColor: AMBER + "18", borderColor: AMBER + "44" }]} onPress={() => setShowAddRecord(true)}>
                <Feather name="plus-circle" size={18} color={AMBER} />
                <Text style={[s.actionText, { color: AMBER }]}>Log Public Record</Text>
              </Pressable>
            </View>
          </View>

          <View style={[s.foiaBox, { borderColor: PURPLE + "33" }]}>
            <Feather name="shield" size={14} color={PURPLE} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.sectionLabel, { color: PURPLE, marginBottom: 0 }]}>HOW TO GET THEIR COMPLETE RECORD</Text>
              <Text style={s.foiaText}>
                File a FOIA / public records request with this officer's department requesting: (1) all complaints against the officer, (2) all sustained findings, (3) use-of-force reports, (4) body camera footage for any incidents you know about. Departments must respond within 10–30 days by state law. Use the FOIA Generator in the Reports tab to create a formal letter, then file via MuckRock for free tracking and automatic follow-up.
              </Text>
              <Pressable style={s.foiaBtn} onPress={() => Linking.openURL("https://www.muckrock.com/foi/create/")}>
                <Feather name="external-link" size={13} color={PURPLE} />
                <Text style={[s.actionText, { color: PURPLE }]}>File via MuckRock (Free)</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <AddRecordModal
        visible={showAddRecord}
        officerId={id!}
        onClose={() => setShowAddRecord(false)}
        onSaved={loadData}
      />
    </View>
  );
}

const m = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: BG, paddingHorizontal: 20 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sheetTitle: { fontSize: 20, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 20 },
  fieldGroup: { gap: 6 },
  fieldRow: { flexDirection: "row", gap: 10 },
  fieldLabel: { fontSize: 10, fontWeight: "700" as const, color: MUTED, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  input: { backgroundColor: "#0d1a2a", borderRadius: 10, padding: 12, color: TEXT, fontFamily: "Inter_400Regular", borderWidth: 1, borderColor: "#1a2e40", fontSize: 14 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  typeChipText: { fontSize: 12, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: AMBER, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: MUTED, fontSize: 16, fontFamily: "Inter_400Regular" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: TEXT, fontFamily: "Inter_600SemiBold" },

  content: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },

  profileCard: { alignItems: "center", gap: 10, paddingVertical: 20, backgroundColor: CARD, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: RED + "18", alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarText: { fontSize: 28, fontWeight: "700" as const, color: RED, fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold", textAlign: "center" as const },
  rank: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular" },
  agency: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular" },
  badgePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgePillText: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  riskBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  riskText: { fontSize: 11, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  statRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 14, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: BORDER },
  statNum: { fontSize: 28, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center" as const },

  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: 10, fontWeight: "700" as const, color: MUTED, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 2 },
  sectionSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17 },

  addRecordBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: AMBER + "18", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: AMBER + "44" },
  addRecordText: { fontSize: 12, color: AMBER, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },

  emptyCard: { backgroundColor: CARD, borderRadius: 14, padding: 24, alignItems: "center", gap: 10, borderWidth: 1, borderColor: BORDER },
  emptyTitle: { fontSize: 16, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center" as const, lineHeight: 19 },
  emptyAddBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, backgroundColor: AMBER + "18", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: AMBER + "44" },
  emptyAddText: { fontSize: 13, color: AMBER, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },

  disciplineCard: { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  disciplineTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeTagText: { fontSize: 10, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  disciplineTitle: { fontSize: 14, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  disciplineDesc: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 18 },
  disciplineMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" as const },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },
  outcomeBox: { backgroundColor: "#0a1020", borderRadius: 8, padding: 10, gap: 3, borderWidth: 1, borderColor: BORDER },
  outcomeLabel: { fontSize: 9, fontWeight: "700" as const, color: MUTED, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  outcomeText: { fontSize: 12, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sourceLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  sourceLinkText: { fontSize: 12, color: BLUE, fontFamily: "Inter_600SemiBold" },

  linkCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: CARD, borderRadius: 12, padding: 14, borderWidth: 1 },
  linkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  linkName: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  linkDesc: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17 },

  npiNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: GREEN + "08", borderRadius: 10, padding: 12, borderWidth: 1 },
  npiNoteText: { flex: 1, fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 18 },

  incidentRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CARD, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: BORDER },
  incidentDot: { width: 8, height: 8, borderRadius: 4 },
  incidentTitle: { fontSize: 13, fontWeight: "600" as const, color: TEXT, fontFamily: "Inter_600SemiBold" },
  incidentMeta: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },
  patternAlert: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: AMBER + "10", borderRadius: 10, padding: 12, borderWidth: 1 },
  patternAlertText: { flex: 1, fontSize: 12, color: AMBER, fontFamily: "Inter_600SemiBold" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap" as const, gap: 10 },
  actionBtn: { width: "47.5%", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, borderWidth: 1, minHeight: 52 },
  actionText: { fontSize: 12, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", flex: 1 },

  foiaBox: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: PURPLE + "10", borderRadius: 14, padding: 16, borderWidth: 1 },
  foiaText: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 19 },
  foiaBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
});
