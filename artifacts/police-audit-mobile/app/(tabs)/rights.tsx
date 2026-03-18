import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";

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

const SCENARIOS = [
  { id: "traffic_stop",      title: "Traffic Stop",       icon: "truck",        color: "#f59e0b", description: "Your rights when pulled over" },
  { id: "pedestrian_stop",   title: "Pedestrian Stop",    icon: "user",         color: "#3b82f6", description: "Stop & frisk / Terry stops" },
  { id: "recording_police",  title: "Recording Police",   icon: "video",        color: "#22c55e", description: "Right to film officers" },
  { id: "home_entry",        title: "Home Entry",         icon: "home",         color: "#8b5cf6", description: "Search warrants & consent" },
  { id: "arrest",            title: "Arrest & Miranda",   icon: "alert-circle", color: "#ef4444", description: "Miranda rights & being arrested" },
  { id: "excessive_force",   title: "Excessive Force",    icon: "shield-off",   color: "#e11d48", description: "When force is unlawful" },
  { id: "rights_protest",    title: "Protest Rights",     icon: "flag",         color: "#0ea5e9", description: "1st Amendment & demonstrations" },
  { id: "vehicle_search",    title: "Vehicle Search",     icon: "search",       color: "#f97316", description: "4th Amendment & car searches" },
];

const SCENARIO_QUESTIONS: Record<string, string> = {
  traffic_stop: "What are my rights during a traffic stop? Do I have to answer questions? Can they search my car?",
  pedestrian_stop: "What are my rights if police stop me on the street? Do I have to show ID? What is a Terry stop?",
  recording_police: "Do I have the legal right to record or film police officers in public? Can they take my phone?",
  home_entry: "Can police enter my home without a warrant? What are my rights if they come to my door?",
  arrest: "What are Miranda rights and when must police read them? What should I do if I am being arrested?",
  excessive_force: "What constitutes excessive force by police? What legal protections do I have against police brutality?",
  rights_protest: "What are my rights at a protest or demonstration? Can police disperse a crowd?",
  vehicle_search: "When can police legally search my vehicle? What is probable cause? Can I refuse a search?",
};

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "Washington D.C." },
];

interface RightsAnswer {
  answer: string;
  sources: Array<{ title: string; url: string; type: string }>;
  disclaimer: string;
  scenario?: { title: string; color: string } | null;
}

