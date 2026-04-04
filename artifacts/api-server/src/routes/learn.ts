import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  policyKnowledgeTable,
  analysisResultsTable,
  analysisFeedbackTable,
} from "@workspace/db/schema";
import { eq, desc, and, ilike, sql, inArray } from "drizzle-orm";

const router: IRouter = Router();

const SEED_POLICIES = [
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Graham v. Connor — Objective Reasonableness Standard (1989)",
    content: `The Fourth Amendment's prohibition against unreasonable seizures governs claims of excessive force against law enforcement officers. The 'reasonableness' of a particular use of force must be judged from the perspective of a reasonable officer on the scene, rather than with 20/20 hindsight. Key factors: (1) severity of the crime, (2) whether the suspect poses an immediate threat to safety, (3) whether the suspect is actively resisting arrest or evading arrest by flight. Reasonableness is not capable of precise definition or mechanical application. The calculus of reasonableness must embody allowance for the fact that police officers are often forced to make split-second judgments. Visual indicators of excessive force violations: officers using force against a person who is clearly compliant, handcuffed, prone, or not resisting; use of force after control is established; multiple officers striking a restrained person; force disproportionate to the threat level visible in the scene.`,
    legal_authority: "Graham v. Connor, 490 U.S. 386 (1989) — https://supreme.justia.com/cases/federal/us/490/386/",
    source_url: "https://supreme.justia.com/cases/federal/us/490/386/",
    policy_type: "case_law",
    tags: ["use_of_force", "excessive_force", "4th_amendment", "reasonableness", "objective_reasonableness"],
    effective_date: "1989",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Tennessee v. Garner — Deadly Force Against Fleeing Suspects (1985)",
    content: `The use of deadly force to prevent the escape of an unarmed, non-dangerous fleeing felon violates the Fourth Amendment. A law enforcement officer may not seize an unarmed, non-dangerous suspect by shooting him. The officer may use deadly force to prevent escape only if the officer has probable cause to believe that the suspect poses a significant threat of death or serious physical injury to the officer or others. Visual indicators of Garner violations: officers shooting at unarmed individuals who are running away or fleeing; officers using deadly force against persons who are not presenting an immediate threat; shooting at moving vehicles when occupants pose no direct threat; use of deadly force for minor offenses.`,
    legal_authority: "Tennessee v. Garner, 471 U.S. 1 (1985) — https://supreme.justia.com/cases/federal/us/471/1/",
    source_url: "https://supreme.justia.com/cases/federal/us/471/1/",
    policy_type: "case_law",
    tags: ["deadly_force", "use_of_force", "4th_amendment", "fleeing_suspect", "shooting"],
    effective_date: "1985",
  },
  {
    category: "search_seizure",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Fourth Amendment — Unreasonable Search and Seizure",
    content: `The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated, and no Warrants shall issue, but upon probable cause, supported by Oath or affirmation, and particularly describing the place to be searched, and the persons or things to be seized. A traffic stop is a seizure under the Fourth Amendment. Police must have reasonable articulable suspicion of a specific violation to stop. Visual indicators of Fourth Amendment violations: searching a vehicle without consent or warrant visible; officers entering a home without showing a warrant; patting down individuals without apparent justification; stopping and detaining individuals with no apparent reason; searching bags or belongings without consent.`,
    legal_authority: "U.S. Const. amend. IV — https://law.cornell.edu/constitution/fourth_amendment",
    source_url: "https://law.cornell.edu/constitution/fourth_amendment",
    policy_type: "statute",
    tags: ["search_seizure", "4th_amendment", "warrant", "probable_cause", "traffic_stop"],
    effective_date: "1791",
  },
  {
    category: "civil_rights",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "42 U.S.C. § 1983 — Civil Rights Violations Under Color of Law",
    content: `Every person who, under color of any statute, ordinance, regulation, custom, or usage, of any State, subjects any citizen of the United States to the deprivation of any rights, privileges, or immunities secured by the Constitution and laws, shall be liable to the party injured in an action at law. This is the primary vehicle for suing law enforcement officers for constitutional violations. Monell v. New York (1978) extends liability to municipalities when a constitutional violation results from a municipal policy or custom. Visual indicators: any clearly unconstitutional force, search, or seizure; any action that deprives a person of constitutional rights while officer is acting in official capacity.`,
    legal_authority: "42 U.S.C. § 1983 — https://www.law.cornell.edu/uscode/text/42/1983",
    source_url: "https://www.law.cornell.edu/uscode/text/42/1983",
    policy_type: "statute",
    tags: ["civil_rights", "1983", "color_of_law", "constitutional_violation", "municipal_liability"],
    effective_date: "1871",
  },
  {
    category: "arrest_procedure",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Miranda v. Arizona — Miranda Rights Upon Custodial Interrogation (1966)",
    content: `Prior to any custodial interrogation, law enforcement must warn a person: (1) they have the right to remain silent; (2) anything they say can and will be used against them in court; (3) they have the right to an attorney; (4) if they cannot afford an attorney, one will be appointed. Custodial interrogation means questioning initiated by law enforcement officers after a person has been taken into custody or otherwise deprived of freedom in any significant way. Visual indicators of Miranda violations: officer questioning detained/arrested persons without apparent warning; person appearing to ask for an attorney while officer continues questioning.`,
    legal_authority: "Miranda v. Arizona, 384 U.S. 436 (1966) — https://supreme.justia.com/cases/federal/us/384/436/",
    source_url: "https://supreme.justia.com/cases/federal/us/384/436/",
    policy_type: "case_law",
    tags: ["miranda", "arrest", "custodial_interrogation", "5th_amendment", "right_to_attorney"],
    effective_date: "1966",
  },
  {
    category: "search_seizure",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Terry v. Ohio — Stop and Frisk / Investigatory Stops (1968)",
    content: `A police officer may stop a person if the officer has articulable reasonable suspicion that the person has been, is, or is about to be engaged in criminal activity. The officer may frisk (pat-down) only if the officer has reasonable suspicion the person is armed and presently dangerous. An anonymous tip alone generally does not provide reasonable suspicion. Reasonable suspicion must be based on specific, articulable facts. Visual indicators of Terry stop violations: officers stopping individuals with no apparent reason; pat-downs based solely on race, neighborhood, or legal activity; extended detentions beyond what investigation requires; frisks of individuals who have shown no indicators of being armed.`,
    legal_authority: "Terry v. Ohio, 392 U.S. 1 (1968) — https://supreme.justia.com/cases/federal/us/392/1/",
    source_url: "https://supreme.justia.com/cases/federal/us/392/1/",
    policy_type: "case_law",
    tags: ["terry_stop", "stop_and_frisk", "reasonable_suspicion", "4th_amendment", "pat_down"],
    effective_date: "1968",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Monell v. New York — Municipal Liability for Constitutional Violations (1978)",
    content: `A municipality (city, county, or other local government body) can be sued under 42 U.S.C. § 1983 when a constitutional violation results from a municipal policy, custom, or practice. This includes: (1) official policies that violate the Constitution, (2) informal but widespread customs that constitute de facto policy, (3) failure to train officers when that failure amounts to deliberate indifference, (4) decisions by officials with final policymaking authority. A single incident is generally insufficient to establish municipal liability — typically requires pattern of violations. Consent decrees, DOJ pattern-or-practice investigations, and sustained complaint records are all evidence of Monell liability.`,
    legal_authority: "Monell v. Dep't of Social Services, 436 U.S. 658 (1978) — https://supreme.justia.com/cases/federal/us/436/658/",
    source_url: "https://supreme.justia.com/cases/federal/us/436/658/",
    policy_type: "case_law",
    tags: ["monell", "municipal_liability", "1983", "policy", "failure_to_train"],
    effective_date: "1978",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal / DOJ",
    state_code: null,
    title: "DOJ 2022 Policy — Chokeholds and Carotid Restraints Prohibited",
    content: `The U.S. Department of Justice (DOJ) policy (2022) prohibits federal law enforcement officers from using chokeholds or carotid restraints except where deadly force is authorized. A chokehold is defined as the use of force that restricts blood flow or air by applying pressure to the throat/neck area. A carotid restraint restricts blood flow by applying pressure to the carotid arteries on either side of the neck. Both pose serious risk of death or serious injury. Visual indicators of chokehold violations: officer's arm or hands around a person's neck/throat; officer applying pressure to the side of the neck with forearm or hands; knee on neck/throat area of prone person; any restraint technique that visibly restricts breathing or blood flow.`,
    legal_authority: "DOJ Policy 2022 — Executive Order on Advancing Effective, Accountable Policing (2022)",
    source_url: "https://www.justice.gov/opa/pr/justice-department-announces-new-law-enforcement-policies",
    policy_type: "department_policy",
    tags: ["chokehold", "carotid_restraint", "use_of_force", "neck_restraint", "deadly_force"],
    effective_date: "2022",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "IACP",
    state_code: null,
    title: "IACP Model Policy — Use of Force (De-escalation Requirement)",
    content: `International Association of Chiefs of Police (IACP) model policy requires officers to use de-escalation techniques to avoid or minimize force when possible and when it is safe to do so. Officers should: (1) attempt to slow down or stabilize the situation before using force; (2) seek out time, distance, and cover; (3) use verbal techniques to persuade individuals to comply; (4) consider alternatives to physical force including tactical repositioning, requesting additional resources, or waiting for backup. Failure to de-escalate when tactically feasible and safe may constitute excessive force. Visual indicators: officer immediately escalating to physical force without visible verbal attempt; officers rushing toward a person who is stationary and not presenting immediate threat; no visible warning before use of force.`,
    legal_authority: "IACP Model Policy — Use of Force (2020 Edition) — https://www.theiacp.org/resources/policy-center-resource/use-of-force",
    source_url: "https://www.theiacp.org/resources/policy-center-resource/use-of-force",
    policy_type: "department_policy",
    tags: ["de_escalation", "use_of_force", "iacp", "best_practices", "verbal_warning"],
    effective_date: "2020",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "California",
    state_code: "CA",
    title: "California AB 392 (2019) — 'Necessary' Use of Force Standard",
    content: `California Penal Code § 835a (AB 392, effective Jan 2020) requires that deadly force be 'necessary' to defend against an imminent threat of death or serious bodily injury. This is a higher standard than the federal 'objective reasonableness' test. Officers must exhaust all reasonable alternatives before using deadly force. Officers may also be held accountable for creating a dangerous situation through unreasonable conduct that precipitated the use of force. The law specifically prohibits shooting at moving vehicles except in very limited circumstances. California POST mandates de-escalation training for all officers. Visual indicators: use of deadly force in situations where alternatives clearly existed; shooting at vehicles; force against individuals who have been effectively controlled.`,
    legal_authority: "California Penal Code § 835a (AB 392, 2019) — https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=201920200AB392",
    source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=835a.&lawCode=PEN",
    policy_type: "statute",
    tags: ["use_of_force", "deadly_force", "california", "ab392", "necessary_standard"],
    effective_date: "2020-01-01",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Texas",
    state_code: "TX",
    title: "Texas Penal Code § 9.51 — Use of Force by Law Enforcement",
    content: `Texas Penal Code § 9.51 authorizes a peace officer to use force when: the officer reasonably believes the force is immediately necessary to make or assist in a lawful arrest, to prevent or assist in preventing escape after lawful arrest, or to prevent the person arrested from harming the officer or other persons. Deadly force is justified only when the officer reasonably believes it is immediately necessary to protect the officer or another from the use or attempted use of deadly force, or to make the arrest of a person who is suspected of using or attempting to use deadly force. Texas does not have a separate de-escalation mandate in statute but major departments have department policies requiring it. Visual indicators: force used when suspect is clearly not resisting; deadly force used against fleeing unarmed persons; force that exceeds what is needed to make the arrest.`,
    legal_authority: "Texas Penal Code § 9.51 — https://statutes.capitol.texas.gov/Docs/PE/htm/PE.9.htm#9.51",
    source_url: "https://statutes.capitol.texas.gov/Docs/PE/htm/PE.9.htm",
    policy_type: "statute",
    tags: ["use_of_force", "texas", "deadly_force", "arrest", "reasonableness"],
    effective_date: "1974",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "New York",
    state_code: "NY",
    title: "New York Penal Law § 35.30 — Justification; Use of Physical Force by Law Enforcement",
    content: `New York PL § 35.30 authorizes use of physical force when the officer reasonably believes it is necessary to: effect an arrest or prevent escape, defend themselves or a third person from physical force being used by the arrestee. Deadly force is authorized only when the officer reasonably believes that the suspect is using or about to use deadly force, or the suspect has committed a violent felony and will cause death or serious physical injury if not captured. New York requires de-escalation and the NYPD patrol guide mandates officers use the minimum force necessary. The Police Reform and Reinvention Act (2020) requires every department to create a public-facing plan. Visual indicators: force against compliant persons; choke holds (banned by state law for NYPD since 1993, now statewide ban); striking prone persons.`,
    legal_authority: "N.Y. Penal Law § 35.30 — https://www.nysenate.gov/legislation/laws/PEN/35.30",
    source_url: "https://www.nysenate.gov/legislation/laws/PEN/35.30",
    policy_type: "statute",
    tags: ["use_of_force", "new_york", "deadly_force", "chokehold_ban", "de_escalation"],
    effective_date: "2020",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Colorado",
    state_code: "CO",
    title: "Colorado SB 217 (2020) — Law Enforcement Integrity Act",
    content: `Colorado's SB 217 is one of the most comprehensive use-of-force reform laws in the US. Key provisions: (1) Prohibits chokeholds; (2) Requires officers to intervene when witnessing illegal use of force by another officer; (3) Mandates body cameras for all officers; (4) Removes qualified immunity for state civil rights claims; (5) Requires de-escalation when possible; (6) Prohibits shooting at moving vehicles; (7) Bans use of chemical agents and projectiles against peaceful protesters; (8) Creates duty to render medical aid after use of force. Officers are personally liable for 25% of civil judgments (up to $25,000) when they acted in bad faith. Visual indicators: use of chokehold or neck restraint; officer not rendering aid after use of force; multiple officer pile-ons; shooting at vehicles.`,
    legal_authority: "Colorado SB 217 (2020) — https://leg.colorado.gov/bills/sb20-217",
    source_url: "https://leg.colorado.gov/bills/sb20-217",
    policy_type: "statute",
    tags: ["use_of_force", "colorado", "sb217", "chokehold_ban", "duty_to_intervene", "body_camera"],
    effective_date: "2020-06-19",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Washington",
    state_code: "WA",
    title: "Washington HB 1310 (2021) — Necessary Force Standard",
    content: `Washington's HB 1310 limits law enforcement's authority to use physical force to situations where it is 'necessary'. Officers may only use physical force when: (1) necessary to effect a lawful arrest, (2) necessary to prevent escape from lawful custody, (3) necessary to protect themselves or others from imminent physical harm. Deadly force is only authorized when necessary to protect against an imminent threat of serious harm. Officers cannot use force to detain or arrest individuals for civil violations. Mental health crises and substance use situations require a response preference for appropriate community resources. Visual indicators: force used in mental health crisis situations without need; force against individuals clearly not fleeing or resisting; force exceeding what the immediate situation requires.`,
    legal_authority: "Washington HB 1310 (2021) — https://app.leg.wa.gov/billsummary?BillNumber=1310&Year=2021",
    source_url: "https://app.leg.wa.gov/billsummary?BillNumber=1310&Year=2021",
    policy_type: "statute",
    tags: ["use_of_force", "washington", "hb1310", "necessary_force", "de_escalation"],
    effective_date: "2021-07-25",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Minnesota",
    state_code: "MN",
    title: "Minnesota Statutes § 609.066 — Authorized Use of Deadly Force by Peace Officers",
    content: `Minnesota Statute § 609.066 (as amended after George Floyd's murder, May 2023) prohibits chokeholds and neck restraints. Officers must provide medical assistance to individuals who need it. The duty to intervene is codified — officers must report and physically intervene when witnessing illegal use of force. Deadly force is authorized only to protect officers or another from apparent death or great bodily harm, or to apprehend a person who has committed great bodily harm if the person presents an ongoing danger. The 'sanctity of life' principle requires officers to exhaust all alternatives before using deadly force. Visual indicators: any neck restraint; failure to render medical aid; excessive force not proportional to threat; officers failing to intervene when witnessing violations.`,
    legal_authority: "Minn. Stat. § 609.066 — https://www.revisor.mn.gov/statutes/cite/609.066",
    source_url: "https://www.revisor.mn.gov/statutes/cite/609.066",
    policy_type: "statute",
    tags: ["use_of_force", "minnesota", "chokehold_ban", "duty_to_intervene", "medical_aid", "deadly_force"],
    effective_date: "2023",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Florida",
    state_code: "FL",
    title: "Florida Statute § 776.05 — Law Enforcement Use of Force",
    content: `Florida Statute § 776.05 authorizes a law enforcement officer to use deadly force only when the officer reasonably believes that the deadly force is necessary to prevent death or great bodily harm to the officer or another, or to prevent the commission of a forcible felony. Florida does not yet have a statutory duty to intervene or a statutory chokehold ban, though many departments have department-level policies. The standard remains the federal Graham v. Connor 'objective reasonableness' test. Florida's 'Stand Your Ground' law (§ 776.013) applies to officers in some circumstances. Visual indicators: deadly force against non-threatening persons; force disproportionate to the threat; use of chokeholds (may violate department policy even if not state statute).`,
    legal_authority: "Fla. Stat. § 776.05 — https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0700-0799/0776/Sections/0776.05.html",
    source_url: "https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0700-0799/0776/Sections/0776.05.html",
    policy_type: "statute",
    tags: ["use_of_force", "florida", "deadly_force", "reasonableness", "forcible_felony"],
    effective_date: "1974",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Illinois",
    state_code: "IL",
    title: "Illinois SAFE-T Act (2021) — Statewide Police Reform",
    content: `Illinois' SAFE-T Act (2021) includes comprehensive police reform: (1) Prohibits chokeholds statewide; (2) Creates duty to intervene and report illegal force; (3) Mandates de-escalation training; (4) Requires officers to render aid after use of force; (5) Creates Independent Oversight Office; (6) Requires body cameras statewide by 2025; (7) Mandates mental health diversion programs; (8) Creates decertification process for officers with misconduct histories. The Act also ended cash bail for most offenses (Pretrial Fairness Act). Officers who witness and fail to report illegal use of force face termination. Visual indicators: chokeholds; failure to render medical aid; officers watching illegal force without intervening; force against compliant persons.`,
    legal_authority: "Illinois SAFE-T Act (Public Act 101-0652, 2021) — https://www.ilga.gov/legislation/publicacts/101/PDF/101-0652.pdf",
    source_url: "https://www.ilga.gov/legislation/publicacts/101/PDF/101-0652.pdf",
    policy_type: "statute",
    tags: ["use_of_force", "illinois", "safe_t_act", "chokehold_ban", "duty_to_intervene", "de_escalation"],
    effective_date: "2021-07-12",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Georgia",
    state_code: "GA",
    title: "Georgia — Use of Force Standard (O.C.G.A. § 17-4-20)",
    content: `Georgia O.C.G.A. § 17-4-20 authorizes law enforcement to use deadly force to apprehend a suspected felon only when the officer reasonably believes that the suspect will endanger human life or inflict bodily injury unless apprehended without delay, or the officer reasonably believes that the suspected felon has committed a crime involving the infliction or threatened infliction of serious physical harm. Georgia does not have a comprehensive police reform statute comparable to some other states. The federal Graham v. Connor standard applies. Atlanta PD and other major departments have adopted de-escalation and body camera policies. Visual indicators: deadly force against unarmed fleeing persons; force against non-resisting individuals; chokeholds.`,
    legal_authority: "O.C.G.A. § 17-4-20 — https://law.justia.com/codes/georgia/title-17/chapter-4/article-1/section-17-4-20/",
    source_url: "https://law.justia.com/codes/georgia/title-17/chapter-4/article-1/section-17-4-20/",
    policy_type: "statute",
    tags: ["use_of_force", "georgia", "deadly_force", "fleeing_felon", "reasonableness"],
    effective_date: "1994",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Maryland",
    state_code: "MD",
    title: "Maryland Anton's Law (2021) — Police Reform and Accountability Act",
    content: `Maryland's Anton's Law (Police Reform and Accountability Act of 2021) includes: (1) Bans no-knock warrants in most circumstances; (2) Requires all officers to wear body cameras; (3) Creates a statewide use of force policy; (4) Requires duty to intervene and duty to render medical aid; (5) Decertifies officers for serious misconduct; (6) Creates county police accountability boards with civilian oversight; (7) Limits use of military-grade equipment. The statewide use of force policy requires de-escalation, prohibits chokeholds, and requires force to be proportional and necessary. Officers cannot use lethal force against a person solely for property crimes. Visual indicators: use of force with no prior de-escalation attempt; chokeholds; force after threat is neutralized; no medical aid rendered after force.`,
    legal_authority: "Maryland Police Accountability Act (HB 670, 2021) — https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/hb0670",
    source_url: "https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/hb0670",
    policy_type: "statute",
    tags: ["use_of_force", "maryland", "antons_law", "chokehold_ban", "body_camera", "duty_to_intervene"],
    effective_date: "2021-10-01",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Visual Pattern: Chokehold / Neck Restraint — Key Indicators",
    content: `VISUAL VIOLATION PATTERN — CHOKEHOLD: This pattern describes what to look for in images/video when analyzing for chokehold or neck restraint violations. Positive indicators: (1) Officer's forearm pressed against front of subject's throat; (2) Officer's arm looped around subject's neck with elbow at Adam's apple — classic 'lateral vascular restraint' or 'carotid chokehold'; (3) Knee, shin, or foot pressed on subject's neck while subject is prone; (4) Subject's face turning red, purple, or showing cyanosis; (5) Subject going limp while restraint applied; (6) Subject's hands at officer's arm in attempt to relieve pressure; (7) Multiple body weight vectors applied to chest/neck simultaneously preventing breathing. Context factors: duration of restraint (longer = more dangerous), subject position (prone is highest risk), number of officers applying weight, subject's apparent level of compliance/resistance.`,
    legal_authority: "Graham v. Connor (1989); Tennessee v. Garner (1985); DOJ 2022 Policy; State laws: CA, CO, NY, MN, IL, MD all ban chokeholds",
    source_url: "https://www.justice.gov/opa/pr/justice-department-announces-new-law-enforcement-policies",
    policy_type: "visual_pattern",
    tags: ["chokehold", "neck_restraint", "visual_pattern", "excessive_force", "prone_restraint"],
    effective_date: "2024",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Visual Pattern: Excessive Force Against Prone / Handcuffed Persons",
    content: `VISUAL VIOLATION PATTERN — FORCE AGAINST COMPLIANT/RESTRAINED PERSONS: Key visual indicators of excessive force after control is established: (1) Subject is prone (face down) on ground with hands visible or cuffed — any additional force at this point is presumptively excessive; (2) Multiple officers applying body weight to a prone restrained person; (3) Striking (punching, kicking) a handcuffed person; (4) Continued application of force after verbal commands are no longer being given (silence after commands = control established); (5) Officers in 'pile-on' configuration with 3+ persons applying weight to one subject; (6) Subject is clearly unconscious or unresponsive but force continues; (7) Use of baton, taser, or OC spray on compliant/cuffed person. Under Graham v. Connor, once the government interest in controlling the individual has been accomplished, further force has no justification and is unconstitutional.`,
    legal_authority: "Graham v. Connor, 490 U.S. 386 (1989) — force must be limited to what is reasonably necessary; force after control is established cannot be justified",
    source_url: "https://supreme.justia.com/cases/federal/us/490/386/",
    policy_type: "visual_pattern",
    tags: ["excessive_force", "prone_restraint", "handcuffed", "visual_pattern", "pile_on", "compliant"],
    effective_date: "2024",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Visual Pattern: Disproportionate Response — Number of Officers vs. Single Suspect",
    content: `VISUAL VIOLATION PATTERN — DISPROPORTIONATE FORCE: Key indicators: (1) 4+ armed officers surrounding a single, unarmed, non-resisting individual; (2) Multiple officers drawing weapons on a compliant person; (3) Takedown force used against elderly, visibly impaired, or clearly non-threatening person; (4) K9 deployment against a compliant, unarmed person with hands up; (5) Taser use on a person who is already being physically controlled by multiple officers; (6) OC spray used at close range against a person who is not physically resisting; (7) Less-lethal projectile use against a stationary, non-threatening person. The 'objective reasonableness' standard requires proportionality — 6 officers using force on 1 compliant unarmed person is presumptively unreasonable regardless of the underlying crime alleged.`,
    legal_authority: "Graham v. Connor (1989); 14th Amendment Equal Protection; DOJ Pattern and Practice authority under 34 U.S.C. § 12601",
    source_url: "https://supreme.justia.com/cases/federal/us/490/386/",
    policy_type: "visual_pattern",
    tags: ["disproportionate_response", "visual_pattern", "excessive_force", "k9", "taser", "proportionality"],
    effective_date: "2024",
  },
  {
    category: "search_seizure",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Visual Pattern: Warrantless Home Entry / Search",
    content: `VISUAL VIOLATION PATTERN — WARRANTLESS HOME ENTRY: Key visual indicators: (1) Officers entering a residence without showing a document to the occupant; (2) Forced entry (breach) without apparent emergency circumstances; (3) Occupant appearing to protest or not consent while officers enter or search inside; (4) Officers searching rooms, closets, drawers without apparent warrant; (5) No visible criminal emergency in progress that would justify exigent circumstances exception. The Fourth Amendment protects 'the right of the people to be secure in their...houses.' Without a warrant, consent, or exigent circumstances, entry is presumptively unconstitutional. Exigent circumstances include: hot pursuit of a fleeing felon, imminent destruction of evidence, emergency assistance to occupants in danger.`,
    legal_authority: "U.S. Const. amend. IV; Payton v. New York, 445 U.S. 573 (1980) — warrantless in-home arrests presumptively unconstitutional; Brigham City v. Stuart (2006) — emergency aid exception",
    source_url: "https://law.cornell.edu/constitution/fourth_amendment",
    policy_type: "visual_pattern",
    tags: ["warrantless_search", "home_entry", "4th_amendment", "visual_pattern", "exigent_circumstances"],
    effective_date: "2024",
  },
  {
    category: "racial_profiling",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "14th Amendment — Equal Protection / Racial Profiling",
    content: `The Fourteenth Amendment's Equal Protection Clause prohibits law enforcement from treating individuals differently based on race, ethnicity, national origin, or religion without sufficient justification. Selective enforcement based on race is unconstitutional. The DOJ Guidance on Race (2014) prohibits racial profiling by federal law enforcement and requires agencies receiving federal funding to maintain anti-profiling policies. Visual indicators of racial profiling: officers stopping individuals with no apparent behavior-based justification in contexts where race is the most visible characteristic; disparate treatment of individuals of different races in identical situations visible in the same footage; stops based solely on presence in a neighborhood.`,
    legal_authority: "U.S. Const. amend. XIV; DOJ Guidance for Federal Law Enforcement on Use of Race, Ethnicity, Gender, National Origin (2014) — https://www.justice.gov/sites/default/files/ag/pages/attachments/2014/12/08/use-of-race-policy.pdf",
    source_url: "https://www.justice.gov/sites/default/files/ag/pages/attachments/2014/12/08/use-of-race-policy.pdf",
    policy_type: "statute",
    tags: ["racial_profiling", "14th_amendment", "equal_protection", "discriminatory_enforcement"],
    effective_date: "2014",
  },
  {
    category: "duty_to_intervene",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "Duty to Intervene — Officer Obligation to Stop Illegal Force by Colleagues",
    content: `Officers who witness another officer using illegal or excessive force have a constitutional duty to intervene if they have a realistic opportunity to do so. Failing to intervene when able makes the bystander officer liable under 42 U.S.C. § 1983 for failure to protect. Many states now codify this duty: Colorado SB 217 (2020), Illinois SAFE-T Act (2021), Minnesota (2023), Maryland Anton's Law (2021), New York (2020). Federal policy (2022) also requires officers to intervene. Visual indicators of duty-to-intervene violations: multiple officers present during visible excessive force with officers standing by not intervening; officers forming a 'wall' to obstruct civilian witnesses while colleague uses force; officers turning their backs or looking away during force incident.`,
    legal_authority: "Yang v. Hardin, 37 F.3d 282 (7th Cir. 1994); Cf. Byrd v. Clark, 783 F.2d 1002 (11th Cir. 1986); State laws: CO SB 217, IL SAFE-T, MN § 609.066",
    source_url: "https://www.justice.gov/opa/pr/justice-department-announces-new-law-enforcement-policies",
    policy_type: "case_law",
    tags: ["duty_to_intervene", "bystander_officer", "1983", "excessive_force", "failure_to_protect"],
    effective_date: "2022",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Oregon",
    state_code: "OR",
    title: "Oregon HB 4301 (2020) / SB 111 (2023) — Use of Force Reform",
    content: `Oregon's 2020-2023 reforms: (1) Banned chokeholds statewide; (2) Required officers to attempt de-escalation when safe and feasible; (3) Required medical care after use of force; (4) Established duty to intervene and report; (5) Created statewide early warning system for officers with patterns of misconduct. The 'when safe and feasible' de-escalation standard requires consideration of all available tactics before using force. ORS 161.235 governs justification for use of physical force by peace officers. Oregon POST sets statewide training standards. Visual indicators: chokeholds; no medical aid post-force; force without prior de-escalation; officers not intervening during visible excessive force.`,
    legal_authority: "ORS 161.235; Oregon HB 4301 (2020); Oregon SB 111 (2023) — https://olis.oregonlegislature.gov",
    source_url: "https://olis.oregonlegislature.gov/liz/2020S1/Measures/Overview/HB4301",
    policy_type: "statute",
    tags: ["use_of_force", "oregon", "chokehold_ban", "de_escalation", "duty_to_intervene"],
    effective_date: "2020-09-01",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Virginia",
    state_code: "VA",
    title: "Virginia Code § 19.2-83.3 / HB 5043 (2020) — Police Use of Force Reform",
    content: `Virginia's 2020 police reform package: (1) Prohibits chokeholds; (2) Requires de-escalation; (3) Mandates medical attention after use of force; (4) Creates duty to intervene; (5) Requires officers to render aid; (6) Mandatory body cameras for all officers by 2023; (7) Creates civilian oversight process. Officers must attempt de-escalation techniques including verbal warnings, repositioning, and waiting for resources before resorting to force. Deadly force must be necessary to protect from imminent threat of death or serious bodily injury. Visual indicators: chokeholds; no medical aid post-force; force without attempt at de-escalation; officers not intervening.`,
    legal_authority: "Va. Code § 19.2-83.3 (2020) — https://law.lis.virginia.gov/vacode/title19.2/chapter7/section19.2-83.3/",
    source_url: "https://law.lis.virginia.gov/vacode/title19.2/chapter7/section19.2-83.3/",
    policy_type: "statute",
    tags: ["use_of_force", "virginia", "chokehold_ban", "de_escalation", "duty_to_intervene"],
    effective_date: "2020-07-01",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "New Jersey",
    state_code: "NJ",
    title: "New Jersey AG Use of Force Policy (2020, Updated 2023)",
    content: `New Jersey Attorney General's Use of Force Policy (one of the most comprehensive in the US): (1) 'Sanctity of life' as the guiding principle; (2) Requires de-escalation when reasonably possible; (3) Prohibits chokeholds; (4) Bans shooting at moving vehicles; (5) Requires rendering aid after force; (6) Creates duty to intervene; (7) Requires early intervention system for officers with patterns; (8) Mandates de-escalation training 4 hours annually minimum; (9) Requires all use of force to be documented and reported; (10) Prohibits force as punishment or retaliation. The AG policy is binding on all 564 NJ law enforcement agencies. Visual indicators: chokeholds; shooting at vehicles; force after compliance; no medical aid.`,
    legal_authority: "NJ AG Use of Force Policy (2020, Rev. 2023) — https://www.njoag.gov/wp-content/uploads/2020/06/ATTORNEY-GENERAL-LAW-ENFORCEMENT-DIRECTIVE-NO.-2020-5.pdf",
    source_url: "https://www.njoag.gov/wp-content/uploads/2020/06/ATTORNEY-GENERAL-LAW-ENFORCEMENT-DIRECTIVE-NO.-2020-5.pdf",
    policy_type: "department_policy",
    tags: ["use_of_force", "new_jersey", "chokehold_ban", "sanctity_of_life", "de_escalation"],
    effective_date: "2020-06-16",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "state",
    jurisdiction_name: "Massachusetts",
    state_code: "MA",
    title: "Massachusetts Police Reform Act (2020) — An Act Relative to Justice",
    content: `Massachusetts Chapter 253 (2020): (1) Bans chokeholds statewide; (2) Creates independent Police Officer Standards & Accreditation Commission (POSAC) with decertification authority; (3) Mandates de-escalation training; (4) Requires duty to intervene; (5) Limits use of chemical agents and crowd control weapons; (6) Requires early warning systems; (7) Creates civilian oversight mechanisms. Officers must be trained in mental health crisis intervention. The law also requires disclosure of police misconduct records. Visual indicators: chokeholds; failure to intervene; use of CS gas against peaceful assemblies; force against compliant persons.`,
    legal_authority: "2020 Mass. Acts c. 253 — https://malegislature.gov/Laws/SessionLaws/Acts/2020/Chapter253",
    source_url: "https://malegislature.gov/Laws/SessionLaws/Acts/2020/Chapter253",
    policy_type: "statute",
    tags: ["use_of_force", "massachusetts", "chokehold_ban", "decertification", "duty_to_intervene"],
    effective_date: "2020-12-31",
  },
  {
    category: "protest_rights",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal",
    state_code: null,
    title: "First Amendment — Right to Protest, Assemble, and Record Police",
    content: `The First Amendment protects the rights of free speech, freedom of the press, and right to peaceably assemble. All three rights are implicated in protest situations. The right to record police officers performing their official duties in public is a clearly established First Amendment right in all federal circuits. Courts have consistently held that recording police in public is protected. Visual indicators of First Amendment violations: officers ordering persons to stop recording; officers physically taking or destroying recording devices; mass arrests of peaceful protesters; use of force against protesters who are not engaged in violence; 'kettling' peaceful protesters; dispersal orders with no time or route to comply.`,
    legal_authority: "U.S. Const. amend. I; ACLU of Ill. v. Alvarez, 679 F.3d 583 (7th Cir. 2012); Glik v. Cunniffe, 655 F.3d 78 (1st Cir. 2011); Turner v. Driver, 848 F.3d 678 (5th Cir. 2017)",
    source_url: "https://law.cornell.edu/constitution/first_amendment",
    policy_type: "case_law",
    tags: ["1st_amendment", "protest_rights", "recording_police", "free_speech", "assembly"],
    effective_date: "1791",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "post_standard",
    jurisdiction_name: "California POST",
    state_code: "CA",
    title: "California POST — Use of Force Training Requirements",
    content: `California Police Officer Standards and Training (POST) mandates all officers complete: (1) Crisis Intervention Training (CIT) — 40 hours minimum for officers handling mental health situations; (2) De-escalation training embedded in all use-of-force training; (3) Implicit bias training (4 hours); (4) Cultural diversity training. California Penal Code 13519.10 requires POST to develop guidelines for training on law enforcement interactions with individuals experiencing mental health crises. California POST also sets standards for use-of-force reporting (URSUS system). Visual indicators of violation: tactics that escalate rather than de-escalate mental health crisis; force used in crisis situations without CIT-trained officer present when available; disproportionate response in mental health contexts.`,
    legal_authority: "California Penal Code § 13519.10; POST Commission regulations — https://post.ca.gov",
    source_url: "https://post.ca.gov",
    policy_type: "post_training",
    tags: ["post_training", "california", "cit", "mental_health", "de_escalation_training"],
    effective_date: "2020",
  },
  {
    category: "use_of_force",
    jurisdiction_type: "federal",
    jurisdiction_name: "Federal / DOJ",
    state_code: null,
    title: "DOJ 34 U.S.C. § 12601 — Pattern or Practice Investigation Authority",
    content: `34 U.S.C. § 12601 gives the Department of Justice authority to investigate and sue state or local law enforcement agencies that engage in a 'pattern or practice' of violating constitutional rights. Investigations can result in consent decrees (court-supervised reform agreements) that mandate specific policy changes, training requirements, monitoring, and reporting. Active or recent consent decrees include: Ferguson MO, Baltimore MD, Chicago IL, New Orleans LA, Seattle WA, Cleveland OH, Los Angeles CA, Newark NJ. A pattern or practice requires more than isolated incidents — it requires a systemic and repeated failure. Documented evidence through NovaShield contributes to establishing patterns. Visual indicators: same type of violation by same department across multiple incidents; supervisors approving unconstitutional force; systematic failure to discipline officers.`,
    legal_authority: "34 U.S.C. § 12601 — https://www.law.cornell.edu/uscode/text/34/12601",
    source_url: "https://www.justice.gov/crt/addressing-police-misconduct-laws-enforced-department-justice",
    policy_type: "statute",
    tags: ["pattern_or_practice", "doj", "consent_decree", "systemic_misconduct", "12601"],
    effective_date: "1994",
  },
];

