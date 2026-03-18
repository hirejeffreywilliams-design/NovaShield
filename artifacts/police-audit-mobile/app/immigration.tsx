import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Linking,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");

const BG        = "#0a1628";
const ACCENT    = "#0891b2";
const CARD_BG   = "#0f2035";
const BORDER    = "#1a3050";
const TEXT      = "#F0F4F8";
const MUTED     = "#7a9ab8";
const SAY_C     = "#22c55e";
const DEMAND_C  = "#3b82f6";
const ASSERT_C  = "#f59e0b";
const WARN_C    = "#ef4444";
const INFO_C    = "#7a9ab8";
const RECORD_C  = "#8b5cf6";

type BlockType = "say" | "demand" | "assert" | "record" | "info" | "warning" | "law";

interface ScriptBlock {
  type: BlockType;
  label: string;
  text: string;
  source?: string;
}

interface ScriptStep {
  title: string;
  subtitle: string;
  blocks: ScriptBlock[];
}

interface Scenario {
  id: string;
  title: string;
  icon: string;
  color: string;
  tagline: string;
  steps: ScriptStep[];
}

const BLOCK_META: Record<BlockType, { color: string; icon: string; bg: string }> = {
  say:     { color: SAY_C,    icon: "message-circle", bg: "#22c55e18" },
  demand:  { color: DEMAND_C, icon: "shield",         bg: "#3b82f618" },
  assert:  { color: ASSERT_C, icon: "alert-triangle", bg: "#f59e0b18" },
  warning: { color: WARN_C,   icon: "alert-octagon",  bg: "#ef444418" },
  record:  { color: RECORD_C, icon: "edit-3",         bg: "#8b5cf618" },
  info:    { color: INFO_C,   icon: "info",           bg: "#1a3050" },
  law:     { color: ACCENT,   icon: "book-open",      bg: "#0891b218" },
};

