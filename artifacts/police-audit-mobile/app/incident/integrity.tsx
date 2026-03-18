import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import Colors from "@/constants/colors";

const C = Colors.light;

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

interface IntegrityData {
  incident_id: string;
  overall_status: "VERIFIED" | "WARNING" | "COMPROMISED";
  chain: {
    intact: boolean;
    total_evidence: number;
    verified_count: number;
    failed_count: number;
    failures: Array<{ evidence_photo_id: string; reason: string }>;
  };
  audit_log: {
    intact: boolean;
    total_entries: number;
    failures: string[];
  };
  fraud_indicators: {
    manipulation_flagged_count: number;
    timestamp_anomalies: number;
    duplicate_submissions: number;
    manipulation_details: Array<{
      evidence_photo_id: string;
      risk_score: number | null;
      flags: any;
      assessment: string | null;
    }>;
  };
  evidence_records: Array<{
    evidence_photo_id: string;
    sequence_number: number;
    image_hash: string;
    chain_hash: string;
    previous_chain_hash: string | null;
    capture_timestamp: string;
    verification_status: string;
    verification_note: string | null;
    manipulation_risk_score: number | null;
    manipulation_flags: any;
    ai_manipulation_assessment: string | null;
    gps_plausible: boolean | null;
    timestamp_plausible: boolean | null;
    duplicate_risk: boolean | null;
    last_verified_at: string | null;
  }>;
  audit_entries: Array<{
    id: string;
    action: string;
    actor: string;
    details: any;
    entry_hash: string;
    created_at: string;
  }>;
  verified_at: string;
}

function StatusBanner({ status }: { status: string }) {
  const map: Record<string, { icon: string; color: string; bg: string; label: string; sub: string }> = {
    VERIFIED:    { icon: "shield", color: "#22c55e", bg: "#22c55e18", label: "Evidence Chain Verified", sub: "Cryptographic hashes are intact. No tampering detected." },
    WARNING:     { icon: "alert-triangle", color: "#f59e0b", bg: "#f59e0b18", label: "Anomalies Detected", sub: "Some items need review. Evidence may still be usable — see details." },
    COMPROMISED: { icon: "alert-octagon", color: "#ef4444", bg: "#ef444418", label: "Chain Compromised", sub: "Cryptographic verification failed. Evidence may have been tampered with." },
  };
  const s = map[status] || map.VERIFIED;
  return (
    <View style={[sb.banner, { backgroundColor: s.bg, borderColor: s.color + "55" }]}>
      <View style={[sb.iconWrap, { backgroundColor: s.color + "22" }]}>
        <Feather name={s.icon as any} size={28} color={s.color} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[sb.label, { color: s.color }]}>{s.label}</Text>
        <Text style={sb.sub}>{s.sub}</Text>
      </View>
    </View>
  );
}
const sb = StyleSheet.create({
  banner: { flexDirection: "row", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  iconWrap: { width: 52, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18 },
});

function HashBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={hb.row}>
      <Text style={hb.label}>{label}</Text>
      <View style={hb.hashWrap}>
        <Feather name="hash" size={11} color={C.textMuted} />
        <Text style={hb.hash} numberOfLines={1} ellipsizeMode="middle">{value}</Text>
      </View>
    </View>
  );
}
const hb = StyleSheet.create({
  row: { gap: 3 },
  label: { fontSize: 10, color: C.textMuted, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const, letterSpacing: 0.5 },
  hashWrap: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: C.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  hash: { flex: 1, fontSize: 11, color: C.text, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
});

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    verified:               { icon: "check-circle", color: "#22c55e", bg: "#22c55e18", label: "Verified" },
    warning:                { icon: "alert-triangle", color: "#f59e0b", bg: "#f59e0b18", label: "Warning" },
    manipulation_detected:  { icon: "x-circle", color: "#ef4444", bg: "#ef444418", label: "Manipulation Detected" },
    pending:                { icon: "clock", color: C.textMuted, bg: C.surface, label: "Pending" },
  };
  const s = map[status] || map.verified;
  return (
    <View style={[vb.badge, { backgroundColor: s.bg }]}>
      <Feather name={s.icon as any} size={11} color={s.color} />
      <Text style={[vb.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}
const vb = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  text: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
});

