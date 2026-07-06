/* ============================================================================
 * MAPPERS — convert snake_case API DTOs → the app's camelCase domain types
 * (and parse numeric-as-string fields). This is the single boundary where the
 * backend shape meets the UI, so screens keep using the same `@/types` shapes
 * whether data comes from the mock db or the real API.
 * ==========================================================================*/

import { toNumber } from "./client";
import type {
  ApiUser, ApiPart, ApiSupplier, ApiProject, ApiBom, ApiBomDetail,
  ApiPurchaseOrder, ApiInventoryBalance, ApiRfq, ApiQuotation, ApiWarehouse,
} from "./types";
import type {
  User, Part, Supplier, Product, ProjectBom, PurchaseOrder,
  InventoryRecord, Rfq, Quotation, Warehouse, BomAuditEntry, ResourceSpec,
} from "@/types";
import type { ApiResourceSpec } from "./types";

export const mapResourceSpec = (r: ApiResourceSpec): ResourceSpec => ({
  id: r.id, code: r.code, name: r.name, description: r.description, isActive: r.is_active,
});

export const mapUser = (u: ApiUser): User => ({
  id: u.id, name: u.name, initials: u.initials, role: u.role, team: u.team,
  hue: u.hue, online: true,
});

export const mapPart = (p: ApiPart): Part => ({
  id: p.id,
  partNumber: p.part_number,
  materialType: p.material_type,
  subType: p.sub_type,
  subTypeCode: p.sub_type_code,
  majorSpec: p.major_spec,
  detailSpec: p.detail_spec,
  name: p.name,
  category: p.category as Part["category"],
  remarks: p.remarks,
  material: p.material,
  finish: p.finish,
  revision: p.revision,
  lifecycle: p.lifecycle,
  sourcing: p.sourcing,
  weightKg: toNumber(p.weight_kg),
  unitCost: toNumber(p.unit_cost),
  lastPurchasePrice: toNumber(p.last_purchase_price),
  lastPurchaseDate: p.last_purchase_date ?? null,
  lastPurchaseVendorId: p.last_purchase_vendor_id ?? null,
  lastPurchaseVendor: p.last_purchase_vendor ? mapSupplier(p.last_purchase_vendor) : null,
  leadTimeDays: p.lead_time_days,
  vendorIds: p.vendor_ids ?? [],
  preferredVendors: (p.preferred_vendors ?? []).map(mapSupplier),
  resourceSpecIds: p.resource_spec_ids ?? [],
  resourceSpecs: (p.resource_specs ?? []).map(mapResourceSpec),
  manufacturerPartNumber: p.manufacturer_part_number,
  make: p.make,
  model: p.model,
  drawingRef: p.drawing_ref,
  availability: p.availability,
  stockQty: toNumber(p.stock_qty),
  reorderPoint: toNumber(p.reorder_point),
  minStock: toNumber(p.min_stock),
  maxStock: toNumber(p.max_stock),
  stockLocation: p.stock_location,
  uom: p.uom,
  compliance: p.compliance ?? [],
  tags: p.tags ?? [],
  ownerId: p.owner_id ?? "",
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  thumbnailHue: p.thumbnail_hue,
  whereUsedCount: p.where_used_count,
});

export const mapSupplier = (s: ApiSupplier): Supplier => ({
  id: s.id, name: s.name, code: s.code, country: s.country, region: s.region,
  category: s.category, tier: s.tier, rating: toNumber(s.rating),
  onTimePct: toNumber(s.on_time_pct), qualityPct: toNumber(s.quality_pct),
  partsSupplied: s.parts_supplied ?? 0, openPOs: s.open_pos ?? 0,
  annualSpend: toNumber(s.annual_spend), leadTimeAvg: s.lead_time_avg,
  riskScore: toNumber(s.risk_score), status: s.status, contact: s.contact,
  email: s.email, gstVat: s.gst_vat, paymentTerms: s.payment_terms,
  categoriesSupplied: s.categories_supplied ?? [], approved: s.approved,
});

export const mapProject = (p: ApiProject): Product => ({
  id: p.id,
  code: p.project_number,
  projectNumber: p.project_number,
  name: p.name,
  family: p.family,
  description: p.description,
  customer: p.customer,
  engineerId: p.engineer_id ?? "",
  projectManagerId: p.project_manager_id ?? null,
  stage: p.stage,
  lifecycle: p.lifecycle,
  revision: p.revision,
  version: p.version,
  unitCost: toNumber(p.est_cost),
  targetCost: toNumber(p.target_cost),
  msrp: toNumber(p.quoted_price),
  marginPct: toNumber(p.margin_pct),
  unitsBuilt: 0,
  openEcos: 0,
  releaseDate: p.created_at,
  ownerId: p.owner_id ?? "",
  ownerName: p.owner_name ?? null,
  engineerName: p.engineer_name ?? null,
  engineerInitials: p.engineer_initials ?? null,
  engineerHue: p.engineer_hue ?? null,
  managerName: p.manager_name ?? null,
  managerInitials: p.manager_initials ?? null,
  managerHue: p.manager_hue ?? null,
  thumbnailHue: p.thumbnail_hue,
  health: p.health ?? 80,
  category: p.category,
});

