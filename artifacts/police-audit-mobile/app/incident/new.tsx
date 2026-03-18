import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useIncidents } from "@/contexts/IncidentContext";

const C = Colors.light;

export default function NewIncidentScreen() {
  const { createIncident } = useIncidents();
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "found" | "denied">("idle");
  const [officerBadge, setOfficerBadge] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [notes, setNotes] = useState("");

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const captureLocation = useCallback(async () => {
    if (Platform.OS === "web") return;
    setGpsStatus("loading");
    try {
      const [perm] = await Promise.all([Location.requestForegroundPermissionsAsync()]);
      if (perm.status !== "granted") {
        setGpsStatus("denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);

      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (geo) {
          const parts = [geo.streetNumber, geo.street, geo.city, geo.region].filter(Boolean);
          setLocation(parts.join(", "));
        }
      } catch {
      }
      setGpsStatus("found");
    } catch {
      setGpsStatus("denied");
    }
  }, []);

  const startRecording = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    const now = Date.now();
    setStartTime(now);
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000));
    }, 1000);
    captureLocation();
  }, [captureLocation]);

  const stopRecording = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRecording(false);
    pulseScale.value = withTiming(1);
    pulseOpacity.value = withTiming(1);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a title for this incident.");
      return;
    }
    if (isRecording) stopRecording();
    setIsSubmitting(true);
    try {
      const incident = await createIncident({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        latitude,
        longitude,
        officer_badge: officerBadge.trim() || undefined,
        officer_name: officerName.trim() || undefined,
        duration_seconds: elapsed > 0 ? elapsed : undefined,
        notes: notes.trim() || undefined,
        status: "pending",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/incident/[id]", params: { id: incident.id } });
    } catch {
      Alert.alert("Error", "Failed to save incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, location, latitude, longitude, officerBadge, officerName, notes, elapsed, isRecording, stopRecording, createIncident]);

  function formatElapsed(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Incident</Text>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { opacity: isSubmitting || pressed ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recordSection}>
          <Animated.View style={[styles.recordRipple, pulseStyle, isRecording && styles.recordRippleActive]} />
          <Pressable
            style={({ pressed }) => [styles.recordBtn, isRecording && styles.recordBtnActive, { opacity: pressed ? 0.9 : 1 }]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Feather name={isRecording ? "square" : "circle"} size={28} color="#fff" />
          </Pressable>
          <Text style={styles.recordLabel}>
            {isRecording ? `Recording  ${formatElapsed(elapsed)}` : elapsed > 0 ? `Recorded ${formatElapsed(elapsed)}` : "Tap to Record"}
          </Text>
          {isRecording && (
            <View style={styles.gpsRow}>
              {gpsStatus === "loading" && <ActivityIndicator size="small" color={C.accent} />}
              {gpsStatus === "found" && latitude !== undefined && (
                <>
                  <Feather name="map-pin" size={12} color="#22c55e" />
                  <Text style={styles.gpsText}>
                    GPS {latitude.toFixed(5)}, {longitude?.toFixed(5)}
                  </Text>
                </>
              )}
              {gpsStatus === "denied" && (
                <>
                  <Feather name="map-pin" size={12} color={C.textMuted} />
                  <Text style={[styles.gpsText, { color: C.textMuted }]}>Location unavailable</Text>
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INCIDENT DETAILS</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Feather name="edit-3" size={16} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Incident title *"
                placeholderTextColor={C.textMuted}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Feather name="align-left" size={16} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Description of what happened"
                placeholderTextColor={C.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Feather
                name="map-pin"
                size={16}
                color={gpsStatus === "found" ? "#22c55e" : C.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Location (auto-filled from GPS)"
                placeholderTextColor={C.textMuted}
                value={location}
                onChangeText={setLocation}
                returnKeyType="next"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OFFICER INFORMATION</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Feather name="shield" size={16} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Badge number"
                placeholderTextColor={C.textMuted}
                value={officerBadge}
                onChangeText={setOfficerBadge}
                returnKeyType="next"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Feather name="user" size={16} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Officer name (if known)"
                placeholderTextColor={C.textMuted}
                value={officerName}
                onChangeText={setOfficerName}
                returnKeyType="next"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputRow}>
              <Feather name="file-text" size={16} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Additional notes, witness info, etc."
                placeholderTextColor={C.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
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
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.accent,
    borderRadius: 10,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  recordSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 16,
    position: "relative",
  },
  recordRipple: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.accent + "22",
  },
  recordRippleActive: { backgroundColor: C.accent + "33" },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.navySurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.accent,
  },
  recordBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  recordLabel: {
    fontSize: 14,
    color: C.textMuted,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  gpsText: {
    fontSize: 11,
    color: "#22c55e",
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputGroup: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputIcon: { marginTop: 2 },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    fontFamily: "Inter_400Regular",
  },
  multilineInput: { minHeight: 70 },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 44,
  },
});
