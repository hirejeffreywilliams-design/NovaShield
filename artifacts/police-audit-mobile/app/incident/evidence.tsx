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
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useIncidents } from "@/contexts/IncidentContext";

const C = Colors.light;

interface EvidenceRecord {
  id: string;
  source?: string | null;
  ai_analysis?: string | null;
  vehicle_unit?: string | null;
  license_plate?: string | null;
  officer_description?: string | null;
  department_markings?: string | null;
  captured_at: string;
}

export default function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { analyzeEvidence, getEvidence } = useIncidents();
  const insets = useSafeAreaInsets();
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        base64: true,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Photo library access is needed to select evidence.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        base64: true,
      });
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
      setExpandedId(data.id);
    } catch (err) {
      Alert.alert("Analysis Failed", "Could not analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [id, analyzeEvidence]);

  function formatCapture(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Photo Evidence</Text>
          <Text style={styles.headerSub}>AI-powered vehicle & officer ID</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.captureRow}>
        <Pressable
          style={({ pressed }) => [styles.captureBtn, { opacity: pressed || analyzing ? 0.7 : 1 }]}
          onPress={() => pickAndAnalyze(true)}
          disabled={analyzing || Platform.OS === "web"}
        >
          <Feather name="camera" size={20} color="#fff" />
          <Text style={styles.captureBtnText}>Take Photo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.captureBtn, styles.captureBtnSecondary, { opacity: pressed || analyzing ? 0.7 : 1 }]}
          onPress={() => pickAndAnalyze(false)}
          disabled={analyzing}
        >
          <Feather name="image" size={20} color={C.accent} />
          <Text style={[styles.captureBtnText, { color: C.accent }]}>Gallery</Text>
        </Pressable>
      </View>

      {analyzing ? (
        <View style={styles.analyzingBanner}>
          <ActivityIndicator color={C.accent} size="small" />
          <Text style={styles.analyzingText}>AI analyzing image for vehicle & officer identification...</Text>
        </View>
      ) : null}

      {Platform.OS === "web" && (
        <View style={styles.webNote}>
          <Feather name="info" size={14} color={C.textMuted} />
          <Text style={styles.webNoteText}>Camera capture available on mobile. Use Gallery to select images.</Text>
        </View>
      )}

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
            <Text style={styles.emptyTitle}>No Evidence Yet</Text>
            <Text style={styles.emptyText}>
              Photograph squad cars, badges, and officers. AI will automatically extract unit numbers, license plates, and identifying information.
            </Text>
          </View>
        ) : (
          evidence.map((item, idx) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(idx * 60).duration(300)}>
              <Pressable
                style={styles.evidenceCard}
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <View style={styles.evidenceCardHeader}>
                  <View style={styles.evidenceSourceBadge}>
                    <Feather name={item.source === "camera" ? "camera" : "image"} size={12} color={C.accent} />
                    <Text style={styles.evidenceSourceText}>{item.source === "camera" ? "Camera" : "Gallery"}</Text>
                  </View>
                  <Text style={styles.evidenceCaptureTime}>{formatCapture(item.captured_at)}</Text>
                  <Feather name={expandedId === item.id ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
                </View>

                <View style={styles.extractedRow}>
                  {item.vehicle_unit ? (
                    <View style={styles.extractedTag}>
                      <Feather name="truck" size={11} color="#22c55e" />
                      <Text style={styles.extractedTagText}>Unit {item.vehicle_unit}</Text>
                    </View>
                  ) : null}
                  {item.license_plate ? (
                    <View style={styles.extractedTag}>
                      <Feather name="credit-card" size={11} color="#3b82f6" />
                      <Text style={[styles.extractedTagText, { color: "#3b82f6" }]}>{item.license_plate}</Text>
                    </View>
                  ) : null}
                  {item.department_markings ? (
                    <View style={styles.extractedTag}>
                      <Feather name="shield" size={11} color="#f59e0b" />
                      <Text style={[styles.extractedTagText, { color: "#f59e0b" }]} numberOfLines={1}>{item.department_markings.substring(0, 30)}</Text>
                    </View>
                  ) : null}
                </View>

                {expandedId === item.id && item.ai_analysis ? (
                  <Animated.View entering={FadeInDown.duration(200)} style={styles.analysisExpanded}>
                    <Text style={styles.analysisLabel}>AI FORENSIC ANALYSIS</Text>
                    <Text style={styles.analysisText}>{item.ai_analysis}</Text>
                  </Animated.View>
                ) : null}
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  headerSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" },
  captureRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  captureBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 13,
  },
  captureBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: C.accent,
  },
  captureBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  analyzingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.accent + "22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent + "44",
  },
  analyzingText: { flex: 1, fontSize: 13, color: C.text, fontFamily: "Inter_400Regular" },
  webNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  webNoteText: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 16, paddingHorizontal: 20 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, color: C.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  evidenceCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  evidenceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  evidenceSourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.accent + "22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  evidenceSourceText: { fontSize: 11, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  evidenceCaptureTime: { flex: 1, fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  extractedRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  extractedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#22c55e22",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  extractedTagText: { fontSize: 12, color: "#22c55e", fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  analysisExpanded: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    gap: 8,
  },
  analysisLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: C.textMuted,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  analysisText: {
    fontSize: 13,
    color: C.text,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