function ManipulationMeter({ score }: { score: number }) {
  const color = score < 0.25 ? "#22c55e" : score < 0.55 ? "#f59e0b" : "#ef4444";
  const label = score < 0.25 ? "LOW RISK" : score < 0.55 ? "MODERATE" : "HIGH RISK";
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const }}>MANIPULATION RISK</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" as const }}>
          <View style={{ height: 6, width: `${Math.round(score * 100)}%` as any, backgroundColor: color, borderRadius: 3 }} />
        </View>
        <Text style={{ fontSize: 12, fontWeight: "700" as const, color, fontFamily: "Inter_700Bold" }}>
          {Math.round(score * 100)}% {label}
        </Text>
      </View>
    </View>
  );
}

function AuditEntry({ entry, index }: { entry: IntegrityData["audit_entries"][0]; index: number }) {
  const actionIcons: Record<string, string> = {
    evidence_captured: "camera",
    integrity_verification: "shield",
    report_generated: "file-text",
    evidence_analyzed: "cpu",
  };
  const icon = actionIcons[entry.action] || "activity";
  return (
    <View style={ae.entry}>
      <View style={ae.dotLine}>
        <View style={ae.dot} />
        {index > 0 && <View style={ae.line} />}
      </View>
      <View style={ae.content}>
        <View style={ae.header}>
          <Feather name={icon as any} size={14} color={C.accent} />
          <Text style={ae.action}>{entry.action.replace(/_/g, " ")}</Text>
          <Text style={ae.actor}>by {entry.actor}</Text>
        </View>
        <Text style={ae.time}>{new Date(entry.created_at).toLocaleString()}</Text>
        <View style={ae.hashRow}>
          <Feather name="lock" size={10} color={C.textMuted} />
          <Text style={ae.entryHash} numberOfLines={1} ellipsizeMode="middle">
            {entry.entry_hash}
          </Text>
        </View>
      </View>
    </View>
  );
}
const ae = StyleSheet.create({
  entry: { flexDirection: "row", gap: 12 },
  dotLine: { alignItems: "center", width: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent, marginTop: 3 },
  line: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4 },
  content: { flex: 1, gap: 4, paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 7 },
  action: { fontSize: 13, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" as const, flex: 1 },
  actor: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
  time: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
  hashRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  entryHash: { flex: 1, fontSize: 10, color: C.textMuted, fontFamily: "Inter_400Regular", letterSpacing: 0.2 },
});

