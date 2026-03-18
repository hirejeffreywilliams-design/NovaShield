export type ResourceType = "ag" | "civil_rights" | "oversight" | "legal_aid" | "immigration" | "federal" | "hotline";

export interface ComplaintResource {
  name: string;
  type: ResourceType;
  phone?: string;
  url: string;
  description: string;
  complaintUrl?: string;
}

export interface StateComplaintData {
  stateName: string;
  stateCode: string;
  resources: ComplaintResource[];
}

export const FEDERAL_RESOURCES: ComplaintResource[] = [
  {
    name: "DOJ Civil Rights Division",
    type: "federal",
    phone: "1-855-856-1247",
    url: "https://www.justice.gov/crt",
    complaintUrl: "https://civilrights.justice.gov",
    description: "File complaints about police misconduct, discrimination, and civil rights violations by law enforcement. Also handles pattern-or-practice investigations of police departments.",
  },
  {
    name: "FBI Civil Rights Program",
    type: "federal",
    url: "https://www.fbi.gov/investigate/civil-rights",
    complaintUrl: "https://tips.fbi.gov",
    description: "Report federal civil rights violations including excessive force by officers, racially motivated crimes, and civil rights abuses. FBI investigates criminal violations of civil rights laws.",
  },
  {
    name: "DHS Civil Rights & Civil Liberties (CRCL)",
    type: "immigration",
    phone: "1-866-644-8360",
    url: "https://www.dhs.gov/office-civil-rights-and-civil-liberties",
    complaintUrl: "https://www.dhs.gov/file-civil-rights-complaint",
    description: "File complaints about ICE, CBP, TSA, and other DHS component misconduct. Handles civil rights violations by any DHS employee.",
  },
  {
    name: "DHS Office of Inspector General",
    type: "federal",
    phone: "1-800-323-8603",
    url: "https://www.oig.dhs.gov",
    complaintUrl: "https://www.oig.dhs.gov/hotline",
    description: "Report fraud, waste, abuse, and misconduct by DHS employees including ICE and CBP agents. 24/7 hotline available.",
  },
  {
    name: "CBP Misconduct Reporting",
    type: "immigration",
    phone: "1-877-227-5511",
    url: "https://www.cbp.gov/contact/report-misconduct",
    complaintUrl: "https://www.cbp.gov/contact/report-misconduct",
    description: "Report misconduct, excessive force, or civil rights violations by US Customs and Border Protection officers. Also handles complaints about border checkpoint violations.",
  },
  {
    name: "ICE Enforcement & Removal Operations",
    type: "immigration",
    phone: "1-888-351-4024",
    url: "https://www.ice.gov/webform/ice-tip-form",
    complaintUrl: "https://www.ice.gov/webform/ice-tip-form",
    description: "Report ICE agent misconduct, file complaints about detention conditions, or locate a detained person. Also use DHS CRCL for civil rights complaints against ICE.",
  },
  {
    name: "EEOC — Equal Employment Opportunity",
    type: "civil_rights",
    phone: "1-800-669-4000",
    url: "https://www.eeoc.gov",
    complaintUrl: "https://publicportal.eeoc.gov/Portal/Login.aspx",
    description: "File charges of employment discrimination based on race, color, religion, sex, national origin, age, disability, or genetic information against any employer.",
  },
  {
    name: "HUD — Fair Housing Complaints",
    type: "civil_rights",
    phone: "1-800-669-9777",
    url: "https://www.hud.gov",
    complaintUrl: "https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint",
    description: "File housing discrimination complaints based on race, color, national origin, religion, sex, familial status, or disability.",
  },
  {
    name: "ACLU — Report Civil Rights Violations",
    type: "legal_aid",
    phone: "1-212-549-2500",
    url: "https://www.aclu.org",
    complaintUrl: "https://www.aclu.org/report",
    description: "Report civil rights violations to the ACLU for potential legal assistance and advocacy. ACLU litigates cases involving police misconduct, immigration rights, free speech, and more.",
  },
  {
    name: "NILC — Immigration Rights",
    type: "immigration",
    phone: "1-213-639-3900",
    url: "https://www.nilc.org",
    complaintUrl: "https://www.nilc.org/get-help",
    description: "National Immigration Law Center: legal resources and assistance for immigration rights violations including ICE/CBP misconduct complaints.",
  },
  {
    name: "RAICES — Immigration Legal Defense",
    type: "immigration",
    phone: "1-512-994-2199",
    url: "https://www.raicestexas.org",
    complaintUrl: "https://www.raicestexas.org/our-programs",
    description: "Provides legal services to immigrants and refugees. Handles cases involving wrongful detention, family separation, and ICE misconduct.",
  },
  {
    name: "DOJ EOIR — Immigration Court",
    type: "immigration",
    phone: "1-800-898-7180",
    url: "https://www.justice.gov/eoir",
    complaintUrl: "https://www.justice.gov/eoir/filing-complaint-regarding-immigration-judge-or-bai-staff-member",
    description: "File complaints about immigration judges and court staff. Also provides immigration court case information. EOIR runs the US immigration court system.",
  },
];

