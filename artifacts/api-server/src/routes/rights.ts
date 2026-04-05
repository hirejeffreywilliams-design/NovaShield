import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const STATE_RESOURCES: Record<string, { legislatureUrl: string; name: string; acluUrl: string }> = {
  AL: { name: "Alabama", legislatureUrl: "https://legislature.state.al.us", acluUrl: "https://www.aclualabama.org" },
  AK: { name: "Alaska", legislatureUrl: "https://www.akleg.gov", acluUrl: "https://www.acluak.org" },
  AZ: { name: "Arizona", legislatureUrl: "https://www.azleg.gov", acluUrl: "https://www.acluaz.org" },
  AR: { name: "Arkansas", legislatureUrl: "https://www.arkleg.state.ar.us", acluUrl: "https://www.acluarkansas.org" },
  CA: { name: "California", legislatureUrl: "https://leginfo.legislature.ca.gov", acluUrl: "https://www.aclunc.org" },
  CO: { name: "Colorado", legislatureUrl: "https://leg.colorado.gov", acluUrl: "https://www.aclu-co.org" },
  CT: { name: "Connecticut", legislatureUrl: "https://www.cga.ct.gov", acluUrl: "https://www.acluct.org" },
  DE: { name: "Delaware", legislatureUrl: "https://legis.delaware.gov", acluUrl: "https://www.aclu-de.org" },
  FL: { name: "Florida", legislatureUrl: "https://www.flsenate.gov", acluUrl: "https://www.aclufl.org" },
  GA: { name: "Georgia", legislatureUrl: "https://www.legis.ga.gov", acluUrl: "https://www.acluga.org" },
  HI: { name: "Hawaii", legislatureUrl: "https://www.capitol.hawaii.gov", acluUrl: "https://www.acluhi.org" },
  ID: { name: "Idaho", legislatureUrl: "https://legislature.idaho.gov", acluUrl: "https://www.acluidaho.org" },
  IL: { name: "Illinois", legislatureUrl: "https://www.ilga.gov", acluUrl: "https://www.aclu-il.org" },
  IN: { name: "Indiana", legislatureUrl: "https://iga.in.gov", acluUrl: "https://www.aclu-in.org" },
  IA: { name: "Iowa", legislatureUrl: "https://www.legis.iowa.gov", acluUrl: "https://www.aclu-ia.org" },
  KS: { name: "Kansas", legislatureUrl: "https://www.kslegislature.org", acluUrl: "https://www.aclukansas.org" },
  KY: { name: "Kentucky", legislatureUrl: "https://legislature.ky.gov", acluUrl: "https://www.aclu-ky.org" },
  LA: { name: "Louisiana", legislatureUrl: "https://www.legis.la.gov", acluUrl: "https://www.laaclu.org" },
  ME: { name: "Maine", legislatureUrl: "https://legislature.maine.gov", acluUrl: "https://www.aclumaine.org" },
  MD: { name: "Maryland", legislatureUrl: "https://mgaleg.maryland.gov", acluUrl: "https://www.aclu-md.org" },
  MA: { name: "Massachusetts", legislatureUrl: "https://malegislature.gov", acluUrl: "https://www.aclum.org" },
  MI: { name: "Michigan", legislatureUrl: "https://www.legislature.mi.gov", acluUrl: "https://www.aclumich.org" },
  MN: { name: "Minnesota", legislatureUrl: "https://www.leg.state.mn.us", acluUrl: "https://www.aclu-mn.org" },
  MS: { name: "Mississippi", legislatureUrl: "https://www.legislature.ms.gov", acluUrl: "https://www.aclu-ms.org" },
  MO: { name: "Missouri", legislatureUrl: "https://www.moga.mo.gov", acluUrl: "https://www.aclu-mo.org" },
  MT: { name: "Montana", legislatureUrl: "https://leg.mt.gov", acluUrl: "https://www.aclumontana.org" },
  NE: { name: "Nebraska", legislatureUrl: "https://nebraskalegislature.gov", acluUrl: "https://www.acluofnebraska.org" },
  NV: { name: "Nevada", legislatureUrl: "https://www.leg.state.nv.us", acluUrl: "https://www.aclunv.org" },
  NH: { name: "New Hampshire", legislatureUrl: "https://www.gencourt.state.nh.us", acluUrl: "https://www.aclu-nh.org" },
  NJ: { name: "New Jersey", legislatureUrl: "https://www.njleg.state.nj.us", acluUrl: "https://www.aclu-nj.org" },
  NM: { name: "New Mexico", legislatureUrl: "https://www.nmlegis.gov", acluUrl: "https://www.aclu-nm.org" },
  NY: { name: "New York", legislatureUrl: "https://www.nysenate.gov", acluUrl: "https://www.nyclu.org" },
  NC: { name: "North Carolina", legislatureUrl: "https://www.ncleg.gov", acluUrl: "https://www.acluofnc.org" },
  ND: { name: "North Dakota", legislatureUrl: "https://www.legis.nd.gov", acluUrl: "https://www.aclund.org" },
  OH: { name: "Ohio", legislatureUrl: "https://www.legislature.ohio.gov", acluUrl: "https://www.acluohio.org" },
  OK: { name: "Oklahoma", legislatureUrl: "https://www.oklegislature.gov", acluUrl: "https://www.acluok.org" },
  OR: { name: "Oregon", legislatureUrl: "https://www.oregonlegislature.gov", acluUrl: "https://www.aclu-or.org" },
  PA: { name: "Pennsylvania", legislatureUrl: "https://www.legis.state.pa.us", acluUrl: "https://www.aclupa.org" },
  RI: { name: "Rhode Island", legislatureUrl: "https://www.rilegislature.gov", acluUrl: "https://www.riaclu.org" },
  SC: { name: "South Carolina", legislatureUrl: "https://www.scstatehouse.gov", acluUrl: "https://www.aclusc.org" },
  SD: { name: "South Dakota", legislatureUrl: "https://sdlegislature.gov", acluUrl: "https://www.aclsd.org" },
  TN: { name: "Tennessee", legislatureUrl: "https://www.capitol.tn.gov", acluUrl: "https://www.aclu-tn.org" },
  TX: { name: "Texas", legislatureUrl: "https://capitol.texas.gov", acluUrl: "https://www.aclutx.org" },
  UT: { name: "Utah", legislatureUrl: "https://le.utah.gov", acluUrl: "https://www.acluutah.org" },
  VT: { name: "Vermont", legislatureUrl: "https://legislature.vermont.gov", acluUrl: "https://www.acluvt.org" },
  VA: { name: "Virginia", legislatureUrl: "https://lis.virginia.gov", acluUrl: "https://www.acluva.org" },
  WA: { name: "Washington", legislatureUrl: "https://app.leg.wa.gov", acluUrl: "https://www.aclu-wa.org" },
  WV: { name: "West Virginia", legislatureUrl: "https://www.wvlegislature.gov", acluUrl: "https://www.acluwv.org" },
  WI: { name: "Wisconsin", legislatureUrl: "https://docs.legis.wisconsin.gov", acluUrl: "https://www.aclu-wi.org" },
  WY: { name: "Wyoming", legislatureUrl: "https://www.wyoleg.gov", acluUrl: "https://www.aclu-wy.org" },
  DC: { name: "Washington D.C.", legislatureUrl: "https://code.dccouncil.gov", acluUrl: "https://www.acludc.org" },
};

