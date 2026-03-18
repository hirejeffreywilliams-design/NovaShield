import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInRight, FadeInLeft, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const BG = "#0D1B2A";
const ACCENT = "#E53935";
const SAY_COLOR = "#22c55e";
const DEMAND_COLOR = "#3b82f6";
const ASSERT_COLOR = "#f59e0b";
const RECORD_COLOR = "#8b5cf6";
const CARD_BG = "#1a2a3a";
const BORDER = "#243447";
const TEXT = "#F0F4F8";
const MUTED = "#8a9bb0";

type BlockType = "say" | "demand" | "assert" | "record" | "info" | "warning";

interface ScriptBlock {
  type: BlockType;
  label: string;
  text: string;
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
  say:     { color: SAY_COLOR,    icon: "message-circle", bg: "#22c55e18" },
  demand:  { color: DEMAND_COLOR, icon: "shield",         bg: "#3b82f618" },
  assert:  { color: ASSERT_COLOR, icon: "alert-triangle", bg: "#f59e0b18" },
  record:  { color: RECORD_COLOR, icon: "edit-3",         bg: "#8b5cf618" },
  info:    { color: MUTED,        icon: "info",           bg: "#ffffff10" },
  warning: { color: ACCENT,       icon: "zap",            bg: "#E5393518" },
};

