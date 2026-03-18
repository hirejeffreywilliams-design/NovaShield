import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

interface PostBoardInfo {
  state: string;
  stateName: string;
  boardName: string;
  lookupUrl: string;
  boardUrl: string;
  phone?: string;
  notes: string;
}

const POST_BOARDS: Record<string, PostBoardInfo> = {
  AL: { state: "AL", stateName: "Alabama", boardName: "Alabama Peace Officers' Standards and Training Commission", lookupUrl: "https://www.apostc.state.al.us/Certification.aspx", boardUrl: "https://www.apostc.state.al.us", notes: "Search by officer name or agency" },
  AK: { state: "AK", stateName: "Alaska", boardName: "Alaska Police Standards Council", lookupUrl: "https://dps.alaska.gov/APSC/Certification", boardUrl: "https://dps.alaska.gov/APSC", notes: "Contact APSC for officer status" },
  AZ: { state: "AZ", stateName: "Arizona", boardName: "Arizona Peace Officer Standards and Training Board", lookupUrl: "https://www.azpost.gov/officer-certification-status", boardUrl: "https://www.azpost.gov", notes: "Online officer status lookup available" },
  AR: { state: "AR", stateName: "Arkansas", boardName: "Arkansas Commission on Law Enforcement Standards and Training", lookupUrl: "https://www.clest.org/verify", boardUrl: "https://www.clest.org", notes: "Officer certification verification" },
  CA: { state: "CA", stateName: "California", boardName: "California Commission on Peace Officer Standards and Training (CA POST)", lookupUrl: "https://post.ca.gov/officer-search", boardUrl: "https://post.ca.gov", phone: "(916) 227-3909", notes: "California has the most comprehensive public officer lookup — includes training records and certifications" },
  CO: { state: "CO", stateName: "Colorado", boardName: "Colorado Peace Officer Standards and Training Board", lookupUrl: "https://www.colorado.gov/pacific/post/officer-certification-verification", boardUrl: "https://www.colorado.gov/pacific/post", notes: "Certification status verification" },
  CT: { state: "CT", stateName: "Connecticut", boardName: "Connecticut Police Officer Standards and Training Council", lookupUrl: "https://portal.ct.gov/POST/Officer-Certification", boardUrl: "https://portal.ct.gov/POST", notes: "Contact POST for officer status" },
  DE: { state: "DE", stateName: "Delaware", boardName: "Delaware Council on Police Training", lookupUrl: "https://dsp.delaware.gov/council-on-police-training", boardUrl: "https://dsp.delaware.gov/council-on-police-training", notes: "Submit public records request for officer status" },
  FL: { state: "FL", stateName: "Florida", boardName: "Florida Department of Law Enforcement – Criminal Justice Standards and Training", lookupUrl: "https://www.fdle.state.fl.us/Criminal-History-Records/Criminal-Justice-Agency-Certification", boardUrl: "https://www.fdle.state.fl.us/CJSTC", phone: "(850) 410-8600", notes: "Florida has public officer certification verification" },
  GA: { state: "GA", stateName: "Georgia", boardName: "Georgia Peace Officer Standards and Training Council", lookupUrl: "https://www.gapost.org/officer-lookup", boardUrl: "https://www.gapost.org", notes: "Georgia POST officer certification lookup" },
  HI: { state: "HI", stateName: "Hawaii", boardName: "Hawaii State Law Enforcement Standards Board", lookupUrl: "https://slesb.hawaii.gov/certification", boardUrl: "https://slesb.hawaii.gov", notes: "Contact SLESB for certification records" },
  ID: { state: "ID", stateName: "Idaho", boardName: "Idaho Peace Officer Standards and Training Academy", lookupUrl: "https://post.idaho.gov/certifications", boardUrl: "https://post.idaho.gov", notes: "Officer certification records" },
  IL: { state: "IL", stateName: "Illinois", boardName: "Illinois Law Enforcement Training and Standards Board", lookupUrl: "https://www.iletsb.com/officer-lookup", boardUrl: "https://www.iletsb.com", notes: "Illinois passed mandatory decertification law in 2021" },
  IN: { state: "IN", stateName: "Indiana", boardName: "Indiana Law Enforcement Academy", lookupUrl: "https://www.in.gov/ilea/certification", boardUrl: "https://www.in.gov/ilea", notes: "Officer certification status" },
  IA: { state: "IA", stateName: "Iowa", boardName: "Iowa Law Enforcement Academy", lookupUrl: "https://ilea.iowa.gov/officer-certification", boardUrl: "https://ilea.iowa.gov", notes: "ILEA certification records" },
  KS: { state: "KS", stateName: "Kansas", boardName: "Kansas Law Enforcement Training Center", lookupUrl: "https://www.kletc.org/officer-certification", boardUrl: "https://www.kletc.org", notes: "Officer certification verification" },
  KY: { state: "KY", stateName: "Kentucky", boardName: "Kentucky Law Enforcement Council", lookupUrl: "https://klecs.ky.gov/certification", boardUrl: "https://klecs.ky.gov", notes: "Certification records and training" },
  LA: { state: "LA", stateName: "Louisiana", boardName: "Louisiana Commission on Law Enforcement", lookupUrl: "https://www.lcle.la.gov/programs/post.asp", boardUrl: "https://www.lcle.la.gov", notes: "POST certification lookup" },
  ME: { state: "ME", stateName: "Maine", boardName: "Maine Criminal Justice Academy", lookupUrl: "https://www.maine.gov/dps/mcja/certification", boardUrl: "https://www.maine.gov/dps/mcja", notes: "Officer certification records" },
  MD: { state: "MD", stateName: "Maryland", boardName: "Maryland Police Training and Standards Commission", lookupUrl: "https://www.mdle.net/certification", boardUrl: "https://www.mdle.net", notes: "Certification and training records" },
  MA: { state: "MA", stateName: "Massachusetts", boardName: "Massachusetts Peace Officer Standards and Training Commission", lookupUrl: "https://www.mass.gov/orgs/peace-officer-standards-and-training-commission", boardUrl: "https://www.mass.gov/orgs/peace-officer-standards-and-training-commission", notes: "Massachusetts created POST Commission in 2020 with decertification powers" },
  MI: { state: "MI", stateName: "Michigan", boardName: "Michigan Commission on Law Enforcement Standards", lookupUrl: "https://www.michigan.gov/mcoles/certifications", boardUrl: "https://www.michigan.gov/mcoles", notes: "MCOLES officer certification lookup" },
  MN: { state: "MN", stateName: "Minnesota", boardName: "Minnesota Board of Peace Officer Standards and Training", lookupUrl: "https://dps.mn.gov/entity/post/officer-licensing", boardUrl: "https://dps.mn.gov/entity/post", notes: "Officer licensing and discipline records" },
  MS: { state: "MS", stateName: "Mississippi", boardName: "Mississippi Board on Law Enforcement Officer Standards and Training", lookupUrl: "https://www.bleost.ms.gov/certifications", boardUrl: "https://www.bleost.ms.gov", notes: "Certification records" },
  MO: { state: "MO", stateName: "Missouri", boardName: "Missouri Department of Public Safety – Peace Officer Standards and Training Program", lookupUrl: "https://dps.mo.gov/dir/post", boardUrl: "https://dps.mo.gov/dir/post", notes: "POST program certification" },
  MT: { state: "MT", stateName: "Montana", boardName: "Montana Public Safety Officer Standards and Training", lookupUrl: "https://doj.mt.gov/post/certification", boardUrl: "https://doj.mt.gov/post", notes: "Officer certification lookup" },
  NE: { state: "NE", stateName: "Nebraska", boardName: "Nebraska Law Enforcement Training Center", lookupUrl: "https://nletc.nebraska.gov/certification", boardUrl: "https://nletc.nebraska.gov", notes: "Certification status" },
  NV: { state: "NV", stateName: "Nevada", boardName: "Nevada Commission on Peace Officers' Standards and Training", lookupUrl: "https://post.nv.gov/Certification/Officer_Lookup", boardUrl: "https://post.nv.gov", notes: "Online officer lookup available" },
  NH: { state: "NH", stateName: "New Hampshire", boardName: "New Hampshire Police Standards and Training Council", lookupUrl: "https://www.pstc.nh.gov/certifications", boardUrl: "https://www.pstc.nh.gov", notes: "Certification records" },
  NJ: { state: "NJ", stateName: "New Jersey", boardName: "New Jersey Police Training Commission", lookupUrl: "https://www.nj.gov/lps/jsc/", boardUrl: "https://www.nj.gov/lps/jsc", phone: "(609) 984-0058", notes: "Contact commission for officer records" },
  NM: { state: "NM", stateName: "New Mexico", boardName: "New Mexico Law Enforcement Academy", lookupUrl: "https://nmlea.dps.nm.gov/certification", boardUrl: "https://nmlea.dps.nm.gov", notes: "Certification and training records" },
  NY: { state: "NY", stateName: "New York", boardName: "New York Division of Criminal Justice Services – Municipal Police Training Council", lookupUrl: "https://www.criminaljustice.ny.gov/ops/", boardUrl: "https://www.criminaljustice.ny.gov", notes: "NY created new transparency requirements in 2020 (S8496)" },
  NC: { state: "NC", stateName: "North Carolina", boardName: "North Carolina Criminal Justice Education and Training Standards Commission", lookupUrl: "https://www.ncdoj.gov/law-enforcement/training-certification", boardUrl: "https://www.ncdoj.gov", notes: "Officer certification" },
  ND: { state: "ND", stateName: "North Dakota", boardName: "North Dakota Peace Officer Standards and Training Board", lookupUrl: "https://www.nd.gov/post/officer-status", boardUrl: "https://www.nd.gov/post", notes: "Officer certification status" },
  OH: { state: "OH", stateName: "Ohio", boardName: "Ohio Peace Officer Training Commission", lookupUrl: "https://www.ohioattorneygeneral.gov/Law-Enforcement/Ohio-Peace-Officer-Training-Commission", boardUrl: "https://www.ohioattorneygeneral.gov", notes: "Certification and training records" },
  OK: { state: "OK", stateName: "Oklahoma", boardName: "Council on Law Enforcement Education and Training", lookupUrl: "https://www.cleet.ok.gov/certification", boardUrl: "https://www.cleet.ok.gov", notes: "Officer certification lookup" },
  OR: { state: "OR", stateName: "Oregon", boardName: "Oregon Department of Public Safety Standards and Training", lookupUrl: "https://www.oregon.gov/dpsst/certification", boardUrl: "https://www.oregon.gov/dpsst", notes: "Oregon has strong transparency laws — officer misconduct public" },
  PA: { state: "PA", stateName: "Pennsylvania", boardName: "Municipal Police Officers' Education and Training Commission", lookupUrl: "https://www.mpoetc.pa.gov/Pages/officer-certification.aspx", boardUrl: "https://www.mpoetc.pa.gov", notes: "Officer certification records" },
  RI: { state: "RI", stateName: "Rhode Island", boardName: "Rhode Island Municipal Police Training Academy", lookupUrl: "https://www.rimpta.com/certification", boardUrl: "https://www.rimpta.com", notes: "Training and certification" },
  SC: { state: "SC", stateName: "South Carolina", boardName: "South Carolina Criminal Justice Academy", lookupUrl: "https://www.sccja.sc.gov/certifications", boardUrl: "https://www.sccja.sc.gov", notes: "Officer certification records" },
  SD: { state: "SD", stateName: "South Dakota", boardName: "South Dakota Law Enforcement Training Center", lookupUrl: "https://letc.sd.gov/certification", boardUrl: "https://letc.sd.gov", notes: "Certification status" },
  TN: { state: "TN", stateName: "Tennessee", boardName: "Tennessee Peace Officers Standards and Training Commission", lookupUrl: "https://www.tnpost.com/officer-lookup", boardUrl: "https://www.tnpost.com", notes: "Officer certification" },
  TX: { state: "TX", stateName: "Texas", boardName: "Texas Commission on Law Enforcement (TCOLE)", lookupUrl: "https://www.tcole.texas.gov/content/verification-licensure", boardUrl: "https://www.tcole.texas.gov", phone: "(512) 936-7700", notes: "Texas has public officer license verification — search by name or license number" },
  UT: { state: "UT", stateName: "Utah", boardName: "Utah Peace Officer Standards and Training Bureau", lookupUrl: "https://post.utah.gov/officer-search", boardUrl: "https://post.utah.gov", notes: "Officer certification lookup" },
  VT: { state: "VT", stateName: "Vermont", boardName: "Vermont Criminal Justice Council", lookupUrl: "https://vcjc.vermont.gov/certification", boardUrl: "https://vcjc.vermont.gov", notes: "Certification records" },
  VA: { state: "VA", stateName: "Virginia", boardName: "Virginia Department of Criminal Justice Services", lookupUrl: "https://www.dcjs.virginia.gov/law-enforcement/officer-certification", boardUrl: "https://www.dcjs.virginia.gov", notes: "Officer certification verification" },
  WA: { state: "WA", stateName: "Washington", boardName: "Washington State Criminal Justice Training Commission", lookupUrl: "https://www.cjtc.wa.gov/officer-license-status", boardUrl: "https://www.cjtc.wa.gov", phone: "(206) 835-7300", notes: "Washington has online officer license lookup" },
  WV: { state: "WV", stateName: "West Virginia", boardName: "West Virginia Division of Justice and Community Services", lookupUrl: "https://djcs.wv.gov/LEP/Pages/Certification-Status.aspx", boardUrl: "https://djcs.wv.gov", notes: "Officer certification" },
  WI: { state: "WI", stateName: "Wisconsin", boardName: "Wisconsin Law Enforcement Standards Board", lookupUrl: "https://lesb.wi.gov/certification", boardUrl: "https://lesb.wi.gov", notes: "Officer certification status" },
  WY: { state: "WY", stateName: "Wyoming", boardName: "Wyoming Peace Officer Standards and Training Commission", lookupUrl: "https://post.wy.gov/officer-lookup", boardUrl: "https://post.wy.gov", notes: "Certification records" },
  DC: { state: "DC", stateName: "Washington D.C.", boardName: "DC Metropolitan Police Department – Office of Professional Responsibility", lookupUrl: "https://mpdc.dc.gov/service/police-disciplinary-records", boardUrl: "https://mpdc.dc.gov", notes: "DC has strong transparency — misconduct records and disciplinary outcomes are public" },
};