export default function RightsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const scrollRef = useRef<ScrollView>(null);

  const [selectedState, setSelectedState] = useState<{ code: string; name: string } | null>(null);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RightsAnswer | null>(null);

  const askRights = useCallback(async (q: string, scenarioId?: string) => {
    if (!q.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setResult(null);
    try {
      const data = await apiFetch<RightsAnswer>("/rights/ask", {
        method: "POST",
        body: JSON.stringify({
          question: q,
          state_code: selectedState?.code || null,
          scenario_id: scenarioId || null,
        }),
      });
      setResult(data);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 400, animated: true }), 300);
    } catch {
      Alert.alert("Error", "Could not retrieve rights information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  const handleScenarioPress = useCallback((scenarioId: string) => {
    const q = SCENARIO_QUESTIONS[scenarioId] || "";
    setActiveScenario(scenarioId);
    setQuestion(q);
    askRights(q, scenarioId);
  }, [askRights]);

  const handleAsk = useCallback(() => {
    askRights(question, activeScenario || undefined);
  }, [question, activeScenario, askRights]);

  const openUrl = useCallback((url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Could not open link", url));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="book-open" size={20} color={C.accent} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Know Your Rights</Text>
          <Text style={styles.headerSub}>Verified public legal information</Text>
        </View>
      </View>

      <View style={styles.disclaimerBanner}>
        <Feather name="info" size={13} color="#f59e0b" />
        <Text style={styles.disclaimerText}>
          Educational information only — not legal advice. Sourced from Cornell Law, ACLU, Justia & official state laws.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 84 + 34 : 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={styles.stateSelector}
          onPress={() => setShowStatePicker(true)}
        >
          <Feather name="map-pin" size={16} color={selectedState ? C.accent : C.textMuted} />
          <Text style={[styles.stateSelectorText, selectedState && { color: C.text }]}>
            {selectedState ? selectedState.name : "Select your state for state-specific laws"}
          </Text>
          <Feather name="chevron-down" size={16} color={C.textMuted} />
        </Pressable>

        <Text style={styles.sectionLabel}>COMMON SCENARIOS</Text>
        <View style={styles.scenarioGrid}>
          {SCENARIOS.map((s, idx) => (
            <Animated.View key={s.id} entering={FadeInDown.delay(idx * 40).duration(280)} style={styles.scenarioCardWrapper}>
              <Pressable
                style={({ pressed }) => [
                  styles.scenarioCard,
                  activeScenario === s.id && { borderColor: s.color, backgroundColor: s.color + "18" },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => handleScenarioPress(s.id)}
              >
                <View style={[styles.scenarioIcon, { backgroundColor: s.color + "22" }]}>
                  <Feather name={s.icon as any} size={18} color={s.color} />
                </View>
                <Text style={[styles.scenarioTitle, activeScenario === s.id && { color: s.color }]}>{s.title}</Text>
                <Text style={styles.scenarioDesc}>{s.description}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ASK A QUESTION</Text>
        <View style={styles.askCard}>
          <TextInput
            style={styles.questionInput}
            placeholder="Ask about your rights in any police encounter..."
            placeholderTextColor={C.textMuted}
            value={question}
            onChangeText={(t) => { setQuestion(t); setActiveScenario(null); }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Pressable
            style={({ pressed }) => [styles.askBtn, { opacity: loading || !question.trim() || pressed ? 0.6 : 1 }]}
            onPress={handleAsk}
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="search" size={16} color="#fff" />
                <Text style={styles.askBtnText}>Get Rights Info</Text>
              </>
            )}
          </Pressable>
        </View>

        {loading && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.loadingCard}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={styles.loadingText}>Searching verified legal sources...</Text>
            <Text style={styles.loadingSubText}>Cornell Law · ACLU · Justia · State Legislature</Text>
          </Animated.View>
        )}

        {result && !loading && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {result.scenario && (
              <View style={[styles.scenarioTag, { backgroundColor: (result.scenario as any).color + "22" }]}>
                <Text style={[styles.scenarioTagText, { color: (result.scenario as any).color }]}>
                  {(result.scenario as any).title}
                </Text>
                {selectedState && (
                  <Text style={[styles.scenarioTagText, { color: (result.scenario as any).color, marginLeft: 8 }]}>
                    · {selectedState.name}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.disclaimerFull}>
              <Feather name="alert-triangle" size={14} color="#f59e0b" />
              <Text style={styles.disclaimerFullText}>{result.disclaimer}</Text>
            </View>

            <View style={styles.answerCard}>
              <RightsAnswerText text={result.answer} />
            </View>

            <Text style={styles.sectionLabel}>VERIFIED SOURCES</Text>
            {result.sources.map((src, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.sourceRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => openUrl(src.url)}
              >
                <View style={styles.sourceLeft}>
                  <View style={styles.sourceTypeBadge}>
                    <Text style={styles.sourceTypeText}>{src.type}</Text>
                  </View>
                  <Text style={styles.sourceTitle} numberOfLines={1}>{src.title}</Text>
                </View>
                <Feather name="external-link" size={14} color={C.accent} />
              </Pressable>
            ))}

            <View style={styles.legalAidBanner}>
              <Feather name="phone" size={16} color={C.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.legalAidTitle}>Need an Attorney?</Text>
                <Text style={styles.legalAidText}>
                  National Lawyers Guild: (212) 679-5100{"\n"}
                  ACLU: aclu.org/get-help
                </Text>
              </View>
              <Pressable onPress={() => openUrl("https://www.aclu.org/get-help")}>
                <Text style={styles.legalAidLink}>Get Help →</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Modal
        visible={showStatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Your State</Text>
            <Pressable onPress={() => setShowStatePicker(false)} hitSlop={12}>
              <Feather name="x" size={22} color={C.text} />
            </Pressable>
          </View>
          <Text style={styles.modalSubtitle}>
            State selection provides laws and rights specific to your jurisdiction
          </Text>
          <FlatList
            data={US_STATES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.stateRow, selectedState?.code === item.code && styles.stateRowSelected]}
                onPress={() => { setSelectedState(item); setShowStatePicker(false); }}
              >
                <Text style={styles.stateCode}>{item.code}</Text>
                <Text style={[styles.stateName, selectedState?.code === item.code && { color: C.accent }]}>{item.name}</Text>
                {selectedState?.code === item.code && <Feather name="check" size={16} color={C.accent} />}
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        </View>
      </Modal>
    </View>
  );
}

function RightsAnswerText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return <Text key={i} style={answerStyles.heading}>{line.replace("## ", "")}</Text>;
        }
        if (line.startsWith("# ")) {
          return <Text key={i} style={answerStyles.title}>{line.replace("# ", "")}</Text>;
        }
        if (line.startsWith("📋 ")) {
          return (
            <View key={i} style={answerStyles.disclaimerLine}>
              <Text style={answerStyles.disclaimerLineText}>{line}</Text>
            </View>
          );
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <Text key={i} style={answerStyles.bullet}>{line}</Text>;
        }
        if (line.trim() === "") return <View key={i} style={{ height: 6 }} />;
        return <Text key={i} style={answerStyles.body}>{line}</Text>;
      })}
    </View>
  );
}

