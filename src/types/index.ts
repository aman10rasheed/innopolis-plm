// ============================================================================
// Innopolis PLM — Domain Types
// ============================================================================

export type Lifecycle =
  | "Concept"
  | "In Design"
  | "In Review"
  | "Released"
  | "Production"
  | "Obsolete";

/** The 14 configurable Material Master categories (Innopolis FRD §3). */
export type PartCategory =
  | "Mechanical Bought-out"
  | "Mechanical Fabricated"
  | "Piping"
  | "Pipe Fittings"
  | "Structural Materials"
  | "Process Equipment"
  | "Field Instruments"
  | "Panel Instruments"
  | "Instrument Accessories"
  | "Electrical"
  | "Reagents"
  | "Packings & Fillings"
  | "Elastomers"
  | "Consumables";

export type SourcingType = "Make" | "Buy" | "Standard";
export type Availability = "In Stock" | "Low Stock" | "Backorder" | "Out of Stock";
export type ComplianceFlag = "ASME" | "PED" | "ATEX" | "GMP" | "3.1 Cert";

/** Predefined resource specification (admin-managed master). */
export interface ResourceSpec {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Part {
  id: string;
  /** Intelligent material code TT-SS-MM-DDDD (also the primary identifier). */
  partNumber: string;
  materialType: string; // TT
  subType: string; // SS  (human-readable subtype name)
  subTypeCode: string; // SS code
  majorSpec: string; // MM
  detailSpec: string; // DDDD
  name: string;
  category: PartCategory;
  /** Material free text (API `remarks`, formerly `description`). */
  remarks: string;
  material: string;
  finish: string;
  revision: string;
  lifecycle: Lifecycle;
  sourcing: SourcingType;
  weightKg: number;
  unitCost: number;
  /** System-maintained: auto-updated on every goods receipt. */
  lastPurchasePrice: number;
  lastPurchaseDate: string | null;
  lastPurchaseVendorId: string | null;
  /** Resolved vendor of the last purchase (single-material reads only). */
  lastPurchaseVendor: Supplier | null;
  leadTimeDays: number;
  /** Preferred vendors (single-material reads only; empty on list rows). */
  vendorIds: string[];
  preferredVendors: Supplier[];
  /** Resource specs (single-material reads only; empty on list rows). */
  resourceSpecIds: string[];
  resourceSpecs: ResourceSpec[];
  manufacturerPartNumber: string;
  make: string;
  model: string;
  drawingRef: string;
  availability: Availability;
  stockQty: number;
  reorderPoint: number;
  minStock: number;
  maxStock: number;
  stockLocation: string;
  uom: string; // unit of measure
  compliance: ComplianceFlag[];
  tags: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  thumbnailHue: number; // for generated thumbnails
  whereUsedCount: number;
}

/** Project lifecycle stages — Innopolis FRD §1 (enquiry → inventory update). */
export type ProjectStage =
  | "Enquiry"
  | "Technical Evaluation"
  | "Quotation"
  | "Project Order"
  | "Detailed Engineering"
  | "Final BOM"
  | "Purchase Release"
  | "Procurement"
  | "Fulfilment"
  | "Completed";

export const PROJECT_STAGES: ProjectStage[] = [
  "Enquiry",
  "Technical Evaluation",
  "Quotation",
  "Project Order",
  "Detailed Engineering",
  "Final BOM",
  "Purchase Release",
  "Procurement",
  "Fulfilment",
  "Completed",
];

/** A Project (formerly Product) — the top-level engineering deliverable. */
export interface Product {
  id: string;
  code: string; // project number e.g. INP-2026-0042
  projectNumber: string;
  name: string;
  family: string;
  description: string;
  customer: string;
  engineerId: string;
  /** Assigned Project Manager (scopes PM visibility/actions). */
  projectManagerId: string | null;
  stage: ProjectStage;
  lifecycle: Lifecycle;
  revision: string;
  version: string;
  unitCost: number; // estimated project cost
  targetCost: number;
  msrp: number; // quoted price
  marginPct: number;
  unitsBuilt: number; // BOM line items
  openEcos: number; // open BOM approvals / changes
  releaseDate: string; // enquiry date
  ownerId: string;
  /** Inline attribution from the API (detail responses; null if user deleted). */
  ownerName?: string | null;
  engineerName?: string | null;
  engineerInitials?: string | null;
  engineerHue?: number | null;
  managerName?: string | null;
  managerInitials?: string | null;
  managerHue?: number | null;
  thumbnailHue: number;
  health: number; // 0-100
  category: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  country: string;
  region: string;
  category: string;
  tier: 1 | 2 | 3;
  rating: number; // 0-5
  onTimePct: number;
  qualityPct: number;
  partsSupplied: number;
  openPOs: number;
  annualSpend: number;
  leadTimeAvg: number;
  riskScore: number; // 0-100, higher = riskier
  status: "Approved" | "Preferred" | "Conditional" | "Under Review";
  contact: string;
  email: string;
  gstVat: string;
  paymentTerms: string;
  categoriesSupplied: string[];
  approved: boolean;
}

export type BomLineType = "project" | "part";

export interface BomNode {
  id: string;
  refId: string; // part or project id
  type: BomLineType;
  partNumber: string;
  name: string;
  category?: PartCategory;
  quantity: number;
  uom: string;
  unitCost: number;
  extendedCost: number; // unit * qty (rolled for the project root)
  lifecycle: Lifecycle;
  revision: string;
  refDesignator?: string;
  leadTimeDays: number;
  procurement: SourcingType;
  level: number;
  findNumber: number;
  children?: BomNode[];
  hasIssue?: boolean;
  isDuplicate?: boolean;
}

export type EcoStatus =
  | "Draft"
  | "Review"
  | "Approved"
  | "Released"
  | "Completed";
export type EcoPriority = "Low" | "Medium" | "High" | "Critical";
export type EcoType =
  | "Design Change"
  | "Cost Reduction"
  | "Supplier Change"
  | "Quality"
  | "Compliance"
  | "Documentation";

export interface Eco {
  id: string;
  number: string;
  title: string;
  description: string;
  status: EcoStatus;
  priority: EcoPriority;
  type: EcoType;
  ownerId: string;
  reviewerIds: string[];
  affectedItems: number;
  productId?: string;
  costImpact: number;
  createdAt: string;
  dueDate: string;
  progress: number;
  commentsCount: number;
  attachmentsCount: number;
  approvalsNeeded: number;
  approvalsReceived: number;
}

export interface Revision {
  id: string;
  itemId: string;
  itemPartNumber: string;
  itemName: string;
  revision: string;
  status: "Released" | "Superseded" | "Working" | "In Review";
  authorId: string;
  date: string;
  changeSummary: string;
  ecoNumber?: string;
  changedFields: number;
  added: number;
  removed: number;
  modified: number;
}

export type DocType =
  | "Drawing"
  | "Specification"
  | "Datasheet"
  | "CAD Model"
  | "Test Report"
  | "Certificate"
  | "Work Instruction"
  | "Image"
  | "Contract";

export interface DocItem {
  id: string;
  name: string;
  type: DocType;
  format: string;
  sizeKb: number;
  folder: string;
  version: string;
  ownerId: string;
  updatedAt: string;
  tags: string[];
  favorite: boolean;
  linkedItemId?: string;
  status: "Approved" | "Draft" | "In Review";
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  type: "Distribution" | "Manufacturing" | "Buffer" | "Transit";
  capacityPct: number;
  skuCount: number;
  stockValue: number;
  lowStockItems: number;
  lat: number;
  lng: number;
}

export interface InventoryRecord {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  warehouseId: string;
  warehouseCode: string;
  onHand: number;
  reserved: number;
  available: number;
  incoming: number;
  reorderPoint: number;
  unitCost: number;
  uom: string;
  status: Availability;
}

export type PoStatus =
  | "Draft"
  | "Pending Approval"
  | "Open"
  | "Partially Received"
  | "Received"
  | "Closed"
  | "Cancelled";

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  status: PoStatus;
  lineItems: number;
  totalValue: number;
  orderedDate: string;
  expectedDate: string;
  receivedPct: number;
  ownerId: string;
  priority: EcoPriority;
  onTimeRisk: "Low" | "Medium" | "High";
}

