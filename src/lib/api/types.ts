/* ============================================================================
 * API DTOs — exactly as the backend returns them (snake_case; numeric fields
 * are JSON strings). Map these to the app's camelCase domain via `mappers.ts`.
 * Enum string unions are shared with the domain model in `@/types`.
 * ==========================================================================*/

import type {
  Lifecycle,
  SourcingType,
  Availability,
  ProjectStage,
  BomStage,
  EcoPriority,
  PoStatus,
  RfqMode,
  RfqStatus,
  QuotationStatus,
  ComplianceFlag,
} from "@/types";
import type { Role } from "@/auth/credentials";

/** numeric-as-string (Postgres numeric). Run through `toNumber()`. */
type Num = string;
type ISO = string;
type UUID = string;

/* ---- Auth ---- */
export interface ApiUser {
  id: UUID;
  name: string;
  email: string;
  role: Role;
  team: string;
  initials: string;
  hue: number;
}
export interface ApiAuthResponse {
  token: string;
  user: ApiUser;
  must_change_password?: boolean;
}

/** Full user record from /api/users (admin) — password_hash is never returned. */
export interface ApiUserFull extends ApiUser {
  is_active: boolean;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiCreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  team?: string;
  initials?: string;
  hue?: number;
}

export interface ApiResetPasswordResponse {
  user_id: UUID;
  temporary_password: string;
  message: string;
}

/* ---- Material Master masters ---- */
export interface ApiCategory { id: UUID; name: string; type_code: string; default_uom: string; is_active: boolean }
export interface ApiSubtype { id: UUID; category_id: UUID; name: string; code: string; is_active: boolean }
export interface ApiMajorSpec { id: UUID; code: string; label: string; is_active: boolean }
export interface ApiGrade { id: UUID; code: string; label: string; is_active: boolean }
export interface ApiUnit { id: UUID; code: string; name: string; is_active: boolean }

/* ---- Part (Material) ---- */
export interface ApiPart {
  id: UUID;
  part_number: string;
  category_id: UUID;
  subtype_id: UUID;
  major_spec_id: UUID | null;
  grade_id: UUID | null;
  material_type: string;
  sub_type: string;
  sub_type_code: string;
  major_spec: string;
  detail_spec: string;
  category: string;
  name: string;
  description: string;
  material: string;
  finish: string;
  revision: string;
  lifecycle: Lifecycle;
  sourcing: SourcingType;
  weight_kg: Num;
  unit_cost: Num;
  last_purchase_price: Num;
  lead_time_days: number;
  supplier_id: UUID | null;
  manufacturer_part_number: string;
  make: string;
  model: string;
  drawing_ref: string;
  availability: Availability;
  stock_qty: Num;
  reorder_point: Num;
  min_stock: Num;
  max_stock: Num;
  stock_location: string;
  uom: string;
  compliance: ComplianceFlag[];
  tags: string[];
  owner_id: UUID | null;
  thumbnail_hue: number;
  where_used_count: number;
  created_at: ISO;
  updated_at: ISO;
}

export interface ApiPartInput {
  category_id: UUID;
  subtype_id: UUID;
  major_spec_id?: UUID;
  grade_id?: UUID;
  name: string;
  description?: string;
  material?: string;
  finish?: string;
  revision?: string;
  lifecycle?: Lifecycle;
  sourcing?: SourcingType;
  weight_kg?: number;
  unit_cost?: number;
  last_purchase_price?: number;
  lead_time_days?: number;
  supplier_id?: UUID;
  manufacturer_part_number?: string;
  make?: string;
  model?: string;
  drawing_ref?: string;
  availability?: Availability;
  stock_qty?: number;
  reorder_point?: number;
  min_stock?: number;
  max_stock?: number;
  stock_location?: string;
  uom?: string;
  compliance?: ComplianceFlag[];
  tags?: string[];
  thumbnail_hue?: number;
}

/* ---- Supplier (Vendor) ---- */
export interface ApiSupplier {
  id: UUID;
  code: string;
  name: string;
  country: string;
  region: string;
  category: string;
  categories_supplied: string[];
  tier: 1 | 2 | 3;
  contact: string;
  email: string;
  phone: string;
  address: string;
  gst_vat: string;
  payment_terms: string;
  lead_time_avg: number;
  rating: Num;
  on_time_pct: Num;
  quality_pct: Num;
  risk_score: Num;
  annual_spend: Num;
  status: "Approved" | "Preferred" | "Conditional" | "Under Review";
  approved: boolean;
  parts_supplied?: number;
  open_pos?: number;
  created_at: ISO;
  updated_at: ISO;
}

/* ---- Project ---- */
export interface ApiProject {
  id: UUID;
  project_number: string;
  name: string;
  customer: string;
  family: string;
  category: string;
  description: string;
  engineer_id: UUID | null;
  stage: ProjectStage;
  lifecycle: Lifecycle;
  revision: string;
  version: string;
  est_cost?: Num;
  target_cost: Num;
  quoted_price: Num;
  margin_pct?: Num;
  owner_id: UUID | null;
  thumbnail_hue: number;
  health?: number;
  created_at: ISO;
  updated_at: ISO;
}