export default function IntegrityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<IntegrityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "audit">("overview");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/incidents/${id}/integrity`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const fraud = data?.fraud_indicators;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Evidence Integrity</Text>
          <Text style={s.headerSub}>Chain of custody · Tamper detection</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={s.centerText}>Verifying cryptographic chain...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Feather name="alert-triangle" size={40} color="#ef4444" />
          <Text style={[s.centerText, { color: "#ef4444" }]}>Verification failed</Text>
          <Text style={s.centerSub}>{error}</Text>
        </View>
      ) : data ? (
        <>
          <View style={s.tabRow}>
            {(["overview", "evidence", "audit"] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "overview" && (
              <Animated.View entering={FadeIn.duration(250)} style={{ gap: 16 }}>
                <StatusBanner status={data.overall_status} />

                <View style={s.section}>
                  <Text style={s.sectionLabel}>CHAIN INTEGRITY</Text>
                  <View style={s.card}>
                    <View style={s.statRow}>
                      <View style={s.stat}>
                        <Text style={s.statNum}>{data.chain.total_evidence}</Text>
                        <Text style={s.statLabel}>Total Items</Text>
                      </View>
                      <View style={s.stat}>
                        <Text style={[s.statNum, { color: "#22c55e" }]}>{data.chain.verified_count}</Text>
                        <Text style={s.statLabel}>Verified</Text>
                      </View>
                      <View style={s.stat}>
                        <Text style={[s.statNum, { color: "#ef4444" }]}>{data.chain.failed_count}</Text>
                        <Text style={s.statLabel}>Failed</Text>
                      </View>
                      <View style={s.stat}>
                        <Text style={s.statNum}>{data.audit_log.total_entries}</Text>
                        <Text style={s.statLabel}>Audit Entries</Text>
                      </View>
                    </View>
                    {data.chain.failures.map((f, i) => (
                      <View key={i} style={s.failureRow}>
                        <Feather name="alert-circle" size={14} color="#ef4444" />
                        <Text style={s.failureText}>{f.reason}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={s.section}>
                  <Text style={s.sectionLabel}>FRAUD DETECTION</Text>
                  <View style={s.card}>
                    <View style={s.fraudRow}>
                      <Feather name="image" size={16} color={fraud?.manipulation_flagged_count ? "#ef4444" : "#22c55e"} />
                      <Text style={s.fraudLabel}>Image manipulation detection</Text>
                      <View style={[s.fraudStatus, { backgroundColor: fraud?.manipulation_flagged_count ? "#ef444418" : "#22c55e18" }]}>
                        <Text style={{ fontSize: 12, fontWeight: "700" as const, color: fraud?.manipulation_flagged_count ? "#ef4444" : "#22c55e", fontFamily: "Inter_700Bold" }}>
                          {fraud?.manipulation_flagged_count ? `${fraud.manipulation_flagged_count} FLAGGED` : "CLEAN"}
                        </Text>
                      </View>
                    </View>
                    <View style={s.fraudRow}>
                      <Feather name="clock" size={16} color={fraud?.timestamp_anomalies ? "#f59e0b" : "#22c55e"} />
                      <Text style={s.fraudLabel}>Timestamp plausibility</Text>
                      <View style={[s.fraudStatus, { backgroundColor: fraud?.timestamp_anomalies ? "#f59e0b18" : "#22c55e18" }]}>
                        <Text style={{ fontSize: 12, fontWeight: "700" as const, color: fraud?.timestamp_anomalies ? "#f59e0b" : "#22c55e", fontFamily: "Inter_700Bold" }}>
                          {fraud?.timestamp_anomalies ? `${fraud.timestamp_anomalies} ANOMALY` : "NORMAL"}
                        </Text>
                      </View>
                    </View>
                    <View style={s.fraudRow}>
                      <Feather name="copy" size={16} color={fraud?.duplicate_submissions ? "#f59e0b" : "#22c55e"} />
                      <Text style={s.fraudLabel}>Duplicate submission check</Text>
                      <View style={[s.fraudStatus, { backgroundColor: fraud?.duplicate_submissions ? "#f59e0b18" : "#22c55e18" }]}>
                        <Text style={{ fontSize: 12, fontWeight: "700" as const, color: fraud?.duplicate_submissions ? "#f59e0b" : "#22c55e", fontFamily: "Inter_700Bold" }}>
                          {fraud?.duplicate_submissions ? `${fraud.duplicate_submissions} DUPLICATE` : "UNIQUE"}
                        </Text>
                      </View>
                    </View>
                    <View style={s.fraudRow}>
                      <Feather name="file-text" size={16} color={data.audit_log.intact ? "#22c55e" : "#ef4444"} />
                      <Text style={s.fraudLabel}>Audit log integrity</Text>
                      <View style={[s.fraudStatus, { backgroundColor: data.audit_log.intact ? "#22c55e18" : "#ef444418" }]}>
                        <Text style={{ fontSize: 12, fontWeight: "700" as const, color: data.audit_log.intact ? "#22c55e" : "#ef4444", fontFamily: "Inter_700Bold" }}>
                          {data.audit_log.intact ? "INTACT" : "BROKEN"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {fraud?.manipulation_details && fraud.manipulation_details.length > 0 && (
                  <View style={s.section}>
                    <Text style={s.sectionLabel}>MANIPULATION DETAILS</Text>
                    {fraud.manipulation_details.map((m, i) => (
                      <View key={i} style={[s.card, { borderLeftWidth: 3, borderLeftColor: "#ef4444" }]}>
                        <ManipulationMeter score={m.risk_score ?? 0} />
                        {m.assessment && <Text style={s.manipText}>{m.assessment}</Text>}
                        {m.flags?.indicators?.length > 0 && (
                          <View style={{ gap: 3, marginTop: 4 }}>
                            <Text style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const }}>DETECTED INDICATORS</Text>
                            {m.flags.indicators.map((ind: string, j: number) => (
                              <Text key={j} style={{ fontSize: 12, color: "#ef4444", fontFamily: "Inter_400Regular" }}>· {ind}</Text>
                            ))}
                          </View>
                        )}
                        <Text style={[s.manipText, { color: C.textMuted, fontSize: 11 }]}>
                          ID: {m.evidence_photo_id.slice(0, 8)}...
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={s.section}>
                  <Text style={s.sectionLabel}>HOW INTEGRITY IS PROTECTED</Text>
                  <View style={s.card}>
                    {[
                      { icon: "lock", color: "#22c55e", title: "Cryptographic Hashing", desc: "Every image is SHA-256 hashed at the moment of capture before any processing." },
                      { icon: "link", color: "#3b82f6", title: "Blockchain-Style Chain", desc: "Each piece of evidence links to the previous via hash, making order manipulation detectable." },
                      { icon: "cpu", color: "#8b5cf6", title: "AI Manipulation Detection", desc: "Every photo is analyzed for editing artifacts, AI generation, and lighting inconsistencies." },
                      { icon: "clock", color: "#f59e0b", title: "Timestamp Verification", desc: "Capture timestamps are validated against server time to detect backdating." },
                      { icon: "copy", color: "#f59e0b", title: "Duplicate Detection", desc: "Hash comparison prevents the same image from being submitted multiple times." },
                      { icon: "file-text", color: "#22c55e", title: "Tamper-Evident Audit Log", desc: "Every action on every record is logged and hash-chained — alterations to the log are detectable." },
                    ].map((item, i) => (
                      <View key={i} style={s.howRow}>
                        <View style={[s.howIcon, { backgroundColor: item.color + "18" }]}>
                          <Feather name={item.icon as any} size={16} color={item.color} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={s.howTitle}>{item.title}</Text>
                          <Text style={s.howDesc}>{item.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={s.verifiedNote}>
                  <Feather name="clock" size={12} color={C.textMuted} />
                  <Text style={s.verifiedNoteText}>Last verified: {new Date(data.verified_at).toLocaleString()}</Text>
                </View>
              </Animated.View>
            )}

            {activeTab === "evidence" && (
              <Animated.View entering={FadeIn.duration(250)} style={{ gap: 12 }}>
                {data.evidence_records.length === 0 ? (
                  <View style={s.empty}>
                    <Feather name="camera-off" size={32} color={C.border} />
                    <Text style={s.emptyText}>No evidence captured yet</Text>
                  </View>
                ) : (
                  data.evidence_records.map((rec, idx) => (
                    <Animated.View key={rec.evidence_photo_id} entering={FadeInDown.delay(idx * 50).duration(250)}>
                      <View style={s.evidenceRecord}>
                        <View style={s.evidenceRecordHeader}>
                          <View style={s.seqBadge}>
                            <Text style={s.seqText}>#{rec.sequence_number}</Text>
                          </View>
                          <Text style={s.evidenceTime}>{new Date(rec.capture_timestamp).toLocaleString()}</Text>
                          <VerificationBadge status={rec.verification_status} />
                        </View>
                        {rec.manipulation_risk_score != null && (
                          <ManipulationMeter score={rec.manipulation_risk_score} />
                        )}
                        <HashBlock label="IMAGE HASH (SHA-256)" value={rec.image_hash} />
                        <HashBlock label="CHAIN HASH" value={rec.chain_hash} />
                        {rec.previous_chain_hash && (
                          <HashBlock label="PREVIOUS CHAIN LINK" value={rec.previous_chain_hash} />
                        )}
                        <View style={s.flagRow}>
                          <View style={[s.flag, rec.timestamp_plausible !== false ? { backgroundColor: "#22c55e18" } : { backgroundColor: "#ef444418" }]}>
                            <Feather name="clock" size={11} color={rec.timestamp_plausible !== false ? "#22c55e" : "#ef4444"} />
                            <Text style={{ fontSize: 10, color: rec.timestamp_plausible !== false ? "#22c55e" : "#ef4444", fontFamily: "Inter_600SemiBold", fontWeight: "600" as const }}>
                              {rec.timestamp_plausible !== false ? "Timestamp OK" : "Timestamp Anomaly"}
                            </Text>
                          </View>
                          <View style={[s.flag, rec.duplicate_risk ? { backgroundColor: "#f59e0b18" } : { backgroundColor: "#22c55e18" }]}>
                            <Feather name="copy" size={11} color={rec.duplicate_risk ? "#f59e0b" : "#22c55e"} />
                            <Text style={{ fontSize: 10, color: rec.duplicate_risk ? "#f59e0b" : "#22c55e", fontFamily: "Inter_600SemiBold", fontWeight: "600" as const }}>
                              {rec.duplicate_risk ? "Duplicate" : "Unique"}
                            </Text>
                          </View>
                        </View>
                        {rec.verification_note && (
                          <View style={s.noteRow}>
                            <Feather name="info" size={12} color="#f59e0b" />
                            <Text style={s.noteText}>{rec.verification_note}</Text>
                          </View>
                        )}
                        {rec.ai_manipulation_assessment && (
                          <View style={s.manipAssess}>
                            <Text style={s.manipAssessLabel}>AI Assessment</Text>
                            <Text style={s.manipAssessText}>{rec.ai_manipulation_assessment}</Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  ))
                )}
              </Animated.View>
            )}

            {activeTab === "audit" && (
              <Animated.View entering={FadeIn.duration(250)} style={{ gap: 12 }}>
                <View style={[s.card, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                  <Feather name={data.audit_log.intact ? "check-circle" : "alert-circle"} size={18} color={data.audit_log.intact ? "#22c55e" : "#ef4444"} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" }}>
                      {data.audit_log.intact ? "Audit Log Intact" : "Audit Log Compromised"}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" }}>
                      {data.audit_log.total_entries} entries · each cryptographically linked
                    </Text>
                  </View>
                </View>
                <Text style={s.sectionLabel}>CHAIN OF CUSTODY EVENTS</Text>
                <View style={{ paddingLeft: 8 }}>
                  {data.audit_entries.length === 0 ? (
                    <Text style={s.emptyText}>No audit entries yet</Text>
                  ) : (
                    [...data.audit_entries].reverse().map((entry, idx) => (
                      <AuditEntry key={entry.id} entry={entry} index={idx} />
                    ))
                  )}
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 10, paddingTop: 8 },
  headerCenter: { flex: 1, alignItems: "center" as const },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 30 },
  centerText: { fontSize: 16, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold", textAlign: "center" as const },
  centerSub: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" as const },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 12, gap: 6 },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.accent + "18", borderColor: C.accent },
  tabText: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  tabTextActive: { color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  scroll: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: "700" as const, color: C.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: C.border },
  statRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center", gap: 4 },
  statNum: { fontSize: 28, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
  failureRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#ef444410", borderRadius: 8, padding: 10 },
  failureText: { flex: 1, fontSize: 12, color: "#ef4444", fontFamily: "Inter_400Regular" },
  fraudRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fraudLabel: { flex: 1, fontSize: 13, color: C.text, fontFamily: "Inter_400Regular" },
  fraudStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  manipText: { fontSize: 13, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 19 },
  howRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  howIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  howTitle: { fontSize: 13, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  howDesc: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 17 },
  verifiedNote: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingTop: 4 },
  verifiedNoteText: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
  evidenceRecord: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: C.border },
  evidenceRecordHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  seqBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.accent + "22", alignItems: "center", justifyContent: "center" },
  seqText: { fontSize: 12, fontWeight: "700" as const, color: C.accent, fontFamily: "Inter_700Bold" },
  evidenceTime: { flex: 1, fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  flagRow: { flexDirection: "row", gap: 8 },
  flag: { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  noteRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#f59e0b18", borderRadius: 8, padding: 10 },
  noteText: { flex: 1, fontSize: 12, color: "#f59e0b", fontFamily: "Inter_400Regular" },
  manipAssess: { gap: 4, backgroundColor: C.surface, borderRadius: 8, padding: 10 },
  manipAssessLabel: { fontSize: 10, fontWeight: "600" as const, color: C.textMuted, fontFamily: "Inter_600SemiBold" },
  manipAssessText: { fontSize: 12, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 18 },
  empty: { alignItems: "center", gap: 12, paddingTop: 40 },
  emptyText: { fontSize: 14, color: C.textMuted, fontFamily: "Inter_400Regular" },
});
