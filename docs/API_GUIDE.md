# Innopolis PLM — Frontend Developer API Guide

The contract for building the frontend against the real Innopolis BOM/PLM backend.
**Field names here are the source of truth.** The UI was built on mock data
(camelCase); the real API is snake_case — map at the model boundary (see
`src/lib/api/mappers.ts`).

## 1. Conventions

- **Base URL:** `http://<host>:7100`, all routes under `/api`. Configure via
  `NEXT_PUBLIC_API_BASE_URL`.
- **Auth:** every endpoint except `POST /api/auth/login` and `GET /health`
  needs `Authorization: Bearer <jwt>`.
- **Content type:** `application/json`.
- **Response envelope:** `{ success, message, data }`; lists add
  `meta: { page, pageSize, total, totalPages }`; errors `{ success:false, error }`.
- **Status codes:** 200 OK · 201 Created · 400 validation · 401 auth · 403 role ·
  404 not found · 409 conflict · 500 server.

### Gotchas
1. **Numbers are JSON strings** (Postgres numeric) — `unit_cost`, `total_value`,
   `on_hand`, `quantity`, `extended_cost`, … → `Number(x)` before maths.
2. **snake_case** field names (`part_number`, `unit_cost`, `lead_time_days`).
3. **Dates** ISO-8601 strings, nullable where noted.
4. **IDs** are UUIDv7 strings (sortable by creation time).
5. **Codes generated server-side** — never send `part_number`, `project_number`,
   `number` (BOM/RFQ/PO); assigned on create.

## 2. Roles (FRD §17)
`Administrator · Engineering · Commercial · Purchase · Stores · Management`.
Administrator bypasses checks. Reads open; writes role-gated; some actions
**stage-gated** (BOM approval, PO status) — 403/400 if role/stage not permitted.
Drive sidebar/route guards from `role` (reuse `navForRole`).

## 3. Auth
- `POST /api/auth/login` (public) → `{ token, user:{ id,name,email,role,team,initials,hue } }`.
- `GET /api/auth/me` → current user.
- Demo logins (after seed): `admin@…/admin123`, `engineer@…/engineer123`,
  `commercial@…/commercial123`, `purchase@…/purchase123`, `stores@…/stores123`,
  `management@…/management123` (`@innopolis.bio`). Token expires per
  `JWT_EXPIRES_IN` (12h) → on 401 redirect to login.

## 4. Module 1 — Material Master (FRD §3–6)
Intelligent code `TT-SS-MM-DDDD` built from master tables:
`TT` category `type_code` · `SS` subtype `code` · `MM` major-spec `code` ·
`DDDD` grade `code`. e.g. `MB-VA-15-3040`.

**Master tables** (admin writes; reads open):
- Categories `GET/POST /api/material-categories`, `GET/PATCH/DELETE /:id` — `name, type_code, default_uom, is_active`
- Subtypes `GET /api/material-categories/:categoryId/subtypes`, `POST /api/subtypes`, `GET/PATCH/DELETE /api/subtypes/:id` — `category_id, name, code, is_active`
- Major specs `GET/POST /api/major-specs`, `GET/PATCH/DELETE /:id` — `code, label, is_active`
- Grades `GET/POST /api/grades`, `GET/PATCH/DELETE /:id` — `code, label, is_active`
- Units `GET/POST /api/units`, `GET/PATCH/DELETE /:id` — `code, name, is_active`

**Materials** `/api/parts` (writes: Engineering):
- `POST /api/parts` — required: `category_id, subtype_id, name`; optional `major_spec_id, grade_id, description, material, finish, revision, lifecycle, sourcing, weight_kg, unit_cost, last_purchase_price, lead_time_days, supplier_id, manufacturer_part_number, make, model, drawing_ref, availability, stock_qty, reorder_point, min_stock, max_stock, stock_location, uom, compliance[], tags[], thumbnail_hue`. `part_number` generated. **Code fields immutable** (omit on update → else 400).
- `GET /api/parts` *(paginated)* — `search, categoryId, subtypeId, lifecycle, availability, sourcing, page, pageSize`.
- `GET/PATCH/DELETE /api/parts/:id` (soft delete).
- **Part fields:** `id, part_number, category_id, subtype_id, major_spec_id, grade_id, material_type, sub_type, sub_type_code, major_spec, detail_spec, category, name, description, material, finish, revision, lifecycle, sourcing, weight_kg, unit_cost, last_purchase_price, lead_time_days, supplier_id, manufacturer_part_number, make, model, drawing_ref, availability, stock_qty, reorder_point, min_stock, max_stock, stock_location, uom, compliance[], tags[], owner_id, thumbnail_hue, where_used_count, created_at, updated_at`.
- **Enums:** lifecycle = Concept·In Design·In Review·Released·Production·Obsolete; sourcing = Make·Buy·Standard; availability = In Stock·Low Stock·Backorder·Out of Stock.