const SCENARIOS = [
  {
    id: "traffic_stop",
    title: "Traffic Stop",
    icon: "truck",
    color: "#f59e0b",
    description: "Your rights when pulled over",
    defaultQuestion: "What are my rights during a traffic stop? Do I have to answer questions? Can they search my car?",
  },
  {
    id: "pedestrian_stop",
    title: "Pedestrian Stop",
    icon: "user",
    color: "#3b82f6",
    description: "Stop & frisk / Terry stops",
    defaultQuestion: "What are my rights if police stop me on the street? Do I have to show ID? What is a Terry stop and when is it legal?",
  },
  {
    id: "recording_police",
    title: "Recording Police",
    icon: "video",
    color: "#22c55e",
    description: "Right to film officers",
    defaultQuestion: "Do I have the legal right to record or film police officers in public? Can they take my phone or demand I stop recording?",
  },
  {
    id: "home_entry",
    title: "Home Entry",
    icon: "home",
    color: "#8b5cf6",
    description: "Search warrants & consent",
    defaultQuestion: "Can police enter my home without a warrant? What are my rights if they come to my door? Do I have to let them in?",
  },
  {
    id: "arrest",
    title: "Arrest & Miranda",
    icon: "alert-circle",
    color: "#ef4444",
    description: "Miranda rights & being arrested",
    defaultQuestion: "What are Miranda rights and when must police read them? What should I do if I am being arrested? Do I have to answer questions after arrest?",
  },
  {
    id: "excessive_force",
    title: "Excessive Force",
    icon: "shield-off",
    color: "#e11d48",
    description: "When force is unlawful",
    defaultQuestion: "What constitutes excessive force by police? What legal protections do I have against police brutality? What is the legal standard courts use?",
  },
  {
    id: "rights_protest",
    title: "Protest Rights",
    icon: "flag",
    color: "#0ea5e9",
    description: "1st Amendment & demonstrations",
    defaultQuestion: "What are my rights at a protest or demonstration? Can police disperse a crowd? What is legal and illegal when protesting?",
  },
  {
    id: "vehicle_search",
    title: "Vehicle Search",
    icon: "search",
    color: "#f97316",
    description: "4th Amendment & car searches",
    defaultQuestion: "When can police legally search my vehicle? What is probable cause? Can I refuse a search? What happens if I refuse?",
  },
];

