import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");
const BG      = "#0a1020";
const CARD_BG = "#0d1a2a";
const BORDER  = "#1a2e40";
const TEXT    = "#F0F4F8";
const MUTED   = "#7a9ab8";
const AMBER   = "#f59e0b";
const RED     = "#ef4444";
const BLUE    = "#3b82f6";
const GREEN   = "#22c55e";
const PURPLE  = "#8b5cf6";
const CYAN    = "#0891b2";
const ROSE    = "#f43f5e";
const INDIGO  = "#6366f1";

interface ReportingStep {
  agency: string;
  phone?: string;
  url: string;
  description: string;
}

interface CorruptionCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  tagline: string;
  what: string;
  examples: string[];
  howToDocument: string[];
  legalBasis: string;
  reportingSteps: ReportingStep[];
  whistleblowerNote: string;
}

const CATEGORIES: CorruptionCategory[] = [
  {
    id: "dereliction",
    title: "Dereliction of Duty",
    icon: "moon",
    color: AMBER,
    tagline: "Sleeping on shift, skipping calls, abandoning post",
    what: "Officers who are paid by your tax dollars but routinely skip their responsibilities — sleeping in cars during shifts, parking in lots for hours, abandoning patrol areas, ignoring calls for service, or spending work time on personal business. This is theft from the public.",
    examples: [
      "Officer parked in a secluded lot sleeping while on duty",
      "Unit repeatedly not responding to non-emergency calls",
      "Officer using patrol vehicle for personal errands",
      "Extended unauthorized breaks during shift",
      "Officers socializing at non-work locations for hours",
    ],
    howToDocument: [
      "Record video with timestamp clearly showing officer, badge number, and unit number",
      "Note exact GPS location — compare to the officer's assigned patrol zone",
      "Record the duration — longer is more damning. Timestamps in video metadata are evidence",
      "If you see them repeatedly, build a log: date, time, location, duration, unit number",
      "Screenshot any city or county open data showing 911 response times vs that unit's area",
      "Your phone's GPS metadata on photos is automatically evidence of location and time",
    ],
    legalBasis: "Officers are paid public employees bound by department policy and public trust. Tax-funded positions require performance of assigned duties. Systematic dereliction can constitute civil service violations, breach of employment contract, and in extreme cases criminal neglect of duty.",
    reportingSteps: [
      { agency: "Internal Affairs / Professional Standards", url: "https://www.nacole.org/find_your_local_oversight_body", description: "File directly with the department's Internal Affairs unit. Request written acknowledgment. Departments must investigate credible complaints against their officers." },
      { agency: "City/County Inspector General", url: "https://www.ignet.gov/content/find-your-inspector-general", description: "Most cities and counties have an Inspector General office that audits government employee performance and investigates waste and misconduct." },
      { agency: "Local Civilian Oversight Board", url: "https://www.nacole.org/find_your_local_oversight_body", description: "Civilian review boards have independent authority to investigate and discipline officers. Your complaint goes on record even if IA dismisses it." },
      { agency: "City Council / Elected Officials", url: "https://www.usa.gov/local-governments", description: "Contact your city council representative. They control the police department budget and respond to constituent complaints about officer conduct." },
      { agency: "State Attorney General", url: "https://www.naag.org/find-my-ag", description: "State AGs investigate systemic misconduct and can audit police department performance and disciplinary records." },
      { agency: "Local News Investigative Desk", url: "https://www.propublica.org/tips", description: "Local investigative journalists (TV station I-teams, newspapers) have resources to FOIA records and amplify patterns you've documented." },
    ],
    whistleblowerNote: "You have a First Amendment right to record government employees in public while performing public duties. This includes recording officers in their patrol vehicles while on duty. Attempting to record public officials in public spaces is constitutionally protected activity.",
  },
  {
    id: "excessive_force",
    title: "Excessive Force & Cover-Up",
    icon: "alert-octagon",
    color: RED,
    tagline: "Brutality, false reports, and command-level cover-ups",
    what: "Officers using force beyond what any situation requires, then writing false reports to justify it — or supervisors and fellow officers covering it up. This is the most documented form of police corruption and the most dangerous to communities.",
    examples: [
      "Officer beats handcuffed or compliant suspect",
      "Fellow officers present who do nothing and later claim 'didn't see'",
      "Police report says 'resisted' when video shows compliance",
      "Supervisor approves use of force report without investigation",
      "Body camera conveniently 'not working' during incident",
      "Officer report contradicts multiple civilian witness accounts",
    ],
    howToDocument: [
      "Record immediately — audio and video from a safe distance (you do NOT need to be close)",
      "Get the full badge number, name tag, and unit identifier of EVERY officer present",
      "Photograph any injuries to the person immediately — document bruising before it changes",
      "Get contact info from witnesses immediately — before police take their statements",
      "Request body camera footage within 24 hours via written FOIA request",
      "Request ambulance/EMT records — they document injuries independently",
      "Keep any clothing worn by the subject — do not wash, it may have DNA or evidence",
      "File a complaint the same day — timestamps matter legally",
    ],
    legalBasis: "42 U.S.C. § 1983 creates civil liability for officers who violate constitutional rights under color of law. The 4th Amendment prohibits unreasonable seizure including excessive force (Graham v. Connor, 490 U.S. 386 (1989)). Officers can face both civil and criminal liability. Supervisors who ratify unlawful force can also be liable (Monell v. New York, 436 U.S. 658 (1978)).",
    reportingSteps: [
      { agency: "DOJ Civil Rights Division — Criminal Section", phone: "1-855-856-1247", url: "https://civilrights.justice.gov", description: "The DOJ investigates criminal violations of federal civil rights laws including excessive force. File here for the most serious cases involving injury or death." },
      { agency: "FBI Civil Rights Program", url: "https://tips.fbi.gov", description: "FBI investigates criminal civil rights violations including color-of-law offenses by officers. A federal criminal complaint carries significant weight." },
      { agency: "Local Civilian Oversight Board", url: "https://www.nacole.org/find_your_local_oversight_body", description: "File with your local oversight board. Many now have binding disciplinary authority and can compel officers to testify." },
      { agency: "District Attorney's Office", url: "https://www.ndaa.org/programs/prosecutors-directory", description: "Ask the DA to file criminal charges against the officer. Bring your documentation, medical records, and witness information." },
      { agency: "ACLU — File a Report", phone: "1-212-549-2500", url: "https://www.aclu.org/report", description: "ACLU litigates excessive force cases and can refer you to civil rights attorneys who take cases on contingency." },
      { agency: "State Attorney General", url: "https://www.naag.org/find-my-ag", description: "Most state AGs have civil rights divisions. Many can pursue criminal or civil actions against officers independently of local DAs." },
    ],
    whistleblowerNote: "If you witnessed excessive force, your testimony is protected speech. Officers who retaliate against civilian witnesses commit additional crimes. Document any follow-up intimidation, retaliatory stops, or harassment — it strengthens the original case.",
  },
  {
    id: "false_reports",
    title: "False Reports & Perjury",
    icon: "file-text",
    color: ROSE,
    tagline: "Officers lying in reports, under oath, or to manufacture charges",
    what: "Officers who fabricate arrest narratives, misrepresent what happened in written reports, plant evidence to justify charges, or lie under oath in court. This destroys innocent lives. A false police report can send someone to prison for years.",
    examples: [
      "Police report says you were 'aggressive' but your video shows hands up",
      "Officer claims to have seen contraband 'in plain view' — but it was planted",
      "Arrest report states 'resisted arrest' for a person who was compliant",
      "Officer lies under oath about what they observed",
      "Multiple officers give identical, word-for-word statements — indicating coordination",
      "Charges filed based on officer testimony that contradicts all other evidence",
    ],
    howToDocument: [
      "Immediately secure your own video — upload to cloud before anything else",
      "Obtain ALL witness contact information before you are separated from the scene",
      "Request a copy of the police report within 24-48 hours via public records request",
      "Compare the report narrative word-by-word against your video/witness accounts",
      "Note any inconsistencies — especially about who was where, what was said, sequence of events",
      "Request body camera and dashboard camera footage via written FOIA immediately",
      "If charged, share all documentation with your attorney before arraignment",
    ],
    legalBasis: "Filing a false police report is a crime in all 50 states. Perjury (lying under oath) is a federal crime (18 U.S.C. § 1621) and state crime. Officers have no immunity for deliberately falsifying reports. Under Brady v. Maryland (1963), prosecutors must disclose officer misconduct records that affect credibility.",
    reportingSteps: [
      { agency: "Your Criminal Defense Attorney (FIRST)", url: "https://www.nacdl.org/FindAnAttorney", description: "If you are facing charges based on a false report, your first call is your defense attorney. Present all documentation of the discrepancy between the report and video." },
      { agency: "District Attorney's Office — Police Integrity Unit", url: "https://www.ndaa.org/programs/prosecutors-directory", description: "Many DA offices have a unit dedicated to officer-involved misconduct. File a formal complaint with documentation of the false reporting." },
      { agency: "FBI Civil Rights Program", url: "https://tips.fbi.gov", description: "Filing a false federal report or lying to federal investigators is a federal crime. FBI investigates cases where officers violate federal civil rights statutes." },
      { agency: "State AG — Civil Rights Division", url: "https://www.naag.org/find-my-ag", description: "State AGs can investigate and prosecute officers for filing false reports and perjury independently of the local DA." },
      { agency: "The Innocence Project", url: "https://innocenceproject.org/contact", description: "If someone has been wrongfully convicted based on officer falsification, the Innocence Project investigates wrongful convictions and may take the case." },
      { agency: "ACLU", phone: "1-212-549-2500", url: "https://www.aclu.org/report", description: "ACLU takes civil rights cases involving false arrests and fabricated charges. They can also demand disclosure of officer disciplinary records." },
    ],
    whistleblowerNote: "Preserve ALL evidence immediately. Video has a way of disappearing. Upload to multiple cloud platforms, email it to trusted contacts, and give a copy to your attorney the same day. Once charges are filed, your attorney can subpoena body camera footage before it is deleted — most departments purge footage after 30-90 days.",
  },
  {
    id: "tax_waste",
    title: "Tax Dollar Waste",
    icon: "dollar-sign",
    color: AMBER,
    tagline: "Misuse of public resources, equipment, and overtime fraud",
    what: "Officers and departments that misuse the tax dollars citizens provide — using police vehicles for personal trips, overtime fraud, purchasing unnecessary equipment, and engaging in financial corruption that diverts public safety funds from their intended purpose.",
    examples: [
      "Police vehicle routinely parked at officer's home miles outside city limits",
      "Overtime listed on timesheets that contradicts dispatch logs",
      "Department purchasing militarized equipment that sits unused",
      "Officers clocking in/out but not present at assigned location",
      "Police credit cards used for personal purchases",
      "No-bid contracts to vendors connected to department leadership",
    ],
    howToDocument: [
      "Photograph or video police vehicles at personal residences outside jurisdiction with timestamp",
      "Use FOIA requests to obtain overtime records and compare to dispatch logs (see FOIA Generator in Reports)",
      "Request city/county budget documents and departmental spending reports via public records request",
      "Document equipment you see sitting unused — cross-reference with department press releases about purchases",
      "Note make/model/unit number of any police vehicle used for what appears to be personal purposes",
    ],
    legalBasis: "Public employees are prohibited from using government resources for personal benefit. Most states have specific statutes against misuse of public property and fiscal misconduct. The False Claims Act (31 U.S.C. § 3729) allows citizens to sue on behalf of the government for fraud involving federal funds.",
    reportingSteps: [
      { agency: "City/County Inspector General", url: "https://www.ignet.gov/content/find-your-inspector-general", description: "Inspector Generals specifically investigate fraud, waste, and abuse of government resources. This is their primary mandate." },
      { agency: "State Comptroller / Auditor General", url: "https://www.nasact.org/nasact/about/member_directory.asp", description: "State financial oversight officials audit public agency spending and investigate fiscal misconduct by government employees." },
      { agency: "FBI Financial Crimes Unit", url: "https://tips.fbi.gov", description: "If federal funds are involved (many police departments receive federal grants), FBI has jurisdiction over their misuse." },
      { agency: "Local News Investigative Unit", url: "https://www.propublica.org/tips", description: "FOIA requests + your documentation + investigative journalists = powerful accountability. Media exposure is often more effective than internal complaints." },
      { agency: "City Council Budget Committee", url: "https://www.usa.gov/local-governments", description: "City councils control police budgets. Presenting documented waste to budget committee members can trigger formal audits." },
      { agency: "State AG — Public Corruption Unit", url: "https://www.naag.org/find-my-ag", description: "State AGs investigate misuse of public funds and can compel production of financial records from municipal agencies." },
    ],
    whistleblowerNote: "Public financial records — including payroll, overtime logs, and expense reports — are generally public records under state open records laws. You have the right to FOIA these documents. Denials can be appealed. Use the FOIA Generator in the Reports tab to create formal requests.",
  },
  {
    id: "profiling",
    title: "Racial Profiling & Discrimination",
    icon: "users",
    color: PURPLE,
    tagline: "Stops based on race, national origin, or protected class",
    what: "Stops, searches, arrests, or enforcement actions targeted at people because of their race, ethnicity, religion, or other protected characteristics — not because of actual behavior. This is both unconstitutional and illegal under federal and state civil rights laws.",
    examples: [
      "Stopped and questioned with no stated reason in predominantly white neighborhood while Black",
      "Followed through a store, questioned, without doing anything suspicious",
      "Asked for ID while white neighbors standing nearby were not",
      "Stopped for a traffic violation that white drivers routinely commit without being stopped",
      "Treated with excessive force for minor infractions vs. how similar violations by white people are handled",
    ],
    howToDocument: [
      "Record the stop from the beginning — note exact time, location, what you were doing",
      "If stopped, ask: 'What is the reason for this stop?' — get it on video",
      "Note the officer's exact words — specific language used is critical evidence",
      "Document your own demographics and what you were doing before the stop",
      "Look for witnesses — especially those of different racial backgrounds in the same area who were NOT stopped",
      "Build a log if this happens repeatedly — dates, times, locations, badge numbers",
      "Request patrol data via FOIA: how many stops in this area, demographic breakdown",
    ],
    legalBasis: "Equal Protection Clause (14th Amendment) prohibits government discrimination based on race. The Civil Rights Act of 1964 and 42 U.S.C. § 1983 provide federal causes of action. The DOJ can investigate departments for pattern-or-practice discrimination under 42 U.S.C. § 14141. Whren v. United States (1996) allows pretextual stops, but documented patterns of racial disparity are actionable.",
    reportingSteps: [
      { agency: "DOJ Civil Rights Division — Special Litigation", phone: "1-855-856-1247", url: "https://civilrights.justice.gov", description: "DOJ investigates police departments for patterns of racial discrimination and can enter consent decrees requiring reform." },
      { agency: "ACLU — Racial Justice Program", phone: "1-212-549-2500", url: "https://www.aclu.org/report", description: "ACLU litigates racial profiling cases and can obtain department-wide stop data through litigation." },
      { agency: "State Civil Rights Commission", url: "https://www.nacole.org/find_your_local_oversight_body", description: "State civil rights agencies investigate discrimination by government employees including law enforcement." },
      { agency: "NAACP Legal Defense Fund", phone: "1-212-965-2200", url: "https://www.naacpldf.org/contact-us/submit-a-case", description: "NAACP LDF takes civil rights cases involving racial discrimination in policing and can file suit on behalf of affected individuals and communities." },
      { agency: "Local Civilian Oversight Board", url: "https://www.nacole.org/find_your_local_oversight_body", description: "File a formal complaint with your local oversight board documenting the racial disparity of the stop." },
      { agency: "State Attorney General", url: "https://www.naag.org/find-my-ag", description: "Many state AGs have civil rights sections that investigate discriminatory policing, especially with documented patterns." },
    ],
    whistleblowerNote: "Pattern evidence is critical for racial profiling cases. Individual stops are harder to prove. Build a log over time. If you can get multiple community members to each file complaints with the same documentation format, a collective complaint has much greater power to trigger a DOJ investigation.",
  },
  {
    id: "evidence_tampering",
    title: "Evidence Tampering & Planting",
    icon: "package",
    color: RED,
    tagline: "Planting drugs/weapons, destroying footage, falsifying chain of custody",
    what: "Officers who plant drugs, weapons, or other contraband on suspects; who destroy or tamper with body camera footage, dashcam, or physical evidence; or who falsify evidence chain of custody records to manufacture criminal cases.",
    examples: [
      "Body camera footage showing officer placing item in suspect's pocket or vehicle",
      "Drugs or weapons 'discovered' in a location that previous video shows was clear",
      "Body camera turned off at precisely the moment critical events occur",
      "Evidence logged in a property room disappears",
      "DNA or fingerprint evidence does not match defendant — but officer swears it was there",
    ],
    howToDocument: [
      "If you witness what you believe is planting: record immediately and continuously",
      "Immediately preserve any footage you have in multiple cloud locations",
      "Request ALL body camera and dashboard camera footage within 24 hours via written FOIA — before automatic purge",
      "If charged: your attorney can subpoena evidence logs and chain of custody records",
      "Document any gaps or interruptions in officer's body camera footage timeline",
      "Request the property and evidence log for anything seized from you",
    ],
    legalBasis: "Evidence tampering is a felony under 18 U.S.C. § 1519. Planting evidence is criminal misconduct and a civil rights violation (42 U.S.C. § 1983). Officers who tamper with evidence can face criminal prosecution and civil liability. Under Giglio v. United States (1972), prosecutors must disclose when officers have a history of dishonesty.",
    reportingSteps: [
      { agency: "FBI Civil Rights Program", url: "https://tips.fbi.gov", description: "FBI investigates criminal misconduct by law enforcement including evidence planting and tampering as color-of-law violations." },
      { agency: "DOJ Civil Rights Division", phone: "1-855-856-1247", url: "https://civilrights.justice.gov", description: "DOJ investigates systematic evidence corruption by police departments." },
      { agency: "State AG — Criminal Division", url: "https://www.naag.org/find-my-ag", description: "State AGs can prosecute officers for evidence tampering and planting independently of local prosecutors who may have conflicts of interest." },
      { agency: "The Innocence Project", url: "https://innocenceproject.org/contact", description: "If someone was wrongfully convicted due to planted or tampered evidence, Innocence Project investigates and litigates for exoneration." },
      { agency: "Your Defense Attorney (if charged)", url: "https://www.nacdl.org/FindAnAttorney", description: "If facing charges, present documentation to your defense attorney immediately. Motion to suppress evidence and seek discovery of officer conduct records." },
      { agency: "ACLU — Criminal Law Reform", phone: "1-212-549-2500", url: "https://www.aclu.org/report", description: "ACLU litigates cases involving fabricated evidence and can file civil rights suits against departments with documented patterns of planting." },
    ],
    whistleblowerNote: "Body camera footage is typically stored for 30-90 days and then automatically purged. If you believe tampering occurred or evidence was planted, you or your attorney MUST request the footage in writing immediately — the same day if possible. A written request before purging creates a legal obligation to preserve the footage.",
  },
  {
    id: "bribery",
    title: "Bribery & Financial Corruption",
    icon: "trending-up",
    color: GREEN,
    tagline: "Soliciting bribes, theft, extortion, kickbacks",
    what: "Officers who solicit money to 'look the other way,' steal from suspects or crime scenes, run extortion schemes, receive kickbacks from towing companies or businesses, or use their badge to commit financial crimes against the public.",
    examples: [
      "Officer hints that the ticket will 'go away' if you pay cash",
      "Cash missing from seized property or property room",
      "Same towing company dispatched every time in an officer's sector — later tied to kickbacks",
      "Officer threatens arrest unless paid",
      "Expensive items missing from a crime scene that the officer worked",
    ],
    howToDocument: [
      "If bribed or extorted: record it. Do not hand over money if at all possible — say you don't have it",
      "If you pay under duress: note exact amount, location, time, officer's name/badge number, and their exact words",
      "Write down everything from memory immediately after — before details fade",
      "If you know of others who experienced the same officer: coordinated complaints are much more powerful",
      "Request any receipts or records for any property seized from you",
    ],
    legalBasis: "Bribery of public officials is a federal crime (18 U.S.C. § 201). Extortion under color of law is a federal crime (18 U.S.C. § 1951 — Hobbs Act). Officers who steal from suspects can face state theft charges and federal civil rights charges. There is no immunity for criminal conduct.",
    reportingSteps: [
      { agency: "FBI Public Corruption Unit", url: "https://tips.fbi.gov", description: "FBI's Public Corruption program specifically investigates bribery, extortion, and financial corruption by law enforcement. This is one of their highest priorities." },
      { agency: "DOJ Criminal Division — Public Integrity Section", url: "https://www.justice.gov/criminal-pin", description: "DOJ prosecutes corruption by public officials including law enforcement under federal statutes." },
      { agency: "State AG — Public Corruption", url: "https://www.naag.org/find-my-ag", description: "State AGs can prosecute officers for state-level bribery and extortion charges." },
      { agency: "City/County Inspector General", url: "https://www.ignet.gov/content/find-your-inspector-general", description: "Inspector Generals investigate financial misconduct by city employees including police officers." },
      { agency: "Local Civilian Oversight Board", url: "https://www.nacole.org/find_your_local_oversight_body", description: "File a formal complaint even if you also file with federal authorities — creates an independent record." },
    ],
    whistleblowerNote: "If you paid a bribe under duress, you are a victim — not a criminal. Federal whistleblower statutes protect people who report official corruption. You cannot be prosecuted for a bribe you paid to avoid unlawful arrest or harm. Document everything and contact the FBI.",
  },
  {
    id: "retaliation",
    title: "Retaliation & Intimidation",
    icon: "alert-triangle",
    color: CYAN,
    tagline: "Officers targeting people who complain, record, or speak out",
    what: "Officers who retaliate against people who have filed complaints, recorded incidents, or spoken publicly against misconduct — through retaliatory traffic stops, fabricated charges, intimidation visits, or harassment. This is designed to silence accountability.",
    examples: [
      "Suddenly receiving multiple traffic tickets after filing a complaint",
      "Officers repeatedly visiting your home or workplace after you filed against them",
      "Being followed by patrol vehicles when none existed before your complaint",
      "Being arrested on questionable charges shortly after publicly speaking about misconduct",
      "Officers making comments referencing your complaint or recording",
    ],
    howToDocument: [
      "Keep a detailed log with dates, times, officer names/badge numbers, what happened, and witnesses",
      "Note any change in enforcement frequency — compare to before you filed/recorded",
      "Document any officer who makes reference to your complaint, your video, or your public statements",
      "Screenshot and preserve any online harassment connected to officers",
      "Get the incident numbers of any retaliatory stops or citations — these create a legal trail",
      "Contact the ACLU immediately — retaliation against complainants is a significant civil rights violation",
    ],
    legalBasis: "Retaliation against someone exercising First Amendment rights (recording, filing complaints, public speech) violates 42 U.S.C. § 1983. The First Amendment prohibits government actors from punishing protected speech and association. Courts have held that filing a police complaint is protected First Amendment activity (Lozman v. City of Riviera Beach, 2018).",
    reportingSteps: [
      { agency: "ACLU — First Amendment Project", phone: "1-212-549-2500", url: "https://www.aclu.org/report", description: "ACLU is the lead organization for retaliation cases against citizen complainants and journalists who document police misconduct." },
      { agency: "DOJ Civil Rights Division", phone: "1-855-856-1247", url: "https://civilrights.justice.gov", description: "Retaliatory use of state power to punish First Amendment activity is a federal civil rights violation. File with DOJ." },
      { agency: "FBI Civil Rights Program", url: "https://tips.fbi.gov", description: "FBI investigates color-of-law violations including retaliatory arrests and use of official powers to punish lawful civilian conduct." },
      { agency: "State AG — Civil Rights", url: "https://www.naag.org/find-my-ag", description: "State civil rights divisions can investigate and prosecute retaliatory conduct by officers." },
      { agency: "Internal Affairs — Retaliation Complaint", url: "https://www.nacole.org/find_your_local_oversight_body", description: "File a separate complaint specifically about the retaliatory conduct. It creates an official record and demonstrates a pattern." },
    ],
    whistleblowerNote: "Retaliation is a separate civil rights violation from the original incident. Every retaliatory stop, citation, or intimidation attempt is additional evidence and additional liability for the officer and department. Document each incident in real time and report each one separately — a pattern of retaliation is extremely powerful in federal court.",
  },
];