export interface User {
  id: string;
  name: string;
  initials: string;
  role: string;
  team: string;
  hue: number;
  online: boolean;
}

export type ActivityType =
  | "eco"
  | "revision"
  | "comment"
  | "approval"
  | "part"
  | "document"
  | "inventory"
  | "purchase";

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  action: string;
  target: string;
  targetId?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: "mention" | "approval" | "inventory" | "eco" | "system";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

export interface Approval {
  id: string;
  ecoId: string;
  ecoNumber: string;
  title: string;
  type: EcoType;
  requestedById: string;
  assignedToId: string;
  priority: EcoPriority;
  requestedAt: string;
  dueDate: string;
  status: "Pending" | "Approved" | "Rejected";
  costImpact: number;
  affectedItems: number;
}

/* ---- BOM Approval workflow (FRD §10) ---- */
export type BomStage =
  | "Draft"
  | "Technical Review"
  | "Commercial Review"
  | "Approved"
  | "Released for Purchase";

export const BOM_STAGES: BomStage[] = [
  "Draft",
  "Technical Review",
  "Commercial Review",
  "Approved",
  "Released for Purchase",
];

export interface BomAuditEntry {
  stage: BomStage;
  userId: string;
  date: string;
  comment: string;
  /** Inline user attribution returned by the API (null if user deleted). */
  userName?: string | null;
  userInitials?: string | null;
  userHue?: number | null;
}