const SCENARIOS: Scenario[] = [
  {
    id: "traffic_stop",
    title: "Traffic Stop",
    icon: "truck",
    color: "#f59e0b",
    tagline: "Pulled over by police",
    steps: [
      {
        title: "Pull Over & Secure",
        subtitle: "Before any interaction begins",
        blocks: [
          { type: "info", label: "DO THIS FIRST", text: "Pull over safely and completely. Turn off the engine. Turn on interior lights if it's dark. Keep both hands visible on the steering wheel. Do NOT reach for anything." },
          { type: "warning", label: "CRITICAL", text: "Do NOT reach into the glove box or anywhere else until asked and you've told the officer what you're doing." },
          { type: "say", label: "IF THEY APPROACH", text: "\"Good [morning/evening], officer.\"" },
          { type: "record", label: "IMMEDIATELY NOTE", text: "Squad car number on the vehicle. Time and exact location. Number of officers present." },
        ],
      },
      {
        title: "Get Officer's Identity",
        subtitle: "Before you answer anything — flip the script",
        blocks: [
          { type: "demand", label: "DEMAND FIRST", text: "\"Officer, may I have your name and badge number for my records, please?\"" },
          { type: "demand", label: "ALSO ASK", text: "\"What department are you with?\"" },
          { type: "info", label: "YOUR RIGHT", text: "In all U.S. jurisdictions, on-duty police officers are required to identify themselves by name and badge number when requested. This is public information." },
          { type: "record", label: "WRITE DOWN", text: "Name · Badge Number · Department · Patrol Car # · Time · Location" },
        ],
      },
      {
        title: "Find Out Why They Stopped You",
        subtitle: "You have a right to know",
        blocks: [
          { type: "demand", label: "DEMAND THE REASON", text: "\"Officer, what is the specific legal basis for this traffic stop? What violation are you alleging?\"" },
          { type: "info", label: "THE LAW", text: "Under the 4th Amendment, a traffic stop is a seizure. Police must have reasonable articulable suspicion of a specific traffic violation or crime. A hunch is not enough." },
          { type: "assert", label: "ASSERT THIS", text: "\"I am exercising my right to know the legal basis for this stop under the Fourth Amendment.\"" },
          { type: "record", label: "NOTE THEIR ANSWER", text: "Write down exactly what they say the reason is — word for word." },
        ],
      },
      {
        title: "Documents — What You Must Provide",
        subtitle: "Only these three things — nothing more",
        blocks: [
          { type: "say", label: "SAY THIS", text: "\"I am providing my license, registration, and proof of insurance as required by law.\"" },
          { type: "assert", label: "THEN IMMEDIATELY ASSERT", text: "\"Beyond these documents, I am asserting my right to remain silent under the Fifth Amendment of the U.S. Constitution.\"" },
          { type: "warning", label: "DO NOT ANSWER THESE", text: "\"Where are you going?\" · \"Where are you coming from?\" · \"Have you been drinking?\" · \"Do you have anything in the car?\" — You are not required to answer any of these questions." },
          { type: "say", label: "IF THEY PRESS YOU", text: "\"I am respectfully declining to answer questions beyond providing the required documents. I am asserting my Fifth Amendment right to remain silent.\"" },
        ],
      },
      {
        title: "If They Ask to Search",
        subtitle: "Your 4th Amendment right — use it",
        blocks: [
          { type: "assert", label: "ALWAYS SAY THIS CLEARLY", text: "\"I do not consent to any search of my vehicle, my belongings, or my person.\"" },
          { type: "demand", label: "DEMAND THIS", text: "\"Do you have a search warrant signed by a judge?\"" },
          { type: "warning", label: "IF THEY CLAIM PROBABLE CAUSE", text: "You CANNOT physically stop the search. But say out loud: \"I am noting for the record that I do not consent to this search.\" This preserves your legal challenge in court." },
          { type: "info", label: "THE LAW", text: "4th Amendment: Police need a warrant, your consent, or specific probable cause to search. Your refusal alone is not probable cause. Source: law.cornell.edu/constitution/fourth_amendment" },
        ],
      },
      {
        title: "Are You Free to Go?",
        subtitle: "The most important question you can ask",
        blocks: [
          { type: "demand", label: "THE KEY QUESTION", text: "\"Am I being detained, or am I free to go?\"" },
          { type: "info", label: "IF THEY SAY YOU'RE FREE", text: "Calmly say \"Thank you\" and leave. Do not linger. Do not argue." },
          { type: "demand", label: "IF THEY SAY YOU'RE DETAINED", text: "\"What is the specific legal basis for my continued detention? What crime am I suspected of?\"" },
          { type: "say", label: "IF YOU GET A TICKET", text: "Accept it calmly. Do not argue. You can contest it in court. Say: \"I am accepting this but I do not agree with it.\"" },
        ],
      },
    ],
  },
  {
    id: "pedestrian_stop",
    title: "Pedestrian Stop",
    icon: "user",
    color: "#3b82f6",
    tagline: "Stopped on the street",
    steps: [
      {
        title: "First Question — Every Time",
        subtitle: "Ask this before doing or saying anything else",
        blocks: [
          { type: "demand", label: "ASK IMMEDIATELY", text: "\"Am I being detained, or am I free to go?\"" },
          { type: "info", label: "IF YOU'RE FREE TO GO", text: "Walk away calmly. You have zero legal obligation to stop, answer questions, or explain yourself if you are not being detained." },
          { type: "info", label: "IF YOU'RE BEING DETAINED", text: "Continue to the next steps. A detention means they have \"reasonable articulable suspicion\" of a specific crime — not just a hunch." },
          { type: "record", label: "IMMEDIATELY NOTE", text: "Officer description · Badge # · Time · Location · What you were doing when stopped" },
        ],
      },
      {
        title: "Get Their Identity",
        subtitle: "Officers must identify themselves",
        blocks: [
          { type: "demand", label: "DEMAND THIS", text: "\"Officer, please provide your name and badge number.\"" },
          { type: "demand", label: "AND ASK", text: "\"What department are you with?\"" },
          { type: "demand", label: "DEMAND THE REASON", text: "\"What is your reasonable articulable suspicion for stopping me? What specific facts justify this detention?\"" },
          { type: "info", label: "THE LAW", text: "Terry v. Ohio, 392 U.S. 1 (1968): Officers may briefly detain a person for investigation if they have reasonable articulable suspicion — not a vague feeling, but specific articulable facts." },
        ],
      },
      {
        title: "The ID Question",
        subtitle: "Know your state's law — it varies",
        blocks: [
          { type: "info", label: "STOP-AND-IDENTIFY STATES", text: "28 states have laws that may require you to give your NAME (and sometimes ID) when lawfully detained. Your state matters here — check your Rights tab." },
          { type: "say", label: "IN A STOP-AND-IDENTIFY STATE", text: "\"I will provide my name as required by [State] law. Beyond that, I am asserting my right to remain silent.\"" },
          { type: "assert", label: "IN ANY STATE", text: "\"I am not required to provide any information beyond what state law specifically mandates. I am asserting my Fifth Amendment right to remain silent.\"" },
          { type: "demand", label: "DEMAND CLARIFICATION", text: "\"What specific state law requires me to provide identification in this circumstance?\"" },
        ],
      },
      {
        title: "Assert Your Rights Clearly",
        subtitle: "Say these out loud — they matter on tape",
        blocks: [
          { type: "assert", label: "RIGHT TO REMAIN SILENT", text: "\"I am invoking my right to remain silent under the Fifth Amendment.\"" },
          { type: "assert", label: "RIGHT AGAINST SEARCH", text: "\"I do not consent to any search of my person or belongings.\"" },
          { type: "assert", label: "RIGHT TO RECORD", text: "\"I am exercising my First Amendment right to record this interaction.\"" },
          { type: "warning", label: "FRISK / PAT-DOWN", text: "If they try to pat you down: say \"I do not consent to this search.\" They can only frisk for weapons if they have reason to believe you're armed — not just to look for contraband." },
        ],
      },
      {
        title: "Stay Calm & Document",
        subtitle: "Composure is your superpower",
        blocks: [
          { type: "info", label: "DEMEANOR", text: "Stay calm, keep your hands visible, do not raise your voice. Your calm composure makes their conduct clearly visible on any recording." },
          { type: "say", label: "IF ASKED PERSONAL QUESTIONS", text: "\"I am respectfully declining to answer. I am asserting my right to remain silent.\"" },
          { type: "record", label: "DOCUMENT EVERYTHING", text: "Badge # · Name · Patrol # · Time · Location · What was said · Any witnesses present" },
          { type: "demand", label: "BEFORE THEY LEAVE", text: "\"Officer, I am filing a record of this encounter. May I have your supervisor's name and how to file a formal complaint?\"" },
        ],
      },
    ],
  },
  {
    id: "home_entry",
    title: "Home Entry",
    icon: "home",
    color: "#8b5cf6",
    tagline: "Police at your door",
    steps: [
      {
        title: "Do NOT Open the Door",
        subtitle: "Your home is your strongest protection",
        blocks: [
          { type: "warning", label: "CRITICAL RULE", text: "You have NO obligation to open your door for police without a warrant. Your home is protected by the 4th Amendment more than anywhere else." },
          { type: "info", label: "SPEAK THROUGH THE DOOR", text: "You can talk to police without opening the door. Many doors allow sound to pass through." },
          { type: "say", label: "SAY THIS THROUGH THE DOOR", text: "\"Who is there?\" (Wait for answer.) \"What is the purpose of your visit?\"" },
          { type: "assert", label: "THEN ASSERT", text: "\"I do not consent to entry into my home.\"" },
        ],
      },
      {
        title: "Demand the Warrant",
        subtitle: "The single most important question",
        blocks: [
          { type: "demand", label: "DEMAND IMMEDIATELY", text: "\"Do you have a warrant signed by a judge to enter this property?\"" },
          { type: "info", label: "IF THEY SAY YES", text: "\"Please slide the warrant under the door, or hold it up to the window so I can read the full document before I open this door.\"" },
          { type: "say", label: "WHILE REVIEWING", text: "\"I am reviewing this warrant.\" Take your time. Check: Is it signed by a judge? Does it have the correct address? What specifically does it authorize?" },
          { type: "info", label: "IF THEY SAY NO WARRANT", text: "\"Then I do not consent to entry. I am asserting my Fourth Amendment rights. If you enter without consent or a warrant, it may be an unlawful search.\"" },
        ],
      },
      {
        title: "If They Have a Warrant",
        subtitle: "Know the limits of what it covers",
        blocks: [
          { type: "assert", label: "SAY THIS AS THEY ENTER", text: "\"I do not consent to any search or seizure beyond the specific scope authorized by this warrant.\"" },
          { type: "demand", label: "ASK EVERY OFFICER", text: "\"Officer, your name and badge number, please.\"" },
          { type: "info", label: "YOUR RIGHTS DURING THE SEARCH", text: "A warrant authorizes a specific search — not unlimited access. If they go beyond the warrant's scope, state: \"That is outside the scope of your warrant. I do not consent.\"" },
          { type: "say", label: "DO NOT HELP THEM", text: "\"I am not going to assist with or facilitate this search.\" You are not required to help police search your home." },
        ],
      },
      {
        title: "Emergency Exceptions — Know Them",
        subtitle: "When they can enter without a warrant",
        blocks: [
          { type: "info", label: "LEGAL EXCEPTIONS TO KNOW", text: "Courts allow warrantless entry in: (1) Hot pursuit of a fleeing suspect, (2) An emergency threatening life, (3) Imminent destruction of evidence. These are narrow — not excuses for general searches." },
          { type: "warning", label: "IF THEY FORCE ENTRY", text: "Do NOT physically resist. It is dangerous and may result in charges against you. Say out loud: \"I do not consent to this entry. I am asserting my Fourth Amendment rights. I am recording this.\"" },
          { type: "assert", label: "STATE THIS CLEARLY", text: "\"I am not resisting. I am complying under protest. I do not consent to this entry.\"" },
          { type: "info", label: "UNLAWFUL ENTRY = CIVIL LAWSUIT", text: "Warrantless entry without a legal exception violates the 4th Amendment and may form the basis for a civil rights lawsuit under 42 U.S.C. § 1983." },
        ],
      },
      {
        title: "Invoke Counsel — Immediately",
        subtitle: "Your most powerful protection",
        blocks: [
          { type: "assert", label: "SAY THIS IMMEDIATELY", text: "\"I am exercising my right to counsel. I will not answer any questions or make any statements without my attorney present.\"" },
          { type: "assert", label: "REPEAT IF PRESSED", text: "\"I have nothing further to say. I am waiting for my attorney.\"" },
          { type: "info", label: "AFTER THEY LEAVE", text: "Document everything immediately: how many officers, badge numbers, exactly what they searched, what they took, exact time of entry and exit." },
          { type: "record", label: "DOCUMENT IN APP", text: "Start an incident record immediately after. Note: warrant number if shown · all officer names and badge numbers · scope of search · what was seized." },
        ],
      },
    ],
  },
  {
    id: "arrest",
    title: "Being Arrested",
    icon: "alert-circle",
    color: "#ef4444",
    tagline: "If you are placed under arrest",
    steps: [
      {
        title: "Do NOT Resist — Ever",
        subtitle: "The courtroom is where you fight this, not the street",
        blocks: [
          { type: "warning", label: "CRITICAL — READ THIS FIRST", text: "Even if the arrest is completely unlawful — do NOT physically resist. Resisting creates additional charges and is physically dangerous. You fight an unlawful arrest through the legal system, not on the street." },
          { type: "say", label: "STATE THIS OUT LOUD", text: "\"I am not resisting. I am complying with this arrest.\"" },
          { type: "info", label: "WHY THIS MATTERS", text: "Saying this on recording establishes clearly that you are complying. Any force used after this statement may be excessive force." },
          { type: "demand", label: "FIND OUT WHY", text: "\"Officer, what am I being arrested for? What is the charge?\"" },
        ],
      },
      {
        title: "Invoke Your Rights — Immediately",
        subtitle: "These two sentences are your most powerful tools",
        blocks: [
          { type: "assert", label: "RIGHT TO REMAIN SILENT", text: "\"I am invoking my right to remain silent under the Fifth Amendment.\"" },
          { type: "assert", label: "RIGHT TO AN ATTORNEY", text: "\"I am invoking my Sixth Amendment right to an attorney. I will not answer any questions without my attorney present.\"" },
          { type: "warning", label: "AFTER THIS — STOP TALKING", text: "Do not try to explain yourself. Do not try to talk your way out. Do not answer \"just a few questions.\" Every word you say without an attorney can be used against you." },
          { type: "info", label: "THE LAW", text: "Miranda v. Arizona, 384 U.S. 436 (1966): You have the right to remain silent and the right to an attorney. These rights do not expire. You can invoke them at any time." },
        ],
      },
      {
        title: "At the Station",
        subtitle: "Two sentences only — repeat as needed",
        blocks: [
          { type: "say", label: "YOUR ONLY RESPONSE TO ANY QUESTION", text: "\"I am invoking my right to remain silent and my right to an attorney. I have nothing further to say.\"" },
          { type: "warning", label: "THEY MAY KEEP ASKING", text: "Police may ask you questions in a friendly way, tell you it will go better if you talk, or suggest your silence looks guilty. These are interrogation tactics. Say only: \"I want my attorney.\"" },
          { type: "demand", label: "YOUR ONE PHONE CALL", text: "\"I am requesting my phone call to contact an attorney.\"" },
          { type: "info", label: "EMERGENCY NUMBERS", text: "National Lawyers Guild: (212) 679-5100\nACLU: aclu.org/get-help\nPublic Defender: request one immediately if you cannot afford an attorney" },
        ],
      },
      {
        title: "Document Everything You Can",
        subtitle: "Memory fades — record as much as possible",
        blocks: [
          { type: "record", label: "MEMORIZE OR NOTE", text: "All officer names and badge numbers · Time and location of arrest · Exact words said to you · Any force used · Witnesses present · What you were doing when arrested" },
          { type: "assert", label: "IF FORCE IS USED", text: "\"This force is excessive. I am not resisting.\" State this out loud even if injured." },
          { type: "info", label: "AFTER RELEASE", text: "Document everything immediately while fresh. File the incident in this app. Photograph any injuries. Contact an attorney within 24 hours." },
          { type: "info", label: "TIME LIMITS MATTER", text: "Civil rights lawsuits under 42 U.S.C. § 1983 typically have a 2-year statute of limitations. File complaints promptly. The sooner you document, the stronger your case." },
        ],
      },
    ],
  },
  {
    id: "recording",
    title: "Recording Police",
    icon: "video",
    color: "#22c55e",
    tagline: "Filming officers in public",
    steps: [
      {
        title: "Assert Your Right — Out Loud",
        subtitle: "Say this clearly at the start",
        blocks: [
          { type: "assert", label: "STATE THIS IMMEDIATELY", text: "\"I am recording this interaction. Recording police in public is my First Amendment constitutional right.\"" },
          { type: "info", label: "THE LAW", text: "Every U.S. Circuit Court of Appeals that has addressed this issue has held that there is a First Amendment right to record police in public. This is established law." },
          { type: "say", label: "IF THEY SEEM UNCERTAIN", text: "\"Officer, courts including the First, Third, Fifth, Seventh, Ninth, and Eleventh Circuits have held this is a protected constitutional right.\"" },
          { type: "record", label: "WHILE RECORDING", text: "State the date, time, location, and officer badge number out loud so it's captured on video." },
        ],
      },
      {
        title: "If They Order You to Stop",
        subtitle: "Know your rights — stand firm calmly",
        blocks: [
          { type: "assert", label: "SAY THIS", text: "\"Officer, with respect, I am not obstructing your duties. Recording police in a public space is a constitutionally protected activity. I will not stop recording.\"" },
          { type: "info", label: "THE LIMIT", text: "You must not physically interfere with an officer's duties. Keep a reasonable distance. You do not have to be within arm's reach of an incident to record it." },
          { type: "demand", label: "IF THEY PERSIST", text: "\"Under what specific law or statute are you ordering me to stop recording?\"" },
          { type: "info", label: "IMPORTANT", text: "Discomfort is not a legal basis to order you to stop recording. They must point to a specific law — and generally there is none that prohibits public recording." },
        ],
      },
      {
        title: "If They Try to Take Your Phone",
        subtitle: "Your phone is protected by the 4th Amendment",
        blocks: [
          { type: "assert", label: "SAY THIS CLEARLY", text: "\"I do not consent to you taking or searching my phone.\"" },
          { type: "demand", label: "DEMAND THIS", text: "\"Do you have a warrant signed by a judge to seize my phone?\"" },
          { type: "info", label: "CONTROLLING CASE LAW", text: "Riley v. California, 573 U.S. 373 (2014) — U.S. Supreme Court unanimously held that police generally need a warrant to search a cell phone, even after arrest." },
          { type: "say", label: "CITE THE CASE", text: "\"The Supreme Court held in Riley v. California that a warrant is required to search a cell phone. I am asserting that right.\"" },
        ],
      },
      {
        title: "Back Up & Protect Your Footage",
        subtitle: "Make your evidence impossible to destroy",
        blocks: [
          { type: "info", label: "CLOUD BACKUP", text: "Enable automatic cloud backup (iCloud, Google Photos) before recording. This way even if your phone is seized, footage is preserved." },
          { type: "info", label: "SHARE IN REAL TIME", text: "Text or AirDrop footage to a trusted contact during the interaction. Once it's on another device, it's protected." },
          { type: "say", label: "IF FOOTAGE IS DELETED", text: "This may constitute evidence tampering. Document it: \"Officer [name/badge] deleted footage from my device at [time].\" File a report immediately." },
          { type: "record", label: "IN THIS APP", text: "Add to your incident record: video hash or confirmation it was saved, officer who tried to stop recording, any deletion or attempted deletion." },
        ],
      },
    ],
  },
  {
    id: "vehicle_search",
    title: "Vehicle Search",
    icon: "search",
    color: "#f97316",
    tagline: "Police want to search your car",
    steps: [
      {
        title: "Refuse Clearly — Every Time",
        subtitle: "Say this calmly and firmly",
        blocks: [
          { type: "assert", label: "YOUR OPENING STATEMENT", text: "\"Officer, I do not consent to a search of my vehicle, my belongings, or my person.\"" },
          { type: "info", label: "WHY THIS MATTERS", text: "Consent is one of the few ways police can legally search without a warrant. By clearly refusing, you eliminate that option and preserve your constitutional rights." },
          { type: "say", label: "IF ASKED AGAIN", text: "\"I understand your request, but I do not consent to this search.\" Repeat calmly as many times as needed." },
          { type: "warning", label: "DO NOT EXPLAIN OR NEGOTIATE", text: "Do not say \"I have nothing to hide\" — this may be interpreted as consent. Simply repeat: \"I do not consent to this search.\"" },
        ],
      },
      {
        title: "Demand the Legal Basis",
        subtitle: "Make them explain themselves",
        blocks: [
          { type: "demand", label: "DEMAND THIS", text: "\"Do you have a search warrant signed by a judge for my vehicle?\"" },
          { type: "demand", label: "IF NO WARRANT", text: "\"What is your specific probable cause for searching my vehicle? What specific facts give you probable cause?\"" },
          { type: "info", label: "WHAT IS PROBABLE CAUSE?", text: "Probable cause requires specific, articulable facts — not a general suspicion. Factors like nervousness, air freshener smell, or being in a \"high crime area\" alone do NOT constitute probable cause." },
          { type: "assert", label: "IF THEY CLAIM PLAIN VIEW", text: "\"What specifically did you see in plain view that constitutes probable cause? I am noting your answer for the record.\"" },
        ],
      },
      {
        title: "If They Search Anyway",
        subtitle: "You cannot physically stop it — but you can protect your rights",
        blocks: [
          { type: "warning", label: "DO NOT PHYSICALLY RESIST", text: "If they proceed with a claimed probable cause or warrant, do NOT physically interfere. This creates danger and additional charges." },
          { type: "assert", label: "SAY OUT LOUD AND ON RECORD", text: "\"I am noting for the record that I do not consent to this search. I am preserving my Fourth Amendment rights to challenge this search in court.\"" },
          { type: "info", label: "WHY SAYING THIS MATTERS", text: "A court can only suppress evidence from an unlawful search if you have not consented. Your on-record refusal is what makes suppression possible." },
          { type: "info", label: "ARIZONA v. GANT (2009)", text: "Arizona v. Gant, 556 U.S. 332 (2009) — Supreme Court limited vehicle searches incident to arrest. Police cannot search a vehicle just because they arrested the driver." },
        ],
      },
      {
        title: "Do NOT Help Them",
        subtitle: "You have zero obligation to assist",
        blocks: [
          { type: "say", label: "IF ASKED TO OPEN THINGS", text: "\"I am not going to assist with a search I have not consented to.\"" },
          { type: "say", label: "IF ASKED WHERE THINGS ARE", text: "\"I am asserting my right to remain silent.\"" },
          { type: "info", label: "WHAT YOU DON'T HAVE TO DO", text: "You do not have to unlock your trunk. You do not have to open the glove box. You do not have to move items. You do not have to tell them where anything is located." },
          { type: "record", label: "DOCUMENT DURING THE SEARCH", text: "What areas they searched · What they touched or moved · What they removed or photographed · Exact time start and end · Every officer badge number present" },
        ],
      },
      {
        title: "After the Search",
        subtitle: "Document everything while it's fresh",
        blocks: [
          { type: "record", label: "DOCUMENT IMMEDIATELY", text: "What exactly was searched · What (if anything) was found or seized · What you said and what they said · Any damage to your vehicle · All officer names and badge numbers" },
          { type: "info", label: "IF NOTHING WAS FOUND", text: "An unlawful vehicle search — even when nothing is found — may be actionable as a civil rights violation. The violation is the unlawful search itself, not what was found." },
          { type: "info", label: "YOUR LEGAL OPTIONS", text: "File a formal complaint with the department · Contact the ACLU · Consult a civil rights attorney · A suppression motion can exclude illegally obtained evidence in any prosecution" },
          { type: "demand", label: "BEFORE THEY LEAVE", text: "\"Officer, I am requesting your name, badge number, and the case or incident report number for this stop.\"" },
        ],
      },
    ],
  },
];

