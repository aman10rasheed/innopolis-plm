import type { PartCategory } from "@/types";

/* ============================================================================
 * INNOPOLIS MATERIAL MASTER — categories, type codes, subtypes, specs
 * Implements the FRD intelligent code structure:  TT-SS-MM-DDDD
 *   TT  = Material Type (category 2-letter code)
 *   SS  = Subtype
 *   MM  = Major Specification (size / rating)
 *   DDDD= Detailed Specification (grade / detail)
 * e.g. MB-VA-15-3040 = Mechanical Bought-out Valve, 15 mm, SS304 Ball Valve
 * ==========================================================================*/

export interface SubtypeDef {
  name: string;
  code: string; // SS
}

export interface MaterialCategoryDef {
  name: PartCategory;
  type: string; // TT
  uom: string;
  subtypes: SubtypeDef[];
}

export const MATERIAL_CATEGORIES: MaterialCategoryDef[] = [
  {
    name: "Mechanical Bought-out", type: "MB", uom: "Nos",
    subtypes: [
      { name: "Valve", code: "VA" }, { name: "Pump", code: "PU" }, { name: "Gearbox", code: "GB" },
      { name: "Bearing", code: "BR" }, { name: "Coupling", code: "CP" }, { name: "Motor", code: "MO" },
      { name: "Blower", code: "BL" }, { name: "Compressor", code: "CM" },
    ],
  },
  {
    name: "Mechanical Fabricated", type: "MF", uom: "Nos",
    subtypes: [
      { name: "Pressure Vessel", code: "VS" }, { name: "Storage Tank", code: "TK" }, { name: "Skid", code: "SK" },
      { name: "Frame", code: "FR" }, { name: "Bracket", code: "BK" }, { name: "Hopper", code: "HP" },
      { name: "Chute", code: "CH" }, { name: "Platform", code: "PL" },
    ],
  },
  {
    name: "Piping", type: "PP", uom: "Mtr",
    subtypes: [
      { name: "Pipe", code: "PI" }, { name: "Tube", code: "TU" }, { name: "Header", code: "HD" }, { name: "Spool", code: "SP" },
    ],
  },
  {
    name: "Pipe Fittings", type: "PF", uom: "Nos",
    subtypes: [
      { name: "Elbow", code: "EL" }, { name: "Tee", code: "TE" }, { name: "Flange", code: "FL" },
      { name: "Reducer", code: "RD" }, { name: "Coupling", code: "CO" }, { name: "Union", code: "UN" },
      { name: "Cap", code: "CA" }, { name: "Nipple", code: "NP" },
    ],
  },
  {
    name: "Structural Materials", type: "ST", uom: "Mtr",
    subtypes: [
      { name: "Beam", code: "BM" }, { name: "Channel", code: "CN" }, { name: "Angle", code: "AN" },
      { name: "Plate", code: "PT" }, { name: "Grating", code: "GR" }, { name: "Ladder", code: "LD" },
    ],
  },
  {
    name: "Process Equipment", type: "PE", uom: "Nos",
    subtypes: [
      { name: "Heat Exchanger", code: "HE" }, { name: "Filter", code: "FT" }, { name: "Reactor", code: "RX" },
      { name: "Centrifuge", code: "CF" }, { name: "Dryer", code: "DR" }, { name: "Mixer", code: "MX" },
      { name: "Column", code: "CL" },
    ],
  },
  {
    name: "Field Instruments", type: "FI", uom: "Nos",
    subtypes: [
      { name: "Transmitter", code: "TR" }, { name: "Gauge", code: "GA" }, { name: "Switch", code: "SW" },
      { name: "Sensor", code: "SN" }, { name: "Flowmeter", code: "FM" }, { name: "Level Element", code: "LV" },
    ],
  },
  {
    name: "Panel Instruments", type: "PI", uom: "Nos",
    subtypes: [
      { name: "Controller", code: "CT" }, { name: "Indicator", code: "ID" }, { name: "Recorder", code: "RC" },
      { name: "PLC Module", code: "PC" }, { name: "HMI", code: "HM" },
    ],
  },
  {
    name: "Instrument Accessories", type: "IA", uom: "Nos",
    subtypes: [
      { name: "Manifold", code: "MN" }, { name: "Impulse Tube", code: "TB" }, { name: "Fitting", code: "FG" },
      { name: "Impulse Line", code: "IL" }, { name: "Mounting Bracket", code: "MB" },
    ],
  },
  {
    name: "Electrical", type: "EL", uom: "Nos",
    subtypes: [
      { name: "Cable", code: "CB" }, { name: "Motor", code: "MT" }, { name: "Breaker", code: "BK" },
      { name: "Panel", code: "PN" }, { name: "Transformer", code: "TF" }, { name: "Light Fitting", code: "LT" },
      { name: "Junction Box", code: "JB" },
    ],
  },
  {
    name: "Reagents", type: "RG", uom: "Ltr",
    subtypes: [
      { name: "Acid", code: "AC" }, { name: "Base", code: "BS" }, { name: "Solvent", code: "SV" },
      { name: "Buffer", code: "BF" }, { name: "Culture Media", code: "MD" }, { name: "Catalyst", code: "CT" },
    ],
  },
  {
    name: "Packings & Fillings", type: "PK", uom: "Nos",
    subtypes: [
      { name: "Gasket", code: "GK" }, { name: "Gland Packing", code: "GP" }, { name: "Mechanical Seal", code: "SL" },
      { name: "O-Ring", code: "OR" }, { name: "Tower Filler", code: "TF" },
    ],
  },
  {
    name: "Elastomers", type: "EM", uom: "Nos",
    subtypes: [
      { name: "Rubber", code: "RB" }, { name: "Silicone", code: "SI" }, { name: "Viton (FKM)", code: "VT" },
      { name: "EPDM", code: "EP" }, { name: "Nitrile (NBR)", code: "NT" },
    ],
  },
  {
    name: "Consumables", type: "CN", uom: "Nos",
    subtypes: [
      { name: "Bolt", code: "BO" }, { name: "Nut", code: "NU" }, { name: "Washer", code: "WA" },
      { name: "Welding Rod", code: "WR" }, { name: "PTFE Tape", code: "TP" }, { name: "Lubricant", code: "LB" },
    ],
  },
];