const ACCOUNTABILITY_RESOURCES: Record<string, Array<{ name: string; url: string; description: string; type: string }>> = {
  CA: [
    { name: "OpenJustice – CA DOJ Use of Force Data", url: "https://openjustice.doj.ca.gov/exploration/officer-involved-shootings", description: "Statewide use-of-force and officer-involved shooting data", type: "State Database" },
    { name: "CA POST Officer Search", url: "https://post.ca.gov/officer-search", description: "Verify officer certification and training records", type: "POST Board" },
    { name: "SB 16 Records (AB 748/SB 1421)", url: "https://www.aclunc.org/police-accountability-resources", description: "California transparency law — serious misconduct records are public", type: "Transparency Law" },
  ],
  NY: [
    { name: "NYC Civilian Complaint Review Board", url: "https://www.nyc.gov/site/ccrb/index.page", description: "NYPD civilian complaint records — searchable database", type: "Misconduct DB" },
    { name: "NYPD Misconduct Database", url: "https://nyclu.org/en/campaigns/nypd-misconduct-database", description: "ACLU searchable database of NYPD officer misconduct", type: "Misconduct DB" },
    { name: "NY Attorney General Police Reform", url: "https://ag.ny.gov/civil-rights/police-reform", description: "State AG civil rights enforcement and complaint filing", type: "State AG" },
  ],
  IL: [
    { name: "Citizens Police Data Project – Chicago", url: "https://invisible.institute/police-data", description: "Chicago PD misconduct records — searchable by officer name", type: "Misconduct DB" },
    { name: "COPA – Chicago Civilian Oversight", url: "https://www.chicagocopa.org", description: "Civilian complaint investigations and outcomes for Chicago PD", type: "Oversight Board" },
    { name: "IL Decertified Officers Database", url: "https://www.iletsb.com/decertified-officers", description: "Officers whose certifications have been revoked in Illinois", type: "State Database" },
  ],
  TX: [
    { name: "TCOLE License Verification", url: "https://www.tcole.texas.gov/content/verification-licensure", description: "Verify Texas officer license status by name or license number", type: "POST Board" },
    { name: "Texas Tribune Police Discipline", url: "https://www.texastribune.org/2021/05/13/texas-police-discipline-misconduct", description: "Investigation into Texas police discipline records", type: "Journalism" },
  ],
  FL: [
    { name: "FDLE Officer Certification", url: "https://www.fdle.state.fl.us/CJSTC", description: "Verify Florida officer certification status", type: "POST Board" },
    { name: "FL Domestic Violence Offender Search", url: "https://www.fdle.state.fl.us/Criminal-History-Records", description: "Public records on officers with domestic violence convictions", type: "State Database" },
  ],
};

