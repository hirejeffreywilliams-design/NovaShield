import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { officersTable, disciplinaryRecordsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const officers = await db.select().from(officersTable).orderBy(officersTable.created_at);
    res.json({ officers });
  } catch (err) {
    res.status(500).json({ error: "Failed to list officers", message: String(err) });
  }
});

router.post("/resolve", async (req, res) => {
  try {
    const { badge_number, badge_text } = req.body;
    const badge = badge_number || badge_text;
    if (!badge) {
      return res.json({ found: false, badge_number: badge || "", officer: null });
    }
    const [officer] = await db
      .select()
      .from(officersTable)
      .where(eq(officersTable.badge_no, badge));
    res.json({ found: !!officer, badge_number: badge, officer: officer || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve officer", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, badge_no, agency, rank, department, notes } = req.body;
    const [officer] = await db
      .insert(officersTable)
      .values({ name, badge_no, agency, rank, department, notes })
      .returning();
    res.status(201).json(officer);
  } catch (err) {
    res.status(500).json({ error: "Failed to create officer", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [officer] = await db
      .select()
      .from(officersTable)
      .where(eq(officersTable.id, req.params.id));
    if (!officer) return res.status(404).json({ error: "Officer not found" });
    res.json(officer);
  } catch (err) {
    res.status(500).json({ error: "Failed to get officer", message: String(err) });
  }
});

router.get("/:id/disciplinary", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(disciplinaryRecordsTable)
      .where(eq(disciplinaryRecordsTable.officer_id, req.params.id))
      .orderBy(desc(disciplinaryRecordsTable.created_at));
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: "Failed to list disciplinary records", message: String(err) });
  }
});

router.post("/:id/disciplinary", async (req, res) => {
  try {
    const { type, title, description, incident_date, source_name, source_url, outcome } = req.body;
    if (!type || !title || !source_name) {
      return res.status(400).json({ error: "type, title, and source_name are required" });
    }
    const [record] = await db
      .insert(disciplinaryRecordsTable)
      .values({
        officer_id: req.params.id,
        type,
        title,
        description,
        incident_date,
        source_name,
        source_url,
        outcome,
      })
      .returning();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to create disciplinary record", message: String(err) });
  }
});