const SCENARIOS: Scenario[] = [
  {
    id: "door",
    title: "ICE at Your Door",
    icon: "home",
    color: WARN_C,
    tagline: "Do NOT open the door without a judicial warrant",
    steps: [
      {
        title: "First: Do NOT Open the Door",
        subtitle: "You have no obligation to open. ICE cannot legally force entry without a judicial warrant.",
        blocks: [
          { type: "warning", label: "CRITICAL", text: "DO NOT OPEN THE DOOR. You can speak through the door or a closed window. Simply keeping the door closed does not constitute obstruction." },
          { type: "say", label: "SPEAK THROUGH DOOR", text: "\"I need to see a judicial warrant before I open this door.\"" },
          { type: "law", label: "LEGAL BASIS", text: "ICE agents cannot legally enter a home without a judicial warrant — one signed by a federal judge. Administrative warrants (Form I-200 Warrant of Arrest, Form I-205 Warrant of Removal) are signed by ICE officers, NOT judges, and do NOT authorize home entry.", source: "ACLU (aclu.org/know-your-rights/immigrants-rights)" },
          { type: "record", label: "RECORD NOW", text: "Start recording immediately. Note the time, the number of agents, their badge numbers if visible, and what they say." },
        ],
      },
      {
        title: "Check the Warrant",
        subtitle: "If they claim to have a judicial warrant, verify it — safely.",
        blocks: [
          { type: "say", label: "REQUEST WARRANT", text: "\"Please slide the warrant under the door.\"" },
          { type: "info", label: "WHAT TO LOOK FOR", text: "A VALID judicial warrant: (1) says 'United States District Court' or similar federal court at the top, (2) is signed by a JUDGE (not an ICE officer), (3) lists YOUR specific address, (4) has a case number. If it says 'Department of Homeland Security' or 'ICE' at the top and is signed by a Deportation Officer or Agent — it is an administrative warrant and does NOT authorize entry." },
          { type: "assert", label: "IF ADMIN WARRANT", text: "\"That is an administrative warrant. You do not have the legal authority to enter this home without a judicial warrant signed by a judge.\"" },
          { type: "demand", label: "IF NO WARRANT", text: "\"I do not consent to entry. I do not consent to a search. Please leave.\"" },
          { type: "law", label: "LEGAL BASIS", text: "Payton v. New York (1980): warrantless entry into a home to make an arrest is presumptively unreasonable. The 4th Amendment's warrant requirement applies to civil immigration arrests (ICE administrative warrants do not satisfy Payton).", source: "NILC (nilc.org), ACLU" },
        ],
      },
      {
        title: "If They Force Entry",
        subtitle: "If agents force their way in — do not physically resist. Document everything.",
        blocks: [
          { type: "warning", label: "DO NOT RESIST PHYSICALLY", text: "Physical resistance can result in injury or additional criminal charges. Comply physically while asserting your rights verbally." },
          { type: "say", label: "STATE CLEARLY", text: "\"I do not consent to this entry. I do not consent to any search. I am invoking my right to remain silent. I want a lawyer.\"" },
          { type: "record", label: "MEMORIZE/DOCUMENT", text: "Memorize or write down: every agent's name/badge, what they say, what they touch, how many there are, and the exact time. This is critical for any legal challenge." },
          { type: "demand", label: "RIGHT TO ATTORNEY", text: "\"I am requesting an attorney immediately. I will not answer any questions without a lawyer present.\"" },
          { type: "law", label: "FORCED ENTRY = POTENTIAL VIOLATION", text: "Unlawful forced entry without a valid judicial warrant may constitute a 4th Amendment violation. Document everything — this can be grounds for suppression of evidence and civil rights litigation.", source: "ACLU, ILRC (ilrc.org)" },
        ],
      },
    ],
  },
  {
    id: "public",
    title: "Stopped in Public",
    icon: "map-pin",
    color: ASSERT_C,
    tagline: "You have rights — even in the street",
    steps: [
      {
        title: "Immediate Response",
        subtitle: "Stay calm. Do not run. Running can be used to justify extended detention.",
        blocks: [
          { type: "warning", label: "DO NOT RUN", text: "Running from agents — even if you believe you've done nothing wrong — can be used to justify a stop and may escalate the encounter dangerously." },
          { type: "say", label: "ASK FIRST", text: "\"Am I free to go?\"" },
          { type: "info", label: "IF THEY SAY YES", text: "Calmly walk away. Do not run. Once you ask and they say yes, you are free to leave." },
          { type: "info", label: "IF THEY SAY NO OR DON'T ANSWER", text: "You are being detained. Move to the next step." },
          { type: "law", label: "LEGAL BASIS", text: "Under Terry v. Ohio (1968), agents must have reasonable articulable suspicion to detain you. You are entitled to know if you are free to go. Asking this question is not obstruction.", source: "ACLU" },
        ],
      },
      {
        title: "If Detained: Assert Rights",
        subtitle: "The 5th Amendment right to remain silent applies to everyone — regardless of immigration status.",
        blocks: [
          { type: "say", label: "INVOKE SILENCE", text: "\"I am exercising my right to remain silent.\"" },
          { type: "say", label: "REFUSE SEARCHES", text: "\"I do not consent to any search of my person or belongings.\"" },
          { type: "say", label: "REQUEST ATTORNEY", text: "\"I want to speak with a lawyer before answering any questions.\"" },
          { type: "warning", label: "DO NOT LIE", text: "Do NOT provide false information to agents. You can and should remain silent — but lying to federal agents is a separate crime (18 U.S.C. § 1001). Say nothing rather than say something false." },
          { type: "law", label: "5TH AMENDMENT APPLIES TO ALL", text: "The 5th Amendment right to remain silent and the 4th Amendment right against unreasonable searches apply to ALL persons in the United States, regardless of immigration status or citizenship.", source: "ACLU (aclu.org/know-your-rights/immigrants-rights), Plyler v. Doe (1982)" },
        ],
      },
      {
        title: "Document the Encounter",
        subtitle: "You have a First Amendment right to record federal agents in public.",
        blocks: [
          { type: "record", label: "RECORD AUDIO/VIDEO", text: "You have the right to record law enforcement in public, including ICE and CBP agents. Record openly if safe to do so. State: \"I am exercising my First Amendment right to record.\"" },
          { type: "record", label: "CAPTURE THESE", text: "Agent badge numbers and names, agency name, vehicle numbers, what is said, time and location. If agents take your phone, say: \"I do not consent to a search of this device.\"" },
          { type: "info", label: "AFTER THE ENCOUNTER", text: "Contact ACLU or an immigration attorney immediately. Write down everything you remember as soon as it is safe. This documentation is critical for any legal challenge or complaint." },
        ],
      },
    ],
  },
  {
    id: "workplace",
    title: "Workplace Raid (Operativo)",
    icon: "briefcase",
    color: RECORD_C,
    tagline: "Your 4th Amendment rights protect private areas at work",
    steps: [
      {
        title: "Immediate Response",
        subtitle: "Do not run. Do not scatter. Stay calm.",
        blocks: [
          { type: "warning", label: "DO NOT RUN OR SCATTER", text: "Running during a workplace raid can lead to injury or additional charges. Remain where you are and stay calm." },
          { type: "say", label: "INVOKE SILENCE IMMEDIATELY", text: "\"I am exercising my right to remain silent. I want to speak with a lawyer.\"" },
          { type: "record", label: "NOTIFY COWORKERS IF SAFE", text: "Alert coworkers to their right to remain silent. Do not interfere with agents, but you can tell people: 'You have the right to remain silent.'" },
          { type: "law", label: "LEGAL BASIS", text: "The 4th Amendment protects against unreasonable searches even in workplaces. Agents need a judicial warrant to search private areas. Common/public areas may have less protection.", source: "ILRC (ilrc.org), ACLU" },
        ],
      },
      {
        title: "If Questioned",
        subtitle: "You are not required to answer questions about your status, birthplace, or how you entered the US.",
        blocks: [
          { type: "say", label: "TO ALL QUESTIONS", text: "\"I am exercising my right to remain silent. I want a lawyer.\"" },
          { type: "demand", label: "DO NOT SIGN ANYTHING", text: "\"I will not sign any documents without speaking to a lawyer first.\"" },
          { type: "warning", label: "CRITICAL — DO NOT SIGN", text: "ICE may present forms including Form I-644 (Stipulated Removal) or other documents. Signing can waive important rights including the right to appear before an immigration judge. DO NOT SIGN ANYTHING without a lawyer." },
          { type: "info", label: "WHAT YOU CAN SAY", text: "You may provide your name. You are NOT required to answer questions about where you were born, how you entered the US, how long you have been here, or your immigration status." },
        ],
      },
      {
        title: "If Taken Into Custody",
        subtitle: "Act quickly — contact a lawyer as soon as possible.",
        blocks: [
          { type: "demand", label: "DEMAND ATTORNEY", text: "\"I want to speak with an immigration attorney immediately. I will not answer any questions until I have legal representation.\"" },
          { type: "say", label: "NOTIFY FAMILY", text: "You have the right to make a phone call. Call a family member, friend, or attorney. Give them your detention location, A-number (if you have it), and the name of the facility." },
          { type: "info", label: "CALL FOR HELP", text: "ACLU: 1-212-549-2500 | NILC: 1-213-639-3900 | RAICES: 1-512-994-2199 | DOJ EOIR (court info): 1-800-898-7180" },
          { type: "law", label: "RIGHT TO BOND HEARING", text: "Most people in immigration detention have the right to a bond hearing before an immigration judge. A lawyer can file a bond motion. Do NOT waive this right.", source: "DOJ EOIR (justice.gov/eoir), NILC" },
        ],
      },
    ],
  },
  {
    id: "checkpoint",
    title: "CBP Checkpoint",
    icon: "alert-circle",
    color: DEMAND_C,
    tagline: "CBP has broad authority within 100 miles of the US border",
    steps: [
      {
        title: "Know CBP's Authority",
        subtitle: "CBP operates checkpoints up to 100 miles from any US border — this affects most major cities.",
        blocks: [
          { type: "law", label: "100-MILE BORDER ZONE", text: "CBP has statutory authority to operate checkpoints within 100 miles of any US border (land, sea, or air). This zone includes: New York City, Los Angeles, Chicago, Houston, Miami, Seattle, and most other major US cities.", source: "CBP (cbp.gov), ACLU '100-Mile Zone' report" },
          { type: "info", label: "WHAT CBP CAN DO AT CHECKPOINTS", text: "At official interior checkpoints, CBP can ask about citizenship. For non-citizens, CBP may ask for immigration documentation. CBP can use X-ray technology, drug-sniffing dogs, and visual inspection of your vehicle's exterior." },
          { type: "warning", label: "EXPANDED POWERS AT PORTS OF ENTRY", text: "At official ports of entry (airports, land crossings), CBP has much broader authority including the ability to search luggage, phones, and laptops without a warrant." },
        ],
      },
      {
        title: "At an Interior Checkpoint",
        subtitle: "Your response depends on your citizenship status.",
        blocks: [
          { type: "say", label: "IF US CITIZEN", text: "\"I am a US citizen.\" — You may decline to answer further questions. You can say: 'I am exercising my right to remain silent regarding any other questions.'" },
          { type: "say", label: "IF LAWFUL PERMANENT RESIDENT", text: "\"I am a lawful permanent resident\" and show your green card if asked. You have the right to remain silent on other questions: \"I am exercising my right to remain silent.\"" },
          { type: "say", label: "IF VISA HOLDER", text: "Show your visa and passport if requested. You may remain silent regarding other questions: \"I am exercising my right to remain silent.\"" },
          { type: "demand", label: "REFUSE DEVICE SEARCH", text: "\"I do not consent to a search of my phone or electronic devices.\"" },
          { type: "law", label: "DEVICE SEARCHES", text: "Courts are split on whether CBP needs a warrant to search phones. To protect yourself: (1) state you do not consent, (2) enable encryption, (3) power off device. If they search anyway, it may be challengeable in court.", source: "ACLU, EFF (eff.org/issues/border-searches-devices)" },
        ],
      },
      {
        title: "If Pulled for Secondary Inspection",
        subtitle: "Remain calm. This does not mean you are in trouble.",
        blocks: [
          { type: "say", label: "INVOKE RIGHTS", text: "\"I am exercising my right to remain silent. I do not consent to any searches.\"" },
          { type: "demand", label: "ASK ABOUT DETENTION", text: "\"Am I being detained or am I free to go?\"" },
          { type: "warning", label: "DO NOT CONSENT TO SEARCHES", text: "Verbally state you do not consent to any search of your vehicle, bags, or electronic devices. Even if CBP searches anyway — your stated non-consent preserves your legal rights for any challenge." },
          { type: "info", label: "RECORD WHAT HAPPENS", text: "Note the agent's badge number, name, the start time, what is searched, and what is said. Report any misconduct to DHS OIG: 1-800-323-8603 or oig.dhs.gov" },
        ],
      },
    ],
  },
  {
    id: "detained",
    title: "If You're Detained",
    icon: "lock",
    color: WARN_C,
    tagline: "Act fast — your rights begin the moment you are detained",
    steps: [
      {
        title: "Immediately Upon Detention",
        subtitle: "The first hours are critical. Assert your rights immediately.",
        blocks: [
          { type: "say", label: "STATE IMMEDIATELY", text: "\"I am exercising my right to remain silent. I want an immigration attorney. I will not sign any documents without legal representation.\"" },
          { type: "demand", label: "DO NOT SIGN ANYTHING", text: "Do NOT sign Form I-644 (Stipulated Removal), Form I-826 (Notice of Rights), or any other form without a lawyer. Signing can mean immediate deportation without a hearing." },
          { type: "record", label: "MEMORIZE YOUR A-NUMBER", text: "Your A-Number (Alien Registration Number) is critical. It is 8-9 digits starting with 'A'. Give it to family/friends so they can track your case and find you in the system." },
          { type: "info", label: "HOW TO BE FOUND", text: "Family/friends can locate you using: ICE Detainee Locator at locator.ice.gov using your name and country of birth, OR by calling 1-888-351-4024 (ICE ERO detention reporting line)." },
        ],
      },
      {
        title: "Your Rights in Detention",
        subtitle: "You have significant legal rights even in immigration detention.",
        blocks: [
          { type: "law", label: "RIGHT TO A HEARING", text: "Most people in immigration detention have the right to appear before an immigration judge. You have the right to a bond hearing in most cases (exceptions: certain criminal grounds, recent arrival). Do NOT waive this right.", source: "DOJ EOIR (justice.gov/eoir)" },
          { type: "law", label: "RIGHT TO ATTORNEY", text: "You have the right to be represented by an attorney — though unlike criminal cases, the government is not required to provide one for free in civil immigration cases. Many nonprofit organizations provide free representation.", source: "NILC (nilc.org), ACLU" },
          { type: "demand", label: "REQUEST LEGAL HELP", text: "Ask for a list of free legal service providers. By law, ICE must provide detainees with information about free legal services. Say: \"I request the list of free legal service providers.\"" },
          { type: "info", label: "FREE LEGAL RESOURCES", text: "RAICES (raicestexas.org): 1-512-994-2199 | NILC: 1-213-639-3900 | ACLU: 1-212-549-2500 | ILRC: ilrc.org | Immigrant Defense Project: immigrantdefenseproject.org" },
        ],
      },
      {
        title: "Critical Do NOT's in Detention",
        subtitle: "These mistakes can permanently end your ability to stay in the US.",
        blocks: [
          { type: "warning", label: "DO NOT SIGN REMOVAL ORDERS", text: "Never sign a Stipulated Order of Removal, Voluntary Departure form, or any removal order without speaking to an attorney first. These documents waive your right to a hearing and can bar reentry for 3-10 years or permanently." },
          { type: "warning", label: "DO NOT WAIVE YOUR HEARING", text: "If asked to waive your right to appear before an immigration judge, say NO. \"I do not waive my right to a hearing. I want to appear before an immigration judge.\"" },
          { type: "warning", label: "DO NOT LIE ABOUT IDENTITY", text: "Providing false identity information to federal agents is a crime. You may remain silent about your immigration status, but do not lie about who you are." },
          { type: "info", label: "CONDITIONS OF DETENTION", text: "If you are mistreated, denied medical care, or subjected to abuse in detention, report it: DHS OIG hotline 1-800-323-8603 | ICE detention standards: ice.gov/detention-standards | ACLU: aclu.org/report" },
          { type: "law", label: "CONDITIONS STANDARDS", text: "ICE detention is governed by the ICE Performance Based Detention Standards (PBNDS). You are entitled to medical care, access to legal calls, religious accommodation, and protection from abuse.", source: "ICE (ice.gov/detention-standards)" },
        ],
      },
    ],
  },
  {
    id: "sensitive",
    title: "Sensitive Locations",
    icon: "heart",
    color: SAY_C,
    tagline: "Schools, hospitals, churches & more — know what protection exists",
    steps: [
      {
        title: "ICE's Sensitive Locations Policy",
        subtitle: "Important: This is ICE POLICY — not a law. It can be changed or ignored.",
        blocks: [
          { type: "law", label: "WHAT THE POLICY COVERS", text: "ICE's current policy generally avoids enforcement operations at: schools (K-12, colleges, universities, vocational), medical facilities (hospitals, emergency rooms, clinics), churches/mosques/synagogues/temples, playgrounds, recreation centers, social services offices, funerals, weddings, and public demonstrations/parades.", source: "ICE (ice.gov) Sensitive Locations Policy" },
          { type: "warning", label: "CRITICAL LIMITATION", text: "This is ADMINISTRATIVE POLICY, not a federal law. It can be changed by any administration without Congressional approval. It does not mean ICE will never enforce at these locations — it means they are supposed to get supervisor approval first." },
          { type: "info", label: "WHAT IT DOESN'T COVER", text: "The policy does NOT cover: areas immediately outside sensitive locations, transportation to/from, ICE agents following someone from a non-sensitive location to a sensitive one, or situations involving national security threats." },
        ],
      },
      {
        title: "At a Hospital or Medical Facility",
        subtitle: "You have rights to emergency medical care regardless of status.",
        blocks: [
          { type: "law", label: "EMTALA PROTECTION", text: "Under EMTALA (Emergency Medical Treatment and Labor Act), hospitals that accept Medicare must provide emergency screening and stabilizing treatment to ALL patients regardless of immigration status, ability to pay, or citizenship.", source: "CMS (cms.gov/medicare/provider-enrollment/emergencymedtreatmentlaboract)" },
          { type: "info", label: "HIPAA PROTECTION", text: "Medical facilities generally cannot share patient information with ICE without a valid court order or specific exceptions. Patient privacy is protected under HIPAA." },
          { type: "say", label: "IF ASKED ABOUT STATUS AT HOSPITAL", text: "\"I need emergency medical care. I am not required to answer questions about my immigration status. Please provide care.\"" },
        ],
      },
      {
        title: "At a School",
        subtitle: "All children have the right to public education regardless of status.",
        blocks: [
          { type: "law", label: "PLYLER V. DOE (1982)", text: "The Supreme Court ruled in Plyler v. Doe (1982) that states cannot deny children access to public K-12 education based on undocumented status. All children have the right to attend public school regardless of immigration status.", source: "Plyler v. Doe, 457 U.S. 202 (1982)" },
          { type: "info", label: "ENROLLMENT RIGHTS", text: "Schools cannot: require Social Security numbers as a condition of enrollment, ask about immigration status, or require birth certificates if not available (alternatives must be accepted)." },
          { type: "warning", label: "IF ICE COMES TO SCHOOL", text: "Schools are not required to allow ICE access without a judicial warrant. Administrators can and should ask agents to leave without proper documentation. Parents should contact the school and an immigration attorney immediately." },
        ],
      },
    ],
  },
];

