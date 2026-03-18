import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useIncidents } from "@/contexts/IncidentContext";

const C = Colors.light;

interface Person {
  person_id: number;
  role: "law_enforcement" | "civilian" | "unknown";
  description?: string;
  clothing?: string;
  visible_badge_number?: string | null;
  visible_name_tag?: string | null;
  apparent_rank?: string | null;
  position?: string;
  action?: string;
  is_armed?: boolean | string;
  visible_weapons?: string[];
  confidence: number;
  confidence_notes?: string;
}

interface Vehicle {
  vehicle_id: number;
  type: string;
  unit_number?: string | null;
  license_plate?: string | null;
  department_markings?: string | null;
  color?: string;
  make_model?: string | null;
  confidence: number;
  confidence_notes?: string;
}

interface ObjectOfInterest {
  type: string;
  description?: string;
  location_in_scene?: string;
  associated_person_id?: number | null;
  confidence: number;
}

interface SceneAnalysis {
  persons?: Person[];
  vehicles?: Vehicle[];
  objects_of_interest?: ObjectOfInterest[];
  scene?: {
    location_type?: string;
    lighting_conditions?: string;
    camera_angle?: string;
    image_quality?: string;
    obstructions?: string[];
    visible_landmarks?: string[];
    time_of_day_estimate?: string | null;
  };
  counts?: {
    total_persons?: number;
    total_law_enforcement?: number;
    total_civilians?: number;
    total_unknown_role?: number;
    total_vehicles?: number;
    total_police_vehicles?: number;
    total_objects_of_interest?: number;
  };
  analysis_confidence?: {
    overall_score?: number;
    person_count_confidence?: number;
    vehicle_count_confidence?: number;
    id_extraction_confidence?: number;
    factors_reducing_confidence?: string[];
    factors_increasing_confidence?: string[];
  };
  potential_concerns?: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    applicable_amendment?: string | null;
  }>;
  false_reading_risks?: string[];
  evidence_summary?: string;
}

interface EvidenceIntegrity {
  verification_status: string;
  verification_note?: string | null;
  manipulation_risk_score?: number | null;
  image_hash?: string;
  chain_hash?: string;
  sequence_number?: number;
  duplicate_risk?: boolean | null;
  timestamp_plausible?: boolean | null;
}

interface EvidenceRecord {
  id: string;
  source?: string | null;
  ai_analysis?: string | null;
  vehicle_unit?: string | null;
  license_plate?: string | null;
  officer_description?: string | null;
  department_markings?: string | null;
  scene_analysis?: SceneAnalysis | null;
  person_count?: number | null;
  officer_count?: number | null;
  vehicle_count?: number | null;
  confidence_score?: number | null;
  integrity?: EvidenceIntegrity | null;
  captured_at: string;
}

function confidenceColor(score: number): string {
  if (score >= 0.80) return "#22c55e";
  if (score >= 0.60) return "#f59e0b";
  return "#ef4444";
}

function confidenceLabel(score: number): string {
  if (score >= 0.80) return "HIGH";
  if (score >= 0.60) return "MEDIUM";
  return "LOW";
}

function ConfidenceMeter({ score, label }: { score: number; label?: string }) {
  const color = confidenceColor(score);
  const pct = Math.round(score * 100);
  return (
    <View style={cm.wrap}>
      {label && <Text style={cm.label}>{label}</Text>}
      <View style={cm.barBg}>
        <View style={[cm.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[cm.pct, { color }]}>{pct}% {confidenceLabel(score)}</Text>
    </View>
  );
}
const cm = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 10, color: C.textMuted, fontFamily: "Inter_400Regular" },
  barBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" as const },
  barFill: { height: 6, borderRadius: 3 },
  pct: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
});

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    law_enforcement: { label: "Officer", color: "#3b82f6", bg: "#3b82f618" },
    civilian:        { label: "Civilian", color: "#22c55e", bg: "#22c55e18" },
    unknown:         { label: "Unknown", color: C.textMuted, bg: C.surface },
  };
  const style = map[role] || map.unknown;
  return (
    <View style={[rb.badge, { backgroundColor: style.bg }]}>
      <Text style={[rb.text, { color: style.color }]}>{style.label}</Text>
    </View>
  );
}
const rb = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 11, fontFamily: "Inter_700Bold", fontWeight: "700" as const, letterSpacing: 0.5 },
});

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    high:   { color: "#ef4444", bg: "#ef444418" },
    medium: { color: "#f59e0b", bg: "#f59e0b18" },
    low:    { color: "#22c55e", bg: "#22c55e18" },
  };
  const s = map[severity] || map.low;
  return (
    <View style={[sv.badge, { backgroundColor: s.bg }]}>
      <Text style={[sv.text, { color: s.color }]}>{severity.toUpperCase()}</Text>
    </View>
  );
}
const sv = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 10, fontFamily: "Inter_700Bold", fontWeight: "700" as const, letterSpacing: 0.8 },
});

