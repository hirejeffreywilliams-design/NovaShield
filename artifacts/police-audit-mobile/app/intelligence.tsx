import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const API = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "http://localhost:3000/api";

const COLORS = {
  bg: "#0a1020",
  card: "#111827",
  border: "#1e2d45",
  cyan: "#0891b2",
  cyanDim: "#0e3a4a",
  amber: "#f59e0b",
  amberDim: "#3d2f0a",
  green: "#22c55e",
  greenDim: "#0f2d1a",
  crimson: "#E53935",
  crimsonDim: "#3a0f0f",
  indigo: "#6366f1",
  indigoDim: "#1e1f4a",
  purple: "#a855f7",
  purpleDim: "#2a1040",
  text: "#f1f5f9",
  muted: "#64748b",
  subtle: "#1e293b",
};

const POLICY_CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  use_of_force: { label: "Use of Force", icon: "shield-outline", color: COLORS.crimson },
  search_seizure: { label: "Search & Seizure", icon: "search-outline", color: COLORS.amber },
  civil_rights: { label: "Civil Rights", icon: "people-outline", color: COLORS.cyan },
  arrest_procedure: { label: "Arrest Procedure", icon: "hand-left-outline", color: COLORS.indigo },
  racial_profiling: { label: "Racial Profiling", icon: "eye-outline", color: COLORS.purple },
  duty_to_intervene: { label: "Duty to Intervene", icon: "alert-circle-outline", color: COLORS.green },
  protest_rights: { label: "Protest Rights", icon: "megaphone-outline", color: COLORS.amber },
};

interface EngineStats {
  knowledge_base: {
    total_policies: number;
    categories: Array<{ category: string; count: number }>;
    jurisdictions: Array<{ type: string; count: number }>;
  };
  learning: {
    total_analyses: number;
    total_feedback: number;
    confirmed_violations: number;
    disputed_findings: number;
    accuracy_rate: number | null;
    top_confirmed_concern_types: Array<{ concern_type: string; count: number }>;
  };
  engine_version: string;
}

interface Policy {
  id: string;
  category: string;
  jurisdiction_type: string;
  jurisdiction_name: string;
  state_code: string | null;
  title: string;
  content: string;
  legal_authority: string | null;
  policy_type: string | null;
  effective_date: string | null;
}

interface LearnedPattern {
  concern_type: string;
  applicable_amendment: string | null;
  confirmed: number;
  disputed: number;
  false_positive: number;
  total: number;
  accuracy_rate: number | null;
  reliability: string;
}

const { width } = Dimensions.get("window");