export const mapBom = (b: ApiBom | ApiBomDetail): ProjectBom => ({
  id: b.id,
  number: b.number,
  projectId: b.project_id,
  projectNumber: (b as { project_number?: string }).project_number ?? "",
  projectName: (b as { project_name?: string }).project_name ?? "",
  customer: (b as { customer?: string }).customer ?? "",
  revision: b.revision,
  stage: b.stage,
  bomType: b.bom_type,
  lineItems: b.line_items,
  uniqueMaterials: b.unique_materials,
  totalValue: toNumber(b.total_value),
  criticalItems: b.critical_items,
  longLeadItems: b.long_lead_items,
  ownerId: b.owner_id ?? "",
  ownerName: b.owner_name ?? null,
  ownerInitials: b.owner_initials ?? null,
  ownerHue: b.owner_hue ?? null,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
  audit: ("audit" in b ? b.audit : []).map(
    (a): BomAuditEntry => ({
      stage: a.to_stage,
      userId: a.user_id,
      date: a.created_at,
      comment: a.comment,
      userName: a.user_name ?? null,
      userInitials: a.user_initials ?? null,
      userHue: a.user_hue ?? null,
    }),
  ),
});

export const mapPurchaseOrder = (o: ApiPurchaseOrder): PurchaseOrder => ({
  id: o.id, number: o.number, supplierId: o.supplier_id, supplierName: o.supplier_name,
  status: o.status, lineItems: o.line_items, totalValue: toNumber(o.total_value),
  orderedDate: o.ordered_date, expectedDate: o.expected_date ?? o.ordered_date,
  receivedPct: toNumber(o.received_pct), ownerId: o.owner_id ?? "", priority: o.priority,
  onTimeRisk: o.on_time_risk ?? "Low",
});

export const mapInventory = (r: ApiInventoryBalance): InventoryRecord => ({
  id: r.id, partId: r.part_id, partNumber: r.part_number, partName: r.part_name,
  warehouseId: r.warehouse_id, warehouseCode: r.warehouse_code,
  onHand: toNumber(r.on_hand), reserved: toNumber(r.reserved), available: toNumber(r.available),
  incoming: toNumber(r.incoming), reorderPoint: toNumber(r.reorder_point),
  unitCost: toNumber(r.unit_cost), uom: r.uom, status: r.status,
});

export const mapRfq = (r: ApiRfq): Rfq => ({
  id: r.id, number: r.number, title: r.title, mode: r.mode, status: r.status,
  projectId: r.project_id ?? undefined, projectNumber: r.project_number,
  vendorIds: r.vendor_ids ?? [], lineItems: (r as { line_items?: number }).line_items ?? 0,
  category: r.category ?? undefined, estValue: toNumber(r.est_value),
  requiredDate: r.required_date ?? r.created_at, createdAt: r.created_at,
  ownerId: r.owner_id ?? "", quotesReceived: r.quotes_received, quotesExpected: r.quotes_expected,
});

export const mapQuotation = (q: ApiQuotation): Quotation => ({
  id: q.id, rfqId: q.rfq_id, rfqNumber: q.rfq_number, vendorId: q.vendor_id,
  vendorName: q.vendor_name, totalValue: toNumber(q.total_value), leadTimeDays: q.lead_time_days,
  paymentTerms: q.payment_terms, validityDays: q.validity_days, deliveryTerms: q.delivery_terms,
  status: q.status, receivedAt: q.received_at, lineCount: q.line_count,
  rank: q.rank, score: toNumber(q.score),
});

export const mapWarehouse = (w: ApiWarehouse): Warehouse => ({
  id: w.id, code: w.code, name: w.name, city: w.city, country: w.country, type: w.type,
  capacityPct: toNumber(w.capacity_pct),
  skuCount: (w as { skuCount?: number }).skuCount ?? 0,
  stockValue: toNumber((w as { stockValue?: string }).stockValue),
  lowStockItems: (w as { lowStockItems?: number }).lowStockItems ?? 0,
  lat: toNumber(w.lat), lng: toNumber(w.lng),
});