function CountTile({ value, label, icon, color }: { value: number | null | undefined; label: string; icon: string; color: string }) {
  return (
    <View style={[ct.tile, { borderColor: color + "44" }]}>
      <View style={[ct.iconWrap, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <Text style={[ct.number, { color }]}>{value ?? "—"}</Text>
      <Text style={ct.label}>{label}</Text>
    </View>
  );
}
const ct = StyleSheet.create({
  tile: { flex: 1, alignItems: "center", gap: 6, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  number: { fontSize: 28, fontWeight: "700" as const, fontFamily: "Inter_700Bold", lineHeight: 32 },
  label: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" as const },
});

function SceneAnalysisView({ analysis }: { analysis: SceneAnalysis }) {
  const counts = analysis.counts || {};
  const confidence = analysis.analysis_confidence || {};
  const scene = analysis.scene || {};
  const persons = analysis.persons || [];
  const vehicles = analysis.vehicles || [];
  const objects = analysis.objects_of_interest || [];
  const concerns = analysis.potential_concerns || [];
  const risks = analysis.false_reading_risks || [];

  const qualityColor = scene.image_quality === "clear" ? "#22c55e"
    : scene.image_quality === "partially_obstructed" ? "#f59e0b"
    : "#ef4444";

  const lightingLabel: Record<string, string> = {
    daylight_bright: "Bright Daylight",
    daylight_overcast: "Overcast Daylight",
    dusk_dawn: "Dusk / Dawn",
    artificial_good: "Artificial (Good)",
    artificial_poor: "Artificial (Poor)",
    nighttime_poor: "Nighttime (Poor)",
  };

  return (
    <View style={{ gap: 16 }}>
      {analysis.evidence_summary ? (
        <View style={sav.summaryCard}>
          <Feather name="file-text" size={14} color={C.accent} />
          <Text style={sav.summaryText}>{analysis.evidence_summary}</Text>
        </View>
      ) : null}

      <View style={sav.countRow}>
        <CountTile value={counts.total_persons} label="Total People" icon="users" color="#3b82f6" />
        <CountTile value={counts.total_law_enforcement} label="Officers" icon="shield" color={C.accent} />
        <CountTile value={counts.total_civilians} label="Civilians" icon="user" color="#22c55e" />
        <CountTile value={counts.total_vehicles} label="Vehicles" icon="truck" color="#f59e0b" />
      </View>

      <View style={sav.section}>
        <Text style={sav.sectionLabel}>ANALYSIS CONFIDENCE</Text>
        <View style={sav.confCard}>
          {confidence.overall_score != null && (
            <ConfidenceMeter score={confidence.overall_score} label="Overall confidence" />
          )}
          {confidence.person_count_confidence != null && (
            <ConfidenceMeter score={confidence.person_count_confidence} label="Person count accuracy" />
          )}
          {confidence.vehicle_count_confidence != null && (
            <ConfidenceMeter score={confidence.vehicle_count_confidence} label="Vehicle count accuracy" />
          )}
          {confidence.id_extraction_confidence != null && (
            <ConfidenceMeter score={confidence.id_extraction_confidence} label="ID extraction accuracy" />
          )}
          {confidence.factors_reducing_confidence && confidence.factors_reducing_confidence.length > 0 && (
            <View style={sav.factorList}>
              <Text style={sav.factorLabel}>⚠ Factors that may reduce accuracy:</Text>
              {confidence.factors_reducing_confidence.map((f, i) => (
                <Text key={i} style={[sav.factorItem, { color: "#f59e0b" }]}>· {f}</Text>
              ))}
            </View>
          )}
          {confidence.factors_increasing_confidence && confidence.factors_increasing_confidence.length > 0 && (
            <View style={sav.factorList}>
              <Text style={sav.factorLabel}>✓ Factors supporting accuracy:</Text>
              {confidence.factors_increasing_confidence.map((f, i) => (
                <Text key={i} style={[sav.factorItem, { color: "#22c55e" }]}>· {f}</Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {risks.length > 0 && (
        <View style={sav.riskBanner}>
          <Feather name="alert-triangle" size={14} color="#f59e0b" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={sav.riskTitle}>Potential False Reading Risks</Text>
            {risks.map((r, i) => <Text key={i} style={sav.riskItem}>· {r}</Text>)}
          </View>
        </View>
      )}

      <View style={sav.section}>
        <Text style={sav.sectionLabel}>SCENE CONDITIONS</Text>
        <View style={sav.sceneCard}>
          <View style={sav.sceneRow}>
            <Feather name="sun" size={14} color={C.textMuted} />
            <Text style={sav.sceneKey}>Lighting</Text>
            <Text style={sav.sceneVal}>{lightingLabel[scene.lighting_conditions || ""] || scene.lighting_conditions || "Unknown"}</Text>
          </View>
          <View style={sav.sceneRow}>
            <Feather name="camera" size={14} color={C.textMuted} />
            <Text style={sav.sceneKey}>Image Quality</Text>
            <Text style={[sav.sceneVal, { color: qualityColor }]}>{(scene.image_quality || "Unknown").replace(/_/g, " ")}</Text>
          </View>
          {scene.camera_angle ? (
            <View style={sav.sceneRow}>
              <Feather name="maximize-2" size={14} color={C.textMuted} />
              <Text style={sav.sceneKey}>Camera Angle</Text>
              <Text style={[sav.sceneVal, { flex: 1 }]} numberOfLines={2}>{scene.camera_angle}</Text>
            </View>
          ) : null}
          {scene.time_of_day_estimate ? (
            <View style={sav.sceneRow}>
              <Feather name="clock" size={14} color={C.textMuted} />
              <Text style={sav.sceneKey}>Est. Time of Day</Text>
              <Text style={sav.sceneVal}>{scene.time_of_day_estimate}</Text>
            </View>
          ) : null}
          {scene.obstructions && scene.obstructions.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text style={sav.sceneKey}>Obstructions</Text>
              {scene.obstructions.map((o, i) => <Text key={i} style={[sav.factorItem, { color: "#f59e0b" }]}>· {o}</Text>)}
            </View>
          )}
          {scene.visible_landmarks && scene.visible_landmarks.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text style={sav.sceneKey}>Visible Landmarks / IDs</Text>
              {scene.visible_landmarks.map((l, i) => <Text key={i} style={[sav.factorItem, { color: "#22c55e" }]}>· {l}</Text>)}
            </View>
          )}
        </View>
      </View>

      {persons.length > 0 && (
        <View style={sav.section}>
          <Text style={sav.sectionLabel}>INDIVIDUALS DETECTED ({persons.length})</Text>
          {persons.map((p) => (
            <View key={p.person_id} style={sav.personCard}>
              <View style={sav.personHeader}>
                <View style={[sav.personNum, p.role === "law_enforcement" ? { backgroundColor: "#3b82f622" } : {}]}>
                  <Text style={sav.personNumText}>#{p.person_id}</Text>
                </View>
                <RoleBadge role={p.role} />
                {p.visible_badge_number && (
                  <View style={sav.badgeChip}>
                    <Feather name="shield" size={11} color={C.accent} />
                    <Text style={sav.badgeChipText}>Badge #{p.visible_badge_number}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <Text style={[sav.confPct, { color: confidenceColor(p.confidence) }]}>
                  {Math.round(p.confidence * 100)}%
                </Text>
              </View>
              {p.description && <Text style={sav.personDetail}>{p.description}</Text>}
              {p.clothing && (
                <Text style={sav.personMeta}>Clothing: {p.clothing}</Text>
              )}
              {p.action && <Text style={sav.personMeta}>Action: {p.action}</Text>}
              {p.position && <Text style={sav.personMeta}>Position: {p.position}</Text>}
              {p.apparent_rank && <Text style={sav.personMeta}>Rank: {p.apparent_rank}</Text>}
              {p.visible_name_tag && <Text style={sav.personMeta}>Name Tag: {p.visible_name_tag}</Text>}
              {p.visible_weapons && p.visible_weapons.length > 0 && (
                <View style={sav.weaponRow}>
                  <Feather name="alert-circle" size={12} color="#ef4444" />
                  <Text style={sav.weaponText}>Weapons/Equipment: {p.visible_weapons.join(", ")}</Text>
                </View>
              )}
              {p.confidence_notes && (
                <Text style={sav.confNotes}>Confidence note: {p.confidence_notes}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {vehicles.length > 0 && (
        <View style={sav.section}>
          <Text style={sav.sectionLabel}>VEHICLES DETECTED ({vehicles.length})</Text>
          {vehicles.map((v) => (
            <View key={v.vehicle_id} style={sav.vehicleCard}>
              <View style={sav.vehicleHeader}>
                <Feather name="truck" size={16} color="#f59e0b" />
                <Text style={sav.vehicleType}>{(v.type || "vehicle").replace(/_/g, " ").toUpperCase()}</Text>
                <View style={{ flex: 1 }} />
                <Text style={[sav.confPct, { color: confidenceColor(v.confidence) }]}>
                  {Math.round(v.confidence * 100)}%
                </Text>
              </View>
              <View style={sav.vehicleTags}>
                {v.unit_number && (
                  <View style={[sav.vTag, { backgroundColor: "#22c55e18" }]}>
                    <Text style={[sav.vTagText, { color: "#22c55e" }]}>Unit #{v.unit_number}</Text>
                  </View>
                )}
                {v.license_plate && (
                  <View style={[sav.vTag, { backgroundColor: "#3b82f618" }]}>
                    <Text style={[sav.vTagText, { color: "#3b82f6" }]}>{v.license_plate}</Text>
                  </View>
                )}
                {v.color && (
                  <View style={sav.vTag}>
                    <Text style={sav.vTagText}>{v.color}</Text>
                  </View>
                )}
                {v.make_model && (
                  <View style={sav.vTag}>
                    <Text style={sav.vTagText}>{v.make_model}</Text>
                  </View>
                )}
              </View>
              {v.department_markings && (
                <Text style={sav.personMeta}>Dept: {v.department_markings}</Text>
              )}
              {v.confidence_notes && (
                <Text style={sav.confNotes}>Confidence note: {v.confidence_notes}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {objects.length > 0 && (
        <View style={sav.section}>
          <Text style={sav.sectionLabel}>OBJECTS OF INTEREST ({objects.length})</Text>
          {objects.map((o, i) => (
            <View key={i} style={sav.objectRow}>
              <View style={sav.objectIcon}>
                <Feather name="alert-triangle" size={14} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={sav.objectType}>{(o.type || "object").replace(/_/g, " ")}</Text>
                {o.description && <Text style={sav.personMeta}>{o.description}</Text>}
                {o.location_in_scene && <Text style={sav.personMeta}>Location: {o.location_in_scene}</Text>}
                {o.associated_person_id != null && (
                  <Text style={sav.personMeta}>Associated with Person #{o.associated_person_id}</Text>
                )}
              </View>
              <Text style={[sav.confPct, { color: confidenceColor(o.confidence) }]}>
                {Math.round(o.confidence * 100)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {concerns.length > 0 && (
        <View style={sav.section}>
          <Text style={sav.sectionLabel}>POTENTIAL CIVIL RIGHTS CONCERNS</Text>
          {concerns.map((c, i) => (
            <View key={i} style={[sav.concernCard, {
              borderLeftColor: c.severity === "high" ? "#ef4444" : c.severity === "medium" ? "#f59e0b" : "#22c55e",
            }]}>
              <View style={sav.concernHeader}>
                <Text style={sav.concernType}>{(c.type || "").replace(/_/g, " ")}</Text>
                <SeverityBadge severity={c.severity} />
                {c.applicable_amendment && (
                  <View style={sav.amendBadge}>
                    <Text style={sav.amendText}>{c.applicable_amendment} Amend.</Text>
                  </View>
                )}
              </View>
              <Text style={sav.concernDesc}>{c.description}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={sav.sourceNote}>
        <Feather name="cpu" size={12} color={C.textMuted} />
        <Text style={sav.sourceNoteText}>
          Structured AI analysis. Confidence scores indicate detection reliability. Low-confidence detections should be independently verified.
        </Text>
      </View>
    </View>
  );
}

const sav = StyleSheet.create({
  summaryCard: { flexDirection: "row", gap: 10, backgroundColor: C.accent + "14", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.accent + "33" },
  summaryText: { flex: 1, fontSize: 14, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 22 },
  countRow: { flexDirection: "row", gap: 8 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: "700" as const, color: C.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  confCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: C.border },
  factorList: { gap: 4, marginTop: 4 },
  factorLabel: { fontSize: 11, fontWeight: "600" as const, color: C.textMuted, fontFamily: "Inter_600SemiBold" },
  factorItem: { fontSize: 12, fontFamily: "Inter_400Regular", paddingLeft: 4, lineHeight: 18 },
  riskBanner: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "#f59e0b18", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#f59e0b33" },
  riskTitle: { fontSize: 13, fontWeight: "600" as const, color: "#f59e0b", fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  riskItem: { fontSize: 12, color: "#f59e0b", fontFamily: "Inter_400Regular", lineHeight: 18 },
  sceneCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: C.border },
  sceneRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  sceneKey: { fontSize: 12, fontWeight: "600" as const, color: C.textMuted, fontFamily: "Inter_600SemiBold", width: 100 },
  sceneVal: { fontSize: 12, color: C.text, fontFamily: "Inter_400Regular", flex: 1 },
  personCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: C.border },
  personHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  personNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  personNumText: { fontSize: 11, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  badgeChip: { flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: C.accent + "18", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeChipText: { fontSize: 11, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  confPct: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  personDetail: { fontSize: 13, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 19 },
  personMeta: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 18 },
  weaponRow: { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: "#ef444414", borderRadius: 6, padding: 8 },
  weaponText: { flex: 1, fontSize: 12, color: "#ef4444", fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  confNotes: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular", fontStyle: "italic" as const },
  vehicleCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: C.border },
  vehicleHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  vehicleType: { fontSize: 13, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  vehicleTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  vTag: { backgroundColor: C.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  vTagText: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  objectRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  objectIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#8b5cf618", alignItems: "center", justifyContent: "center" },
  objectType: { fontSize: 13, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" as const },
  concernCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4 },
  concernHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  concernType: { fontSize: 13, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" as const, flex: 1 },
  amendBadge: { backgroundColor: C.accent + "22", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  amendText: { fontSize: 10, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  concernDesc: { fontSize: 13, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 19 },
  sourceNote: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingTop: 4 },
  sourceNoteText: { flex: 1, fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular", lineHeight: 17 },
});

function IntegrityBadge({ status }: { status: string }) {
  const map: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    verified:               { icon: "shield", color: "#22c55e", bg: "#22c55e18", label: "Verified" },
    warning:                { icon: "alert-triangle", color: "#f59e0b", bg: "#f59e0b18", label: "Warning" },
    manipulation_detected:  { icon: "x-circle", color: "#ef4444", bg: "#ef444418", label: "Tampered" },
  };
  const s = map[status] || map.verified;
  return (
    <View style={[intgBadge.badge, { backgroundColor: s.bg }]}>
      <Feather name={s.icon as any} size={10} color={s.color} />
      <Text style={[intgBadge.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}
const intgBadge = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 10, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
});

function EvidenceCard({ item, index }: { item: EvidenceRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const analysis = item.scene_analysis as SceneAnalysis | null | undefined;
  const hasStructured = !!analysis && !!(analysis.counts || analysis.persons);
  const integrity = item.integrity;

  function formatCapture(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <Pressable
        style={[styles.evidenceCard, integrity?.verification_status === "manipulation_detected" && { borderColor: "#ef444455" }]}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.evidenceCardHeader}>
          <View style={styles.evidenceSourceBadge}>
            <Feather name={item.source === "camera" ? "camera" : "image"} size={12} color={C.accent} />
            <Text style={styles.evidenceSourceText}>{item.source === "camera" ? "Camera" : "Gallery"}</Text>
          </View>
          <Text style={styles.evidenceCaptureTime}>{formatCapture(item.captured_at)}</Text>
          {integrity?.verification_status && (
            <IntegrityBadge status={integrity.verification_status} />
          )}
          {item.confidence_score != null && (
            <View style={[styles.confBadge, { backgroundColor: confidenceColor(item.confidence_score) + "22" }]}>
              <Text style={[styles.confBadgeText, { color: confidenceColor(item.confidence_score) }]}>
                {Math.round(item.confidence_score * 100)}%
              </Text>
            </View>
          )}
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
        </View>
        {integrity?.verification_note && (
          <View style={styles.integrityNote}>
            <Feather name="alert-triangle" size={12} color="#f59e0b" />
            <Text style={styles.integrityNoteText} numberOfLines={2}>{integrity.verification_note}</Text>
          </View>
        )}

        <View style={styles.countMiniRow}>
          {item.person_count != null && (
            <View style={styles.miniCount}>
              <Feather name="users" size={11} color="#3b82f6" />
              <Text style={[styles.miniCountText, { color: "#3b82f6" }]}>{item.person_count} people</Text>
            </View>
          )}
          {item.officer_count != null && item.officer_count > 0 && (
            <View style={styles.miniCount}>
              <Feather name="shield" size={11} color={C.accent} />
              <Text style={[styles.miniCountText, { color: C.accent }]}>{item.officer_count} officers</Text>
            </View>
          )}
          {item.vehicle_count != null && item.vehicle_count > 0 && (
            <View style={styles.miniCount}>
              <Feather name="truck" size={11} color="#f59e0b" />
              <Text style={[styles.miniCountText, { color: "#f59e0b" }]}>{item.vehicle_count} vehicles</Text>
            </View>
          )}
          {item.vehicle_unit && (
            <View style={styles.miniCount}>
              <Feather name="hash" size={11} color="#22c55e" />
              <Text style={[styles.miniCountText, { color: "#22c55e" }]}>Unit {item.vehicle_unit}</Text>
            </View>
          )}
          {item.license_plate && (
            <View style={styles.miniCount}>
              <Feather name="credit-card" size={11} color="#8b5cf6" />
              <Text style={[styles.miniCountText, { color: "#8b5cf6" }]}>{item.license_plate}</Text>
            </View>
          )}
        </View>

        {expanded && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.expandedSection}>
            {hasStructured ? (
              <SceneAnalysisView analysis={analysis!} />
            ) : item.ai_analysis ? (
              <>
                <Text style={styles.analysisLabel}>AI ANALYSIS</Text>
                <Text style={styles.analysisText}>{item.ai_analysis}</Text>
              </>
            ) : null}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { analyzeEvidence, getEvidence } = useIncidents();
  const insets = useSafeAreaInsets();
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (id) {
      getEvidence(id)
        .then((ev) => setEvidence(ev))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const pickAndAnalyze = useCallback(async (fromCamera: boolean) => {
    let result: ImagePicker.ImagePickerResult;
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed to capture evidence photos.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, base64: true });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Photo library access is needed.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, base64: true });
    }

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Error", "Failed to read image data.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalyzing(true);
    try {
      const data = await analyzeEvidence(id!, asset.base64, fromCamera ? "camera" : "gallery");
      setEvidence((prev) => [data, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Analysis Failed", "Could not analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [id, analyzeEvidence]);

  const totalPersons = evidence.reduce((acc, e) => acc + (e.person_count ?? 0), 0);
  const totalOfficers = evidence.reduce((acc, e) => acc + (e.officer_count ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scene Analysis</Text>
          <Text style={styles.headerSub}>
            {evidence.length > 0
              ? `${evidence.length} photo${evidence.length > 1 ? "s" : ""} · ${totalPersons} people · ${totalOfficers} officers`
              : "AI-powered forensic scene analysis"}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.captureRow}>
        <Pressable
          style={({ pressed }) => [styles.captureBtn, { opacity: pressed || analyzing ? 0.7 : 1 }]}
          onPress={() => pickAndAnalyze(true)}
          disabled={analyzing || Platform.OS === "web"}
        >
          <Feather name="camera" size={18} color="#fff" />
          <Text style={styles.captureBtnText}>Capture Scene</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.captureBtn, styles.captureBtnSecondary, { opacity: pressed || analyzing ? 0.7 : 1 }]}
          onPress={() => pickAndAnalyze(false)}
          disabled={analyzing}
        >
          <Feather name="image" size={18} color={C.accent} />
          <Text style={[styles.captureBtnText, { color: C.accent }]}>From Gallery</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.recordVideoBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push({ pathname: "/record", params: { incidentId: id, autoStart: "true" } } as any)}
        disabled={analyzing}
      >
        <View style={styles.recordVideoDot} />
        <Feather name="video" size={17} color="#fff" />
        <Text style={styles.recordVideoBtnText}>Record Video Evidence</Text>
      </Pressable>

      {analyzing && (
        <View style={styles.analyzingBanner}>
          <ActivityIndicator color={C.accent} size="small" />
          <View style={{ flex: 1 }}>
            <Text style={styles.analyzingText}>Counting people, vehicles, and objects...</Text>
            <Text style={styles.analyzingSubText}>Calculating confidence scores · Flagging concerns</Text>
          </View>
        </View>
      )}

      {Platform.OS === "web" && (
        <View style={styles.webNote}>
          <Feather name="info" size={14} color={C.textMuted} />
          <Text style={styles.webNoteText}>Camera available on mobile. Use Gallery to upload images for analysis.</Text>
        </View>
      )}

      <View style={styles.capabilityRow}>
        {[
          { icon: "users", label: "Person Count", color: "#3b82f6" },
          { icon: "shield", label: "Officer ID", color: C.accent },
          { icon: "truck", label: "Vehicle ID", color: "#f59e0b" },
          { icon: "percent", label: "Confidence", color: "#22c55e" },
        ].map((c, i) => (
          <View key={i} style={styles.capabilityChip}>
            <Feather name={c.icon as any} size={12} color={c.color} />
            <Text style={[styles.capabilityLabel, { color: c.color }]}>{c.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 84 + 34 : 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        ) : evidence.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="camera" size={36} color={C.border} />
            </View>
            <Text style={styles.emptyTitle}>No Photos Analyzed Yet</Text>
            <Text style={styles.emptyText}>
              Capture or upload photos of the scene. The AI will count every person and vehicle, identify officers by badge and uniform, extract vehicle unit numbers and plates, and report a confidence score for every detection to reduce false readings.
            </Text>
          </View>
        ) : (
          evidence.map((item, idx) => (
            <EvidenceCard key={item.id} item={item} index={idx} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerCenter: { flex: 1, alignItems: "center" as const },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" as const, marginTop: 2 },
  captureRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 10 },
  captureBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 12 },
  captureBtnSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.accent },
  captureBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  recordVideoBtn: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#E53935",
    borderRadius: 12,
    paddingVertical: 12,
  },
  recordVideoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  recordVideoBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  analyzingBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.accent + "18", borderRadius: 12, borderWidth: 1, borderColor: C.accent + "33" },
  analyzingText: { fontSize: 13, color: C.text, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  analyzingSubText: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  webNote: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  webNoteText: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", flex: 1 },
  capabilityRow: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 10, gap: 6 },
  capabilityChip: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.card, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 6, borderWidth: 1, borderColor: C.border, justifyContent: "center" },
  capabilityLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 16, paddingHorizontal: 20 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 20, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, color: C.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  evidenceCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 10 },
  evidenceCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  evidenceSourceBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.accent + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  evidenceSourceText: { fontSize: 11, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  evidenceCaptureTime: { flex: 1, fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  confBadgeText: { fontSize: 12, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  countMiniRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  miniCount: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  miniCountText: { fontSize: 12, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  expandedSection: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14, gap: 16 },
  analysisLabel: { fontSize: 10, fontWeight: "600" as const, color: C.textMuted, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  analysisText: { fontSize: 13, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 20 },
  integrityNote: { flexDirection: "row", gap: 7, alignItems: "flex-start", backgroundColor: "#f59e0b18", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  integrityNoteText: { flex: 1, fontSize: 12, color: "#f59e0b", fontFamily: "Inter_400Regular", lineHeight: 17 },
});