export interface ProjectBom {
  id: string;
  number: string; // BOM-####
  projectId: string;
  projectNumber: string;
  projectName: string;
  customer: string;
  revision: string;
  stage: BomStage;
  bomType: "Engineering" | "Procurement" | "Final Released";
  lineItems: number;
  uniqueMaterials: number;
  totalValue: number;
  criticalItems: number;
  longLeadItems: number;
  ownerId: string;
  /** Inline owner attribution from the API (detail responses; null if deleted). */
  ownerName?: string | null;
  ownerInitials?: string | null;
  ownerHue?: number | null;
  createdAt: string;
  updatedAt: string;
  audit: BomAuditEntry[];
}

/* ---- Procurement: RFQ + Quotation (FRD §12–13) ---- */
export type RfqMode = "Vendor-wise" | "Category-wise" | "Package-wise" | "Single Item" | "Bulk";
export type RfqStatus = "Draft" | "Sent" | "Quotes In" | "Comparison" | "Awarded" | "Closed";

export interface Rfq {
  id: string;
  number: string; // RFQ-####
  title: string;
  mode: RfqMode;
  status: RfqStatus;
  projectId?: string;
  projectNumber?: string;
  vendorIds: string[];
  lineItems: number;
  category?: string;
  estValue: number;
  requiredDate: string;
  createdAt: string;
  ownerId: string;
  quotesReceived: number;
  quotesExpected: number;
}

export type QuotationStatus = "Pending" | "Received" | "Under Review" | "Awarded" | "Rejected";

export interface Quotation {
  id: string;
  rfqId: string;
  rfqNumber: string;
  vendorId: string;
  vendorName: string;
  totalValue: number;
  leadTimeDays: number;
  paymentTerms: string;
  validityDays: number;
  deliveryTerms: string;
  status: QuotationStatus;
  receivedAt: string;
  lineCount: number;
  /** lower rank = better overall (1 = recommended). */
  rank: number;
  score: number; // 0-100 weighted
}