const DEFAULT_ACCOUNTABILITY = [
  { name: "ProPublica – Police Misconduct Database", url: "https://projects.propublica.org/credibility", description: "National database of officers with credibility issues", type: "National DB" },
  { name: "The Invisible Institute – National", url: "https://invisible.institute", description: "Investigative journalism on police accountability data", type: "Journalism" },
  { name: "Mapping Police Violence", url: "https://mappingpoliceviolence.org", description: "Comprehensive database of police killings in the US", type: "National DB" },
  { name: "MuckRock FOIA Center", url: "https://www.muckrock.com", description: "File public records requests and browse existing police records", type: "FOIA Resource" },
  { name: "The Marshall Project – Police Accountability", url: "https://www.themarshallproject.org/records/police-accountability", description: "Nonprofit news tracking the U.S. criminal justice system", type: "Journalism" },
  { name: "National Decertification Index", url: "https://thelearningportal.net/ndi/ndi-search", description: "IADLEST national index of decertified officers across states", type: "National DB" },
];

async function queryOverpass(lat: number, lng: number, radiusMeters: number): Promise<any[]> {
  const query = `[out:json][timeout:15];(node["amenity"="police"](around:${radiusMeters},${lat},${lng});way["amenity"="police"](around:${radiusMeters},${lat},${lng});relation["amenity"="police"](around:${radiusMeters},${lat},${lng}););out body center qt;`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);
  const data = await response.json() as { elements: any[] };
  return data.elements || [];
}