/* ---- Project BOM ---- */
export interface ApiBom {
  id: UUID;
  number: string;
  project_id: UUID;
  bom_type: "Engineering" | "Procurement" | "Final Released";
  stage: BomStage;
  revision: string;
  line_items: number;
  unique_materials: number;
  total_value: Num;
  critical_items: number;
  long_lead_items: number;
  owner_id: UUID | null;
  created_at: ISO;
  updated_at: ISO;
}
export interface ApiBomLine {
  id: UUID;
  bom_id: UUID;
  part_id: UUID;
  find_number: number;
  level: number;
  parent_line_id: UUID | null;
  part_number: string;
  name: string;
  description: string;
  category: string;
  uom: string;
  unit_cost: Num;
  procurement: SourcingType;
  lead_time_days: number;
  material_revision: string;
  quantity: Num;
  extended_cost: Num;
  ref_designator: string | null;
  remarks: string | null;
  buying_notes: string | null;
  drawing_ref: string | null;
  vendor_id: UUID | null;
  is_critical: boolean;
}
export interface ApiBomAudit {
  from_stage: BomStage | null;
  to_stage: BomStage;
  action: "advance" | "reject" | "create";
  comment: string;
  user_id: UUID;
  created_at: ISO;
}
export interface ApiBomDetail extends ApiBom {
  lines: ApiBomLine[];
  audit: ApiBomAudit[];
}
export interface ApiBomAnalysisGroup { key: string; lineItems: number; totalValue: Num; pctOfTotal: number }
export interface ApiBomAnalysis { bomId: UUID; dimension: string; total: Num; groups: ApiBomAnalysisGroup[] }

export interface ApiBomLineInput {
  part_id: UUID;
  quantity: number;
  vendor_id?: UUID;
  ref_designator?: string;
  remarks?: string;
  buying_notes?: string;
  drawing_ref?: string;
  is_critical?: boolean;
  unit_cost?: number;
}

/* ---- RFQ / Quotation ---- */
export interface ApiRfq {
  id: UUID;
  number: string;
  title: string;
  mode: RfqMode;
  status: RfqStatus;
  project_id: UUID | null;
  project_number?: string;
  category: string | null;
  est_value: Num;
  required_date: ISO | null;
  quotes_received: number;
  quotes_expected: number;
  vendor_ids: UUID[];
  owner_id: UUID | null;
  created_at: ISO;
}
export interface ApiRfqLine { id: UUID; rfq_id: UUID; part_id: UUID; part_number: string; name: string; quantity: Num; specification: string; buying_notes: string }
export interface ApiQuotation {
  id: UUID;
  rfq_id: UUID;
  rfq_number: string;
  vendor_id: UUID;
  vendor_name: string;
  total_value: Num;
  lead_time_days: number;
  payment_terms: string;
  validity_days: number;
  delivery_terms: string;
  status: QuotationStatus;
  rank: number;
  score: Num;
  received_at: ISO;
  line_count: number;
}
export interface ApiQuotationLine { id: UUID; quotation_id: UUID; rfq_line_id: UUID; unit_price: Num; lead_time_days: number; remarks: string }
export interface ApiRfqDetail extends ApiRfq { lines: ApiRfqLine[]; quotations: ApiQuotation[] }
export interface ApiComparison { rfqId: UUID; recommended: ApiQuotation | null; quotations: ApiQuotation[] }

/* ---- Purchase Order ---- */
export interface ApiPurchaseOrder {
  id: UUID;
  number: string;
  supplier_id: UUID;
  supplier_name: string;
  project_id: UUID | null;
  status: PoStatus;
  priority: EcoPriority;
  line_items: number;
  total_value: Num;
  ordered_date: ISO;
  expected_date: ISO | null;
  received_pct: Num;
  owner_id: UUID | null;
  on_time_risk?: "Low" | "Medium" | "High";
}
export interface ApiPoLine { id: UUID; po_id: UUID; part_id: UUID; part_number: string; name: string; quantity: Num; unit_price: Num; extended: Num; received_qty: Num; rejected_qty: Num }
export interface ApiPoDetail extends ApiPurchaseOrder { lines: ApiPoLine[] }

/* ---- Inventory ---- */
export interface ApiWarehouse {
  id: UUID;
  code: string;
  name: string;
  type: "Distribution" | "Manufacturing" | "Buffer" | "Transit";
  city: string;
  country: string;
  capacity_pct: Num;
  lat: Num;
  lng: Num;
}
export interface ApiWarehouseDetail extends ApiWarehouse { skuCount: number; stockValue: Num; lowStockItems: number }
export interface ApiInventoryBalance {
  id: UUID;
  part_id: UUID;
  warehouse_id: UUID;
  part_number: string;
  part_name: string;
  warehouse_code: string;
  on_hand: Num;
  reserved: Num;
  available: Num;
  incoming: Num;
  reorder_point: Num;
  unit_cost: Num;
  uom: string;
  status: Availability;
}
export interface ApiMovement {
  id: UUID;
  type: "opening" | "purchase" | "sale_consumption" | "adjustment" | "wastage" | "transfer_in" | "transfer_out";
  direction: "in" | "out";
  quantity: Num;
  unit_cost: Num;
  inspection_status: string | null;
  rejected_qty: Num;
  batch: string | null;
  reference: string | null;
  reference_id: UUID | null;
  note: string | null;
  user_id: UUID | null;
  created_at: ISO;
}

/* ---- Reports ---- */
export interface ApiDashboard {
  projects: number;
  materials: number;
  vendors: number;
  openRfqs: number;
  openPurchaseOrders: number;
  stockValue: Num;
  lowStockItems: number;
  committedPoValue: Num;
  bomsByStage: { stage: BomStage; count: number }[];
}