router.post("/seed", async (req, res) => {
  try {
    const existing = await db.select({ id: policyKnowledgeTable.id }).from(policyKnowledgeTable).limit(1);
    if (existing.length > 0) {
      return res.json({ message: "Knowledge base already seeded", count: existing.length });
    }

    const inserted = await db.insert(policyKnowledgeTable).values(
      SEED_POLICIES.map((p) => ({ ...p, tags: p.tags || [] }))
    ).returning({ id: policyKnowledgeTable.id });

    res.json({ message: "Knowledge base seeded successfully", count: inserted.length });
  } catch (err) {
    res.status(500).json({ error: "Seed failed", message: String(err) });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [policyCount] = await db.select({ count: sql<number>`count(*)::int` }).from(policyKnowledgeTable);
    const [analysisCount] = await db.select({ count: sql<number>`count(*)::int` }).from(analysisResultsTable);
    const [feedbackCount] = await db.select({ count: sql<number>`count(*)::int` }).from(analysisFeedbackTable);

    const confirmedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysisFeedbackTable)
      .where(eq(analysisFeedbackTable.feedback_type, "confirmed"));
    const confirmed = confirmedResult[0]?.count ?? 0;

    const disputedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analysisFeedbackTable)
      .where(eq(analysisFeedbackTable.feedback_type, "disputed"));
    const disputed = disputedResult[0]?.count ?? 0;

    const categoryBreakdown = await db
      .select({ category: policyKnowledgeTable.category, count: sql<number>`count(*)::int` })
      .from(policyKnowledgeTable)
      .groupBy(policyKnowledgeTable.category);

    const jurisdictionBreakdown = await db
      .select({ type: policyKnowledgeTable.jurisdiction_type, count: sql<number>`count(*)::int` })
      .from(policyKnowledgeTable)
      .groupBy(policyKnowledgeTable.jurisdiction_type);

    const topConcerns = await db
      .select({ concern_type: analysisFeedbackTable.concern_type, count: sql<number>`count(*)::int` })
      .from(analysisFeedbackTable)
      .where(eq(analysisFeedbackTable.feedback_type, "confirmed"))
      .groupBy(analysisFeedbackTable.concern_type)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const accuracy = (Number(feedbackCount.count) > 0)
      ? Math.round((Number(confirmed) / Number(feedbackCount.count)) * 100)
      : null;

    res.json({
      knowledge_base: {
        total_policies: policyCount.count,
        categories: categoryBreakdown,
        jurisdictions: jurisdictionBreakdown,
      },
      learning: {
        total_analyses: analysisCount.count,
        total_feedback: feedbackCount.count,
        confirmed_violations: confirmed,
        disputed_findings: disputed,
        accuracy_rate: accuracy,
        top_confirmed_concern_types: topConcerns,
      },
      engine_version: "SIE-1.0",
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Stats failed", message: String(err) });
  }
});