const WHISTLEBLOWER_RIGHTS = [
  { title: "Right to Record in Public", body: "You have a First Amendment right to record law enforcement officers performing their public duties in public spaces. This is settled law in every federal circuit. Officers who order you to stop recording, seize your phone, or arrest you for recording are violating your constitutional rights.", icon: "video", color: GREEN },
  { title: "42 U.S.C. § 1983 — Sue the Officer", body: "Section 1983 of the Civil Rights Act allows any person to sue a government official who violates their constitutional rights while acting under color of law. You can sue for damages, legal fees, and injunctive relief — directly against the officer and the department.", icon: "shield", color: BLUE },
  { title: "Pattern-or-Practice Investigations", body: "Under 42 U.S.C. § 14141, the DOJ can investigate and sue entire police departments for patterns of constitutional violations. Your individual documentation, combined with others' complaints, can trigger a federal investigation and consent decree requiring reform.", icon: "trending-up", color: AMBER },
  { title: "Qualified Immunity — What It Means", body: "Qualified immunity shields officers from civil suits unless they violated 'clearly established' law. It is not absolute protection. Courts are increasingly denying qualified immunity for egregious misconduct. The more clearly documented your case, the harder it is for courts to apply immunity.", icon: "info", color: PURPLE },
  { title: "Police Discipline Is Often Public Record", body: "In most states, officer disciplinary records are public records accessible via FOIA. Requesting an officer's complaint history can reveal a pattern that strengthens your case and may qualify them for Brady list disclosure — which DAs are required to track.", icon: "file-text", color: CYAN },
  { title: "Anonymous Tip Lines", body: "FBI, DOJ, DHS OIG, and most oversight boards accept anonymous tips. You do not need to identify yourself to start an investigation. Use ProPublica's secure tip line (propublica.org/tips), Wickr, or Signal for maximum security when reporting sensitive corruption.", icon: "eye-off", color: ROSE },
];