/** Quick lookup of category def by name. */
export const CATEGORY_BY_NAME: Record<PartCategory, MaterialCategoryDef> = Object.fromEntries(
  MATERIAL_CATEGORIES.map((c) => [c.name, c]),
) as Record<PartCategory, MaterialCategoryDef>;

/** Backwards-compatible meta used by older imports. */
export const CATEGORY_META: Record<PartCategory, { prefix: string; uom: string }> =
  Object.fromEntries(MATERIAL_CATEGORIES.map((c) => [c.name, { prefix: c.type, uom: c.uom }])) as Record<
    PartCategory,
    { prefix: string; uom: string }
  >;

/** Major spec values (MM) — nominal sizes / ratings, 2 chars. */
export const MAJOR_SPECS = ["08", "15", "25", "40", "50", "80", "10", "20", "65", "00"];

/** Detailed spec values (DDDD) — material grade / detail, 4 chars. */
export interface GradeDef {
  code: string; // DDDD
  label: string;
}
export const GRADES: GradeDef[] = [
  { code: "3040", label: "SS 304" },
  { code: "3160", label: "SS 316" },
  { code: "316L", label: "SS 316L" },
  { code: "CS10", label: "Carbon Steel" },
  { code: "DUPX", label: "Duplex 2205" },
  { code: "PTFE", label: "PTFE Lined" },
  { code: "PP00", label: "Polypropylene" },
  { code: "PVDF", label: "PVDF" },
  { code: "HAST", label: "Hastelloy C276" },
  { code: "TI00", label: "Titanium Gr2" },
  { code: "BRSS", label: "Brass" },
  { code: "GIPV", label: "GI / Galvanised" },
];

/** Build the intelligent material code TT-SS-MM-DDDD. */
export function buildMaterialCode(type: string, subtype: string, major: string, detail: string) {
  return `${type}-${subtype}-${major}-${detail}`;
}

export const MATERIALS: Record<string, string[]> = {
  metal: ["Stainless Steel 304", "Stainless Steel 316L", "Carbon Steel A106", "Duplex 2205", "Hastelloy C276", "Titanium Gr2", "Brass", "Galvanised Iron"],
  plastic: ["Polypropylene", "PVDF", "PTFE", "HDPE", "PVC", "Acrylic"],
  elastomer: ["EPDM", "Silicone", "Nitrile (NBR)", "Viton (FKM)", "Neoprene"],
  electronic: ["FR-4", "Tinned Copper", "PVC Insulated", "XLPE"],
};

export const FINISHES = [
  "Electropolished", "Pickled & Passivated", "Powder Coat — RAL 7035", "Galvanised", "Epoxy Painted",
  "Mirror Polish Ra 0.4", "Bead Blasted", "PTFE Coated", "As Fabricated", "None",
];

