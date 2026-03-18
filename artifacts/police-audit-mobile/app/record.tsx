import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Video, ResizeMode } from "expo-av";

const { width: W, height: H } = Dimensions.get("window");

const CRIMSON = "#E53935";
const BG = "#000000";
const TEXT = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.6)";
const CARD = "rgba(0,0,0,0.7)";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ incidentId?: string; autoStart?: string }>();
  const incidentId = params.incidentId;
  const autoStart = params.autoStart === "true";

  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const [facing, setFacing] = useState<"front" | "back">("back");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [phase, setPhase] = useState<"capture" | "review">("capture");

  const recDotOpacity = useSharedValue(1);
  const recDotStyle = useAnimatedStyle(() => ({ opacity: recDotOpacity.value }));

  useEffect(() => {
    requestAllPermissions();
  }, []);

  const requestAllPermissions = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    if (!mediaPermission?.granted) await requestMediaPermission();
  };

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording || !cameraReady) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate(200);
      setIsRecording(true);
      setElapsedSeconds(0);

      recDotOpacity.value = withRepeat(
        withSequence(withTiming(0.1, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        false
      );

      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);

      const result = await cameraRef.current.recordAsync({
        maxDuration: 3600,
      });

      if (result?.uri) {
        setRecordedUri(result.uri);
        setPhase("review");
      }
    } catch (e) {
      console.error("Recording error:", e);
      setIsRecording(false);
    }
  }, [isRecording, cameraReady]);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current || !isRecording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Vibration.vibrate([0, 100, 50, 100]);
    cameraRef.current.stopRecording();
    setIsRecording(false);
    recDotOpacity.value = 1;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (cameraReady && autoStart && !isRecording && !recordedUri) {
      const t = setTimeout(() => startRecording(), 800);
      return () => clearTimeout(t);
    }
  }, [cameraReady, autoStart]);

  const saveToGallery = async () => {
    if (!recordedUri) return;
    setIsSaving(true);
    try {
      if (!mediaPermission?.granted) {
        await requestMediaPermission();
      }
      await MediaLibrary.saveToLibraryAsync(recordedUri);
      setSavedToGallery(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Save Failed", "Could not save to gallery. " + String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const discardAndRetake = () => {
    Alert.alert("Discard Recording?", "This will delete the current recording and let you record again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard", style: "destructive", onPress: () => {
          setRecordedUri(null);
          setSavedToGallery(false);
          setElapsedSeconds(0);
          setPhase("capture");
        }
      }
    ]);
  };

  const handleDone = () => {
    if (incidentId) {
      router.replace({ pathname: "/incident/evidence", params: { id: incidentId, newVideoUri: recordedUri || "" } });
    } else {
      router.back();
    }
  };

  const allGranted = cameraPermission?.granted && micPermission?.granted;

  if (!cameraPermission || !micPermission) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="videocam" size={48} color={MUTED} />
        <Text style={styles.permissionText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!allGranted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="videocam-off-outline" size={56} color={CRIMSON} />
        <Text style={styles.permissionTitle}>Camera & Microphone Access Required</Text>
        <Text style={styles.permissionSubtext}>
          CivilShield needs your camera and microphone to record video evidence. This is essential for documenting encounters.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestAllPermissions}>
          <Ionicons name="shield-checkmark" size={18} color={BG} />
          <Text style={styles.grantBtnText}>Grant Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "review" && recordedUri) {
    return (
      <View style={styles.reviewScreen}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />

        <View style={styles.reviewHeader}>
          <TouchableOpacity onPress={discardAndRetake} style={styles.reviewBtn}>
            <Feather name="rotate-ccw" size={18} color={TEXT} />
            <Text style={styles.reviewBtnText}>Retake</Text>
          </TouchableOpacity>
          <View style={styles.reviewTitleArea}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.reviewTitle}>Recording Complete</Text>
          </View>
          <TouchableOpacity onPress={handleDone} style={[styles.reviewBtn, { backgroundColor: "#22c55e22" }]}>
            <Text style={[styles.reviewBtnText, { color: "#22c55e" }]}>Done</Text>
            <Ionicons name="checkmark" size={18} color="#22c55e" />
          </TouchableOpacity>
        </View>

        <Video
          ref={videoRef}
          source={{ uri: recordedUri }}
          style={styles.videoPlayer}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
        />

        <View style={styles.reviewActions}>
          <View style={styles.reviewMeta}>
            <View style={styles.reviewMetaRow}>
              <Ionicons name="time-outline" size={14} color={MUTED} />
              <Text style={styles.reviewMetaText}>Duration: {formatTime(elapsedSeconds)}</Text>
            </View>
            {savedToGallery && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                <Text style={styles.savedBadgeText}>Saved to Gallery</Text>
              </View>
            )}
          </View>

          {!savedToGallery && (
            <TouchableOpacity
              style={styles.saveGalleryBtn}
              onPress={saveToGallery}
              disabled={isSaving}
            >
              <Ionicons name="download-outline" size={18} color={TEXT} />
              <Text style={styles.saveGalleryText}>{isSaving ? "Saving..." : "Save to Gallery"}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.evidenceNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#f59e0b" />
            <Text style={styles.evidenceNoteText}>
              This recording is your evidence. Save it to your gallery and share with your attorney if needed.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
        onCameraReady={() => setCameraReady(true)}
        videoQuality="1080p"
      />

      <View style={styles.topBar}>
        {!isRecording && (
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={TEXT} />
          </TouchableOpacity>
        )}

        {isRecording && (
          <Animated.View entering={FadeIn} style={styles.recBadge}>
            <Animated.View style={[styles.recDot, recDotStyle]} />
            <Text style={styles.recText}>REC</Text>
            <Text style={styles.recTimer}>{formatTime(elapsedSeconds)}</Text>
          </Animated.View>
        )}

        {!isRecording && (
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing(f => f === "back" ? "front" : "back")}
          >
            <Ionicons name="camera-reverse-outline" size={24} color={TEXT} />
          </TouchableOpacity>
        )}
      </View>

      {!isRecording && (
        <Animated.View entering={FadeIn} style={styles.instructionBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#f59e0b" />
          <Text style={styles.instructionText}>
            Video + audio recording — state the date, time, location &amp; officer badge number out loud
          </Text>
        </Animated.View>
      )}

      <View style={styles.bottomBar}>
        {isRecording ? (
          <View style={styles.controlsRow}>
            <View style={styles.controlSpacer} />

            <TouchableOpacity
              style={styles.stopBtn}
              onPress={stopRecording}
              activeOpacity={0.8}
            >
              <View style={styles.stopIcon} />
            </TouchableOpacity>

            <View style={styles.controlSpacer} />
          </View>
        ) : (
          <View style={styles.controlsRow}>
            <View style={styles.controlSpacer} />

            <TouchableOpacity
              style={[styles.recordBtn, !cameraReady && styles.recordBtnDisabled]}
              onPress={startRecording}
              disabled={!cameraReady}
              activeOpacity={0.8}
            >
              <View style={styles.recordBtnInner} />
            </TouchableOpacity>

            <View style={styles.controlSpacer} />
          </View>
        )}

        <View style={styles.bottomLabels}>
          {isRecording ? (
            <Text style={styles.bottomLabel}>Tap square to stop recording</Text>
          ) : (
            <Text style={styles.bottomLabel}>
              {cameraReady ? "Tap to start recording" : "Initializing camera..."}
            </Text>
          )}
        </View>
      </View>

      {isRecording && (
        <Animated.View entering={FadeIn} style={styles.recordingOverlay}>
          <View style={styles.recordingCornerTL} />
          <View style={styles.recordingCornerTR} />
          <View style={styles.recordingCornerBL} />
          <View style={styles.recordingCornerBR} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  permissionScreen: {
    flex: 1, backgroundColor: "#0a1020", alignItems: "center",
    justifyContent: "center", padding: 32, gap: 16,
  },
  permissionTitle: { color: TEXT, fontSize: 20, fontWeight: "700", textAlign: "center" },
  permissionText: { color: MUTED, fontSize: 14, textAlign: "center" },
  permissionSubtext: { color: MUTED, fontSize: 14, textAlign: "center", lineHeight: 21 },
  grantBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: CRIMSON, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 16, marginTop: 8,
  },
  grantBtnText: { color: BG, fontSize: 16, fontWeight: "700" },
  backLink: { marginTop: 8 },
  backLinkText: { color: MUTED, fontSize: 14 },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingHorizontal: 20,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  flipBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  recBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: CRIMSON + "80",
  },
  recDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: CRIMSON,
  },
  recText: { color: CRIMSON, fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  recTimer: { color: TEXT, fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
  instructionBanner: {
    position: "absolute", bottom: 190, left: 16, right: 16,
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#f59e0b40",
  },
  instructionText: { color: "#f59e0b", fontSize: 12, flex: 1, lineHeight: 17 },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    paddingTop: 20, alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  controlsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    width: "100%", paddingHorizontal: 48,
  },
  controlSpacer: { width: 56 },
  recordBtn: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: TEXT,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  recordBtnDisabled: { opacity: 0.5 },
  recordBtnInner: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: CRIMSON,
  },
  stopBtn: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: TEXT,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  stopIcon: {
    width: 30, height: 30, borderRadius: 6, backgroundColor: CRIMSON,
  },
  bottomLabels: { alignItems: "center", marginTop: 14 },
  bottomLabel: { color: MUTED, fontSize: 13 },
  recordingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: "none",
  },
  recordingCornerTL: {
    position: "absolute", top: 70, left: 16, width: 32, height: 32,
    borderTopWidth: 3, borderLeftWidth: 3, borderColor: CRIMSON, borderTopLeftRadius: 4,
  },
  recordingCornerTR: {
    position: "absolute", top: 70, right: 16, width: 32, height: 32,
    borderTopWidth: 3, borderRightWidth: 3, borderColor: CRIMSON, borderTopRightRadius: 4,
  },
  recordingCornerBL: {
    position: "absolute", bottom: 170, left: 16, width: 32, height: 32,
    borderBottomWidth: 3, borderLeftWidth: 3, borderColor: CRIMSON, borderBottomLeftRadius: 4,
  },
  recordingCornerBR: {
    position: "absolute", bottom: 170, right: 16, width: 32, height: 32,
    borderBottomWidth: 3, borderRightWidth: 3, borderColor: CRIMSON, borderBottomRightRadius: 4,
  },
  reviewScreen: { flex: 1, backgroundColor: BG },
  reviewHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  reviewBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  reviewBtnText: { color: TEXT, fontSize: 14, fontWeight: "600" },
  reviewTitleArea: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewTitle: { color: TEXT, fontSize: 14, fontWeight: "700" },
  videoPlayer: { width: W, height: W * (9 / 16) },
  reviewActions: {
    flex: 1, padding: 20, gap: 14,
  },
  reviewMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewMetaText: { color: MUTED, fontSize: 13 },
  savedBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#22c55e20", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  savedBadgeText: { color: "#22c55e", fontSize: 12, fontWeight: "600" },
  saveGalleryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#1e293b", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#334155",
  },
  saveGalleryText: { color: TEXT, fontSize: 15, fontWeight: "600" },
  evidenceNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#f59e0b18", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#f59e0b33",
  },
  evidenceNoteText: { color: "#f59e0b", fontSize: 12, flex: 1, lineHeight: 18 },
});