## 5. Module 3 — Vendor Database (FRD §7)
`/api/suppliers` (writes: Purchase). List params: `search, status, country,
region, category, approved, tier, page, pageSize`. Body (req `code, name`):
`code, name, country, region, category, categories_supplied[], tier(1|2|3),
contact, email, phone, address, gst_vat, payment_terms, lead_time_avg, rating,
on_time_pct, quality_pct, risk_score, annual_spend, status, approved`.
status = Approved·Preferred·Conditional·Under Review. CRUD `POST/GET/GET:id/PATCH:id/DELETE:id`.

## 6. Module 2 — Project BOM (FRD §8–10)
**Projects** `/api/projects` (writes: Engineering). Create req `name`; opt
`customer, family, category, description, engineer_id, stage, lifecycle,
revision, version, target_cost, quoted_price, thumbnail_hue`. `project_number`
auto `INP-{year}-{seq}`. List: `search, stage, customer, page, pageSize`.
stage = Enquiry·Technical Evaluation·Quotation·Project Order·Detailed
Engineering·Final BOM·Purchase Release·Procurement·Fulfilment·Completed.

**BOMs** `/api/project-boms` (writes: Engineering):
- `POST /` `{ project_id, bom_type?, revision? }` → `number` `BOM-{seq}`, stage **Draft**. bom_type = Engineering·Procurement·Final Released.
- `GET /` *(paginated)* `projectId, stage, page, pageSize`; `GET /:id` → BOM + `lines[]` + `audit[]`; `PATCH /:id` `{bom_type?,revision?}` (not Released); `DELETE /:id` (Draft only / Admin).
- **BOM fields:** `id, number, project_id, bom_type, stage, revision, line_items, unique_materials, total_value, critical_items, long_lead_items, owner_id, created_at, updated_at`.

**BOM lines** (Engineering, BOM Draft):
- `POST /api/project-boms/:bomId/lines` `{ part_id, quantity, vendor_id?, ref_designator?, remarks?, buying_notes?, drawing_ref?, is_critical?, unit_cost? }` — material snapshotted; `extended_cost = quantity × unit_cost`.
- `GET /api/project-boms/:bomId/lines`; `PATCH /api/bom-lines/:id`; `DELETE /api/bom-lines/:id` (Draft only).
- **Line fields:** `id, bom_id, part_id, find_number, level, parent_line_id, part_number, name, description, category, uom, unit_cost, procurement, lead_time_days, material_revision, quantity, extended_cost, ref_designator, remarks, buying_notes, drawing_ref, vendor_id, is_critical`.

**Approval** `POST /api/project-boms/:id/transition` `{ action:"advance"|"reject", comment }`:
`Draft →(Eng) Technical Review →(Eng) Commercial Review →(Commercial) Approved →(Purchase) Released for Purchase`.
advance→next (role must match current stage); reject→Draft. Returns BOM + `audit[]`
(`{from_stage,to_stage,action,comment,user_id,created_at}`). Lines lock after Draft.

**Analysis** `GET /api/project-boms/:id/analysis?groupBy=category|vendor|leadtime|procurement`
→ `{ bomId, dimension, total, groups:[{key,lineItems,totalValue,pctOfTotal}] }`.

## 7. Module 4 — Procurement (FRD §11–13)
**RFQ** `/api/rfqs` (writes: Purchase):
- `POST /` `{ title, mode, vendor_ids[], from_bom_id?, category?, required_date?, lines?[] }` → `RFQ-{seq}`, **Draft**. mode = Vendor-wise·Category-wise·Package-wise·Single Item·Bulk.
- `GET /` *(paginated)* `search, status, projectId, page, pageSize`; `GET /:id` → RFQ + `lines[]` + `quotations[]`; `PATCH/DELETE /:id` (Draft only); `POST /:id/send` → Sent.
- status = Draft·Sent·Quotes In·Comparison·Awarded·Closed.

