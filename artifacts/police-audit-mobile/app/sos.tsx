import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useSOS, SituationType } from "@/contexts/SOSContext";

const C = Colors.light;

const SITUATIONS: { id: SituationType; label: string; icon: string; color: string; rights: string[] }[] = [
  {
    id: "police_encounter",
    label: "Police Encounter",
    icon: "shield",
    color: "#E53935",
    rights: [
      "You have the right to remain silent — say: \"I am invoking my right to remain silent.\"",
      "You do NOT have to consent to a search — say: \"I do not consent to a search.\"",
      "You have the right to an attorney — say: \"I want a lawyer.\"",
      "Stay calm. Do not physically resist even if the stop is unlawful.",
      "You can ask: \"Am I being detained or am I free to go?\"",
      "Record the interaction openly if safe to do so.",
    ],
  },
  {
    id: "traffic_stop",
    label: "Traffic Stop",
    icon: "truck",
    color: "#f59e0b",
    rights: [
      "Provide license, registration, and insurance when asked.",
      "You do NOT have to answer questions beyond ID — stay silent on the rest.",
      "You do NOT have to consent to a search of your vehicle.",
      "Keep your hands visible at all times.",
      "Officer asking to search ≠ having a right to search. Decline politely.",
      "Note the officer's name, badge number, and patrol car number.",
    ],
  },
  {
    id: "immigration",
    label: "Immigration / ICE",
    icon: "globe",
    color: "#0891b2",
    rights: [
      "You have the right to remain silent regardless of immigration status.",
      "Do NOT sign any document without speaking to an attorney.",
      "ICE needs a judicial warrant signed by a judge to enter your home.",
      "Say: \"I do not consent to your entry\" if ICE comes to your door.",
      "You have the right to contact your consulate.",
      "Contact a immigration attorney immediately — do not delay.",
    ],
  },
  {
    id: "arrest",
    label: "Being Arrested",
    icon: "lock",
    color: "#8b5cf6",
    rights: [
      "Say: \"I am invoking my right to remain silent and I want an attorney.\"",
      "Do NOT resist arrest physically, even if it is unlawful.",
      "You have the right to know the charges against you.",
      "Do NOT make statements or sign anything without an attorney present.",
      "You are entitled to a phone call — use it to call an attorney or trusted person.",
      "Document everything you can remember as soon as possible after.",
    ],
  },
  {
    id: "search_seizure",
    label: "Search & Seizure",
    icon: "search",
    color: "#10b981",
    rights: [
      "Say clearly: \"I do not consent to this search.\"",
      "Officer needs a warrant or specific exception (exigent circumstances, etc.).",
      "Step aside — do NOT physically block or interfere with the search.",
      "Note everything taken and ask for a receipt for seized items.",
      "Any evidence from an illegal search may be suppressed (4th Amendment).",
      "Document everything and contact an attorney after.",
    ],
  },
  {
    id: "use_of_force",
    label: "Use of Force",
    icon: "alert-triangle",
    color: "#ef4444",
    rights: [
      "Force must be reasonable and proportional to the threat (Graham v. Connor).",
      "If safe, say clearly: \"I am not resisting. I am not a threat.\"",
      "Record if possible — footage is critical evidence.",
      "Seek medical attention immediately after, even for minor injuries.",
      "Document injuries with photos before medical treatment if possible.",
      "File a complaint with OPA/OIG and consult a civil rights attorney (42 U.S.C. § 1983).",
    ],
  },
  {
    id: "other",
    label: "Other Situation",
    icon: "alert-circle",
    color: "#6366f1",
    rights: [
      "Stay calm and do not escalate the situation.",
      "Invoke your right to remain silent immediately.",
      "Ask: \"Am I being detained?\" If yes: \"I want an attorney.\"",
      "Do not consent to any search or seizure.",
      "Record names, badge numbers, and patrol car numbers.",
      "Contact an attorney and file any applicable complaints after.",
    ],
  },
];

