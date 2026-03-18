import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { useSOS, TrustedContact } from "@/contexts/SOSContext";

const C = Colors.light;

const RELATIONSHIPS = [
  "Family", "Spouse / Partner", "Parent", "Sibling",
  "Attorney", "Friend", "Guardian", "Emergency Contact",
];

function ContactCard({
  contact,
  index,
  onEdit,
  onDelete,
}: {
  contact: TrustedContact;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = contact.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(280)}>
      <View style={styles.contactCard}>
        <View style={[styles.avatar, { backgroundColor: contact.notify_on_sos ? "#ef444420" : "#ffffff10" }]}>
          <Text style={[styles.avatarText, { color: contact.notify_on_sos ? "#ef4444" : C.textMuted }]}>
            {initials}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
          {contact.relationship && (
            <View style={styles.relBadge}>
              <Text style={styles.relText}>{contact.relationship}</Text>
            </View>
          )}
        </View>
        <View style={styles.contactActions}>
          {contact.notify_on_sos && (
            <View style={styles.sosBadge}>
              <Feather name="zap" size={10} color="#ef4444" />
              <Text style={styles.sosBadgeText}>ALERT</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={onEdit}
          >
            <Feather name="edit-2" size={15} color={C.textMuted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={onDelete}
          >
            <Feather name="trash-2" size={15} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  notify_on_sos: boolean;
}

const EMPTY_FORM: FormState = { name: "", phone: "", email: "", relationship: "", notify_on_sos: true };

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { contacts, addContact, updateContact, deleteContact, refreshContacts } = useSOS();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [relOpen, setRelOpen] = useState(false);

  const openAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((contact: TrustedContact) => {
    Haptics.selectionAsync();
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      relationship: contact.relationship || "",
      notify_on_sos: contact.notify_on_sos,
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert("Missing Info", "Name and phone number are required.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        relationship: form.relationship || undefined,
        notify_on_sos: form.notify_on_sos,
      };
      if (editingId) {
        await updateContact(editingId, data);
      } else {
        await addContact(data as any);
      }
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Error", "Could not save contact. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [form, editingId, addContact, updateContact]);

  const handleDelete = useCallback(
    (contact: TrustedContact) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Remove Contact",
        `Remove ${contact.name} from your Guardian Network? They will no longer be alerted during a Shield Alert.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              await deleteContact(contact.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    },
    [deleteContact]
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Guardian Network</Text>
          <Text style={styles.headerSub}>Alerted automatically during Shield Alert</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={openAdd}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="users" size={36} color="#ef4444" />
          </View>
          <Text style={styles.emptyTitle}>Guardian Network is Empty</Text>
          <Text style={styles.emptyText}>
            Add family members, attorneys, or close friends. When you raise a Shield Alert, they'll receive an instant SMS with your location and situation.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={openAdd}
          >
            <Feather name="user-plus" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add First Contact</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.sosInfoBanner}>
            <Feather name="zap" size={14} color="#ef4444" />
            <Text style={styles.sosInfoText}>
              <Text style={{ color: "#ef4444", fontFamily: "Inter_700Bold" }}>
                {contacts.filter((c) => c.notify_on_sos).length}
              </Text>
              {" "}of {contacts.length} Guardian{contacts.length !== 1 ? "s" : ""} will be alerted via SMS during a Shield Alert
            </Text>
          </View>
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ContactCard
                contact={item}
                index={index}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: Platform.OS === "web" ? 84 + 34 : 120,
            }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <Pressable style={styles.addMoreBtn} onPress={openAdd}>
                <Feather name="user-plus" size={16} color={C.accent} />
                <Text style={styles.addMoreText}>Add Another Contact</Text>
              </Pressable>
            }
          />
        </>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? "Edit Contact" : "Add Trusted Contact"}</Text>
            <Pressable onPress={() => setShowModal(false)} style={styles.modalClose}>
              <Feather name="x" size={22} color={C.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Maria Rodriguez"
              placeholderTextColor={C.textMuted}
              returnKeyType="next"
            />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={C.textMuted}
              keyboardType="phone-pad"
              returnKeyType="next"
            />

            <Text style={styles.inputLabel}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="email@example.com"
              placeholderTextColor={C.textMuted}
              keyboardType="email-address"
              returnKeyType="next"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <Pressable
              style={[styles.input, styles.relSelector]}
              onPress={() => setRelOpen((v) => !v)}
            >
              <Text style={form.relationship ? styles.relSelected : styles.relPlaceholder}>
                {form.relationship || "Select relationship…"}
              </Text>
              <Feather name={relOpen ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
            </Pressable>
            {relOpen && (
              <View style={styles.relDropdown}>
                {RELATIONSHIPS.map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.relOption, form.relationship === r && styles.relOptionSelected]}
                    onPress={() => {
                      setForm((f) => ({ ...f, relationship: r }));
                      setRelOpen(false);
                    }}
                  >
                    <Text style={[styles.relOptionText, form.relationship === r && { color: "#ef4444" }]}>{r}</Text>
                    {form.relationship === r && <Feather name="check" size={14} color="#ef4444" />}
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Alert on Shield Alert</Text>
                <Text style={styles.toggleSub}>Send SMS when you trigger emergency alert</Text>
              </View>
              <Switch
                value={form.notify_on_sos}
                onValueChange={(v) => setForm((f) => ({ ...f, notify_on_sos: v }))}
                trackColor={{ false: "#334155", true: "#ef4444" }}
                thumbColor="#fff"
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.8 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>{editingId ? "Save Changes" : "Add Contact"}</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center",
  },
  sosInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ef444412",
    borderBottomWidth: 1,
    borderBottomColor: "#ef444420",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sosInfoText: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular", flex: 1 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff0a",
    borderWidth: 1,
    borderColor: "#ffffff12",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { fontSize: 15, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  contactPhone: { fontSize: 13, color: C.textMuted, fontFamily: "Inter_400Regular" },
  relBadge: {
    alignSelf: "flex-start" as const,
    backgroundColor: "#ffffff10",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  relText: { fontSize: 11, color: C.textMuted, fontFamily: "Inter_400Regular" },
  contactActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  sosBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ef444420",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 4,
  },
  sosBadgeText: { fontSize: 10, fontWeight: "700" as const, color: "#ef4444", fontFamily: "Inter_700Bold" },
  actionBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 4,
  },
  addMoreText: { fontSize: 14, color: C.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 40, gap: 14,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "#ef444415", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#ef444430",
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold", textAlign: "center" as const },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: "center" as const, fontFamily: "Inter_400Regular", lineHeight: 21 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#ef4444", paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 12, marginTop: 4,
  },
  emptyBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  modalContainer: { flex: 1, backgroundColor: "#0d1b2e" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: "#ffffff10",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" as const, color: C.text, fontFamily: "Inter_700Bold" },
  modalClose: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  modalBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60, gap: 6 },
  inputLabel: {
    fontSize: 12, fontWeight: "600" as const, color: C.textMuted,
    fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginTop: 12, marginBottom: 4,
    textTransform: "uppercase" as const,
  },
  input: {
    backgroundColor: "#ffffff0a", borderWidth: 1, borderColor: "#ffffff18",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    color: C.text, fontSize: 15, fontFamily: "Inter_400Regular",
  },
  relSelector: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  relSelected: { fontSize: 15, color: C.text, fontFamily: "Inter_400Regular" },
  relPlaceholder: { fontSize: 15, color: C.textMuted, fontFamily: "Inter_400Regular" },
  relDropdown: {
    backgroundColor: "#0f1e30", borderWidth: 1, borderColor: "#ffffff15",
    borderRadius: 10, overflow: "hidden", marginTop: 4, marginBottom: 4,
  },
  relOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#ffffff08",
  },
  relOptionSelected: { backgroundColor: "#ef444412" },
  relOptionText: { fontSize: 14, color: C.text, fontFamily: "Inter_400Regular" },
  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#ffffff0a", borderWidth: 1, borderColor: "#ffffff12",
    borderRadius: 10, padding: 14, marginTop: 12,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600" as const, color: C.text, fontFamily: "Inter_600SemiBold" },
  toggleSub: { fontSize: 12, color: C.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#ef4444", borderRadius: 12, paddingVertical: 15, marginTop: 20,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
});
