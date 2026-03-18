import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const IMMIGRATION_SYSTEM_PROMPT = `You are a verified immigration rights legal assistant for a civil rights accountability app. You ONLY answer questions about immigration law, ICE/CBP encounters, detentions, deportation proceedings, and immigration rights.

CRITICAL RULES:
1. You MUST cite only these verified, authoritative sources. NEVER cite anything else:
   - ACLU (aclu.org) — American Civil Liberties Union
   - NILC (nilc.org) — National Immigration Law Center
   - ILRC (ilrc.org) — Immigrant Legal Resource Center
   - USCIS (uscis.gov) — US Citizenship and Immigration Services (official gov)
   - ICE (ice.gov) — US Immigration and Customs Enforcement (official gov policy)
   - CBP (cbp.gov) — US Customs and Border Protection (official gov)
   - DOJ EOIR (justice.gov/eoir) — Executive Office for Immigration Review
   - RAICES (raicestexas.org) — immigration legal defense organization
   - Immigrant Defense Project (immigrantdefenseproject.org)
   - National Immigration Forum (immigrationforum.org)

2. For EVERY legal claim, cite the specific source and if possible the relevant case law or statute.

3. Key verified legal facts you MUST use accurately:
   - The 4th Amendment applies to ALL people in the US regardless of immigration status (Plyler v. Doe, 457 U.S. 202 (1982); Zadvydas v. Davis, 533 U.S. 678 (2001))
   - ICE CANNOT enter a home without a JUDICIAL warrant signed by a federal judge — administrative warrants (Form I-200, I-205) do NOT authorize home entry
   - The 5th Amendment right to remain silent applies to everyone regardless of status
   - People have the right to refuse consent to searches
   - People should NOT sign ANY immigration forms without a lawyer
   - CBP has expanded jurisdiction within 100 miles of any US border
   - "Sensitive locations" (schools, hospitals, churches, playgrounds, funerals) are protected by ICE policy (though this is policy, not law — it can change)

4. If you do not know the answer or it requires specific legal advice for someone's individual situation, say so clearly and direct them to contact ACLU (1-212-549-2500) or a local immigration attorney.

5. Format with clear sections. When you cite a source, put the URL in parentheses. Be specific and practical — people need to know EXACTLY what to say and do.

6. This is for safety — people's lives and liberty are at stake. Be accurate, clear, and actionable.`;

router.post("/immigration/question", async (req, res) => {
  try {
    const { question, state, context } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question is required" });
    }

    const contextNote = state ? `The user is in ${state}.` : "";
    const situationNote = context ? `Current situation: ${context}` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: IMMIGRATION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `${contextNote} ${situationNote}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = response.choices[0]?.message?.content || "Unable to generate response.";
    res.json({ answer, question, state, context });
  } catch (err) {
    console.error("Immigration Q&A error:", err);
    res.status(500).json({ error: "Failed to generate response", message: String(err) });
  }
});

router.get("/immigration/resources", async (req, res) => {
  res.json({
    emergency_hotlines: [
      { name: "ACLU National Hotline", phone: "1-212-549-2500", url: "https://www.aclu.org", note: "Immigration rights" },
      { name: "NILC Hotline", phone: "1-213-639-3900", url: "https://www.nilc.org", note: "National Immigration Law Center" },
      { name: "RAICES", phone: "1-512-994-2199", url: "https://www.raicestexas.org", note: "Immigration legal defense" },
      { name: "DOJ EOIR", phone: "1-800-898-7180", url: "https://www.justice.gov/eoir", note: "Immigration court information" },
      { name: "ICE Detention Reporting", phone: "1-888-351-4024", url: "https://www.ice.gov", note: "Report ICE misconduct" },
      { name: "DHS Office of Inspector General", phone: "1-800-323-8603", url: "https://www.oig.dhs.gov", note: "Report DHS abuse/misconduct" },
    ],
    state_aclu_offices: [
      { state: "Alabama", phone: "1-334-265-2754", url: "https://www.aclual.org" },
      { state: "Alaska", phone: "1-907-276-2658", url: "https://www.acluak.org" },
      { state: "Arizona", phone: "1-602-650-1854", url: "https://www.acluaz.org" },
      { state: "Arkansas", phone: "1-501-374-2842", url: "https://www.acluark.org" },
      { state: "California", phone: "1-213-977-9500", url: "https://www.aclu-ca.org" },
      { state: "Colorado", phone: "1-720-402-3100", url: "https://www.aclu-co.org" },
      { state: "Connecticut", phone: "1-860-523-9146", url: "https://www.acluct.org" },
      { state: "Florida", phone: "1-786-363-2700", url: "https://www.aclufl.org" },
      { state: "Georgia", phone: "1-404-523-6201", url: "https://www.acluga.org" },
      { state: "Illinois", phone: "1-312-201-9740", url: "https://www.aclu-il.org" },
      { state: "New York", phone: "1-212-607-3300", url: "https://www.nyclu.org" },
      { state: "Texas", phone: "1-512-478-7300", url: "https://www.aclutx.org" },
      { state: "Washington", phone: "1-206-624-2184", url: "https://www.aclu-wa.org" },
    ],
    verified_sources: [
      { name: "ACLU Immigrants' Rights", url: "https://www.aclu.org/know-your-rights/immigrants-rights", description: "Full Know Your Rights guide for immigrants" },
      { name: "NILC Know Your Rights", url: "https://www.nilc.org/get-involved/community-education-resources/know-your-rights/", description: "National Immigration Law Center rights guide" },
      { name: "ILRC Red Cards", url: "https://www.ilrc.org/red-cards", description: "Know your rights cards in multiple languages" },
      { name: "USCIS Know Your Rights", url: "https://www.uscis.gov/", description: "Official US government immigration information" },
      { name: "ICE ERO Policy", url: "https://www.ice.gov/features/ero", description: "Official ICE enforcement policies" },
      { name: "CBP Rights", url: "https://www.cbp.gov", description: "US Customs and Border Protection official guidance" },
      { name: "DOJ EOIR", url: "https://www.justice.gov/eoir", description: "Immigration court information and resources" },
    ],
  });
});

export default router;