export const STATE_RESOURCES: StateComplaintData[] = [
  {
    stateName: "Alabama", stateCode: "AL",
    resources: [
      { name: "Alabama AG Civil Rights", type: "ag", phone: "1-800-392-5658", url: "https://www.ago.state.al.us", complaintUrl: "https://www.ago.state.al.us/page-consumer-complaint", description: "File civil rights and police misconduct complaints through the Alabama Attorney General's office." },
      { name: "ACLU of Alabama", type: "legal_aid", phone: "1-334-265-2754", url: "https://www.aclual.org", complaintUrl: "https://www.aclual.org/contact", description: "Report civil rights violations, police misconduct, and immigration issues." },
    ],
  },
  {
    stateName: "Alaska", stateCode: "AK",
    resources: [
      { name: "Alaska AG Civil Rights", type: "ag", phone: "1-907-465-2133", url: "https://www.law.alaska.gov", complaintUrl: "https://www.law.alaska.gov/department/civil/complaint.html", description: "File civil rights complaints through the Alaska Department of Law." },
      { name: "Alaska Commission for Human Rights", type: "civil_rights", phone: "1-800-478-4692", url: "https://humanrights.alaska.gov", complaintUrl: "https://humanrights.alaska.gov/file-a-complaint", description: "File complaints about discrimination in employment, housing, and public accommodations. Investigates civil rights violations." },
      { name: "ACLU of Alaska", type: "legal_aid", phone: "1-907-276-2658", url: "https://www.acluak.org", complaintUrl: "https://www.acluak.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Alaska." },
    ],
  },
  {
    stateName: "Arizona", stateCode: "AZ",
    resources: [
      { name: "Arizona AG Civil Rights Division", type: "ag", phone: "1-602-542-5263", url: "https://www.azag.gov/civil-rights", complaintUrl: "https://www.azag.gov/complaints/civil-rights", description: "File civil rights complaints including police misconduct, discrimination, and excessive force." },
      { name: "ACLU of Arizona", type: "legal_aid", phone: "1-602-650-1854", url: "https://www.acluaz.org", complaintUrl: "https://www.acluaz.org/en/report-rights-violation", description: "Arizona ACLU handles civil rights violations, immigration rights, and police accountability cases." },
      { name: "Tucson Office of Police Oversight", type: "oversight", phone: "1-520-791-4160", url: "https://www.tucsonaz.gov/police/police-oversight", complaintUrl: "https://www.tucsonaz.gov/police/how-file-complaint", description: "File formal complaints against Tucson Police Department officers. Independent oversight body." },
    ],
  },
  {
    stateName: "Arkansas", stateCode: "AR",
    resources: [
      { name: "Arkansas AG Office", type: "ag", phone: "1-800-482-8982", url: "https://www.arkansasag.gov", complaintUrl: "https://www.arkansasag.gov/consumer-protection/complaint-center", description: "File civil rights complaints through the Arkansas Attorney General's office." },
      { name: "ACLU of Arkansas", type: "legal_aid", phone: "1-501-374-2842", url: "https://www.acluark.org", complaintUrl: "https://www.acluark.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Arkansas." },
    ],
  },
  {
    stateName: "California", stateCode: "CA",
    resources: [
      { name: "California AG Civil Rights Section", type: "ag", phone: "1-916-210-6276", url: "https://oag.ca.gov/civil", complaintUrl: "https://oag.ca.gov/complaint", description: "California DOJ accepts complaints about law enforcement, discrimination, and constitutional violations. CA AG can investigate police departments under AB 1506." },
      { name: "CA Civil Rights Department (CRD)", type: "civil_rights", phone: "1-800-884-1684", url: "https://calcivilrights.ca.gov", complaintUrl: "https://calcivilrights.ca.gov/complaintprocess", description: "File employment, housing, and public accommodations discrimination complaints. The state agency that enforces California's civil rights laws." },
      { name: "LA Civilian Oversight Commission", type: "oversight", phone: "1-213-996-1280", url: "https://coc.lacounty.gov", complaintUrl: "https://coc.lacounty.gov/LAPD-Complaint", description: "Independent oversight of the Los Angeles Police Department. File complaints against LAPD officers." },
      { name: "SF Dept of Police Accountability", type: "oversight", phone: "1-415-241-7711", url: "https://sfgov.org/dpa", complaintUrl: "https://sfgov.org/dpa/file-complaint", description: "File complaints against San Francisco Police Department officers. Independent civilian oversight." },
      { name: "ACLU of California", type: "legal_aid", phone: "1-213-977-9500", url: "https://www.aclu-ca.org", complaintUrl: "https://www.aclu-ca.org/en/report-civil-rights-violation", description: "Report civil rights violations, police misconduct, and immigration rights issues in California." },
    ],
  },
  {
    stateName: "Colorado", stateCode: "CO",
    resources: [
      { name: "Colorado AG Civil Rights", type: "ag", phone: "1-800-222-4444", url: "https://coag.gov", complaintUrl: "https://coag.gov/resources/filing-complaints", description: "File civil rights and law enforcement misconduct complaints through the Colorado AG office." },
      { name: "Colorado Civil Rights Division", type: "civil_rights", phone: "1-303-894-2997", url: "https://dora.colorado.gov/civil-rights", complaintUrl: "https://dora.colorado.gov/ccrd/file-a-charge", description: "File charges of discrimination in employment, housing, and public accommodations." },
      { name: "Denver Citizen Oversight Board", type: "oversight", phone: "1-720-913-3306", url: "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Citizen-Oversight-Board", complaintUrl: "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Citizen-Oversight-Board/File-a-Complaint", description: "File formal complaints against Denver Police Department or Denver Sheriff Department officers." },
      { name: "ACLU of Colorado", type: "legal_aid", phone: "1-720-402-3100", url: "https://www.aclu-co.org", complaintUrl: "https://www.aclu-co.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Colorado." },
    ],
  },
  {
    stateName: "Connecticut", stateCode: "CT",
    resources: [
      { name: "Connecticut AG Office", type: "ag", phone: "1-860-808-5318", url: "https://www.ct.gov/ag", complaintUrl: "https://www.ct.gov/ag/cwp/view.asp?a=2088&q=426430", description: "File civil rights and public discrimination complaints through the Connecticut AG." },
      { name: "CT Commission on Human Rights", type: "civil_rights", phone: "1-800-477-5737", url: "https://www.ct.gov/chro", complaintUrl: "https://www.ct.gov/chro/cwp/view.asp?a=2525&q=316434", description: "File discrimination complaints in employment, housing, credit, and public accommodations." },
      { name: "ACLU of Connecticut", type: "legal_aid", phone: "1-860-523-9146", url: "https://www.acluct.org", complaintUrl: "https://www.acluct.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Connecticut." },
    ],
  },
  {
    stateName: "Delaware", stateCode: "DE",
    resources: [
      { name: "Delaware AG Civil Rights", type: "ag", phone: "1-302-577-8400", url: "https://attorneygeneral.delaware.gov", complaintUrl: "https://attorneygeneral.delaware.gov/fraud/cpu/complaint", description: "File civil rights complaints through the Delaware AG's Civil Rights Division." },
      { name: "Delaware Human Relations Commission", type: "civil_rights", phone: "1-302-577-5050", url: "https://humanrelations.delaware.gov", complaintUrl: "https://humanrelations.delaware.gov/complaint.shtml", description: "File discrimination complaints in employment, housing, and public accommodations in Delaware." },
      { name: "ACLU of Delaware", type: "legal_aid", phone: "1-302-654-5326", url: "https://www.aclu-de.org", complaintUrl: "https://www.aclu-de.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Delaware." },
    ],
  },
  {
    stateName: "Washington D.C.", stateCode: "DC",
    resources: [
      { name: "DC AG Civil Rights Section", type: "ag", phone: "1-202-727-3400", url: "https://oag.dc.gov", complaintUrl: "https://oag.dc.gov/consumer-protection/file-complaint", description: "File civil rights and police misconduct complaints through the DC Office of the Attorney General." },
      { name: "DC Office of Human Rights", type: "civil_rights", phone: "1-202-727-4559", url: "https://ohr.dc.gov", complaintUrl: "https://ohr.dc.gov/service/file-complaint-ohr", description: "File discrimination complaints in employment, housing, and public accommodations in Washington DC." },
      { name: "DC Office of Police Complaints", type: "oversight", phone: "1-202-727-3838", url: "https://policecomplaints.dc.gov", complaintUrl: "https://policecomplaints.dc.gov/service/file-complaint", description: "File formal complaints against Metropolitan Police Department officers. Completely independent civilian oversight agency." },
      { name: "ACLU of DC", type: "legal_aid", phone: "1-202-457-0800", url: "https://www.acludc.org", complaintUrl: "https://www.acludc.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Washington DC." },
    ],
  },
  {
    stateName: "Florida", stateCode: "FL",
    resources: [
      { name: "Florida AG Civil Rights", type: "ag", phone: "1-866-966-7226", url: "https://myfloridalegal.com", complaintUrl: "https://myfloridalegal.com/contact#complaint", description: "File civil rights and law enforcement misconduct complaints through the Florida AG office." },
      { name: "Florida Commission on Human Relations", type: "civil_rights", phone: "1-850-488-7082", url: "https://fchr.myflorida.com", complaintUrl: "https://fchr.myflorida.com/onlinecomplaint", description: "File employment and housing discrimination complaints in Florida." },
      { name: "ACLU of Florida", type: "legal_aid", phone: "1-786-363-2700", url: "https://www.aclufl.org", complaintUrl: "https://www.aclufl.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Florida." },
    ],
  },
  {
    stateName: "Georgia", stateCode: "GA",
    resources: [
      { name: "Georgia AG Civil Rights", type: "ag", phone: "1-404-656-3300", url: "https://law.georgia.gov", complaintUrl: "https://law.georgia.gov/contact-ago/file-complaint", description: "File civil rights complaints through the Georgia Attorney General's office." },
      { name: "Georgia Commission on Equal Opportunity", type: "civil_rights", phone: "1-404-656-1736", url: "https://gceo.georgia.gov", complaintUrl: "https://gceo.georgia.gov/how-file-charge", description: "File employment and housing discrimination complaints in Georgia." },
      { name: "ACLU of Georgia", type: "legal_aid", phone: "1-404-523-6201", url: "https://www.acluga.org", complaintUrl: "https://www.acluga.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Georgia." },
    ],
  },
  {
    stateName: "Hawaii", stateCode: "HI",
    resources: [
      { name: "Hawaii AG Civil Rights", type: "ag", phone: "1-808-586-1282", url: "https://ag.hawaii.gov", complaintUrl: "https://ag.hawaii.gov/cpja/about-cpja/civil-rights/", description: "File civil rights complaints through the Hawaii Attorney General." },
      { name: "Hawaii Civil Rights Commission", type: "civil_rights", phone: "1-808-586-8636", url: "https://labor.hawaii.gov/hcrc", complaintUrl: "https://labor.hawaii.gov/hcrc/complaint-process-and-forms/", description: "File discrimination complaints in employment, housing, and public accommodations in Hawaii." },
      { name: "ACLU of Hawaii", type: "legal_aid", phone: "1-808-522-5900", url: "https://www.acluhi.org", complaintUrl: "https://www.acluhi.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Hawaii." },
    ],
  },
  {
    stateName: "Idaho", stateCode: "ID",
    resources: [
      { name: "Idaho AG Civil Rights", type: "ag", phone: "1-208-334-2400", url: "https://www.ag.idaho.gov", complaintUrl: "https://www.ag.idaho.gov/contact", description: "File civil rights complaints through the Idaho Attorney General's office." },
      { name: "Idaho Human Rights Commission", type: "civil_rights", phone: "1-800-545-3461", url: "https://humanrights.idaho.gov", complaintUrl: "https://humanrights.idaho.gov/complaint-process", description: "File discrimination complaints in employment, housing, and education in Idaho." },
      { name: "ACLU of Idaho", type: "legal_aid", phone: "1-208-344-9750", url: "https://www.acluidaho.org", complaintUrl: "https://www.acluidaho.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Idaho." },
    ],
  },
  {
    stateName: "Illinois", stateCode: "IL",
    resources: [
      { name: "Illinois AG Civil Rights Bureau", type: "ag", phone: "1-312-814-3000", url: "https://illinoisattorneygeneral.gov/rights/civilrights.html", complaintUrl: "https://illinoisattorneygeneral.gov/consumers/filecomplaint.html", description: "File police misconduct and civil rights complaints. Illinois AG has authority to investigate law enforcement agencies." },
      { name: "Illinois Department of Human Rights", type: "civil_rights", phone: "1-312-814-6200", url: "https://www2.illinois.gov/dhr", complaintUrl: "https://www2.illinois.gov/dhr/FilingACharge/Pages/OnlineChargeForm.aspx", description: "File employment, housing, and public accommodations discrimination charges in Illinois." },
      { name: "Chicago COPA (Police Accountability)", type: "oversight", phone: "1-312-746-3609", url: "https://www.chicago.gov/city/en/depts/copa.html", complaintUrl: "https://www.chicago.gov/city/en/depts/copa/provdrs/file_a_complaint.html", description: "Civilian Office of Police Accountability — file formal complaints against Chicago Police Department officers. Fully independent from CPD." },
      { name: "ACLU of Illinois", type: "legal_aid", phone: "1-312-201-9740", url: "https://www.aclu-il.org", complaintUrl: "https://www.aclu-il.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Illinois." },
    ],
  },
  {
    stateName: "Indiana", stateCode: "IN",
    resources: [
      { name: "Indiana AG Consumer Protection", type: "ag", phone: "1-800-382-5516", url: "https://www.in.gov/ag", complaintUrl: "https://www.in.gov/ag/consumer-protection-division/file-a-consumer-complaint", description: "File civil rights complaints through the Indiana Attorney General's office." },
      { name: "Indiana Civil Rights Commission", type: "civil_rights", phone: "1-317-232-2600", url: "https://www.in.gov/icrc", complaintUrl: "https://www.in.gov/icrc/file-a-charge/how-to-file-a-charge", description: "File discrimination complaints in employment, housing, education, and public accommodations in Indiana." },
      { name: "ACLU of Indiana", type: "legal_aid", phone: "1-317-635-4059", url: "https://www.aclu-in.org", complaintUrl: "https://www.aclu-in.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Indiana." },
    ],
  },
  {
    stateName: "Iowa", stateCode: "IA",
    resources: [
      { name: "Iowa AG Civil Rights", type: "ag", phone: "1-515-281-5164", url: "https://www.iowaattorneygeneral.gov", complaintUrl: "https://www.iowaattorneygeneral.gov/for-consumers/file-a-consumer-complaint", description: "File civil rights complaints through the Iowa Attorney General's Civil Rights Division." },
      { name: "Iowa Civil Rights Commission", type: "civil_rights", phone: "1-800-457-4416", url: "https://icrc.iowa.gov", complaintUrl: "https://icrc.iowa.gov/file-a-complaint", description: "File discrimination complaints in employment, housing, credit, and public accommodations in Iowa." },
      { name: "ACLU of Iowa", type: "legal_aid", phone: "1-515-243-3988", url: "https://www.aclu-ia.org", complaintUrl: "https://www.aclu-ia.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Iowa." },
    ],
  },
  {
    stateName: "Kansas", stateCode: "KS",
    resources: [
      { name: "Kansas AG Civil Rights", type: "ag", phone: "1-785-296-2215", url: "https://ag.ks.gov", complaintUrl: "https://ag.ks.gov/about-the-office/file-a-complaint", description: "File civil rights complaints through the Kansas Attorney General's office." },
      { name: "Kansas Human Rights Commission", type: "civil_rights", phone: "1-785-296-3206", url: "https://www.khrc.net", complaintUrl: "https://www.khrc.net/file-a-complaint.html", description: "File discrimination complaints in employment, housing, and public accommodations in Kansas." },
      { name: "ACLU of Kansas", type: "legal_aid", phone: "1-785-232-7352", url: "https://www.aclukansas.org", complaintUrl: "https://www.aclukansas.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Kansas." },
    ],
  },
  {
    stateName: "Kentucky", stateCode: "KY",
    resources: [
      { name: "Kentucky AG Civil Rights", type: "ag", phone: "1-502-696-5300", url: "https://ag.ky.gov", complaintUrl: "https://ag.ky.gov/civil/file-a-complaint", description: "File civil rights complaints through the Kentucky Attorney General's Civil and Environmental Division." },
      { name: "KY Commission on Human Rights", type: "civil_rights", phone: "1-800-292-5566", url: "https://kchr.ky.gov", complaintUrl: "https://kchr.ky.gov/file-complaint", description: "File discrimination complaints in employment, housing, and public accommodations in Kentucky." },
      { name: "ACLU of Kentucky", type: "legal_aid", phone: "1-502-581-9746", url: "https://www.aclu-ky.org", complaintUrl: "https://www.aclu-ky.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Kentucky." },
    ],
  },
  {
    stateName: "Louisiana", stateCode: "LA",
    resources: [
      { name: "Louisiana AG Civil Rights", type: "ag", phone: "1-225-326-6000", url: "https://ag.louisiana.gov", complaintUrl: "https://ag.louisiana.gov/Complaint", description: "File civil rights complaints through the Louisiana Attorney General's office." },
      { name: "Louisiana Commission on Human Rights", type: "civil_rights", phone: "1-225-342-6969", url: "https://www.gov.louisiana.gov/lchr", complaintUrl: "https://www.gov.louisiana.gov/lchr/complaints", description: "File discrimination complaints in employment and housing in Louisiana." },
      { name: "ACLU of Louisiana", type: "legal_aid", phone: "1-504-522-0628", url: "https://laaclu.org", complaintUrl: "https://laaclu.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Louisiana." },
    ],
  },
  {
    stateName: "Maine", stateCode: "ME",
    resources: [
      { name: "Maine AG Civil Rights", type: "ag", phone: "1-207-626-8800", url: "https://www.maine.gov/ag", complaintUrl: "https://www.maine.gov/ag/consumer/complaints/index.shtml", description: "File civil rights complaints through the Maine Attorney General's office." },
      { name: "Maine Human Rights Commission", type: "civil_rights", phone: "1-207-624-6290", url: "https://www.maine.gov/mhrc", complaintUrl: "https://www.maine.gov/mhrc/file-a-complaint", description: "File discrimination complaints in employment, housing, credit, education, and public accommodations in Maine." },
      { name: "ACLU of Maine", type: "legal_aid", phone: "1-207-774-5444", url: "https://www.aclumaine.org", complaintUrl: "https://www.aclumaine.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Maine." },
    ],
  },
  {
    stateName: "Maryland", stateCode: "MD",
    resources: [
      { name: "Maryland AG Civil Rights", type: "ag", phone: "1-410-576-6300", url: "https://www.marylandattorneygeneral.gov", complaintUrl: "https://www.marylandattorneygeneral.gov/Pages/CPD/Complaint.aspx", description: "File civil rights and police misconduct complaints through the Maryland AG's Civil Rights Division." },
      { name: "MD Commission on Civil Rights", type: "civil_rights", phone: "1-800-637-6247", url: "https://mccr.maryland.gov", complaintUrl: "https://mccr.maryland.gov/Pages/Online_Complaint_Form.aspx", description: "File discrimination complaints in employment, housing, and public accommodations in Maryland." },
      { name: "Baltimore Civilian Review Board", type: "oversight", phone: "1-410-396-4755", url: "https://www.baltimorecity.gov/civilianreviewboard", complaintUrl: "https://www.baltimorecity.gov/civilianreviewboard/file-complaint", description: "File formal complaints against Baltimore Police Department officers. Independent civilian oversight." },
      { name: "ACLU of Maryland", type: "legal_aid", phone: "1-410-889-8555", url: "https://www.aclu-md.org", complaintUrl: "https://www.aclu-md.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Maryland." },
    ],
  },
  {
    stateName: "Massachusetts", stateCode: "MA",
    resources: [
      { name: "Massachusetts AG Civil Rights Division", type: "ag", phone: "1-617-727-2200", url: "https://www.mass.gov/ago", complaintUrl: "https://www.mass.gov/how-to/file-a-civil-rights-complaint-with-the-ag", description: "File civil rights complaints. Massachusetts AG actively investigates systemic law enforcement misconduct." },
      { name: "MA Commission Against Discrimination", type: "civil_rights", phone: "1-617-994-6000", url: "https://www.mass.gov/mcad", complaintUrl: "https://www.mass.gov/how-to/file-a-complaint-with-the-massachusetts-commission-against-discrimination", description: "File discrimination complaints in employment, housing, credit, and public accommodations in Massachusetts." },
      { name: "ACLU of Massachusetts", type: "legal_aid", phone: "1-617-482-3170", url: "https://www.aclum.org", complaintUrl: "https://www.aclum.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Massachusetts." },
    ],
  },
  {
    stateName: "Michigan", stateCode: "MI",
    resources: [
      { name: "Michigan AG Civil Rights", type: "ag", phone: "1-517-335-7622", url: "https://www.michigan.gov/ag", complaintUrl: "https://www.michigan.gov/ag/consumer-protection/complaints/file-a-complaint", description: "File civil rights complaints through the Michigan AG's Civil Rights Division." },
      { name: "Michigan DCDR (Civil Rights Dept)", type: "civil_rights", phone: "1-800-482-3604", url: "https://www.michigan.gov/mdcr", complaintUrl: "https://www.michigan.gov/mdcr/divisions/enforcement/how-to-file-a-complaint", description: "File discrimination complaints in employment, housing, education, and public accommodations in Michigan." },
      { name: "Detroit Board of Police Commissioners", type: "oversight", phone: "1-313-596-1830", url: "https://detroitmi.gov/boards/board-police-commissioners", complaintUrl: "https://detroitmi.gov/departments/police-department/citizens-complaints", description: "File formal complaints against Detroit Police Department officers. Board provides civilian oversight." },
      { name: "ACLU of Michigan", type: "legal_aid", phone: "1-313-578-6800", url: "https://www.aclumich.org", complaintUrl: "https://www.aclumich.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Michigan." },
    ],
  },
  {
    stateName: "Minnesota", stateCode: "MN",
    resources: [
      { name: "Minnesota AG Civil Rights", type: "ag", phone: "1-651-296-3353", url: "https://www.ag.state.mn.us", complaintUrl: "https://www.ag.state.mn.us/Office/Complaint.asp", description: "File civil rights complaints through the Minnesota AG. MN AG actively investigates police misconduct." },
      { name: "MN Department of Human Rights", type: "civil_rights", phone: "1-800-657-3704", url: "https://mn.gov/mdhr", complaintUrl: "https://mn.gov/mdhr/intake/chargeforms", description: "File discrimination charges in employment, housing, education, public accommodations, and other areas in Minnesota." },
      { name: "Minneapolis Office of Police Conduct Review", type: "oversight", phone: "1-612-673-5500", url: "https://www.minneapolismn.gov/resident-services/neighborhood-law-enforcement/", complaintUrl: "https://www.minneapolismn.gov/resident-services/neighborhood-law-enforcement/file-a-complaint/", description: "File formal complaints against Minneapolis Police Department officers." },
      { name: "ACLU of Minnesota", type: "legal_aid", phone: "1-651-645-4097", url: "https://www.aclu-mn.org", complaintUrl: "https://www.aclu-mn.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Minnesota." },
    ],
  },
  {
    stateName: "Mississippi", stateCode: "MS",
    resources: [
      { name: "Mississippi AG Civil Rights", type: "ag", phone: "1-601-359-3680", url: "https://ago.ms.gov", complaintUrl: "https://ago.ms.gov/pages/consumer-protection", description: "File civil rights complaints through the Mississippi Attorney General's office." },
      { name: "ACLU of Mississippi", type: "legal_aid", phone: "1-601-355-6464", url: "https://www.aclu-ms.org", complaintUrl: "https://www.aclu-ms.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Mississippi." },
    ],
  },
  {
    stateName: "Missouri", stateCode: "MO",
    resources: [
      { name: "Missouri AG Civil Rights", type: "ag", phone: "1-573-751-3321", url: "https://ago.mo.gov", complaintUrl: "https://ago.mo.gov/contact-us", description: "File civil rights complaints through the Missouri Attorney General's office." },
      { name: "MO Commission on Human Rights", type: "civil_rights", phone: "1-877-781-4236", url: "https://labor.mo.gov/mohumanrights", complaintUrl: "https://labor.mo.gov/mohumanrights/charges/online", description: "File discrimination charges in employment, housing, and places of public accommodation in Missouri." },
      { name: "ACLU of Missouri", type: "legal_aid", phone: "1-314-652-3114", url: "https://www.aclu-mo.org", complaintUrl: "https://www.aclu-mo.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Missouri." },
    ],
  },
  {
    stateName: "Montana", stateCode: "MT",
    resources: [
      { name: "Montana AG Civil Rights", type: "ag", phone: "1-406-444-2026", url: "https://dojmt.gov", complaintUrl: "https://dojmt.gov/consumer/complaint-form", description: "File civil rights complaints through the Montana Department of Justice." },
      { name: "Montana Human Rights Bureau", type: "civil_rights", phone: "1-406-444-2884", url: "https://erd.dli.mt.gov/human-rights", complaintUrl: "https://erd.dli.mt.gov/human-rights/file-a-complaint", description: "File discrimination complaints in employment, housing, and public accommodations in Montana." },
      { name: "ACLU of Montana", type: "legal_aid", phone: "1-406-443-8590", url: "https://www.aclumontana.org", complaintUrl: "https://www.aclumontana.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Montana." },
    ],
  },
  {
    stateName: "Nebraska", stateCode: "NE",
    resources: [
      { name: "Nebraska AG Civil Rights", type: "ag", phone: "1-402-471-2682", url: "https://ago.nebraska.gov", complaintUrl: "https://ago.nebraska.gov/contact-us", description: "File civil rights complaints through the Nebraska Attorney General's office." },
      { name: "Nebraska Equal Opportunity Commission", type: "civil_rights", phone: "1-402-471-2024", url: "https://neoc.ne.gov", complaintUrl: "https://neoc.ne.gov/Filing/default.aspx", description: "File employment and housing discrimination complaints in Nebraska." },
      { name: "ACLU of Nebraska", type: "legal_aid", phone: "1-402-476-8091", url: "https://www.aclune.org", complaintUrl: "https://www.aclune.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Nebraska." },
    ],
  },
  {
    stateName: "Nevada", stateCode: "NV",
    resources: [
      { name: "Nevada AG Civil Rights", type: "ag", phone: "1-775-684-1100", url: "https://ag.nv.gov", complaintUrl: "https://ag.nv.gov/Complaints/Filing_Complaints", description: "File civil rights complaints through the Nevada Attorney General's office." },
      { name: "Nevada Equal Rights Commission", type: "civil_rights", phone: "1-702-486-7161", url: "https://detr.nv.gov/Page/Nevada_Equal_Rights_Commission_(NERC)", complaintUrl: "https://detr.nv.gov/Page/Complaint_Process", description: "File discrimination complaints in employment, housing, and public accommodations in Nevada." },
      { name: "Las Vegas Citizen Review Board", type: "oversight", phone: "1-702-229-6702", url: "https://www.lasvegas.gov/government/departments/city-marshal/citizen-review-board", complaintUrl: "https://www.lasvegas.gov/government/departments/city-marshal/citizen-review-board/complaint-process", description: "File formal complaints against Las Vegas Metropolitan Police Department officers." },
      { name: "ACLU of Nevada", type: "legal_aid", phone: "1-702-366-1902", url: "https://www.aclunv.org", complaintUrl: "https://www.aclunv.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Nevada." },
    ],
  },
  {
    stateName: "New Hampshire", stateCode: "NH",
    resources: [
      { name: "New Hampshire AG Civil Rights", type: "ag", phone: "1-603-271-3658", url: "https://www.doj.nh.gov", complaintUrl: "https://www.doj.nh.gov/civil-rights/file-complaint.htm", description: "File civil rights complaints through the New Hampshire Department of Justice." },
      { name: "NH Human Rights Commission", type: "civil_rights", phone: "1-603-271-2767", url: "https://www.nh.gov/hrc", complaintUrl: "https://www.nh.gov/hrc/complaint.htm", description: "File discrimination complaints in employment, housing, and public accommodations in New Hampshire." },
      { name: "ACLU of New Hampshire", type: "legal_aid", phone: "1-603-224-5591", url: "https://www.aclu-nh.org", complaintUrl: "https://www.aclu-nh.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in New Hampshire." },
    ],
  },
  {
    stateName: "New Jersey", stateCode: "NJ",
    resources: [
      { name: "NJ AG Division on Civil Rights", type: "ag", phone: "1-609-292-4605", url: "https://www.njcivilrights.gov", complaintUrl: "https://www.njcivilrights.gov/complaint", description: "File complaints about discrimination, police misconduct, and civil rights violations in New Jersey. NJ Division on Civil Rights is a powerful enforcement body." },
      { name: "ACLU of New Jersey", type: "legal_aid", phone: "1-973-642-2086", url: "https://www.aclu-nj.org", complaintUrl: "https://www.aclu-nj.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in New Jersey." },
    ],
  },
  {
    stateName: "New Mexico", stateCode: "NM",
    resources: [
      { name: "New Mexico AG Civil Rights", type: "ag", phone: "1-505-827-6000", url: "https://www.nmag.gov", complaintUrl: "https://www.nmag.gov/complaints.aspx", description: "File civil rights complaints through the New Mexico Attorney General's office." },
      { name: "NM Human Rights Bureau", type: "civil_rights", phone: "1-505-827-6838", url: "https://www.dws.state.nm.us/Human-Rights", complaintUrl: "https://www.dws.state.nm.us/Human-Rights/Complaint-Process", description: "File discrimination complaints in employment, housing, and public accommodations in New Mexico." },
      { name: "ACLU of New Mexico", type: "legal_aid", phone: "1-505-266-5915", url: "https://www.aclu-nm.org", complaintUrl: "https://www.aclu-nm.org/en/report-civil-rights-violation", description: "Report civil rights violations, immigration rights, and police misconduct in New Mexico." },
    ],
  },
  {
    stateName: "New York", stateCode: "NY",
    resources: [
      { name: "New York AG Civil Rights Bureau", type: "ag", phone: "1-800-771-7755", url: "https://ag.ny.gov/bureau/civil-rights", complaintUrl: "https://ag.ny.gov/complaint-forms/civil-rights", description: "File civil rights complaints. NY AG's Civil Rights Bureau investigates police misconduct, hate crimes, and discrimination systemically and individually." },
      { name: "NY Division of Human Rights", type: "civil_rights", phone: "1-888-392-3644", url: "https://dhr.ny.gov", complaintUrl: "https://dhr.ny.gov/complaint", description: "File discrimination complaints in employment, housing, credit, and public accommodations in New York State." },
      { name: "NYC Civilian Complaint Review Board (CCRB)", type: "oversight", phone: "1-800-341-2272", url: "https://www.nyc.gov/site/ccrb/index.page", complaintUrl: "https://www.nyc.gov/site/ccrb/complaints/file-a-complaint.page", description: "File formal complaints against NYPD officers. The CCRB is fully independent of the NYPD and has authority to investigate, hold hearings, and recommend penalties." },
      { name: "ACLU of New York (NYCLU)", type: "legal_aid", phone: "1-212-607-3300", url: "https://www.nyclu.org", complaintUrl: "https://www.nyclu.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in New York. NYCLU is one of the most active state ACLU affiliates." },
    ],
  },
  {
    stateName: "North Carolina", stateCode: "NC",
    resources: [
      { name: "North Carolina AG Civil Rights", type: "ag", phone: "1-877-566-7226", url: "https://www.ncdoj.gov", complaintUrl: "https://www.ncdoj.gov/protecting-consumers/file-a-consumer-complaint", description: "File civil rights complaints through the North Carolina AG's Consumer Protection and Civil Rights division." },
      { name: "NC Human Relations Commission", type: "civil_rights", phone: "1-919-431-3050", url: "https://www.ncdhhs.gov/divisions/nchrc", complaintUrl: "https://www.ncdhhs.gov/divisions/nchrc/file-complaint", description: "File discrimination complaints and seek mediation in North Carolina." },
      { name: "ACLU of North Carolina", type: "legal_aid", phone: "1-919-834-3466", url: "https://www.acluofnc.org", complaintUrl: "https://www.acluofnc.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in North Carolina." },
    ],
  },
  {
    stateName: "North Dakota", stateCode: "ND",
    resources: [
      { name: "North Dakota AG Civil Rights", type: "ag", phone: "1-701-328-2210", url: "https://www.nd.gov/ndago", complaintUrl: "https://attorneygeneral.nd.gov/consumer-protection/complaint", description: "File civil rights complaints through the North Dakota Attorney General." },
      { name: "ND Department of Labor - Human Rights", type: "civil_rights", phone: "1-701-328-2660", url: "https://www.nd.gov/labor/human-rights", complaintUrl: "https://www.nd.gov/labor/human-rights/file-complaint", description: "File employment and housing discrimination complaints in North Dakota." },
      { name: "ACLU of North Dakota", type: "legal_aid", phone: "1-701-232-3965", url: "https://www.aclund.org", complaintUrl: "https://www.aclund.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in North Dakota." },
    ],
  },
  {
    stateName: "Ohio", stateCode: "OH",
    resources: [
      { name: "Ohio AG Civil Rights Section", type: "ag", phone: "1-800-282-0515", url: "https://www.ohioattorneygeneral.gov", complaintUrl: "https://www.ohioattorneygeneral.gov/Individuals-and-Families/Consumers/File-A-Complaint", description: "File civil rights complaints through the Ohio Attorney General's office." },
      { name: "Ohio Civil Rights Commission", type: "civil_rights", phone: "1-888-278-7101", url: "https://crc.ohio.gov", complaintUrl: "https://crc.ohio.gov/complaints/how-to-file", description: "File discrimination complaints in employment, housing, credit, and public accommodations in Ohio." },
      { name: "ACLU of Ohio", type: "legal_aid", phone: "1-614-228-8090", url: "https://www.acluohio.org", complaintUrl: "https://www.acluohio.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Ohio." },
    ],
  },
  {
    stateName: "Oklahoma", stateCode: "OK",
    resources: [
      { name: "Oklahoma AG Civil Rights", type: "ag", phone: "1-405-521-3921", url: "https://www.oag.ok.gov", complaintUrl: "https://www.oag.ok.gov/complaint", description: "File civil rights complaints through the Oklahoma Attorney General's office." },
      { name: "Oklahoma Human Rights Commission", type: "civil_rights", phone: "1-405-521-2360", url: "https://www.ok.gov/ohrc", complaintUrl: "https://www.ok.gov/ohrc/File_a_Complaint", description: "File discrimination complaints in employment, housing, and public accommodations in Oklahoma." },
      { name: "ACLU of Oklahoma", type: "legal_aid", phone: "1-405-524-8511", url: "https://www.acluok.org", complaintUrl: "https://www.acluok.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Oklahoma." },
    ],
  },
  {
    stateName: "Oregon", stateCode: "OR",
    resources: [
      { name: "Oregon AG Civil Rights", type: "ag", phone: "1-503-378-4400", url: "https://www.doj.state.or.us", complaintUrl: "https://www.doj.state.or.us/consumer-protection/complaints", description: "File civil rights and law enforcement misconduct complaints through the Oregon AG." },
      { name: "Oregon Bureau of Labor & Industries (BOLI)", type: "civil_rights", phone: "1-971-673-0761", url: "https://www.oregon.gov/boli", complaintUrl: "https://www.oregon.gov/boli/workers/pages/civil-rights-complaints.aspx", description: "File civil rights and discrimination complaints in employment and housing in Oregon." },
      { name: "Portland IPR (Independent Police Review)", type: "oversight", phone: "1-503-823-0146", url: "https://www.portlandoregon.gov/ipr", complaintUrl: "https://www.portlandoregon.gov/ipr/article/26608", description: "File formal complaints against Portland Police Bureau officers. Independent civilian review." },
      { name: "ACLU of Oregon", type: "legal_aid", phone: "1-503-227-3186", url: "https://www.aclu-or.org", complaintUrl: "https://www.aclu-or.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Oregon." },
    ],
  },
  {
    stateName: "Pennsylvania", stateCode: "PA",
    resources: [
      { name: "Pennsylvania AG Civil Rights", type: "ag", phone: "1-717-787-3391", url: "https://www.attorneygeneral.gov", complaintUrl: "https://www.attorneygeneral.gov/protect-yourself/file-a-complaint", description: "File civil rights complaints through the Pennsylvania Attorney General's office." },
      { name: "PA Human Relations Commission", type: "civil_rights", phone: "1-717-787-4410", url: "https://www.phrc.pa.gov", complaintUrl: "https://www.phrc.pa.gov/File-A-Complaint/Pages/default.aspx", description: "File discrimination complaints in employment, housing, commercial property, education, and public accommodations in Pennsylvania." },
      { name: "Philadelphia Police Advisory Commission", type: "oversight", phone: "1-215-685-0899", url: "https://www.phila.gov/departments/police-advisory-commission", complaintUrl: "https://www.phila.gov/departments/police-advisory-commission/complaints", description: "File formal complaints against Philadelphia Police Department officers." },
      { name: "ACLU of Pennsylvania", type: "legal_aid", phone: "1-215-592-1513", url: "https://www.aclupa.org", complaintUrl: "https://www.aclupa.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Pennsylvania." },
    ],
  },
  {
    stateName: "Rhode Island", stateCode: "RI",
    resources: [
      { name: "Rhode Island AG Civil Rights", type: "ag", phone: "1-401-274-4400", url: "https://riag.ri.gov", complaintUrl: "https://riag.ri.gov/contact-us/complaint", description: "File civil rights complaints through the Rhode Island Attorney General's office." },
      { name: "RI Commission for Human Rights", type: "civil_rights", phone: "1-401-222-2661", url: "https://richr.ri.gov", complaintUrl: "https://richr.ri.gov/filing-a-complaint", description: "File discrimination complaints in employment, housing, and public accommodations in Rhode Island." },
      { name: "ACLU of Rhode Island", type: "legal_aid", phone: "1-401-831-7171", url: "https://www.riaclu.org", complaintUrl: "https://www.riaclu.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Rhode Island." },
    ],
  },
  {
    stateName: "South Carolina", stateCode: "SC",
    resources: [
      { name: "South Carolina AG Civil Rights", type: "ag", phone: "1-803-734-3970", url: "https://www.scag.gov", complaintUrl: "https://www.scag.gov/for-consumers/consumer-complaint-process", description: "File civil rights complaints through the South Carolina Attorney General's office." },
      { name: "SC Human Affairs Commission", type: "civil_rights", phone: "1-803-737-7800", url: "https://schac.sc.gov", complaintUrl: "https://schac.sc.gov/complaints", description: "File employment and housing discrimination complaints in South Carolina." },
      { name: "ACLU of South Carolina", type: "legal_aid", phone: "1-803-799-5151", url: "https://www.aclusc.org", complaintUrl: "https://www.aclusc.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in South Carolina." },
    ],
  },
  {
    stateName: "South Dakota", stateCode: "SD",
    resources: [
      { name: "South Dakota AG Civil Rights", type: "ag", phone: "1-605-773-3215", url: "https://atg.sd.gov", complaintUrl: "https://atg.sd.gov/Consumers/ConsumerProtection/complaint.aspx", description: "File civil rights complaints through the South Dakota Attorney General." },
      { name: "SD Division of Human Rights", type: "civil_rights", phone: "1-605-773-4493", url: "https://dlr.sd.gov/human_rights", complaintUrl: "https://dlr.sd.gov/human_rights/complaint_process.aspx", description: "File employment and housing discrimination complaints in South Dakota." },
      { name: "ACLU of South Dakota", type: "legal_aid", phone: "1-605-332-2508", url: "https://www.aclusd.org", complaintUrl: "https://www.aclusd.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in South Dakota." },
    ],
  },
  {
    stateName: "Tennessee", stateCode: "TN",
    resources: [
      { name: "Tennessee AG Civil Rights", type: "ag", phone: "1-615-741-3491", url: "https://www.tn.gov/attorneygeneral", complaintUrl: "https://www.tn.gov/attorneygeneral/article/contact-agtngovconsumer", description: "File civil rights complaints through the Tennessee Attorney General's office." },
      { name: "TN Human Rights Commission", type: "civil_rights", phone: "1-615-741-5825", url: "https://www.tn.gov/humanrights", complaintUrl: "https://www.tn.gov/humanrights/how-to-file-a-charge.html", description: "File employment and housing discrimination charges in Tennessee." },
      { name: "ACLU of Tennessee", type: "legal_aid", phone: "1-615-320-7142", url: "https://www.aclu-tn.org", complaintUrl: "https://www.aclu-tn.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Tennessee." },
    ],
  },
  {
    stateName: "Texas", stateCode: "TX",
    resources: [
      { name: "Texas AG Civil Rights Division", type: "ag", phone: "1-512-463-2100", url: "https://www.texasattorneygeneral.gov", complaintUrl: "https://www.texasattorneygeneral.gov/consumer-protection/consumer-complaints", description: "File civil rights complaints through the Texas Attorney General's Civil Rights Division." },
      { name: "TX Workforce Commission — Civil Rights", type: "civil_rights", phone: "1-888-452-4778", url: "https://www.twc.texas.gov/civil-rights", complaintUrl: "https://www.twc.texas.gov/jobseekers/how-file-complaint-under-texas-labor-code", description: "File employment discrimination complaints in Texas through the Texas Workforce Commission." },
      { name: "Austin Police Oversight Office", type: "oversight", phone: "1-512-978-9420", url: "https://www.austintexas.gov/police-oversight", complaintUrl: "https://www.austintexas.gov/department/police-oversight/how-file-complaint", description: "File formal complaints against Austin Police Department officers. Independent civilian oversight." },
      { name: "ACLU of Texas", type: "legal_aid", phone: "1-512-478-7300", url: "https://www.aclutx.org", complaintUrl: "https://www.aclutx.org/en/report-civil-rights-violation", description: "Report civil rights violations, immigration rights, and police misconduct in Texas." },
      { name: "RAICES Texas", type: "immigration", phone: "1-512-994-2199", url: "https://www.raicestexas.org", complaintUrl: "https://www.raicestexas.org/our-programs/legal-services", description: "Immigration legal defense and ICE/CBP misconduct reporting in Texas and nationwide." },
    ],
  },
  {
    stateName: "Utah", stateCode: "UT",
    resources: [
      { name: "Utah AG Civil Rights", type: "ag", phone: "1-801-366-0260", url: "https://attorneygeneral.utah.gov", complaintUrl: "https://attorneygeneral.utah.gov/contact", description: "File civil rights complaints through the Utah Attorney General's office." },
      { name: "Utah Antidiscrimination & Labor Division", type: "civil_rights", phone: "1-801-530-6800", url: "https://laborcommission.utah.gov/divisions/antidiscrimination-labor", complaintUrl: "https://laborcommission.utah.gov/divisions/antidiscrimination-labor/file-a-complaint", description: "File employment and housing discrimination complaints in Utah." },
      { name: "ACLU of Utah", type: "legal_aid", phone: "1-801-521-9862", url: "https://www.acluutah.org", complaintUrl: "https://www.acluutah.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Utah." },
    ],
  },
  {
    stateName: "Vermont", stateCode: "VT",
    resources: [
      { name: "Vermont AG Civil Rights", type: "ag", phone: "1-802-828-3171", url: "https://ago.vermont.gov", complaintUrl: "https://ago.vermont.gov/divisions/civil-rights/how-to-file-a-civil-rights-complaint", description: "File civil rights and police misconduct complaints through the Vermont AG's Civil Rights Unit." },
      { name: "VT Human Rights Commission", type: "civil_rights", phone: "1-800-416-2010", url: "https://humanrights.vermont.gov", complaintUrl: "https://humanrights.vermont.gov/complaint-process", description: "File employment, housing, and public accommodations discrimination complaints in Vermont." },
      { name: "ACLU of Vermont", type: "legal_aid", phone: "1-802-223-6304", url: "https://www.acluvt.org", complaintUrl: "https://www.acluvt.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Vermont." },
    ],
  },
  {
    stateName: "Virginia", stateCode: "VA",
    resources: [
      { name: "Virginia AG Civil Rights Section", type: "ag", phone: "1-804-786-2071", url: "https://www.ag.virginia.gov", complaintUrl: "https://www.ag.virginia.gov/civil-rights-report-form", description: "File civil rights complaints through Virginia AG's Civil Rights Section. Virginia AG has increased law enforcement oversight authority under recent reforms." },
      { name: "VA Office of Civil Rights", type: "civil_rights", phone: "1-804-225-2292", url: "https://www.doe.virginia.gov/civil-rights", complaintUrl: "https://www.doe.virginia.gov/civil-rights/discrimination-complaints", description: "File civil rights and education discrimination complaints in Virginia." },
      { name: "ACLU of Virginia", type: "legal_aid", phone: "1-804-644-8080", url: "https://www.acluva.org", complaintUrl: "https://www.acluva.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Virginia." },
    ],
  },
  {
    stateName: "Washington", stateCode: "WA",
    resources: [
      { name: "Washington AG Civil Rights Division", type: "ag", phone: "1-800-551-4636", url: "https://www.atg.wa.gov/civil-rights", complaintUrl: "https://www.atg.wa.gov/civil-rights/file-civil-rights-complaint", description: "File civil rights complaints. Washington AG has strong authority to investigate law enforcement misconduct and has a dedicated Equity, Civil Rights & Ethics Division." },
      { name: "WA Human Rights Commission", type: "civil_rights", phone: "1-800-233-3247", url: "https://www.hum.wa.gov", complaintUrl: "https://www.hum.wa.gov/file-complaint", description: "File discrimination complaints in employment, housing, real estate transactions, and places of public resort in Washington state." },
      { name: "Seattle Office of Police Accountability", type: "oversight", phone: "1-206-684-8797", url: "https://www.seattle.gov/office-of-police-accountability", complaintUrl: "https://www.seattle.gov/office-of-police-accountability/file-a-complaint", description: "File formal complaints against Seattle Police Department officers. Independent civilian oversight." },
      { name: "ACLU of Washington", type: "legal_aid", phone: "1-206-624-2184", url: "https://www.aclu-wa.org", complaintUrl: "https://www.aclu-wa.org/en/report-civil-rights-violation", description: "Report civil rights violations, immigration rights issues, and police misconduct in Washington." },
    ],
  },
  {
    stateName: "West Virginia", stateCode: "WV",
    resources: [
      { name: "West Virginia AG Civil Rights", type: "ag", phone: "1-304-558-2021", url: "https://ago.wv.gov", complaintUrl: "https://ago.wv.gov/consumerprotection/Pages/ComplaintCenter.aspx", description: "File civil rights complaints through the West Virginia Attorney General's office." },
      { name: "WV Human Rights Commission", type: "civil_rights", phone: "1-304-558-2616", url: "https://www.wvhumanrights.com", complaintUrl: "https://www.wvhumanrights.com/complaint.html", description: "File employment and housing discrimination complaints in West Virginia." },
      { name: "ACLU of West Virginia", type: "legal_aid", phone: "1-304-345-9246", url: "https://www.acluwv.org", complaintUrl: "https://www.acluwv.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in West Virginia." },
    ],
  },
  {
    stateName: "Wisconsin", stateCode: "WI",
    resources: [
      { name: "Wisconsin AG Civil Rights", type: "ag", phone: "1-608-266-1221", url: "https://www.doj.state.wi.us", complaintUrl: "https://www.doj.state.wi.us/consumer/complaint-center/file-complaint", description: "File civil rights complaints through the Wisconsin Department of Justice." },
      { name: "WI Equal Rights Division", type: "civil_rights", phone: "1-608-266-6860", url: "https://dwd.wisconsin.gov/er", complaintUrl: "https://dwd.wisconsin.gov/er/civil_rights/complaints.htm", description: "File employment and public accommodation discrimination complaints in Wisconsin." },
      { name: "ACLU of Wisconsin", type: "legal_aid", phone: "1-414-272-4032", url: "https://www.aclu-wi.org", complaintUrl: "https://www.aclu-wi.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Wisconsin." },
    ],
  },
  {
    stateName: "Wyoming", stateCode: "WY",
    resources: [
      { name: "Wyoming AG Civil Rights", type: "ag", phone: "1-307-777-7841", url: "https://ag.wyo.gov", complaintUrl: "https://ag.wyo.gov/consumer-protection/file-a-consumer-complaint", description: "File civil rights complaints through the Wyoming Attorney General's office." },
      { name: "Wyoming Department of Workforce Services", type: "civil_rights", phone: "1-307-777-6380", url: "https://wyomingworkforce.org", complaintUrl: "https://wyomingworkforce.org/businesses/employment-standards/fair-employment/file-a-complaint", description: "File employment discrimination complaints in Wyoming through the Department of Workforce Services." },
      { name: "ACLU of Wyoming", type: "legal_aid", phone: "1-307-637-4565", url: "https://www.acluwy.org", complaintUrl: "https://www.acluwy.org/en/report-civil-rights-violation", description: "Report civil rights violations and police misconduct in Wyoming." },
    ],
  },
];

export const TYPE_META: Record<ResourceType, { label: string; color: string; icon: string }> = {
  federal:      { label: "Federal", color: "#3b82f6", icon: "star" },
  ag:           { label: "Attorney General", color: "#8b5cf6", icon: "shield" },
  civil_rights: { label: "Civil Rights Commission", color: "#f59e0b", icon: "award" },
  oversight:    { label: "Police Oversight", color: "#ef4444", icon: "eye" },
  legal_aid:    { label: "Legal Aid", color: "#22c55e", icon: "briefcase" },
  immigration:  { label: "Immigration", color: "#0891b2", icon: "globe" },
  hotline:      { label: "Hotline", color: "#f97316", icon: "phone" },
};