const STATUS_ACTIONS = [
  { id: "safe", label: "I'm Safe", icon: "check-circle", color: "#10b981", smsMsg: "UPDATE: I am safe. Thank you." },
  { id: "help", label: "Need Help NOW", icon: "alert-triangle", color: "#ef4444", smsMsg: "🚨 I NEED HELP IMMEDIATELY. Please call 911 and come to my location." },
  { id: "attorney", label: "Get Me an Attorney", icon: "briefcase", color: "#6366f1", smsMsg: "I am invoking my right to an attorney. Please contact a civil rights lawyer and send them my location." },
  { id: "guardian", label: "Contact My Guardian", icon: "user", color: "#f59e0b", smsMsg: "Please come to my location or contact someone who can help me immediately." },
];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const {
    contacts,
    activeEvent,
    isLoading,
    sosElapsed,
    triggerSOS,
    updateSOSStatus,
    endSOS,
    sendSMSToContacts,
    getLocationString,
  } = useSOS();

  const [phase, setPhase] = useState<"select" | "active">(activeEvent ? "active" : "select");
  const [selectedSituation, setSelectedSituation] = useState<SituationType | null>(
    (activeEvent?.situation_type as SituationType) || null
  );
  const [statusSent, setStatusSent] = useState<string | null>(null);
  const [rightsExpanded, setRightsExpanded] = useState(false);

  const pulseOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (activeEvent && !activeEvent.ended_at) {
      setPhase("active");
      setSelectedSituation((activeEvent.situation_type as SituationType) || null);
    }
  }, [activeEvent]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const activeSituation = SITUATIONS.find((s) => s.id === selectedSituation);

  const handleSelectSituation = useCallback(async (situation: typeof SITUATIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedSituation(situation.id);
    try {
      const event = await triggerSOS(situation.id);
      const notifyContacts = contacts.filter((c) => c.notify_on_sos);
      if (notifyContacts.length > 0) {
        const mapLink = event.latitude
          ? `https://maps.google.com/?q=${event.latitude},${event.longitude}`
          : "Location unavailable";
        const locLabel = event.location_text || mapLink;
        const msg = `🚨 EMERGENCY ALERT from CitizenWatch\n\nI am in a ${situation.label} situation and need support.\n\nLocation: ${locLabel}\n\nSending this through CitizenWatch emergency system. Please respond or call 911 if I do not update you.`;
        sendSMSToContacts(msg);
      }
      setPhase("active");
    } catch (err) {
      Alert.alert("Error", "Could not activate SOS. Check your connection.");
    }
  }, [contacts, triggerSOS, sendSMSToContacts]);

  const handleStatusAction = useCallback(async (action: typeof STATUS_ACTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateSOSStatus(action.id);
    setStatusSent(action.id);
    const mapLink = activeEvent?.latitude
      ? `https://maps.google.com/?q=${activeEvent.latitude},${activeEvent.longitude}`
      : "Location unavailable";
    const locLabel = activeEvent?.location_text || mapLink;
    const msg = `CitizenWatch SOS Update\n\n${action.smsMsg}\n\nLocation: ${locLabel}`;
    sendSMSToContacts(msg);
    if (action.id === "safe") {
      setTimeout(() => setStatusSent(null), 4000);
    }
  }, [activeEvent, updateSOSStatus, sendSMSToContacts]);

  const handleEnd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "End SOS Alert?",
      "This will stop the emergency recording and close this session. Only end if you are safe.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End SOS",
          style: "destructive",
          onPress: async () => {
            const mapLink = activeEvent?.latitude
              ? `https://maps.google.com/?q=${activeEvent.latitude},${activeEvent.longitude}`
              : "Location unavailable";
            sendSMSToContacts(`✅ CitizenWatch SOS Ended\n\nI have ended my emergency alert. I am okay. Last location: ${activeEvent?.location_text || mapLink}`);
            await endSOS();
            router.back();
          },
        },
      ]
    );
  }, [activeEvent, endSOS, sendSMSToContacts]);

  const handleOpenMaps = useCallback(() => {
    if (!activeEvent?.latitude) return;
    const url = `https://maps.google.com/?q=${activeEvent.latitude},${activeEvent.longitude}`;
    Linking.openURL(url).catch(() => {});
  }, [activeEvent]);

  if (phase === "select") {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={22} color={C.textMuted} />
          </Pressable>
          <Text style={styles.headerTitle}>Shield Alert</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 84 + 34 : 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300)} style={styles.alertBanner}>
            <Feather name="zap" size={18} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertBannerTitle}>What's happening?</Text>
              <Text style={styles.alertBannerSub}>
                Select your situation to instantly alert {contacts.filter((c) => c.notify_on_sos).length} trusted contact{contacts.filter((c) => c.notify_on_sos).length !== 1 ? "s" : ""}, get your rights, and start the SOS timer.
              </Text>
            </View>
          </Animated.View>

          {contacts.filter((c) => c.notify_on_sos).length === 0 && (
            <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.noContactsWarn}>
              <Feather name="user-x" size={15} color="#f59e0b" />
              <Text style={styles.noContactsText}>
                No Guardian Network contacts added yet.{" "}
                <Text style={{ color: "#f59e0b", fontFamily: "Inter_600SemiBold" }} onPress={() => router.push("/contacts")}>
                  Add contacts
                </Text>{" "}
                so they're alerted automatically.
              </Text>
            </Animated.View>
          )}

          <View style={styles.situationGrid}>
            {SITUATIONS.map((s, i) => (
              <Animated.View key={s.id} entering={FadeInDown.delay(i * 40 + 120).duration(280)} style={{ width: "48%" }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.situationCard,
                    { borderColor: s.color + "44", backgroundColor: s.color + "12", opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => handleSelectSituation(s)}
                  disabled={isLoading}
                >
                  <View style={[styles.situationIcon, { backgroundColor: s.color + "22" }]}>
                    <Feather name={s.icon as any} size={24} color={s.color} />
                  </View>
                  <Text style={[styles.situationLabel, { color: s.color }]}>{s.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#ef4444" size="small" />
              <Text style={styles.loadingText}>Getting location & alerting contacts…</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.headerActive}>
        <Animated.View style={[styles.recordingDot, pulseStyle]} />
        <Text style={styles.headerTitleActive}>SOS ACTIVE</Text>
        <Text style={styles.timerText}>{formatElapsed(sosElapsed)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Platform.OS === "web" ? 84 + 34 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        {activeSituation && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.situationBadge, { borderColor: activeSituation.color + "55" }]}>
            <View style={[styles.situationBadgeIcon, { backgroundColor: activeSituation.color + "22" }]}>
              <Feather name={activeSituation.icon as any} size={20} color={activeSituation.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.situationBadgeLabel, { color: activeSituation.color }]}>{activeSituation.label}</Text>
              <Text style={styles.situationBadgeSub}>
                {contacts.filter((c) => c.notify_on_sos).length} contact{contacts.filter((c) => c.notify_on_sos).length !== 1 ? "s" : ""} alerted
              </Text>
            </View>
            {statusSent && (
              <View style={[styles.statusBadge, { backgroundColor: STATUS_ACTIONS.find((a) => a.id === statusSent)?.color + "22" }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_ACTIONS.find((a) => a.id === statusSent)?.color }]}>
                  {STATUS_ACTIONS.find((a) => a.id === statusSent)?.label}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {activeEvent?.latitude ? (
          <Pressable style={styles.locationCard} onPress={handleOpenMaps}>
            <Feather name="map-pin" size={16} color="#0891b2" />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationText} numberOfLines={2}>
                {activeEvent.location_text || `${activeEvent.latitude?.toFixed(5)}, ${activeEvent.longitude?.toFixed(5)}`}
              </Text>
              <Text style={styles.locationSub}>Tap to open in Maps · Share link with contacts</Text>
            </View>
            <Feather name="external-link" size={14} color={C.textMuted} />
          </Pressable>
        ) : (
          <View style={[styles.locationCard, { opacity: 0.6 }]}>
            <Feather name="map-pin" size={16} color={C.textMuted} />
            <Text style={[styles.locationText, { color: C.textMuted }]}>Location not available</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>SEND STATUS UPDATE</Text>
        <Text style={styles.sectionSub}>Tapping a button sends an SMS to your entire Guardian Network with your status and location.</Text>

        <View style={styles.statusGrid}>
          {STATUS_ACTIONS.map((action, i) => (
            <Animated.View key={action.id} entering={FadeInDown.delay(i * 50 + 100).duration(280)} style={{ width: "48%" }}>
              <Pressable
                style={({ pressed }) => [
                  styles.statusCard,
                  { borderColor: action.color + "55", backgroundColor: action.color + "15", opacity: pressed ? 0.8 : 1 },
                  statusSent === action.id && { backgroundColor: action.color + "30", borderColor: action.color },
                ]}
                onPress={() => handleStatusAction(action)}
              >
                <Feather name={action.icon as any} size={22} color={action.color} />
                <Text style={[styles.statusCardLabel, { color: action.color }]}>{action.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {activeSituation && (
          <>
            <Pressable
              style={styles.rightsToggle}
              onPress={() => {
                Haptics.selectionAsync();
                setRightsExpanded((v) => !v);
              }}
            >
              <View style={styles.rightsToggleLeft}>
                <Feather name="book-open" size={16} color="#6366f1" />
                <Text style={styles.rightsToggleText}>Your Rights — {activeSituation.label}</Text>
              </View>
              <Feather name={rightsExpanded ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
            </Pressable>

            {rightsExpanded && (
              <Animated.View entering={FadeInDown.duration(250)} style={styles.rightsCard}>
                {activeSituation.rights.map((right, i) => (
                  <View key={i} style={styles.rightRow}>
                    <View style={[styles.rightNum, { backgroundColor: activeSituation.color + "22" }]}>
                      <Text style={[styles.rightNumText, { color: activeSituation.color }]}>{i + 1}</Text>
                    </View>
                    <Text style={styles.rightText}>{right}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </>
        )}

        <View style={styles.quickLinksRow}>
          <Pressable style={styles.quickLink} onPress={() => Linking.openURL("tel:911").catch(() => {})}>
            <Feather name="phone-call" size={16} color="#ef4444" />
            <Text style={[styles.quickLinkText, { color: "#ef4444" }]}>Call 911</Text>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push("/contacts")}>
            <Feather name="users" size={16} color={C.textMuted} />
            <Text style={styles.quickLinkText}>Contacts</Text>
          </Pressable>
          <Pressable
            style={styles.quickLink}
            onPress={() => {
              if (activeEvent?.latitude) {
                const url = `https://maps.google.com/?q=${activeEvent.latitude},${activeEvent.longitude}`;
                Linking.openURL(url).catch(() => {});
              }
            }}
          >
            <Feather name="share-2" size={16} color={C.textMuted} />
            <Text style={styles.quickLinkText}>Share Location</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.endBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleEnd}
        >
          <Feather name="x-circle" size={18} color="#fff" />
          <Text style={styles.endBtnText}>End SOS — I'm Safe Now</Text>
        </Pressable>
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  headerActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ef444422",
    backgroundColor: "#ef444408",
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  headerTitleActive: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#ef4444",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    flex: 1,
  },
  timerText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#ef4444",
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  alertBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#ef444412",
    borderWidth: 1,
    borderColor: "#ef444433",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  alertBannerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#ef4444",
    fontFamily: "Inter_700Bold",
  },
  alertBannerSub: {
    fontSize: 13,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    lineHeight: 19,
  },
  noContactsWarn: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#f59e0b12",
    borderWidth: 1,
    borderColor: "#f59e0b33",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  noContactsText: {
    flex: 1,
    fontSize: 13,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  situationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  situationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    minHeight: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  situationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  situationLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center" as const,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  loadingText: {
    color: C.textMuted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  situationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: "#ffffff08",
  },
  situationBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  situationBadgeLabel: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  situationBadgeSub: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0891b212",
    borderWidth: 1,
    borderColor: "#0891b233",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 13,
    color: C.text,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  locationSub: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: C.textMuted,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    lineHeight: 18,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statusCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 90,
  },
  statusCardLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center" as const,
    lineHeight: 17,
  },
  rightsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6366f110",
    borderWidth: 1,
    borderColor: "#6366f130",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rightsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightsToggleText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6366f1",
    fontFamily: "Inter_600SemiBold",
  },
  rightsCard: {
    backgroundColor: "#ffffff08",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff10",
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  rightRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  rightNum: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  rightNumText: {
    fontSize: 11,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  rightText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  quickLinksRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffffff0a",
    borderWidth: 1,
    borderColor: "#ffffff15",
    borderRadius: 10,
    paddingVertical: 12,
  },
  quickLinkText: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 8,
  },
  endBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: C.textMuted,
    fontFamily: "Inter_600SemiBold",
  },
});