router.get("/scenarios", (_req, res) => {
  res.json({ scenarios: SCENARIOS });
});

router.get("/states", (_req, res) => {
  const states = Object.entries(STATE_RESOURCES).map(([code, info]) => ({
    code,
    name: info.name,
    legislatureUrl: info.legislatureUrl,
    acluUrl: info.acluUrl,
  }));
  res.json({ states });
});

router.post("/ask", async (req, res): Promise<void> => {
  try {
    const { question, state_code, scenario_id } = req.body;
    if (!question) { res.status(400).json({ error: "question is required" }); return; }

    const stateInfo = state_code ? STATE_RESOURCES[state_code.toUpperCase()] : null;
    const stateName = stateInfo?.name || state_code || "your state";
    const scenario = scenario_id ? SCENARIOS.find((s) => s.id === scenario_id) : null;

    const systemPrompt = `You are a constitutional and civil rights legal information assistant for a police accountability application. Your role is to provide EDUCATIONAL information about legal rights in police encounters for U.S. citizens.

CRITICAL RULES — FOLLOW EXACTLY:
1. ALWAYS begin your response with this exact disclaimer block:
   "📋 EDUCATIONAL INFORMATION ONLY — This is public legal information, not legal advice. Laws can change. For advice specific to your situation, consult a licensed attorney in your state."

2. ONLY cite these verified, authoritative public sources. Never cite Wikipedia, blogs, or unofficial sites:
   - Cornell Law School Legal Information Institute: law.cornell.edu (for U.S. Constitution text, federal statutes, Supreme Court cases)
   - ACLU.org (for rights guides and state-specific know-your-rights resources)
   - Justia.com (for case law, statutes, and legal databases — free and accurate)
   - Official state legislature websites (provide the actual URL for ${stateName})
   - U.S. Supreme Court decisions (cite: [Case Name], [Year], [holding summary])
   - The U.S. Code at uscode.house.gov
   - State Attorney General official websites

3. ALWAYS cite the specific legal authority for every rights claim you make:
   - Constitutional provisions (e.g., "4th Amendment, U.S. Constitution — law.cornell.edu/constitution/fourth_amendment")
   - Federal case law (e.g., "Terry v. Ohio, 392 U.S. 1 (1968) — held that brief investigative stops are lawful with reasonable articulable suspicion")
   - State statutes (cite the actual code section, e.g., "California Penal Code § 148.1")

4. Structure every response with these sections:
   ## Your Federal Rights (apply in ALL states)
   ## Your Rights in ${stateName} (state-specific laws)
   ## Key Court Cases
   ## What You Can Do
   ## Sources & Further Reading

5. Be accurate and factual. If a right varies by state, say so explicitly.
6. If you are uncertain about a specific state law, direct the user to the official state legislature website: ${stateInfo?.legislatureUrl || "the state legislature website"} and ACLU ${stateName}: ${stateInfo?.acluUrl || "aclu.org"}
7. Never give legal strategy advice — only factual information about what the law says.
8. Distinguish between what the law says and what commonly happens in practice, when relevant.`;

    const userMessage = scenario
      ? `Scenario: ${scenario.title} — ${scenario.description}\n\nQuestion: ${question}\n\nState: ${stateName}`
      : `Question: ${question}\n\nState: ${stateName}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const answer = response.choices[0]?.message?.content || "Unable to generate response.";

    const sources: Array<{ title: string; url: string; type: string }> = [
      { title: "Cornell Law — U.S. Constitution", url: "https://law.cornell.edu/constitution", type: "Federal Law" },
      { title: "ACLU Know Your Rights", url: "https://www.aclu.org/know-your-rights/stopped-by-police", type: "Rights Guide" },
      { title: "Justia — Constitutional Law", url: "https://law.justia.com/constitution/", type: "Legal Database" },
    ];
    if (stateInfo) {
      sources.push({ title: `${stateInfo.name} Legislature`, url: stateInfo.legislatureUrl, type: "State Law" });
      sources.push({ title: `ACLU ${stateInfo.name}`, url: stateInfo.acluUrl, type: "Rights Guide" });
    }

    res.json({
      answer,
      state: stateInfo ? { code: state_code, ...stateInfo } : null,
      scenario: scenario || null,
      sources,
      disclaimer: "This information is educational and sourced from public legal references. It is not legal advice. Laws vary by state and can change. Consult a licensed attorney for advice specific to your situation.",
    });
  } catch (err) {
    console.error("Rights ask error:", err);
    res.status(500).json({ error: "Failed to get rights information", message: String(err) });
  }
});

export default router;