export const SUPPLIER_NAMES = [
  "Bharat Process Equip", "Inox Valves Pvt Ltd", "Grundfos Pumps India", "SKF Bearings", "Forbes Marshall",
  "Endress+Hauser India", "Emerson Process Mgmt", "Honeywell Automation", "Siemens India", "L&T Valves",
  "Alfa Laval India", "GMM Pfaudler", "Praj Industries", "Thermax Ltd", "Ion Exchange",
  "Sintex Plastics", "Finolex Pipes", "Jindal SAW", "Tata Structural Steel", "APL Apollo Tubes",
  "Audco India", "KSB Pumps", "Kirloskar Brothers", "Crompton Greaves", "Polycab Wires",
  "Havells Electricals", "ABB India", "Schneider Electric", "Yokogawa India", "Pepperl+Fuchs",
  "Rotork Controls", "Flowserve India", "Pentair Valves", "Sandvik Materials", "Outokumpu Steel",
  "Merck Life Science", "Sigma-Aldrich", "Thermo Fisher Sci", "HiMedia Labs", "SRL Chemicals",
  "Garlock Sealing", "Champion Seals", "Klinger Gaskets", "Pyramid Elastomers", "Hindustan Rubber",
  "Spirax Sarco India", "Swagelok India", "Parker Hannifin", "Festo India", "SMC Pneumatics",
  "Wika Instruments", "Ashcroft Gauges", "Rosemount India", "Vega Instruments", "Krohne Marshall",
  "Cole-Parmer India", "GEA Process", "SPX Flow", "Sulzer Pumps", "Xylem Water",
  "Bonfiglioli Drives", "NORD Drivesystems", "Rexnord Couplings", "Lovejoy India", "Renold Chains",
  "Trouw Nutrition", "Praxair Gases", "Linde Engineering", "Atlas Copco", "Ingersoll Rand",
  "Cera Sanitaryware", "Supreme Industries", "Astral Pipes", "Ashirvad Pipes", "Prince Pipes",
  "Wires & Fabriks", "Anchor Electricals", "RR Kabel", "KEI Industries", "Lapp India",
];

export const COUNTRIES = [
  { country: "India", region: "Domestic" },
  { country: "India", region: "Domestic" },
  { country: "India", region: "Domestic" },
  { country: "Germany", region: "Import" },
  { country: "USA", region: "Import" },
  { country: "Italy", region: "Import" },
  { country: "China", region: "Import" },
  { country: "Japan", region: "Import" },
  { country: "Switzerland", region: "Import" },
  { country: "Singapore", region: "Import" },
];

export const PROJECT_FAMILIES = [
  { family: "Fermentation", category: "Bioprocess", noun: "Fermenter Skid" },
  { family: "Downstream", category: "Bioprocess", noun: "Purification Skid" },
  { family: "Media Prep", category: "Utilities", noun: "Media Prep System" },
  { family: "CIP/SIP", category: "Utilities", noun: "CIP Station" },
  { family: "Buffer Prep", category: "Utilities", noun: "Buffer Prep Skid" },
  { family: "Chromatography", category: "Downstream", noun: "Chromatography Skid" },
  { family: "Filtration", category: "Downstream", noun: "TFF Skid" },
  { family: "Formulation", category: "Fill-Finish", noun: "Formulation System" },
  { family: "Bioreactor", category: "Bioprocess", noun: "Single-Use Bioreactor" },
  { family: "Utility", category: "Utilities", noun: "WFI Generation Unit" },
];

export const CUSTOMERS = [
  "Serum Institute", "Biocon Biologics", "Dr. Reddy's Labs", "Cipla Biotech", "Bharat Biotech",
  "Panacea Biotec", "Zydus Lifesciences", "Gennova Biopharma", "Shantha Biotechnics", "Wockhardt Bio",
  "Intas Pharma", "Aurobindo Pharma", "Hetero Labs", "Sun Pharma", "Lupin Biotech",
];

export const USER_NAMES = [
  ["Elena Vasquez", "Lead Process Engineer", "Engineering"],
  ["Marcus Chen", "Instrumentation Engineer", "Engineering"],
  ["Priya Nair", "System Administrator", "Admin"],
  ["David Okafor", "Mechanical Engineer", "Engineering"],
  ["Sofia Rossi", "Piping Engineer", "Engineering"],
  ["James Park", "Purchase Manager", "Purchase"],
  ["Anika Schmidt", "QA / Stores", "Stores"],
  ["Liam Murphy", "Project Lead", "Engineering"],
  ["Yuki Tanaka", "Electrical Engineer", "Engineering"],
  ["Carlos Mendez", "Commercial Analyst", "Commercial"],
  ["Nadia Petrov", "Process Engineer", "Engineering"],
  ["Tom Albright", "Buyer", "Purchase"],
  ["Grace Liu", "Design Engineer", "Engineering"],
  ["Omar Haddad", "Commercial Manager", "Commercial"],
  ["Hannah Berg", "Engineering Director", "Management"],
  ["Raj Patel", "Stores In-charge", "Stores"],
];

export const COMPLIANCE_POOL = ["ASME", "PED", "ATEX", "GMP", "3.1 Cert"] as const;

export const TAG_POOL = [
  "critical-path", "long-lead", "single-source", "cost-driver", "import",
  "high-value", "preferred", "new-material", "qualified", "obsolescence-risk",
  "GMP-contact", "hazardous", "import-licence", "common", "custom-fab",
];