function parseOsmElement(el: any, userLat: number, userLng: number) {
  const tags = el.tags || {};
  const elLat = el.lat ?? el.center?.lat;
  const elLng = el.lon ?? el.center?.lon;

  let distanceKm: number | null = null;
  if (elLat && elLng) {
    const R = 6371;
    const dLat = ((elLat - userLat) * Math.PI) / 180;
    const dLng = ((elLng - userLng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLat * Math.PI) / 180) * Math.cos((elLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const name = tags.name || tags["name:en"] || "Police Station";
  const operator = tags.operator || tags.agency || null;
  const phone = tags.phone || tags["contact:phone"] || null;
  const website = tags.website || tags["contact:website"] || null;
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = tags["addr:city"] || null;
  const state = tags["addr:state"] || null;
  const address = [street, city, state].filter(Boolean).join(", ") || null;

  return {
    id: `osm_${el.id}`,
    osm_id: el.id,
    osm_type: el.type,
    name,
    operator,
    address,
    phone,
    website,
    latitude: elLat || null,
    longitude: elLng || null,
    distance_km: distanceKm ? Math.round(distanceKm * 100) / 100 : null,
    distance_miles: distanceKm ? Math.round(distanceKm * 0.621371 * 100) / 100 : null,
    source: "OpenStreetMap",
  };
}

router.get("/nearby", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseInt(req.query.radius as string) || 8000;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const elements = await queryOverpass(lat, lng, radius);
    const departments = elements
      .map((el) => parseOsmElement(el, lat, lng))
      .filter((d) => d.name !== "Police Station" || d.operator)
      .sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999))
      .slice(0, 15);

    res.json({
      departments,
      total: departments.length,
      search_radius_km: radius / 1000,
      center: { lat, lng },
      source: "OpenStreetMap Overpass API — data © OpenStreetMap contributors",
      data_note: "Department locations sourced from OpenStreetMap, a verified crowdsourced mapping dataset used by government agencies worldwide.",
    });
  } catch (err) {
    console.error("Overpass error:", err);
    res.status(500).json({ error: "Failed to find nearby departments", message: String(err) });
  }
});