**Quotations**:
- `POST /api/rfqs/:id/quotations` `{ vendor_id, lead_time_days, payment_terms, validity_days, delivery_terms, lines:[{rfq_line_id,unit_price,lead_time_days,remarks}] }` (RFQ sent; one per vendor) → Sent→Quotes In.
- `GET /api/rfqs/:id/quotations`; `GET /api/rfqs/:id/comparison` (Purchase, Commercial) → `{ recommended, quotations:[{rank,score,…}] }` (cheapest rank 1, score 100) → RFQ Comparison.
- `GET /api/quotations/:id` → quotation + `lines[]`; `POST /api/quotations/:id/award` → winner Awarded, rest Rejected, RFQ Awarded.
- status = Pending·Received·Under Review·Awarded·Rejected.

**Purchase Orders** `/api/purchase-orders` (writes: Purchase):
- `POST /` `{ from_quotation_id }` **or** `{ supplier_id, project_id?, priority?, expected_date?, lines:[{part_id,quantity,unit_price}] }` → `PO-{seq}`, **Draft**. priority = Low·Medium·High·Critical.
- `GET /` *(paginated)* `search, status, supplierId, page, pageSize`; `GET /:id` → PO + `lines[]`.
- `POST /:id/status` `{ status }` — `Draft→Pending Approval→Open→Partially Received→Received→Closed`; `Cancelled` from non-terminal.
- `POST /:id/receive` (Purchase, Stores) → goods receipt (§8). `DELETE /:id` (Draft/Cancelled).
- status = Draft·Pending Approval·Open·Partially Received·Received·Closed·Cancelled.

## 8. Module 5 — Inventory (FRD §14)
**Warehouses** `/api/warehouses` (writes: Stores). Create req `code, name`; opt
`type, city, country, capacity_pct, lat, lng`. type = Distribution·Manufacturing·Buffer·Transit.
`GET /:id` returns warehouse + summary `{skuCount, stockValue, lowStockItems}`.

**Stock** `/api/inventory`:
- `GET /` *(paginated)* `search, warehouseId, partId, status, lowStock, page, pageSize` — fields `id, part_id, warehouse_id, part_number, part_name, warehouse_code, on_hand, reserved, available, incoming, reorder_point, unit_cost, uom, status`.
- `GET /movements` *(paginated)* `partId, warehouseId, type, page, pageSize` — `type, direction, quantity, unit_cost, inspection_status, rejected_qty, batch, reference, reference_id, note, user_id, created_at`. type = opening·purchase·sale_consumption·adjustment·wastage·transfer_in·transfer_out.
- `GET /alerts` — at/below reorder.
- `POST /opening` `{part_id,warehouse_id,quantity,unit_cost?,reorder_point?,batch?,note?}`; `POST /adjust` `{part_id,warehouse_id,direction:"in"|"out",quantity,wastage?,note?}`; `POST /transfer` `{part_id,from_warehouse_id,to_warehouse_id,quantity,note?}`.
- Postings update balance, derive status, sync material `stock_qty`+`availability`. Over-draw → 400.

**PO goods receipt** `POST /api/purchase-orders/:id/receive` (Purchase, Stores):
`{ warehouse_id, lines:[{po_line_id,received_qty,rejected_qty,batch}] }`. Updates
`received_qty`/`received_pct`/status; posts accepted (received−rejected) into stock
as `purchase` movement. **Rejected never enters inventory.** Omit `warehouse_id`
to record receipt without stock.

## 9. Module 6 — Reports & Analytics (FRD §15) — all GET
- `/api/reports/dashboard` → `{ projects, materials, vendors, openRfqs, openPurchaseOrders, stockValue, lowStockItems, committedPoValue, bomsByStage:[{stage,count}] }`
- `/api/reports/procurement/purchase-value` → `[{status,count,value}]`
- `/api/reports/procurement/vendor-performance` → `[{id,name,code,tier,rating,onTimePct,qualityPct,riskScore,status,poCount,poSpend}]`
- `/api/reports/inventory/stock-value` → `[{warehouseId,code,name,skuCount,stockValue,lowStockItems}]`
- `/api/reports/commercial/vendor-spend` → `[{supplierId,supplierName,poCount,spend}]`
- `/api/reports/commercial/project-cost` → `[{projectId,projectNumber,name,customer,stage,bomCount,bomValue}]`

## 10. End-to-end flow
login → create materials → create project → create BOM + lines → transition ×4 →
analysis → RFQ + send → quotations → comparison + award → PO (from quotation) →
status Open + receive into stock → reports.

## 11. Frontend data layer (implemented in `src/lib/api/`)
`apiFetch` wrapper (injects JWT, parses envelope, throws on `success:false`,
redirects on 401) · `toNumber()` at the model boundary · React Query keys per
resource · role-driven sidebar/route guards.