function BlockCard({ block }: { block: ScriptBlock }) {
  const meta = BLOCK_META[block.type];
  const labelMap: Record<BlockType, string> = {
    say: "SAY THIS",
    demand: "DEMAND THIS",
    assert: "ASSERT THIS",
    record: "RECORD THIS",
    info: "KNOW THIS",
    warning: "IMPORTANT",
  };

  return (
    <View style={[s.block, { backgroundColor: meta.bg, borderLeftColor: meta.color, borderLeftWidth: 3 }]}>
      <View style={s.blockHeader}>
        <Feather name={meta.icon as any} size={13} color={meta.color} />
        <Text style={[s.blockLabel, { color: meta.color }]}>{block.label || labelMap[block.type]}</Text>
      </View>
      <Text style={[s.blockText, block.type === "say" || block.type === "demand" || block.type === "assert" ? s.blockTextBold : null]}>
        {block.text}
      </Text>
    </View>
  );
}

function ShowOfficerCard({ onClose }: { onClose: () => void }) {
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={s.officerCardScreen}>
        <Pressable style={s.officerCardClose} onPress={onClose}>
          <Feather name="x" size={28} color="#333" />
        </Pressable>
        <View style={s.officerCardContent}>
          <Text style={s.officerCardTitle}>PLEASE PROVIDE</Text>
          <View style={s.officerCardDivider} />
          {[
            "Full Legal Name",
            "Badge Number",
            "Department / Agency",
            "Reason for This Stop",
            "Supervisor's Name",
          ].map((item, i) => (
            <View key={i} style={s.officerCardItem}>
              <View style={s.officerCardBullet} />
              <Text style={s.officerCardItemText}>{item}</Text>
            </View>
          ))}
          <View style={s.officerCardDivider} />
          <Text style={s.officerCardNote}>
            I am exercising my constitutional rights.{"\n"}This interaction is being recorded.
          </Text>
          <Text style={s.officerCardLaw}>
            4th · 5th · 6th Amendment | U.S. Constitution
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export default function EncounterScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 20;

  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOfficerCard, setShowOfficerCard] = useState(false);
  const [direction, setDirection] = useState<"right" | "left">("right");

  const steps = selectedScenario.steps;
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const goNext = useCallback(() => {
    if (!isLast) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDirection("right");
      setCurrentStep((s) => s + 1);
    }
  }, [isLast]);

  const goPrev = useCallback(() => {
    if (!isFirst) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDirection("left");
      setCurrentStep((s) => s - 1);
    }
  }, [isFirst]);

  const selectScenario = useCallback((s: Scenario) => {
    Haptics.selectionAsync();
    setSelectedScenario(s);
    setCurrentStep(0);
  }, []);

  const handleShowOfficerCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowOfficerCard(true);
  }, []);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {showOfficerCard && <ShowOfficerCard onClose={() => setShowOfficerCard(false)} />}

      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Encounter Mode</Text>
          <Text style={s.headerSub}>Your rights · Your script</Text>
        </View>
        <Pressable style={s.showOfficerBtn} onPress={handleShowOfficerCard}>
          <Feather name="eye" size={13} color="#fff" />
          <Text style={s.showOfficerBtnText}>Show Officer</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scenarioScroll} contentContainerStyle={s.scenarioScrollContent}>
        {SCENARIOS.map((sc) => (
          <Pressable
            key={sc.id}
            style={[s.scenarioChip, selectedScenario.id === sc.id && { backgroundColor: sc.color + "22", borderColor: sc.color }]}
            onPress={() => selectScenario(sc)}
          >
            <Feather name={sc.icon as any} size={13} color={selectedScenario.id === sc.id ? sc.color : MUTED} />
            <Text style={[s.scenarioChipText, selectedScenario.id === sc.id && { color: sc.color }]}>{sc.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.progressRow}>
        {steps.map((_, i) => (
          <Pressable
            key={i}
            style={[s.progressDot, i === currentStep && { backgroundColor: selectedScenario.color, width: 20 }, i < currentStep && { backgroundColor: selectedScenario.color + "60" }]}
            onPress={() => { setDirection(i > currentStep ? "right" : "left"); setCurrentStep(i); }}
          />
        ))}
        <Text style={s.progressLabel}>Step {currentStep + 1} of {steps.length}</Text>
      </View>

      <Animated.View key={`${selectedScenario.id}-${currentStep}`} entering={direction === "right" ? FadeInRight.duration(220) : FadeInLeft.duration(220)} style={{ flex: 1 }}>
        <ScrollView style={s.stepScroll} contentContainerStyle={[s.stepContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
          <View style={[s.stepTitleRow, { borderLeftColor: selectedScenario.color }]}>
            <Text style={s.stepNumber}>STEP {currentStep + 1}</Text>
            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.stepSubtitle}>{step.subtitle}</Text>
          </View>

          {step.blocks.map((block, i) => (
            <BlockCard key={i} block={block} />
          ))}
        </ScrollView>
      </Animated.View>

      <View style={[s.navRow, { paddingBottom: bottomPad }]}>
        <Pressable
          style={[s.navBtn, isFirst && s.navBtnDisabled]}
          onPress={goPrev}
          disabled={isFirst}
        >
          <Feather name="arrow-left" size={20} color={isFirst ? MUTED : TEXT} />
          <Text style={[s.navBtnText, isFirst && { color: MUTED }]}>Previous</Text>
        </Pressable>

        <Pressable style={s.officerCardQuickBtn} onPress={handleShowOfficerCard}>
          <Feather name="eye" size={16} color={TEXT} />
          <Text style={s.officerCardQuickText}>Show Officer</Text>
        </Pressable>

        <Pressable
          style={[s.navBtn, s.navBtnNext, isLast && { backgroundColor: "#22c55e22", borderColor: "#22c55e" }]}
          onPress={isLast ? () => router.back() : goNext}
        >
          <Text style={[s.navBtnText, { color: isLast ? "#22c55e" : TEXT }]}>
            {isLast ? "Done" : "Next"}
          </Text>
          <Feather name={isLast ? "check" : "arrow-right"} size={20} color={isLast ? "#22c55e" : TEXT} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 10,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },
  showOfficerBtn: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  showOfficerBtnText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  scenarioScroll: { maxHeight: 44, flexGrow: 0 },
  scenarioScrollContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  scenarioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  scenarioChipText: { fontSize: 12, color: MUTED, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BORDER },
  progressLabel: { marginLeft: "auto" as any, fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },
  stepScroll: { flex: 1 },
  stepContent: { paddingHorizontal: 16, gap: 12 },
  stepTitleRow: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    marginBottom: 4,
    gap: 3,
  },
  stepNumber: { fontSize: 10, fontWeight: "700" as const, color: MUTED, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  stepTitle: { fontSize: 22, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold", lineHeight: 28 },
  stepSubtitle: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", marginTop: 2 },
  block: { borderRadius: 12, padding: 14, gap: 8 },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  blockLabel: { fontSize: 11, fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  blockText: { fontSize: 15, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 23 },
  blockTextBold: { fontFamily: "Inter_600SemiBold", fontWeight: "600" as const, fontSize: 16, lineHeight: 24 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD_BG,
  },
  navBtnNext: { backgroundColor: "#1a2a3a", borderColor: BORDER },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 15, fontWeight: "600" as const, color: TEXT, fontFamily: "Inter_600SemiBold" },
  officerCardQuickBtn: {
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT + "44",
    backgroundColor: ACCENT + "18",
  },
  officerCardQuickText: { fontSize: 10, color: TEXT, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  officerCardScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  officerCardClose: {
    position: "absolute" as const,
    top: 60,
    right: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  officerCardContent: {
    width: "100%",
    gap: 16,
  },
  officerCardTitle: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#111",
    fontFamily: "Inter_700Bold",
    textAlign: "center" as const,
    letterSpacing: 2,
  },
  officerCardDivider: {
    height: 2,
    backgroundColor: "#e5e7eb",
    borderRadius: 1,
  },
  officerCardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 6,
  },
  officerCardBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
  },
  officerCardItemText: {
    fontSize: 26,
    fontWeight: "600" as const,
    color: "#111",
    fontFamily: "Inter_600SemiBold",
  },
  officerCardNote: {
    fontSize: 18,
    color: "#374151",
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    lineHeight: 28,
  },
  officerCardLaw: {
    fontSize: 14,
    color: "#9ca3af",
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    letterSpacing: 1,
  },
});