router.get("/policies", async (req, res) => {
  try {
    const { category, state, jurisdiction_type, search, limit: lim = "50" } = req.query as Record<string, string>;

    let query = db.select().from(policyKnowledgeTable) as any;

    const conditions: any[] = [];
    if (category) conditions.push(eq(policyKnowledgeTable.category, category));
    if (state) conditions.push(eq(policyKnowledgeTable.state_code, state.toUpperCase()));
    if (jurisdiction_type) conditions.push(eq(policyKnowledgeTable.jurisdiction_type, jurisdiction_type));
    if (search) conditions.push(ilike(policyKnowledgeTable.title, `%${search}%`));

    if (conditions.length > 0) query = query.where(and(...conditions));

    const policies = await query
      .orderBy(desc(policyKnowledgeTable.created_at))
      .limit(parseInt(lim));

    res.json({ policies, count: policies.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch policies", message: String(err) });
  }
});

router.get("/policies/context", async (req, res) => {
  try {
    const { state, concerns } = req.query as { state?: string; concerns?: string };

    const concernList = concerns ? concerns.split(",").map((c) => c.trim()) : [];

    const federal = await db
      .select()
      .from(policyKnowledgeTable)
      .where(and(
        eq(policyKnowledgeTable.jurisdiction_type, "federal"),
        inArray(policyKnowledgeTable.policy_type, ["case_law", "statute", "visual_pattern"])
      ))
      .orderBy(desc(policyKnowledgeTable.created_at))
      .limit(12);

    let statePolicies: any[] = [];
    if (state) {
      statePolicies = await db
        .select()
        .from(policyKnowledgeTable)
        .where(eq(policyKnowledgeTable.state_code, state.toUpperCase()))
        .limit(5);
    }

    const patterns = await db
      .select()
      .from(policyKnowledgeTable)
      .where(eq(policyKnowledgeTable.policy_type, "visual_pattern"))
      .limit(5);

    const all = [...federal, ...statePolicies, ...patterns];
    const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());

    res.json({ policies: unique, count: unique.length, state_code: state || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch context", message: String(err) });
  }
});

router.post("/policies", async (req, res) => {
  try {
    const { category, jurisdiction_type, jurisdiction_name, state_code, title, content, legal_authority, source_url, policy_type, tags, effective_date } = req.body;
    if (!category || !jurisdiction_type || !title || !content) {
      return res.status(400).json({ error: "category, jurisdiction_type, title, and content are required" });
    }
    const [policy] = await db
      .insert(policyKnowledgeTable)
      .values({ category, jurisdiction_type, jurisdiction_name, state_code, title, content, legal_authority, source_url, policy_type, tags, effective_date })
      .returning();
    res.status(201).json(policy);
  } catch (err) {
    res.status(500).json({ error: "Failed to add policy", message: String(err) });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { analysis_result_id, incident_id, concern_type, concern_description, applicable_amendment, feedback_type, notes } = req.body;
    if (!feedback_type) {
      return res.status(400).json({ error: "feedback_type is required (confirmed | disputed | false_positive | uncertain)" });
    }
    const [feedback] = await db
      .insert(analysisFeedbackTable)
      .values({ analysis_result_id, incident_id, concern_type, concern_description, applicable_amendment, feedback_type, notes })
      .returning();
    res.status(201).json({ feedback, message: "Feedback recorded. The Shield Intelligence Engine has been updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to record feedback", message: String(err) });
  }
});

router.get("/feedback", async (req, res) => {
  try {
    const { incident_id } = req.query as { incident_id?: string };
    let query = db.select().from(analysisFeedbackTable) as any;
    if (incident_id) query = query.where(eq(analysisFeedbackTable.incident_id, incident_id as any));
    const feedback = await query.orderBy(desc(analysisFeedbackTable.created_at)).limit(100);
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedback", message: String(err) });
  }
});

router.get("/patterns", async (req, res) => {
  try {
    const patterns = await db
      .select({
        concern_type: analysisFeedbackTable.concern_type,
        applicable_amendment: analysisFeedbackTable.applicable_amendment,
        confirmed: sql<number>`SUM(CASE WHEN ${analysisFeedbackTable.feedback_type} = 'confirmed' THEN 1 ELSE 0 END)::int`,
        disputed: sql<number>`SUM(CASE WHEN ${analysisFeedbackTable.feedback_type} = 'disputed' THEN 1 ELSE 0 END)::int`,
        false_positive: sql<number>`SUM(CASE WHEN ${analysisFeedbackTable.feedback_type} = 'false_positive' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(analysisFeedbackTable)
      .groupBy(analysisFeedbackTable.concern_type, analysisFeedbackTable.applicable_amendment)
      .orderBy(desc(sql`SUM(CASE WHEN ${analysisFeedbackTable.feedback_type} = 'confirmed' THEN 1 ELSE 0 END)`));

    const enriched = patterns.map((p) => ({
      ...p,
      accuracy_rate: p.total > 0 ? Math.round((Number(p.confirmed) / Number(p.total)) * 100) : null,
      reliability: Number(p.confirmed) >= 5 ? "high" : Number(p.confirmed) >= 2 ? "medium" : "low",
    }));

    res.json({ patterns: enriched, total_unique_concern_types: enriched.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patterns", message: String(err) });
  }
});

router.get("/analyses", async (req, res) => {
  try {
    const { incident_id } = req.query as { incident_id?: string };
    let query = db.select().from(analysisResultsTable) as any;
    if (incident_id) query = query.where(eq(analysisResultsTable.incident_id, incident_id as any));
    const analyses = await query.orderBy(desc(analysisResultsTable.created_at)).limit(50);
    res.json({ analyses });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analyses", message: String(err) });
  }
});

export default router;