router.delete("/:id/disciplinary/:recordId", async (req, res) => {
  try {
    await db
      .delete(disciplinaryRecordsTable)
      .where(eq(disciplinaryRecordsTable.id, req.params.recordId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete disciplinary record", message: String(err) });
  }
});

const NATIONAL_POLICE_INDEX_STATES: Record<string, string> = {
  AL: "Alabama", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", FL: "Florida", GA: "Georgia", IL: "Illinois", IN: "Indiana",
  KS: "Kansas", KY: "Kentucky", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MO: "Missouri", NC: "North Carolina", OH: "Ohio", OR: "Oregon",
  TN: "Tennessee", TX: "Texas", VA: "Virginia", WA: "Washington",
};

const CITY_SPECIFIC_DATABASES: Record<string, { name: string; url: string; description: string }[]> = {
  "new york": [
    { name: "50-a.org — NYPD Misconduct Database", url: "https://www.50-a.org/search", description: "520,000+ allegations against 96,500+ NYPD officers. Most comprehensive city police misconduct database in the US." },
    { name: "ProPublica NYPD Files", url: "https://projects.propublica.org/nypd-ccrb/", description: "~4,000 NYPD officers with substantiated misconduct allegations (1985–2020)" },
    { name: "NYC CCRB Open Data", url: "https://data.cityofnewyork.us/Public-Safety/Civilian-Complaint-Review-Board-CCRB-Complaints/8uh8-7bmz", description: "Official NYC Civilian Complaint Review Board complaint data" },
  ],
  "chicago": [
    { name: "Invisible Institute — CPDP", url: "https://invisible.institute/police-data", description: "Comprehensive Chicago Police Department disciplinary data (1988–present): misconduct, use of force, officer demographics, complaint outcomes" },
  ],
  "los angeles": [
    { name: "CA POST Commission — Officer Records", url: "https://post.ca.gov/officer-search", description: "California POST officer certification and disciplinary history" },
    { name: "CA DOJ — OpenJustice", url: "https://openjustice.doj.ca.gov/data", description: "California DOJ use of force and misconduct data by agency" },
  ],
  "philadelphia": [
    { name: "OpenDataPhilly — Police Complaints", url: "https://opendataphilly.org/datasets/complaints-against-police/", description: "Philadelphia police complaint data updated monthly — past 5 years of civilian complaints with findings and outcomes" },
  ],
  "minneapolis": [
    { name: "CUAPB — Minneapolis Police Complaints", url: "https://complaints.cuapb.org/", description: "Communities United Against Police Brutality — Minneapolis police complaints archive via public records" },
  ],
};

router.get("/:id/public-links", async (req, res) => {
  try {
    const { state, agency, name } = req.query as { state?: string; agency?: string; name?: string };

    const stateUpper = (state || "").toUpperCase().trim();
    const agencyLower = (agency || "").toLowerCase();
    const encodedName = encodeURIComponent(name || "");
    const encodedAgency = encodeURIComponent(agency || "");

    const links: Array<{ name: string; url: string; description: string; category: string; covered: boolean }> = [];

    const npiStateName = NATIONAL_POLICE_INDEX_STATES[stateUpper];
    if (npiStateName) {
      const stateLower = npiStateName.toLowerCase().replace(/ /g, "-");
      links.push({
        name: `National Police Index — ${npiStateName}`,
        url: `https://national.cpdp.co/states/${stateLower}`,
        description: `Employment history, certification status, and disciplinary actions for officers in ${npiStateName}. Covers 24 states — updated from state certification boards.`,
        category: "National Database",
        covered: true,
      });
    } else if (stateUpper) {
      links.push({
        name: "National Police Index",
        url: "https://national.cpdp.co",
        description: `National Police Index covers 24 states. ${stateUpper} is not yet included — check back as coverage expands.`,
        category: "National Database",
        covered: false,
      });
    } else {
      links.push({
        name: "National Police Index",
        url: "https://national.cpdp.co",
        description: "Employment history, disciplinary actions, and certification status for officers in 24 states. Enter officer name to search.",
        category: "National Database",
        covered: true,
      });
    }

    links.push({
      name: "Police Scorecard — Department Accountability",
      url: agencyLower
        ? `https://policescorecard.org/find?type=local&location=${encodedAgency}`
        : "https://policescorecard.org",
      description: "Nationwide public evaluation of police departments. See this department's use of force rate, complaint sustain rate, racial bias score, and accountability grade across 16,000+ agencies.",
      category: "Department Data",
      covered: true,
    });

    links.push({
      name: "Mapping Police Violence",
      url: "https://mappingpoliceviolence.us/aboutthedata",
      description: "Database of all police killings in the US since 2013. Check if this officer or department has a history of fatal force incidents.",
      category: "Use of Force",
      covered: true,
    });

    links.push({
      name: "ProPublica — Police Data",
      url: "https://www.propublica.org/datastore/datasets/criminal-justice",
      description: "ProPublica maintains multiple police accountability datasets. Search their data store for your jurisdiction.",
      category: "Investigative Data",
      covered: true,
    });

    links.push({
      name: "IADLEST National Decertification Index",
      url: "https://www.iadlest.org/our-programs/ndi",
      description: "National database of decertified officers — law enforcement who have had their certification revoked or denied across participating states.",
      category: "Decertification",
      covered: true,
    });

    links.push({
      name: "Vera Institute — Police Data Directory",
      url: "https://github.com/vera-institute/PD_Data_Directory/blob/master/PD_Data_Directory.csv",
      description: "Comprehensive directory of 72+ city police department data portals. Find your city's official open data about police activity.",
      category: "Data Directory",
      covered: true,
    });

    const cityDbLinks: typeof links = [];
    for (const [cityKey, cityDbs] of Object.entries(CITY_SPECIFIC_DATABASES)) {
      if (agencyLower.includes(cityKey)) {
        for (const db of cityDbs) {
          cityDbLinks.push({ ...db, category: "City-Specific Database", covered: true });
        }
      }
    }

    if (stateUpper === "CA") {
      if (!cityDbLinks.some(l => l.url.includes("post.ca.gov"))) {
        cityDbLinks.push({
          name: "California POST — Officer Search",
          url: "https://post.ca.gov/officer-search",
          description: "CA POST Commission officer certification, decertification, and disciplinary history (SB 1421/SB 16 disclosures)",
          category: "State Database",
          covered: true,
        });
      }
    } else if (stateUpper === "NY") {
      if (!cityDbLinks.some(l => l.url.includes("50-a.org"))) {
        cityDbLinks.push({
          name: "NY — Office of the Attorney General Police Data",
          url: "https://ag.ny.gov/bureau/civil-rights-bureau",
          description: "NY AG Civil Rights Bureau tracks police misconduct and can investigate complaints statewide.",
          category: "State Database",
          covered: true,
        });
      }
    } else if (stateUpper === "MA") {
      cityDbLinks.push({
        name: "Massachusetts POST — Disciplinary Records",
        url: "https://mapostcommission.gov/discipline-status-records/disciplinary-records/",
        description: "Massachusetts POST Commission disciplinary records — searchable database of sustained officer discipline (updated monthly).",
        category: "State Database",
        covered: true,
      });
    }

    const allLinks = [...cityDbLinks, ...links];
    res.json({ links: allLinks, state: stateUpper, covered_by_npi: !!npiStateName });
  } catch (err) {
    res.status(500).json({ error: "Failed to get public links", message: String(err) });
  }
});

export default router;