router.get("/post-board", async (req, res) => {
  try {
    const { state } = req.query as { state?: string };
    if (!state) {
      return res.json({ boards: Object.values(POST_BOARDS) });
    }
    const board = POST_BOARDS[state.toUpperCase()];
    if (!board) return res.status(404).json({ error: "State not found" });
    res.json({ board });
  } catch (err) {
    res.status(500).json({ error: "Failed to get POST board info", message: String(err) });
  }
});

router.get("/accountability", async (req, res) => {
  try {
    const { state } = req.query as { state?: string };
    const stateKey = state?.toUpperCase();
    const stateResources = stateKey ? (ACCOUNTABILITY_RESOURCES[stateKey] || []) : [];
    const combined = [...stateResources, ...DEFAULT_ACCOUNTABILITY];
    res.json({
      resources: combined,
      state: stateKey || null,
      disclaimer: "These are publicly available databases and official government resources. All data originates from verified public records, court documents, FOIA responses, and official government databases.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get accountability resources", message: String(err) });
  }
});

router.post("/foia-request", async (req, res) => {
  try {
    const { department_name, officer_badge, officer_name, incident_date, state } = req.body;
    if (!department_name) return res.status(400).json({ error: "department_name is required" });

    const prompt = `Generate a proper FOIA (Freedom of Information Act) or state open records law request letter for police records. Use formal legal language. Make it comprehensive but concise.

Request details:
- Department: ${department_name}
- State: ${state || "Unknown"}
- Officer Badge: ${officer_badge || "Not specified"}
- Officer Name: ${officer_name || "Not specified"}
- Incident Date: ${incident_date || "Not specified"}

Generate a complete, professional FOIA letter requesting:
1. All use-of-force reports involving this officer
2. All civilian complaint records for this officer
3. The officer's disciplinary history
4. Any body camera or dash camera footage from the incident
5. The officer's training and certification records
6. Any internal affairs investigations

If a state other than federal is specified, reference the appropriate state open records law (e.g., California Public Records Act, Texas Public Information Act, New York FOIL, etc.) in addition to the federal FOIA.

Include specific cite to the law, timeframes for response, and assertion of fee waiver as a member of the public.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const letter = response.choices[0]?.message?.content || "Unable to generate letter.";
    res.json({
      letter,
      instructions: [
        "Send via certified mail with return receipt to the department's records custodian",
        "Keep a copy of the letter and the mailing receipt",
        "Most agencies must respond within 10-30 days depending on state law",
        "You can follow up or appeal a denial to the state attorney general",
      ],
      resources: [
        { name: "MuckRock – FOIA Filing Help", url: "https://www.muckrock.com/foi/create/", description: "Free platform to file and track FOIA requests" },
        { name: "ACLU – How to File a FOIA", url: "https://www.aclu.org/know-your-rights/your-right-government-information", description: "ACLU guide to public records requests" },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate FOIA letter", message: String(err) });
  }
});

export default router;