const answerStyles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold", marginTop: 8 },
  heading: { fontSize: 14, fontWeight: "700" as const, color: C.accent, fontFamily: "Inter_700Bold", marginTop: 12, marginBottom: 2 },
  body: { fontSize: 14, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bullet: { fontSize: 14, color: C.text, fontFamily: "Inter_400Regular", lineHeight: 22, paddingLeft: 8 },
  disclaimerLine: {
    backgroundColor: "#f59e0b22",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  disclaimerLineText: { fontSize: 13, color: "#f59e0b", fontFamily: "Inter_500Medium", fontWeight: "500" as const },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.accent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 1 },
  disclaimerBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f59e0b18",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f59e0b44",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: "#f59e0b",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  stateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  stateSelectorText: {
    flex: 1,
    fontSize: 14,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 12,
  },
  scenarioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  scenarioCardWrapper: { width: "47%" },
  scenarioCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  scenarioIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  scenarioDesc: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  askCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
    marginBottom: 16,
  },
  questionInput: {
    fontSize: 14,
    color: C.text,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
  },
  askBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  loadingCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  loadingText: { fontSize: 15, color: C.text, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  loadingSubText: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular" },
  scenarioTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  scenarioTagText: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  disclaimerFull: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f59e0b18",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f59e0b33",
  },
  disclaimerFullText: { flex: 1, fontSize: 12, color: "#f59e0b", fontFamily: "Inter_400Regular", lineHeight: 18 },
  answerCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  sourceLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sourceTypeBadge: {
    backgroundColor: C.accent + "22",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceTypeText: { fontSize: 10, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  sourceTitle: { fontSize: 13, color: C.text, fontFamily: "Inter_400Regular", flex: 1 },
  legalAidBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.accent + "18",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.accent + "44",
  },
  legalAidTitle: { fontSize: 14, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  legalAidText: { fontSize: 12, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
  legalAidLink: { fontSize: 13, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  modalContainer: { flex: 1, backgroundColor: C.background, paddingTop: 20 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  modalSubtitle: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", paddingHorizontal: 20, paddingBottom: 16, lineHeight: 18 },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  stateRowSelected: { backgroundColor: C.accent + "14" },
  stateCode: { fontSize: 13, fontWeight: "700" as const, color: C.textMuted, fontFamily: "Inter_700Bold", width: 30 },
  stateName: { flex: 1, fontSize: 15, color: C.text, fontFamily: "Inter_400Regular" },
});