const INVESTIGATIVE_RESOURCES = [
  { name: "ProPublica Secure Tip Line", url: "https://www.propublica.org/tips", icon: "radio", description: "Award-winning investigative journalism — secure encrypted tips, specializes in exposing government corruption and police misconduct" },
  { name: "The Marshall Project", url: "https://www.themarshallproject.org", icon: "book-open", description: "Dedicated to criminal justice reform and accountability — covers police misconduct, wrongful convictions, and systemic failures" },
  { name: "Injustice Watch", url: "https://www.injusticewatch.org", icon: "eye", description: "Investigative journalism focused on courts, prosecutors, and police accountability in US cities" },
  { name: "The Appeal", url: "https://theappeal.org", icon: "globe", description: "Criminal justice reporting covering police violence, corruption, and accountability" },
  { name: "Mapping Police Violence", url: "https://mappingpoliceviolence.us", icon: "map", description: "Database tracking all police killings in the US — check if your incident fits a pattern" },
  { name: "NACOLE — Find Oversight Bodies", url: "https://www.nacole.org/find_your_local_oversight_body", icon: "search", description: "National Association for Civilian Oversight of Law Enforcement — find your city's oversight board" },
];

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export default function CorruptionScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [activeCategory, setActiveCategory] = useState<CorruptionCategory | null>(null);
  const [expandedRight, setExpandedRight] = useState<string | null>(null);

  const handleCategoryPress = useCallback((cat: CorruptionCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveCategory(cat);
  }, []);

  const handleDocumentNow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/incident/new");
  }, []);

  if (activeCategory) {
    const cat = activeCategory;
    const meta = { color: cat.color };
    return (
      <View style={[s.container, { paddingTop: topPad }]}>
        <View style={s.header}>
          <Pressable onPress={() => setActiveCategory(null)} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={TEXT} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.headerTitle}>{cat.title}</Text>
            <Text style={s.headerSub}>{cat.tagline}</Text>
          </View>
          <View style={[s.catIconWrap, { backgroundColor: cat.color + "22" }]}>
            <Feather name={cat.icon as any} size={18} color={cat.color} />
          </View>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.detailContent, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(200)}>
            <View style={[s.whatBox, { borderColor: cat.color + "44" }]}>
              <Text style={s.sectionLabel}>WHAT THIS IS</Text>
              <Text style={s.whatText}>{cat.what}</Text>
            </View>

            <View style={s.section}>
              <Text style={s.sectionLabel}>REAL EXAMPLES</Text>
              {cat.examples.map((ex, i) => (
                <View key={i} style={s.exampleRow}>
                  <Feather name="chevron-right" size={14} color={cat.color} />
                  <Text style={s.exampleText}>{ex}</Text>
                </View>
              ))}
            </View>

            <Pressable style={[s.documentNowBtn, { borderColor: cat.color }]} onPress={handleDocumentNow}>
              <Feather name="edit-3" size={20} color={cat.color} />
              <View style={{ flex: 1 }}>
                <Text style={[s.documentNowTitle, { color: cat.color }]}>Document This Incident Now</Text>
                <Text style={s.documentNowSub}>Creates a timestamped, GPS-tagged incident record</Text>
              </View>
              <Feather name="chevron-right" size={18} color={cat.color + "88"} />
            </Pressable>

            <View style={s.section}>
              <Text style={s.sectionLabel}>HOW TO DOCUMENT — STEP BY STEP</Text>
              {cat.howToDocument.map((step, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(200)}>
                  <View style={s.docStepRow}>
                    <View style={[s.docStepNum, { backgroundColor: cat.color + "22" }]}>
                      <Text style={[s.docStepNumText, { color: cat.color }]}>{i + 1}</Text>
                    </View>
                    <Text style={s.docStepText}>{step}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            <View style={[s.legalBox, { borderColor: "#3b82f644" }]}>
              <View style={s.legalHeader}>
                <Feather name="book-open" size={15} color={BLUE} />
                <Text style={[s.sectionLabel, { color: BLUE, marginBottom: 0 }]}>LEGAL BASIS</Text>
              </View>
              <Text style={s.legalText}>{cat.legalBasis}</Text>
            </View>

            <View style={s.section}>
              <Text style={s.sectionLabel}>WHERE TO REPORT — IN ORDER OF IMPACT</Text>
              {cat.reportingSteps.map((step, i) => (
                <View key={i} style={s.reportRow}>
                  <View style={s.reportPriority}>
                    <Text style={s.reportPriorityNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.reportAgency}>{step.agency}</Text>
                    <Text style={s.reportDesc}>{step.description}</Text>
                    <View style={s.reportActions}>
                      {step.phone && (
                        <Pressable style={s.reportPhoneBtn} onPress={() => Linking.openURL(`tel:${step.phone!.replace(/[^0-9]/g, "")}`)}>
                          <Feather name="phone" size={12} color={GREEN} />
                          <Text style={s.reportPhoneText}>{step.phone}</Text>
                        </Pressable>
                      )}
                      <Pressable style={s.reportLinkBtn} onPress={() => Linking.openURL(step.url)}>
                        <Feather name="external-link" size={12} color={BLUE} />
                        <Text style={s.reportLinkText}>File Report</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={[s.whistleblowerBox, { borderColor: GREEN + "44" }]}>
              <View style={s.legalHeader}>
                <Feather name="shield" size={15} color={GREEN} />
                <Text style={[s.sectionLabel, { color: GREEN, marginBottom: 0 }]}>WHISTLEBLOWER NOTE</Text>
              </View>
              <Text style={s.whistleblowerText}>{cat.whistleblowerNote}</Text>
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
          <Text style={s.headerTitle}>Police Accountability</Text>
          <Text style={s.headerSub}>Document · Report · Expose corruption with your rights</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.mainContent, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.missionCard}>
          <Feather name="target" size={22} color={AMBER} />
          <Text style={s.missionText}>
            Police officers are public servants hired by and accountable to the citizens who pay their salaries. When they violate the oath they swore, waste tax dollars, or abuse their authority — you have both the right and the tools to hold them accountable.
          </Text>
        </View>

        <View style={s.quickActions}>
          <Pressable style={[s.quickBtn, { backgroundColor: AMBER + "18", borderColor: AMBER + "44" }]} onPress={handleDocumentNow}>
            <Feather name="edit-3" size={18} color={AMBER} />
            <Text style={[s.quickBtnText, { color: AMBER }]}>Document Now</Text>
          </Pressable>
          <Pressable style={[s.quickBtn, { backgroundColor: INDIGO + "18", borderColor: INDIGO + "44" }]} onPress={() => router.push("/complaints")}>
            <Feather name="folder" size={18} color={INDIGO} />
            <Text style={[s.quickBtnText, { color: INDIGO }]}>File Complaint</Text>
          </Pressable>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>SELECT A CORRUPTION TYPE</Text>
          <Text style={s.sectionSub}>Tap any category for step-by-step documentation and reporting guidance</Text>
          {CATEGORIES.map((cat, idx) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(idx * 50).duration(250)}>
              <Pressable
                style={({ pressed }) => [s.catCard, { borderColor: cat.color + "44", opacity: pressed ? 0.85 : 1 }]}
                onPress={() => handleCategoryPress(cat)}
              >
                <View style={[s.catIcon, { backgroundColor: cat.color + "22" }]}>
                  <Feather name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.catTitle}>{cat.title}</Text>
                  <Text style={s.catTagline}>{cat.tagline}</Text>
                  <Text style={[s.catSteps, { color: cat.color }]}>{cat.reportingSteps.length} reporting agencies · {cat.howToDocument.length} documentation steps</Text>
                </View>
                <Feather name="chevron-right" size={18} color={cat.color + "88"} />
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>YOUR RIGHTS AS A CITIZEN WATCHDOG</Text>
          <Text style={s.sectionSub}>Know exactly what protects you when documenting and reporting</Text>
          {WHISTLEBLOWER_RIGHTS.map((right, i) => (
            <Pressable
              key={i}
              style={[s.rightCard, { borderColor: right.color + "33" }]}
              onPress={() => setExpandedRight(expandedRight === right.title ? null : right.title)}
            >
              <View style={s.rightCardTop}>
                <View style={[s.rightIcon, { backgroundColor: right.color + "22" }]}>
                  <Feather name={right.icon as any} size={15} color={right.color} />
                </View>
                <Text style={[s.rightTitle, { color: right.color }]}>{right.title}</Text>
                <Feather name={expandedRight === right.title ? "chevron-up" : "chevron-down"} size={15} color={MUTED} />
              </View>
              {expandedRight === right.title && (
                <Animated.View entering={FadeIn.duration(200)} style={s.rightBody}>
                  <Text style={s.rightBodyText}>{right.body}</Text>
                </Animated.View>
              )}
            </Pressable>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>TAKE IT PUBLIC — INVESTIGATIVE RESOURCES</Text>
          <Text style={s.sectionSub}>Journalists and databases that amplify accountability documentation</Text>
          {INVESTIGATIVE_RESOURCES.map((r, i) => (
            <Pressable key={i} style={s.resourceRow} onPress={() => Linking.openURL(r.url)}>
              <View style={[s.resourceIcon, { backgroundColor: AMBER + "18" }]}>
                <Feather name={r.icon as any} size={15} color={AMBER} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.resourceName}>{r.name}</Text>
                <Text style={s.resourceDesc}>{r.description}</Text>
              </View>
              <Feather name="external-link" size={14} color={MUTED} />
            </Pressable>
          ))}
        </View>

        <View style={s.patternBox}>
          <Feather name="repeat" size={16} color={PURPLE} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.sectionLabel, { color: PURPLE, marginBottom: 0 }]}>PATTERN DOCUMENTATION = MAXIMUM POWER</Text>
            <Text style={s.patternText}>
              A single complaint is often dismissed. A pattern of documented incidents by the same officer — even across different civilians — is what triggers DOJ investigations, city audits, and court-ordered reform. Use the Officers tab to track badge numbers across incidents. Use the FOIA Generator (Reports tab) to request that officer's full complaint history. Share your documented pattern with investigative journalists.
            </Text>
            <Pressable style={s.patternBtn} onPress={() => router.push("/(tabs)/officers")}>
              <Feather name="users" size={14} color={PURPLE} />
              <Text style={[s.quickBtnText, { color: PURPLE }]}>Track Officer Patterns →</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", marginTop: 1 },
  catIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  mainContent: { paddingHorizontal: 16, paddingTop: 4, gap: 20 },
  detailContent: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },

  missionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: AMBER + "14",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AMBER + "33",
  },
  missionText: { flex: 1, fontSize: 13, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 20 },

  quickActions: { flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickBtnText: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },

  section: { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: "700" as const, color: MUTED, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17 },

  catCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  catIcon: { width: 48, height: 48, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  catTitle: { fontSize: 15, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  catTagline: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 16 },
  catSteps: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },

  rightCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  rightCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  rightIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rightTitle: { flex: 1, fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  rightBody: { paddingTop: 4 },
  rightBodyText: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 19 },

  resourceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  resourceIcon: { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  resourceName: { fontSize: 13, fontWeight: "600" as const, color: TEXT, fontFamily: "Inter_600SemiBold" },
  resourceDesc: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 17 },

  patternBox: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: PURPLE + "12",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PURPLE + "33",
  },
  patternText: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 19 },
  patternBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  whatBox: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  whatText: { fontSize: 14, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 22 },

  exampleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  exampleText: { flex: 1, fontSize: 13, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 19 },

  documentNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
  },
  documentNowTitle: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  documentNowSub: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", marginTop: 2 },

  docStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  docStepNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  docStepNumText: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  docStepText: { flex: 1, fontSize: 13, color: TEXT, fontFamily: "Inter_400Regular", lineHeight: 19 },

  legalBox: {
    backgroundColor: "#3b82f612",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  legalHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  legalText: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 19 },

  reportRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  reportPriority: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AMBER + "22",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  reportPriorityNum: { fontSize: 13, fontWeight: "700" as const, color: AMBER, fontFamily: "Inter_700Bold" },
  reportAgency: { fontSize: 14, fontWeight: "700" as const, color: TEXT, fontFamily: "Inter_700Bold" },
  reportDesc: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 18 },
  reportActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" as const, marginTop: 4 },
  reportPhoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: GREEN + "18",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: GREEN + "44",
  },
  reportPhoneText: { fontSize: 12, color: GREEN, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  reportLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: BLUE + "18",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BLUE + "44",
  },
  reportLinkText: { fontSize: 12, color: BLUE, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },

  whistleblowerBox: {
    backgroundColor: GREEN + "10",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  whistleblowerText: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