function StatCard({
  value,
  label,
  icon,
  color,
  subtitle,
}: {
  value: string | number;
  label: string;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: color + "40" }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function SectionHeader({ title, icon, color }: { title: string; icon: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

function PolicyCard({ policy, onPress }: { policy: Policy; onPress: () => void }) {
  const cat = POLICY_CATEGORIES[policy.category] || { label: policy.category, icon: "document-outline", color: COLORS.cyan };
  const isVisualPattern = policy.policy_type === "visual_pattern";

  return (
    <TouchableOpacity style={styles.policyCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.policyTypeBar, { backgroundColor: cat.color }]} />
      <View style={styles.policyContent}>
        <View style={styles.policyMeta}>
          <View style={[styles.policyBadge, { backgroundColor: cat.color + "20" }]}>
            <Ionicons name={cat.icon as any} size={10} color={cat.color} />
            <Text style={[styles.policyBadgeText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          {isVisualPattern && (
            <View style={[styles.policyBadge, { backgroundColor: COLORS.purple + "20" }]}>
              <Ionicons name="eye-outline" size={10} color={COLORS.purple} />
              <Text style={[styles.policyBadgeText, { color: COLORS.purple }]}>Visual Pattern</Text>
            </View>
          )}
          {policy.state_code && (
            <View style={[styles.policyBadge, { backgroundColor: COLORS.amber + "20" }]}>
              <Text style={[styles.policyBadgeText, { color: COLORS.amber }]}>{policy.state_code}</Text>
            </View>
          )}
        </View>
        <Text style={styles.policyTitle} numberOfLines={2}>{policy.title}</Text>
        <Text style={styles.policyExcerpt} numberOfLines={2}>{policy.content}</Text>
        {policy.effective_date && (
          <Text style={styles.policyDate}>Effective: {policy.effective_date}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={14} color={COLORS.muted} style={{ marginTop: 8 }} />
    </TouchableOpacity>
  );
}

function PatternRow({ pattern }: { pattern: LearnedPattern }) {
  const reliabilityColor =
    pattern.reliability === "high" ? COLORS.green :
    pattern.reliability === "medium" ? COLORS.amber :
    COLORS.muted;

  return (
    <View style={styles.patternRow}>
      <View style={styles.patternLeft}>
        <View style={[styles.reliabilityDot, { backgroundColor: reliabilityColor }]} />
        <View>
          <Text style={styles.patternName}>{pattern.concern_type?.replace(/_/g, " ") || "Unknown"}</Text>
          {pattern.applicable_amendment && (
            <Text style={styles.patternAmendment}>{pattern.applicable_amendment} Amendment</Text>
          )}
        </View>
      </View>
      <View style={styles.patternStats}>
        <Text style={[styles.patternCount, { color: COLORS.green }]}>{pattern.confirmed}✓</Text>
        <Text style={[styles.patternCount, { color: COLORS.muted }]}>{pattern.total}</Text>
        {pattern.accuracy_rate !== null && (
          <Text style={[styles.patternAccuracy, { color: reliabilityColor }]}>{pattern.accuracy_rate}%</Text>
        )}
      </View>
    </View>
  );
}

export default function ShieldIntelligenceScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [patterns, setPatterns] = useState<LearnedPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "policies" | "patterns">("overview");
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, policiesRes, patternsRes] = await Promise.all([
        fetch(`${API}/learn/stats`),
        fetch(`${API}/learn/policies?limit=50`),
        fetch(`${API}/learn/patterns`),
      ]);
      const statsData = await statsRes.json();
      const policiesData = await policiesRes.json();
      const patternsData = await patternsRes.json();

      setStats(statsData);
      setPolicies(policiesData.policies || []);
      setPatterns(patternsData.patterns || []);
    } catch (e) {
      console.error("Failed to load intelligence data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API}/learn/seed`, { method: "POST" });
      const data = await res.json();
      await loadAll();
    } catch (e) {
      console.error("Seed failed", e);
    } finally {
      setSeeding(false);
    }
  };

  const filteredPolicies = filterCategory
    ? policies.filter((p) => p.category === filterCategory)
    : policies;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.loadingText}>Initializing Shield Intelligence Engine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Shield Intelligence</Text>
          <Text style={styles.headerSubtitle}>Self-Learning AI Engine • {stats?.engine_version || "SIE-1.0"}</Text>
        </View>
        <View style={[styles.engineBadge, { backgroundColor: COLORS.cyanDim }]}>
          <View style={[styles.pulsingDot, { backgroundColor: COLORS.cyan }]} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {(["overview", "policies", "patterns"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "overview" ? "Overview" : tab === "policies" ? "Knowledge Base" : "Learned Patterns"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={COLORS.cyan} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && stats && (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Ionicons name="analytics" size={32} color={COLORS.cyan} />
              </View>
              <Text style={styles.heroTitle}>Shield Intelligence Engine</Text>
              <Text style={styles.heroDesc}>
                Trained on {stats.knowledge_base.total_policies} public laws, case precedents, POST standards, and visual violation patterns. Every analysis improves the engine.
              </Text>
              {stats.knowledge_base.total_policies === 0 && (
                <TouchableOpacity
                  style={[styles.seedBtn, seeding && styles.seedBtnDisabled]}
                  onPress={handleSeed}
                  disabled={seeding}
                >
                  {seeding ? (
                    <ActivityIndicator size="small" color={COLORS.bg} />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={16} color={COLORS.bg} />
                  )}
                  <Text style={styles.seedBtnText}>
                    {seeding ? "Loading Public Policy Data..." : "Initialize Knowledge Base"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <SectionHeader title="Knowledge Base" icon="library-outline" color={COLORS.cyan} />
            <View style={styles.statsGrid}>
              <StatCard
                value={stats.knowledge_base.total_policies}
                label="Policies Loaded"
                icon="document-text-outline"
                color={COLORS.cyan}
                subtitle="Laws, cases & POST standards"
              />
              <StatCard
                value={stats.learning.total_analyses}
                label="Analyses Run"
                icon="eye-outline"
                color={COLORS.indigo}
                subtitle="Images analyzed to date"
              />
              <StatCard
                value={stats.learning.confirmed_violations}
                label="Confirmed Violations"
                icon="alert-circle-outline"
                color={COLORS.crimson}
                subtitle="Guardian-confirmed findings"
              />
              <StatCard
                value={stats.learning.accuracy_rate !== null ? `${stats.learning.accuracy_rate}%` : "—"}
                label="Detection Accuracy"
                icon="checkmark-circle-outline"
                color={COLORS.green}
                subtitle="Based on Guardian feedback"
              />
            </View>

            <SectionHeader title="Policy Coverage by Category" icon="pie-chart-outline" color={COLORS.amber} />
            <View style={styles.categoryGrid}>
              {stats.knowledge_base.categories.map((cat) => {
                const meta = POLICY_CATEGORIES[cat.category] || { label: cat.category, icon: "document-outline", color: COLORS.muted };
                return (
                  <TouchableOpacity
                    key={cat.category}
                    style={[styles.categoryCard, { borderColor: meta.color + "40" }]}
                    onPress={() => { setFilterCategory(cat.category); setActiveTab("policies"); }}
                  >
                    <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    <Text style={[styles.categoryCount, { color: meta.color }]}>{cat.count}</Text>
                    <Text style={styles.categoryLabel}>{meta.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SectionHeader title="Jurisdiction Coverage" icon="globe-outline" color={COLORS.green} />
            {stats.knowledge_base.jurisdictions.map((j) => (
              <View key={j.type} style={styles.jurisdictionRow}>
                <Text style={styles.jurisdictionType}>
                  {j.type === "federal" ? "🇺🇸 Federal" :
                   j.type === "state" ? "🏛 State Laws" :
                   j.type === "post_standard" ? "🎓 POST Training" :
                   j.type === "department" ? "🚔 Department Policies" :
                   j.type}
                </Text>
                <Text style={styles.jurisdictionCount}>{j.count} policies</Text>
              </View>
            ))}

            {stats.learning.top_confirmed_concern_types.length > 0 && (
              <>
                <SectionHeader title="Top Confirmed Concern Types" icon="trending-up-outline" color={COLORS.purple} />
                {stats.learning.top_confirmed_concern_types.slice(0, 5).map((c, i) => (
                  <View key={i} style={styles.concernRow}>
                    <Text style={styles.concernRank}>#{i + 1}</Text>
                    <Text style={styles.concernType}>{c.concern_type?.replace(/_/g, " ") || "Unknown"}</Text>
                    <Text style={styles.concernCount}>{c.count}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={styles.howItWorksCard}>
              <Text style={styles.howItWorksTitle}>How the Engine Learns</Text>
              {[
                { icon: "cloud-download-outline", color: COLORS.cyan, step: "1. Public Policy Ingestion", desc: "Federal case law, state statutes, POST standards, and department policies are loaded into the knowledge base." },
                { icon: "eye-outline", color: COLORS.indigo, step: "2. Policy-Informed Analysis", desc: "Before analyzing your evidence, the AI receives relevant laws for your jurisdiction, dramatically improving accuracy." },
                { icon: "thumbs-up-outline", color: COLORS.green, step: "3. Guardian Feedback Loop", desc: "When you confirm or dispute a finding, the engine records it. Confirmed patterns strengthen future detection." },
                { icon: "trending-up-outline", color: COLORS.purple, step: "4. Continuous Improvement", desc: "Patterns from across all confirmed cases teach the system what violations actually look like in the field." },
              ].map((item, i) => (
                <View key={i} style={styles.howItWorksStep}>
                  <View style={[styles.howItWorksIcon, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <View style={styles.howItWorksText}>
                    <Text style={styles.howItWorksStepTitle}>{item.step}</Text>
                    <Text style={styles.howItWorksStepDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === "policies" && (
          <>
            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
                  onPress={() => setFilterCategory(null)}
                >
                  <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {Object.entries(POLICY_CATEGORIES).map(([key, meta]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterChip, filterCategory === key && { borderColor: meta.color, backgroundColor: meta.color + "15" }]}
                    onPress={() => setFilterCategory(filterCategory === key ? null : key)}
                  >
                    <Ionicons name={meta.icon as any} size={11} color={filterCategory === key ? meta.color : COLORS.muted} />
                    <Text style={[styles.filterChipText, filterCategory === key && { color: meta.color }]}>{meta.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.resultsCount}>{filteredPolicies.length} policies</Text>

            {filteredPolicies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onPress={() => setSelectedPolicy(policy)}
              />
            ))}

            {filteredPolicies.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={40} color={COLORS.muted} />
                <Text style={styles.emptyText}>No policies in this category</Text>
                {stats?.knowledge_base.total_policies === 0 && (
                  <TouchableOpacity style={styles.seedBtn} onPress={handleSeed} disabled={seeding}>
                    <Text style={styles.seedBtnText}>Initialize Knowledge Base</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {activeTab === "patterns" && (
          <>
            <View style={styles.patternHero}>
              <Ionicons name="trending-up" size={28} color={COLORS.purple} />
              <Text style={styles.patternHeroTitle}>Learned Violation Patterns</Text>
              <Text style={styles.patternHeroDesc}>
                These patterns emerge as Guardians confirm AI findings across thousands of analyses. Higher confirmation rates make the engine smarter.
              </Text>
            </View>

            {patterns.length > 0 ? (
              <>
                <View style={styles.patternHeader}>
                  <Text style={styles.patternHeaderCol}>Concern Type</Text>
                  <Text style={styles.patternHeaderCol}>✓ / Total / %</Text>
                </View>
                {patterns.map((p, i) => (
                  <PatternRow key={i} pattern={p} />
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trending-up-outline" size={40} color={COLORS.muted} />
                <Text style={styles.emptyText}>No patterns yet</Text>
                <Text style={styles.emptySubtext}>
                  Patterns emerge when Guardians confirm AI findings on analyzed evidence. Start by analyzing evidence in a Shield Report.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!selectedPolicy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={3}>{selectedPolicy?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedPolicy(null)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedPolicy && (
              <>
                <View style={styles.modalMeta}>
                  {selectedPolicy.jurisdiction_name && (
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>{selectedPolicy.jurisdiction_name}</Text>
                    </View>
                  )}
                  {selectedPolicy.policy_type && (
                    <View style={[styles.metaBadge, { backgroundColor: COLORS.indigoDim }]}>
                      <Text style={[styles.metaBadgeText, { color: COLORS.indigo }]}>{selectedPolicy.policy_type.replace(/_/g, " ")}</Text>
                    </View>
                  )}
                  {selectedPolicy.effective_date && (
                    <View style={[styles.metaBadge, { backgroundColor: COLORS.amberDim }]}>
                      <Text style={[styles.metaBadgeText, { color: COLORS.amber }]}>Eff. {selectedPolicy.effective_date}</Text>
                    </View>
                  )}
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalContent}>{selectedPolicy.content}</Text>
                  {selectedPolicy.legal_authority && (
                    <View style={styles.legalAuthorityBox}>
                      <Text style={styles.legalAuthorityLabel}>Legal Authority</Text>
                      <Text style={styles.legalAuthorityText}>{selectedPolicy.legal_authority}</Text>
                    </View>
                  )}
                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  headerSubtitle: { color: COLORS.cyan, fontSize: 11, marginTop: 1 },
  engineBadge: { marginLeft: "auto", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pulsingDot: { width: 8, height: 8, borderRadius: 4 },
  tabBar: { flexDirection: "row", backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.cyan },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: "500" },
  tabTextActive: { color: COLORS.cyan, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 14 },
  heroCard: { backgroundColor: COLORS.cyanDim + "80", borderWidth: 1, borderColor: COLORS.cyan + "40", borderRadius: 14, padding: 20, alignItems: "center", gap: 8 },
  heroIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.cyanDim, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  heroDesc: { color: COLORS.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  seedBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.cyan, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, gap: 8, marginTop: 8 },
  seedBtnDisabled: { opacity: 0.6 },
  seedBtnText: { color: COLORS.bg, fontSize: 13, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { flex: 1, minWidth: (width - 52) / 2, backgroundColor: COLORS.card, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { color: COLORS.text, fontSize: 11, fontWeight: "600", textAlign: "center" },
  statSubtitle: { color: COLORS.muted, fontSize: 10, textAlign: "center" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryCard: { backgroundColor: COLORS.card, borderWidth: 1, borderRadius: 10, padding: 12, alignItems: "center", gap: 4, minWidth: (width - 56) / 3 },
  categoryCount: { fontSize: 20, fontWeight: "800" },
  categoryLabel: { color: COLORS.muted, fontSize: 10, textAlign: "center" },
  jurisdictionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  jurisdictionType: { color: COLORS.text, fontSize: 13 },
  jurisdictionCount: { color: COLORS.cyan, fontSize: 13, fontWeight: "600" },
  concernRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4, gap: 10 },
  concernRank: { color: COLORS.muted, fontSize: 13, width: 24 },
  concernType: { color: COLORS.text, fontSize: 13, flex: 1, textTransform: "capitalize" },
  concernCount: { color: COLORS.purple, fontSize: 13, fontWeight: "700" },
  howItWorksCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, gap: 16 },
  howItWorksTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  howItWorksStep: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  howItWorksIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  howItWorksText: { flex: 1, gap: 2 },
  howItWorksStepTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  howItWorksStepDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  filterRow: { marginBottom: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, backgroundColor: COLORS.card },
  filterChipActive: { borderColor: COLORS.cyan, backgroundColor: COLORS.cyanDim },
  filterChipText: { color: COLORS.muted, fontSize: 12 },
  filterChipTextActive: { color: COLORS.cyan, fontWeight: "600" },
  resultsCount: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  policyCard: { backgroundColor: COLORS.card, borderRadius: 12, flexDirection: "row", overflow: "hidden", marginBottom: 8 },
  policyTypeBar: { width: 4, flexShrink: 0 },
  policyContent: { flex: 1, padding: 12, gap: 4 },
  policyMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  policyBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  policyBadgeText: { fontSize: 10, fontWeight: "600" },
  policyTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  policyExcerpt: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  policyDate: { color: COLORS.muted, fontSize: 10 },
  patternHero: { backgroundColor: COLORS.purpleDim, borderWidth: 1, borderColor: COLORS.purple + "40", borderRadius: 14, padding: 16, alignItems: "center", gap: 6 },
  patternHeroTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  patternHeroDesc: { color: COLORS.muted, fontSize: 12, textAlign: "center", lineHeight: 17 },
  patternHeader: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 6 },
  patternHeaderCol: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  patternRow: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  patternLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  reliabilityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  patternName: { color: COLORS.text, fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  patternAmendment: { color: COLORS.muted, fontSize: 11 },
  patternStats: { flexDirection: "row", gap: 8, alignItems: "center" },
  patternCount: { fontSize: 13, fontWeight: "600" },
  patternAccuracy: { fontSize: 12, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { color: COLORS.muted, fontSize: 14, fontWeight: "500" },
  emptySubtext: { color: COLORS.muted, fontSize: 12, textAlign: "center", lineHeight: 17, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: "#000000aa", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 16 },
  modalHeader: { flexDirection: "row", paddingHorizontal: 16, gap: 10, alignItems: "flex-start" },
  modalTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", flex: 1, lineHeight: 21 },
  modalClose: { padding: 4 },
  modalMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap", paddingHorizontal: 16, marginTop: 10 },
  metaBadge: { backgroundColor: COLORS.cyanDim, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  metaBadgeText: { color: COLORS.cyan, fontSize: 11, fontWeight: "600" },
  modalBody: { paddingHorizontal: 16, marginTop: 14 },
  modalContent: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
  legalAuthorityBox: { backgroundColor: COLORS.amberDim, borderRadius: 10, padding: 12, marginTop: 14, gap: 4 },
  legalAuthorityLabel: { color: COLORS.amber, fontSize: 11, fontWeight: "700" },
  legalAuthorityText: { color: COLORS.text, fontSize: 12, lineHeight: 18 },
});