const RIGHTS_CARDS = [
  { id: "silent", title: "RIGHT TO REMAIN SILENT", subtitle: "5th Amendment · Applies to Everyone", body: "I AM EXERCISING MY RIGHT TO REMAIN SILENT.\n\nI WILL NOT ANSWER ANY QUESTIONS WITHOUT AN ATTORNEY PRESENT.", color: DEMAND_C },
  { id: "no_entry", title: "I DO NOT CONSENT TO ENTRY", subtitle: "4th Amendment · No Judicial Warrant", body: "I DO NOT CONSENT TO THIS ENTRY.\n\nYOU DO NOT HAVE A JUDICIAL WARRANT.\nI AM NOT OPENING THIS DOOR.", color: WARN_C },
  { id: "no_search", title: "I DO NOT CONSENT TO A SEARCH", subtitle: "4th Amendment · Applies to Everyone", body: "I DO NOT CONSENT TO ANY SEARCH OF MY PERSON, VEHICLE, HOME, OR ELECTRONIC DEVICES.", color: ASSERT_C },
  { id: "lawyer", title: "I AM REQUESTING AN ATTORNEY", subtitle: "Right to Counsel · Do Not Question Me", body: "I AM REQUESTING AN IMMIGRATION ATTORNEY.\n\nI WILL NOT SIGN ANY DOCUMENTS.\nI WILL NOT ANSWER ANY QUESTIONS\nUNTIL I HAVE LEGAL REPRESENTATION.", color: SAY_C },
  { id: "no_sign", title: "I WILL NOT SIGN ANYTHING", subtitle: "Protect Your Rights · No Waivers", body: "I WILL NOT SIGN ANY DOCUMENTS.\n\nSIGNING WITHOUT A LAWYER COULD MEAN IMMEDIATE DEPORTATION AND A PERMANENT BAN FROM THE US.", color: RECORD_C },
];

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export default function ImmigrationScreen() {
  const insets = useSafeAreaInsets();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showRightsCard, setShowRightsCard] = useState<typeof RIGHTS_CARDS[0] | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showHotlines, setShowHotlines] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const scenario = SCENARIOS.find((s) => s.id === activeScenario) || null;
  const currentStep = scenario?.steps[activeStep] || null;

  const handleAsk = useCallback(async () => {
    if (!question.trim()) return;
    setAiLoading(true);
    setAiAnswer("");
    try {
      const res = await fetch(`${BASE_URL}/immigration/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();
      setAiAnswer(data.answer || "Unable to generate response.");
    } catch {
      setAiAnswer("Connection error. Please try again or call ACLU: 1-212-549-2500");
    } finally {
      setAiLoading(false);
    }
  }, [question]);

  const triggerPanic = useCallback(() => {
    if (Platform.OS !== "web") {
      Vibration.vibrate([0, 200, 100, 200, 100, 500]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowRightsCard(RIGHTS_CARDS[0]);
  }, []);

  if (showRightsCard) {
    return (
      <Modal visible animationType="fade">
        <View style={[rc.container, { backgroundColor: showRightsCard.color + "22", paddingTop: topPad }]}>
          <Pressable style={rc.close} onPress={() => setShowRightsCard(null)} hitSlop={20}>
            <Feather name="x" size={28} color={TEXT} />
          </Pressable>
          <View style={[rc.card, { borderColor: showRightsCard.color }]}>
            <Text style={[rc.title, { color: showRightsCard.color }]}>{showRightsCard.title}</Text>
            <Text style={rc.subtitle}>{showRightsCard.subtitle}</Text>
            <View style={[rc.divider, { backgroundColor: showRightsCard.color }]} />
            <Text style={rc.body}>{showRightsCard.body}</Text>
          </View>
          <Text style={rc.tip}>Show this screen to the agent if needed</Text>
          <View style={rc.cardNav}>
            {RIGHTS_CARDS.map((card) => (
              <Pressable
                key={card.id}
                style={[rc.cardDot, { backgroundColor: showRightsCard.id === card.id ? card.color : BORDER }]}
                onPress={() => setShowRightsCard(card)}
              />
            ))}
          </View>
        </View>
      </Modal>
    );
  }

  if (activeScenario && scenario && currentStep) {
    return (
      <View style={[s.container, { paddingTop: topPad }]}>
        <View style={s.scenarioHeader}>
          <Pressable onPress={() => { setActiveScenario(null); setActiveStep(0); }} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={TEXT} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.scenarioTitle}>{scenario.title}</Text>
            <Text style={s.scenarioTagline}>{scenario.tagline}</Text>
          </View>
          <Pressable
            style={[s.panicBtn, { width: 42, height: 42 }]}
            onPress={triggerPanic}
            hitSlop={8}
          >
            <Feather name="shield" size={18} color="#fff" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stepTabs} style={{ maxHeight: 48, flexGrow: 0 }}>
          {scenario.steps.map((step, idx) => (
            <Pressable
              key={idx}
              style={[s.stepTab, activeStep === idx && { backgroundColor: scenario.color + "22", borderColor: scenario.color }]}
              onPress={() => setActiveStep(idx)}
            >
              <Text style={[s.stepTabText, activeStep === idx && { color: scenario.color }]}>Step {idx + 1}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.stepContent, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(200)} key={`step-${activeStep}`}>
            <View style={s.stepHeader}>
              <View style={[s.stepNum, { backgroundColor: scenario.color + "22" }]}>
                <Text style={[s.stepNumText, { color: scenario.color }]}>{activeStep + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.stepTitle}>{currentStep.title}</Text>
                <Text style={s.stepSubtitle}>{currentStep.subtitle}</Text>
              </View>
            </View>

            <View style={{ gap: 10, marginTop: 4 }}>
              {currentStep.blocks.map((block, i) => {
                const meta = BLOCK_META[block.type];
                return (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 60).duration(250)}>
                    <View style={[bl.card, { backgroundColor: meta.bg, borderColor: meta.color + "44" }]}>
                      <View style={bl.labelRow}>
                        <View style={[bl.iconWrap, { backgroundColor: meta.color + "22" }]}>
                          <Feather name={meta.icon as any} size={14} color={meta.color} />
                        </View>
                        <Text style={[bl.label, { color: meta.color }]}>{block.label}</Text>
                      </View>
                      <Text style={bl.text}>{block.text}</Text>
                      {block.source && (
                        <Text style={bl.source}>Source: {block.source}</Text>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            <View style={s.stepNav}>
              <Pressable
                style={[s.navBtn, activeStep === 0 && { opacity: 0.4 }]}
                onPress={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
              >
                <Feather name="chevron-left" size={18} color={ACCENT} />
                <Text style={s.navBtnText}>Previous</Text>
              </Pressable>
              <Pressable
                style={[s.navBtn, activeStep === scenario.steps.length - 1 && { opacity: 0.4 }]}
                onPress={() => setActiveStep(Math.min(scenario.steps.length - 1, activeStep + 1))}
                disabled={activeStep === scenario.steps.length - 1}
              >
                <Text style={s.navBtnText}>Next</Text>
                <Feather name="chevron-right" size={18} color={ACCENT} />
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={TEXT} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Sanctuary Rights</Text>
          <Text style={s.headerSub}>ICE · CBP · Detention · Know Your Rights</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.mainContent, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={s.panicButton} onPress={triggerPanic}>
          <View style={s.panicInner}>
            <Feather name="shield" size={28} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={s.panicTitle}>I AM BEING DETAINED</Text>
              <Text style={s.panicSub}>Tap for immediate rights cards to show agents</Text>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>

        <View style={s.legalBasis}>
          <Feather name="info" size={14} color={ACCENT} />
          <Text style={s.legalBasisText}>
            The 4th and 5th Amendments apply to ALL people in the US regardless of immigration status.{" "}
            <Text style={{ color: ACCENT }}>Plyler v. Doe (1982) · Zadvydas v. Davis (2001)</Text>
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>ENCOUNTER SCENARIOS</Text>
          <Text style={s.sectionSub}>Tap a scenario for step-by-step scripts grounded in verified law</Text>
          <View style={s.scenarioGrid}>
            {SCENARIOS.map((sc, idx) => (
              <Animated.View key={sc.id} entering={FadeInDown.delay(idx * 60).duration(300)} style={{ width: "48%" }}>
                <Pressable
                  style={({ pressed }) => [s.scenarioCard, { borderColor: sc.color + "55", opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => { setActiveScenario(sc.id); setActiveStep(0); }}
                >
                  <View style={[s.scenarioIcon, { backgroundColor: sc.color + "22" }]}>
                    <Feather name={sc.icon as any} size={22} color={sc.color} />
                  </View>
                  <Text style={s.scenarioCardTitle}>{sc.title}</Text>
                  <Text style={s.scenarioCardTagline}>{sc.tagline}</Text>
                  <View style={[s.scenarioSteps, { backgroundColor: sc.color + "18" }]}>
                    <Text style={[s.scenarioStepsText, { color: sc.color }]}>{sc.steps.length} step scripts</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>SHOW-AGENT RIGHTS CARDS</Text>
          <Text style={s.sectionSub}>Tap any card to display it full-screen to show agents</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {RIGHTS_CARDS.map((card) => (
              <Pressable
                key={card.id}
                style={[s.rightsCard, { borderColor: card.color + "66" }]}
                onPress={() => setShowRightsCard(card)}
              >
                <View style={[s.rightsCardIcon, { backgroundColor: card.color + "22" }]}>
                  <Feather name="maximize" size={16} color={card.color} />
                </View>
                <Text style={[s.rightsCardTitle, { color: card.color }]}>{card.title}</Text>
                <Text style={s.rightsCardSub}>{card.subtitle}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>ASK AN IMMIGRATION RIGHTS QUESTION</Text>
          <Text style={s.sectionSub}>AI answers citing only ACLU, NILC, ILRC, USCIS, ICE, CBP, and DOJ verified sources</Text>
          <View style={s.aiCard}>
            <TextInput
              style={s.aiInput}
              placeholder="e.g. Can ICE enter my home without a judicial warrant?"
              placeholderTextColor={MUTED}
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Pressable
              style={({ pressed }) => [s.aiBtn, aiLoading && { opacity: 0.6 }, { opacity: pressed ? 0.8 : 1 }]}
              onPress={handleAsk}
              disabled={aiLoading || !question.trim()}
            >
              {aiLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name="send" size={16} color="#fff" />
              )}
              <Text style={s.aiBtnText}>{aiLoading ? "Researching..." : "Get Verified Answer"}</Text>
            </Pressable>
            {aiAnswer ? (
              <Animated.View entering={FadeIn.duration(300)} style={s.aiAnswer}>
                <Text style={s.aiAnswerText}>{aiAnswer}</Text>
                <Text style={s.aiDisclaimer}>This AI cites verified legal sources (ACLU, NILC, ILRC, USCIS, ICE, CBP, DOJ). This is educational information, not legal advice. For your specific situation, contact an immigration attorney.</Text>
              </Animated.View>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>EMERGENCY CONTACTS</Text>
          <Pressable
            style={[s.hotlineBtn, { opacity: showHotlines ? 0.7 : 1 }]}
            onPress={() => setShowHotlines(!showHotlines)}
          >
            <Feather name="phone" size={16} color={SAY_C} />
            <Text style={s.hotlineBtnText}>{showHotlines ? "Hide" : "Show"} Emergency Hotlines</Text>
            <Feather name={showHotlines ? "chevron-up" : "chevron-down"} size={16} color={MUTED} />
          </Pressable>
          {showHotlines && (
            <Animated.View entering={FadeIn.duration(200)} style={{ gap: 8 }}>
              {[
                { name: "ACLU National", phone: "1-212-549-2500", note: "Immigration rights" },
                { name: "NILC", phone: "1-213-639-3900", note: "National Immigration Law Center" },
                { name: "RAICES", phone: "1-512-994-2199", note: "Immigration legal defense" },
                { name: "DOJ Immigration Court Info", phone: "1-800-898-7180", note: "EOIR court information" },
                { name: "ICE Detention Locator", phone: "1-888-351-4024", note: "Find detained person" },
                { name: "DHS Misconduct Report", phone: "1-800-323-8603", note: "Report ICE/CBP abuse" },
              ].map((h, i) => (
                <Pressable
                  key={i}
                  style={s.hotlineCard}
                  onPress={() => Linking.openURL(`tel:${h.phone.replace(/-/g, "")}`)}
                >
                  <View style={s.hotlineLeft}>
                    <Text style={s.hotlineName}>{h.name}</Text>
                    <Text style={s.hotlineNote}>{h.note}</Text>
                  </View>
                  <View style={s.hotlinePhoneWrap}>
                    <Feather name="phone" size={14} color={SAY_C} />
                    <Text style={s.hotlinePhone}>{h.phone}</Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>

        <View style={s.sourceSection}>
          <Text style={s.sectionLabel}>VERIFIED LEGAL SOURCES</Text>
          {[
            { name: "ACLU Immigrants' Rights Guide", url: "https://www.aclu.org/know-your-rights/immigrants-rights", icon: "shield" },
            { name: "NILC Know Your Rights", url: "https://www.nilc.org/get-involved/community-education-resources/know-your-rights/", icon: "book-open" },
            { name: "ILRC Red Cards (printable)", url: "https://www.ilrc.org/red-cards", icon: "credit-card" },
            { name: "USCIS Official Immigration Info", url: "https://www.uscis.gov", icon: "globe" },
            { name: "ICE Enforcement Policy (official)", url: "https://www.ice.gov/features/ero", icon: "file-text" },
            { name: "DOJ Immigration Court (EOIR)", url: "https://www.justice.gov/eoir", icon: "award" },
            { name: "DHS Office of Inspector General (report abuse)", url: "https://www.oig.dhs.gov", icon: "alert-circle" },
          ].map((src, i) => (
            <Pressable key={i} style={s.sourceRow} onPress={() => Linking.openURL(src.url)}>
              <Feather name={src.icon as any} size={14} color={ACCENT} />
              <Text style={s.sourceName}>{src.name}</Text>
              <Feather name="external-link" size={12} color={MUTED} />
            </Pressable>
          ))}
        </View>

        <View style={s.disclaimer}>
          <Feather name="info" size={12} color={MUTED} />
          <Text style={s.disclaimerText}>
            This information is based on verified legal sources (ACLU, NILC, ILRC, USCIS, ICE, CBP, DOJ). Laws and policies change — always consult a licensed immigration attorney for advice specific to your situation. This app does not constitute legal representation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerTitle: { fontSize: 22, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", marginTop: 1 },
  mainContent: { paddingHorizontal: 16, paddingTop: 4, gap: 20 },

  panicButton: { backgroundColor: "#be123c", borderRadius: 16, overflow: "hidden" as const },
  panicInner: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 18 },
  panicTitle: { fontSize: 18, fontWeight: "800" as const, color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  panicSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", marginTop: 3 },
  panicBtn: { backgroundColor: "#be123c", borderRadius: 21, alignItems: "center", justifyContent: "center" },

  legalBasis: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: ACCENT + "14", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: ACCENT + "33" },
  legalBasisText: { flex: 1, fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 18 },

  section: { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: "700" as const, color: MUTED, fontFamily: "Inter_700Bold", letterSpacing: 1.3 },
  sectionSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17 },

  scenarioGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  scenarioCard: { backgroundColor: CARD_BG, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, width: "100%" },
  scenarioIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scenarioCardTitle: { fontSize: 14, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  scenarioCardTagline: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 16 },
  scenarioSteps: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  scenarioStepsText: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },

  rightsCard: { backgroundColor: CARD_BG, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, width: 180 },
  rightsCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rightsCardTitle: { fontSize: 12, fontWeight: "700" as const, fontFamily: "Inter_700Bold", lineHeight: 16 },
  rightsCardSub: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },

  aiCard: { backgroundColor: CARD_BG, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: BORDER },
  aiInput: { backgroundColor: BG, borderRadius: 10, padding: 12, fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular", minHeight: 80, borderWidth: 1, borderColor: BORDER },
  aiBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 12 },
  aiBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  aiAnswer: { gap: 8 },
  aiAnswerText: { fontSize: 13, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 21 },
  aiDisclaimer: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 16, fontStyle: "italic" as const },

  hotlineBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: CARD_BG, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: BORDER },
  hotlineBtnText: { flex: 1, fontSize: 14, color: SAY_C, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  hotlineCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: CARD_BG, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: BORDER },
  hotlineLeft: { flex: 1, gap: 2 },
  hotlineName: { fontSize: 13, fontWeight: "600" as const, color: TEXT, fontFamily: "Inter_600SemiBold" },
  hotlineNote: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },
  hotlinePhoneWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  hotlinePhone: { fontSize: 14, color: SAY_C, fontFamily: "Inter_700Bold", fontWeight: "700" as const },

  sourceSection: { gap: 8 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: CARD_BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: BORDER },
  sourceName: { flex: 1, fontSize: 13, color: TEXT, fontFamily: "Inter_400Regular" },

  disclaimer: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingTop: 4 },
  disclaimerText: { flex: 1, fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17 },

  scenarioHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, paddingTop: 8 },
  scenarioTitle: { fontSize: 18, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  scenarioTagline: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular", marginTop: 1 },
  stepTabs: { paddingHorizontal: 16, gap: 8, alignItems: "center", paddingBottom: 8 },
  stepTab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER },
  stepTabText: { fontSize: 13, color: MUTED, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  stepContent: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  stepHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 8 },
  stepNum: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 20, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  stepTitle: { fontSize: 17, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  stepSubtitle: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  stepNav: { flexDirection: "row", justifyContent: "space-between", paddingTop: 16 },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER },
  navBtnText: { fontSize: 13, color: ACCENT, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
});

const bl = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, gap: 8, borderWidth: 1 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  text: { fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 21 },
  source: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular", fontStyle: "italic" as const },
});

const rc = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 24 },
  close: { position: "absolute", top: 56, right: 24, padding: 8, zIndex: 10 },
  card: { width: "100%", backgroundColor: "#0a1020", borderRadius: 20, padding: 32, borderWidth: 2, gap: 16, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800" as const, fontFamily: "Inter_700Bold", textAlign: "center" as const, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center" as const },
  divider: { height: 2, width: "60%", borderRadius: 1, marginVertical: 4 },
  body: { fontSize: 18, color: TEXT, fontFamily: "Inter_700Bold", fontWeight: "700" as const, textAlign: "center" as const, lineHeight: 28 },
  tip: { marginTop: 20, fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center" as const },
  cardNav: { flexDirection: "row", gap: 10, marginTop: 12 },
  cardDot: { width: 10, height: 10, borderRadius: 5 },
});
