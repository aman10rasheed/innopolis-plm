import { seededRandom, pick, range, initials } from "@/lib/utils";
import type {
  Part,
  Product,
  Supplier,
  Eco,
  Revision,
  DocItem,
  Warehouse,
  InventoryRecord,
  PurchaseOrder,
  User,
  Activity,
  Notification,
  Approval,
  PartCategory,
  Lifecycle,
  SourcingType,
  Availability,
  EcoStatus,
  EcoPriority,
  EcoType,
  DocType,
  ComplianceFlag,
  PoStatus,
  ProjectStage,
  ProjectBom,
  BomStage,
  BomAuditEntry,
  Rfq,
  RfqMode,
  RfqStatus,
  Quotation,
  QuotationStatus,
} from "@/types";
import { PROJECT_STAGES, BOM_STAGES } from "@/types";
import {
  MATERIAL_CATEGORIES,
  CATEGORY_BY_NAME,
  MAJOR_SPECS,
  GRADES,
  buildMaterialCode,
  MATERIALS,
  FINISHES,
  SUPPLIER_NAMES,
  COUNTRIES,
  PROJECT_FAMILIES,
  CUSTOMERS,
  USER_NAMES,
  COMPLIANCE_POOL,
  TAG_POOL,
} from "./pools";

const CATEGORIES = MATERIAL_CATEGORIES.map((c) => c.name) as PartCategory[];
const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production", "Obsolete"];
const REVS = ["A", "B", "C", "D", "E", "F"];
const STOCK_LOCATIONS = ["WH-A · Rack 01", "WH-A · Rack 14", "WH-B · Bay 03", "WH-B · Mezz", "Cold Store 1", "Yard 2", "Bonded Store", "QC Hold"];
const PAYMENT_TERMS = ["30 days net", "45 days net", "60 days net", "Advance 30% / 70% on delivery", "LC at sight", "100% advance"];
const MAKES = ["Inox", "L&T", "KSB", "Grundfos", "Endress+Hauser", "Emerson", "Siemens", "ABB", "Alfa Laval", "Forbes Marshall", "Yokogawa", "Festo"];

function daysAgo(rng: () => number, maxDays: number): string {
  const base = Date.UTC(2026, 5, 28);
  return new Date(base - Math.floor(rng() * maxDays) * 86400000).toISOString();
}
function daysAhead(rng: () => number, maxDays: number): string {
  const base = Date.UTC(2026, 5, 28);
  return new Date(base + Math.floor(rng() * maxDays) * 86400000).toISOString();
}
function gstNumber(rng: () => number) {
  const a = () => String.fromCharCode(65 + Math.floor(rng() * 26));
  const d = () => Math.floor(rng() * 10);
  return `${d()}${d()}${a()}${a()}${a()}${a()}${a()}${d()}${d()}${d()}${d()}${a()}${d()}Z${d()}`;
}

export interface BomEdge {
  refId: string; // part id
  qty: number;
  refDes?: string;
}

export interface Database {
  users: User[];
  suppliers: Supplier[];
  parts: Part[];
  products: Product[];
  ecos: Eco[];
  revisions: Revision[];
  documents: DocItem[];
  warehouses: Warehouse[];
  inventory: InventoryRecord[];
  purchaseOrders: PurchaseOrder[];
  activities: Activity[];
  notifications: Notification[];
  approvals: Approval[];
  projectBoms: ProjectBom[];
  rfqs: Rfq[];
  quotations: Quotation[];
  /** Flat BOM line-items per project (productId → part edges). */
  projectBomLines: Record<string, BomEdge[]>;
}

export function generateDatabase(): Database {
  const rng = seededRandom(20260628);

  // ---- Users ----
  const users: User[] = USER_NAMES.slice(0, 4).map(([name, role, team], i) => ({
    id: `U-${i + 1}`,
    name: name!,
    initials: initials(name!),
    role: role!,
    team: team!,
    hue: Math.floor(rng() * 360),
    online: rng() > 0.55,
  }));
  const userId = () => pick(rng, users).id;
  const engineers = users.filter((u) => u.team === "Engineering");

  // ---- Vendors (Suppliers) ----
  const statuses: Supplier["status"][] = ["Preferred", "Approved", "Approved", "Conditional", "Under Review"];
  const suppliers: Supplier[] = SUPPLIER_NAMES.slice(0, 3).map((name, i) => {
    const loc = pick(rng, COUNTRIES);
    const onTime = 70 + Math.floor(rng() * 30);
    const quality = 82 + Math.floor(rng() * 18);
    const status = pick(rng, statuses);
    const cats = MATERIAL_CATEGORIES.filter(() => rng() > 0.7).slice(0, 3).map((c) => c.name);
    return {
      id: `SUP-${String(i + 1).padStart(3, "0")}`,
      name,
      code: name.split(" ").map((w) => w[0]).join("").slice(0, 4).toUpperCase(),
      country: loc.country,
      region: loc.region,
      category: pick(rng, CATEGORIES),
      tier: pick(rng, [1, 1, 2, 2, 2, 3]) as 1 | 2 | 3,
      rating: Math.round((2.8 + rng() * 2.2) * 10) / 10,
      onTimePct: onTime,
      qualityPct: quality,
      partsSupplied: 0,
      openPOs: 0,
      annualSpend: Math.floor((50 + rng() * 1950) * 1000),
      leadTimeAvg: loc.region === "Import" ? 45 + Math.floor(rng() * 75) : 7 + Math.floor(rng() * 30),
      riskScore: Math.max(2, Math.round(100 - (onTime + quality) / 2 + (rng() * 20 - 10))),
      status,
      contact: pick(rng, users).name,
      email: `sales@${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.com`,
      gstVat: loc.region === "Domestic" ? gstNumber(rng) : `VAT-${Math.floor(10000000 + rng() * 89999999)}`,
      paymentTerms: pick(rng, PAYMENT_TERMS),
      categoriesSupplied: cats.length ? cats : [pick(rng, CATEGORIES)],
      approved: status !== "Under Review",
    };
  });

  // ---- Materials (Parts) with intelligent codes ----
  const availPool: Availability[] = ["In Stock", "In Stock", "In Stock", "Low Stock", "Backorder", "Out of Stock"];
  const sourcingPool: SourcingType[] = ["Buy", "Buy", "Make", "Standard"];

  const parts: Part[] = range(3).map((i) => {
    const catDef = MATERIAL_CATEGORIES[i % MATERIAL_CATEGORIES.length]!;
    const category = catDef.name;
    const subtype = pick(rng, catDef.subtypes);
    const major = pick(rng, MAJOR_SPECS);
    const grade = pick(rng, GRADES);
    const code = buildMaterialCode(catDef.type, subtype.code, major, grade.code);
    const sizeLabel = major === "00" ? "" : ` ${major} ${catDef.uom === "Mtr" ? "NB" : "mm"}`;
    const name = `${grade.label} ${subtype.name}${sizeLabel}`.trim();
    const supplier = pick(rng, suppliers);
    const lifecycle = pick(rng, ["Released", "Production", "Production", "In Review", "In Design", "Obsolete"] as Lifecycle[]);
    const availability = pick(rng, availPool);
    const stockQty = availability === "Out of Stock" ? 0 : availability === "Backorder" ? Math.floor(rng() * 10) : Math.floor(rng() * 5000);
    const cost = Math.round((5 + rng() * rng() * 48000) * 100) / 100;
    const compliance: ComplianceFlag[] = COMPLIANCE_POOL.filter(() => rng() > 0.6);
    const tags = TAG_POOL.filter(() => rng() > 0.86);
    const reorderPoint = 20 + Math.floor(rng() * 400);
    return {
      id: `P-${i + 1}`,
      partNumber: code,
      materialType: catDef.type,
      subType: subtype.name,
      subTypeCode: subtype.code,
      majorSpec: major,
      detailSpec: grade.code,
      name,
      category,
      description: `${grade.label} ${subtype.name.toLowerCase()}${sizeLabel}. ${category} material per project specification.`,
      material: grade.label,
      finish: pick(rng, FINISHES),
      revision: pick(rng, REVS.slice(0, 4)),
      lifecycle,
      sourcing: pick(rng, sourcingPool),
      weightKg: Math.round((0.01 + rng() * rng() * 60) * 1000) / 1000,
      unitCost: cost,
      lastPurchasePrice: Math.round(cost * (0.9 + rng() * 0.25) * 100) / 100,
      leadTimeDays: supplier.leadTimeAvg + Math.floor(rng() * 14 - 7),
      supplierId: supplier.id,
      manufacturerPartNumber: `${supplier.code}${Math.floor(10000 + rng() * 89999)}`,
      make: pick(rng, MAKES),
      model: `${subtype.code}-${Math.floor(100 + rng() * 899)}`,
      drawingRef: `DRG-${catDef.type}-${Math.floor(1000 + rng() * 8999)}`,
      availability,
      stockQty,
      reorderPoint,
      minStock: reorderPoint,
      maxStock: reorderPoint * (3 + Math.floor(rng() * 6)),
      stockLocation: pick(rng, STOCK_LOCATIONS),
      uom: catDef.uom,
      compliance,
      tags,
      ownerId: userId(),
      createdAt: daysAgo(rng, 900),
      updatedAt: daysAgo(rng, 120),
      thumbnailHue: Math.floor(rng() * 360),
      whereUsedCount: Math.floor(rng() * 24),
    };
  });

  for (const p of parts) {
    const s = suppliers.find((x) => x.id === p.supplierId);
    if (s) s.partsSupplied++;
  }

  // ---- Projects (Products) ----
  const stageWeights: ProjectStage[] = [
    "Enquiry", "Technical Evaluation", "Quotation", "Project Order",
    "Detailed Engineering", "Detailed Engineering", "Final BOM",
    "Purchase Release", "Procurement", "Procurement", "Fulfilment", "Completed",
  ];
  const products: Product[] = range(3).map((i) => {
    const fam = PROJECT_FAMILIES[i % PROJECT_FAMILIES.length]!;
    const projectNumber = `INP-2026-${String(1000 + i)}`;
    const estCost = Math.floor(800000 + rng() * 48000000);
    const margin = 14 + rng() * 26;
    const quoted = Math.round((estCost / (1 - margin / 100)) / 1000) * 1000;
    const stage = pick(rng, stageWeights);
    return {
      id: `PR-${i + 1}`,
      code: projectNumber,
      projectNumber,
      name: `${fam.family} ${fam.noun} — ${pick(rng, CUSTOMERS).split(" ")[0]}`,
      family: fam.family,
      description: `Turnkey ${fam.noun.toLowerCase()} package including detailed engineering, BOM, procurement and supply.`,
      customer: pick(rng, CUSTOMERS),
      engineerId: pick(rng, engineers).id,
      stage,
      lifecycle: pick(rng, ["Production", "Production", "Released", "In Review", "In Design", "Obsolete"] as Lifecycle[]),
      revision: pick(rng, REVS),
      version: `${1 + Math.floor(rng() * 4)}.${Math.floor(rng() * 9)}`,
      unitCost: estCost,
      targetCost: Math.floor(estCost * (0.85 + rng() * 0.2)),
      msrp: quoted,
      marginPct: Math.round(margin * 10) / 10,
      unitsBuilt: 40 + Math.floor(rng() * 600),
      openEcos: Math.floor(rng() * 8),
      releaseDate: daysAgo(rng, 700),
      ownerId: pick(rng, engineers).id,
      thumbnailHue: Math.floor(rng() * 360),
      health: 55 + Math.floor(rng() * 45),
      category: fam.category,
    };
  });

  // ---- Project BOM line-items (flat: each project → list of part lines) ----
  const partById = new Map(parts.map((p) => [p.id, p]));
  const projectBomLines: Record<string, BomEdge[]> = {};
  let tagCounter = 0;
  for (const product of products) {
    const lineCount = 3 + Math.floor(rng() * 3);
    const edges: BomEdge[] = [];
    for (let k = 0; k < lineCount; k++) {
      const part = pick(rng, parts);
      const isInstr = part.category === "Field Instruments" || part.category === "Panel Instruments";
      edges.push({
        refId: part.id,
        qty: 1 + Math.floor(rng() * 12),
        refDes: isInstr ? `${pick(rng, ["PT", "TT", "FT", "LT", "PG", "FV"])}-${++tagCounter}` : undefined,
      });
    }
    projectBomLines[product.id] = edges;
  }

  /** Rolled-up part cost of a project's flat BOM. */
  function projectRolled(productId: string): number {
    let cost = 0;
    for (const edge of projectBomLines[productId] ?? []) {
      const p = partById.get(edge.refId);
      if (p) cost += p.unitCost * edge.qty;
    }
    return Math.round(cost * 100) / 100;
  }

  // ---- ECOs (engineering changes / material change requests) ----
  const ecoStatuses: EcoStatus[] = ["Draft", "Review", "Approved", "Released", "Completed"];
  const ecoPriorities: EcoPriority[] = ["Low", "Medium", "High", "Critical"];
  const ecoTypes: EcoType[] = ["Design Change", "Cost Reduction", "Supplier Change", "Quality", "Compliance", "Documentation"];
  const ecoTitles = [
    "Upgrade valve trim to SS316 for process line", "Replace obsolete level transmitter model",
    "Switch to dual-source for centrifugal pump", "Reduce pipe schedule on utility header",
    "Add ATEX-certified alternate for field instrument", "Revise gasket material to PTFE for high temp",
    "Material change: CS to SS304 on structural support", "Correct nozzle orientation on vessel drawing",
    "Qualify new gland packing for agitator seal", "Cost-down: standardise fittings across skids",
    "Update P&ID tag and datasheet reference", "Tighten flatness tolerance on tube sheet",
    "Supersede legacy controller with PLC module", "Add electropolish spec to product-contact parts",
    "Revise CIP spray-ball coverage specification", "Eliminate single-source risk on mechanical seal",
  ];
  const ecos: Eco[] = range(3).map((i) => {
    const status = pick(rng, ecoStatuses);
    const needed = 1 + Math.floor(rng() * 3);
    const received = status === "Completed" || status === "Released" ? needed : Math.floor(rng() * (needed + 1));
    return {
      id: `E-${i + 1}`, number: `MCR-${String(4500 + i)}`, title: pick(rng, ecoTitles),
      description: "Material change request covering affected BOM items, rationale, cost impact and disposition. Pending cross-functional review.",
      status, priority: pick(rng, ecoPriorities), type: pick(rng, ecoTypes), ownerId: userId(),
      reviewerIds: [userId(), userId()], affectedItems: 1 + Math.floor(rng() * 18), productId: pick(rng, products).id,
      costImpact: Math.round((rng() * 2 - 0.8) * 180000), createdAt: daysAgo(rng, 180), dueDate: daysAhead(rng, 45),
      progress: status === "Completed" ? 100 : status === "Draft" ? Math.floor(rng() * 20) : 20 + Math.floor(rng() * 70),
      commentsCount: Math.floor(rng() * 24), attachmentsCount: Math.floor(rng() * 8),
      approvalsNeeded: needed, approvalsReceived: received,
    };
  });

  // ---- Project BOMs + approval workflow ----
  const bomTypes: ProjectBom["bomType"][] = ["Engineering", "Procurement", "Final Released"];
  const projectBoms: ProjectBom[] = [];
  let bomCounter = 0;
  for (const product of products) {
    const count = 1;
    for (let b = 0; b < count; b++) {
      const stage = pick(rng, BOM_STAGES);
      const stageIdx = BOM_STAGES.indexOf(stage);
      const lineItems = 20 + Math.floor(rng() * 220);
      const value = projectRolled(product.id) || product.unitCost;
      const audit: BomAuditEntry[] = BOM_STAGES.slice(0, stageIdx + 1).map((st, k) => ({
        stage: st, userId: userId(), date: daysAgo(rng, 120 - k * 15),
        comment: pick(rng, ["Specs verified against P&ID.", "Costs within estimate.", "Released to purchase.", "Long-lead items flagged.", "Vendor refs confirmed.", "Draft prepared from estimation BOM."]),
      }));
      projectBoms.push({
        id: `PB-${++bomCounter}`, number: `BOM-${String(7000 + bomCounter)}`,
        projectId: product.id, projectNumber: product.projectNumber, projectName: product.name,
        customer: product.customer, revision: pick(rng, REVS.slice(0, 4)), stage,
        bomType: bomTypes[b] ?? "Engineering", lineItems, uniqueMaterials: Math.floor(lineItems * (0.6 + rng() * 0.3)),
        totalValue: Math.round(value), criticalItems: Math.floor(rng() * 14), longLeadItems: Math.floor(rng() * 22),
        ownerId: product.engineerId, createdAt: daysAgo(rng, 150), updatedAt: daysAgo(rng, 20), audit,
      });
    }
  }

  // ---- Revisions ----
  const allItems = [
    ...parts.slice(0, 2).map((p) => ({ id: p.id, pn: p.partNumber, name: p.name })),
    ...products.map((p) => ({ id: p.id, pn: p.projectNumber, name: p.name })),
  ];
  const changeSummaries = [
    "Updated specification and rating", "Material grade revised", "Added 3.1 certificate requirement",
    "Vendor sourcing change", "Corrected drawing callouts", "BOM quantity adjustment",
    "Finish specification updated", "Released for purchase", "Cost reduction implemented", "Datasheet migration",
  ];
  const revisions: Revision[] = [];
  let revCounter = 0;
  for (const item of allItems) {
    const revCount = 1;
    for (let r = 0; r <= revCount; r++) {
      const isLatest = r === revCount;
      revisions.push({
        id: `REV-${++revCounter}`, itemId: item.id, itemPartNumber: item.pn, itemName: item.name,
        revision: REVS[r] ?? "A", status: isLatest ? pick(rng, ["Released", "Working", "In Review"] as const) : "Superseded",
        authorId: userId(), date: daysAgo(rng, 600 - r * 80), changeSummary: pick(rng, changeSummaries),
        ecoNumber: rng() > 0.4 ? pick(rng, ecos).number : undefined, changedFields: 1 + Math.floor(rng() * 12),
        added: Math.floor(rng() * 6), removed: Math.floor(rng() * 4), modified: Math.floor(rng() * 9),
      });
    }
  }

  // ---- Documents ----
  const docTypes: DocType[] = ["Drawing", "Specification", "Datasheet", "CAD Model", "Test Report", "Certificate", "Work Instruction", "Image", "Contract"];
  const docFormats: Record<DocType, string> = {
    Drawing: "PDF", Specification: "DOCX", Datasheet: "PDF", "CAD Model": "DWG", "Test Report": "PDF",
    Certificate: "PDF", "Work Instruction": "PDF", Image: "PNG", Contract: "PDF",
  };
  const folders = [
    "Engineering / P&IDs", "Engineering / GA Drawings", "Engineering / Datasheets", "Quality / Test Reports",
    "Quality / Material Certs", "Manufacturing / Work Instructions", "Procurement / Vendor Docs",
    "Procurement / Contracts", "Projects / Customer Docs",
  ];
  const documents: DocItem[] = range(3).map((i) => {
    const type = pick(rng, docTypes);
    const linked = pick(rng, allItems);
    return {
      id: `D-${i + 1}`, name: `${linked.pn}_${type.replace(/\s/g, "")}_Rev${pick(rng, REVS)}`, type,
      format: docFormats[type], sizeKb: Math.floor(20 + rng() * 48000), folder: pick(rng, folders),
      version: `${1 + Math.floor(rng() * 5)}.${Math.floor(rng() * 9)}`, ownerId: userId(), updatedAt: daysAgo(rng, 300),
      tags: TAG_POOL.filter(() => rng() > 0.9), favorite: rng() > 0.85, linkedItemId: linked.id,
      status: pick(rng, ["Approved", "Approved", "Draft", "In Review"] as const),
    };
  });

  // ---- Warehouses ----
  const whCities = [
    ["Pune", "India", 18.52, 73.86], ["Hyderabad", "India", 17.38, 78.48], ["Ahmedabad", "India", 23.02, 72.57],
    ["Bengaluru", "India", 12.97, 77.59], ["Mumbai", "India", 19.07, 72.87], ["Chennai", "India", 13.08, 80.27],
    ["Vadodara", "India", 22.31, 73.18], ["Vizag", "India", 17.69, 83.21], ["Indore", "India", 22.72, 75.86],
    ["Nashik", "India", 19.99, 73.79], ["Goa", "India", 15.30, 74.12], ["Daman", "India", 20.40, 72.83],
    ["Baddi", "India", 30.96, 76.79], ["Sikkim", "India", 27.53, 88.51], ["Vapi", "India", 20.37, 72.90],
    ["Frankfurt", "Germany", 50.11, 8.68], ["Singapore", "Singapore", 1.35, 103.82], ["Milan", "Italy", 45.46, 9.19],
    ["Shanghai", "China", 31.23, 121.47], ["Osaka", "Japan", 34.69, 135.50], ["Zürich", "Switzerland", 47.38, 8.54],
    ["Houston", "USA", 29.76, -95.37], ["Rotterdam", "Netherlands", 51.92, 4.48], ["Dubai", "UAE", 25.20, 55.27],
    ["Mundra Port", "India", 22.84, 69.72],
  ];
  const warehouses: Warehouse[] = whCities.slice(0, 3).map((c, i) => ({
    id: `WH-${i + 1}`, code: `${(c[0] as string).slice(0, 3).toUpperCase()}-${i + 1}`,
    name: `${c[0]} ${pick(rng, ["Store", "Plant", "Hub", "Yard"])}`, city: c[0] as string, country: c[1] as string,
    type: pick(rng, ["Distribution", "Manufacturing", "Buffer", "Transit"] as const),
    capacityPct: 35 + Math.floor(rng() * 64), skuCount: 200 + Math.floor(rng() * 2400),
    stockValue: Math.floor((200 + rng() * 8000) * 1000), lowStockItems: Math.floor(rng() * 80),
    lat: c[2] as number, lng: c[3] as number,
  }));

  // ---- Inventory ----
  const inventory: InventoryRecord[] = [];
  let invCounter = 0;
  for (const part of parts) {
    const whCount = 1;
    for (let w = 0; w < whCount; w++) {
      const wh = pick(rng, warehouses);
      const onHand = Math.floor(rng() * 4000);
      const reserved = Math.floor(rng() * Math.min(onHand, 800));
      const available = onHand - reserved;
      const status: Availability = available <= 0 ? "Out of Stock" : available < part.reorderPoint ? "Low Stock" : "In Stock";
      inventory.push({
        id: `INV-${++invCounter}`, partId: part.id, partNumber: part.partNumber, partName: part.name,
        warehouseId: wh.id, warehouseCode: wh.code, onHand, reserved, available,
        incoming: rng() > 0.6 ? Math.floor(rng() * 2000) : 0, reorderPoint: part.reorderPoint,
        unitCost: part.unitCost, uom: part.uom, status,
      });
    }
  }

  // ---- Purchase Orders ----
  const poStatuses: PoStatus[] = ["Draft", "Pending Approval", "Open", "Open", "Partially Received", "Received", "Closed", "Cancelled"];
  const purchaseOrders: PurchaseOrder[] = range(3).map((i) => {
    const supplier = pick(rng, suppliers);
    const status = pick(rng, poStatuses);
    const received = status === "Received" || status === "Closed" ? 100 : status === "Partially Received" ? 20 + Math.floor(rng() * 60) : 0;
    supplier.openPOs += status === "Open" || status === "Partially Received" ? 1 : 0;
    return {
      id: `PO-${i + 1}`, number: `PO-${String(78000 + i)}`, supplierId: supplier.id, supplierName: supplier.name,
      status, lineItems: 1 + Math.floor(rng() * 24), totalValue: Math.floor(5000 + rng() * rng() * 4000000),
      orderedDate: daysAgo(rng, 200), expectedDate: daysAhead(rng, 60), receivedPct: received, ownerId: userId(),
      priority: pick(rng, ecoPriorities), onTimeRisk: pick(rng, ["Low", "Low", "Medium", "High"] as const),
    };
  });

  // ---- RFQs ----
  const rfqModes: RfqMode[] = ["Vendor-wise", "Category-wise", "Package-wise", "Single Item", "Bulk"];
  const rfqStatuses: RfqStatus[] = ["Draft", "Sent", "Quotes In", "Comparison", "Awarded", "Closed"];
  const rfqs: Rfq[] = range(3).map((i) => {
    const mode = pick(rng, rfqModes);
    const status = pick(rng, rfqStatuses);
    const product = pick(rng, products);
    const vendorIds = Array.from({ length: 2 + Math.floor(rng() * 4) }, () => pick(rng, suppliers).id);
    const expected = vendorIds.length;
    const received = status === "Draft" || status === "Sent" ? Math.floor(rng() * expected) : expected - Math.floor(rng() * 2);
    return {
      id: `RFQ-${i + 1}`, number: `RFQ-${String(3300 + i)}`,
      title: `${mode} RFQ — ${pick(rng, ["Valves", "Pumps", "Instruments", "Piping", "Electrical", "Fabrication", "Fittings", "Seals"])}`,
      mode, status, projectId: product.id, projectNumber: product.projectNumber,
      vendorIds: [...new Set(vendorIds)], lineItems: 1 + Math.floor(rng() * 40),
      category: mode === "Category-wise" ? pick(rng, CATEGORIES) : undefined,
      estValue: Math.floor(20000 + rng() * rng() * 3000000), requiredDate: daysAhead(rng, 50),
      createdAt: daysAgo(rng, 90), ownerId: userId(), quotesReceived: Math.max(0, received), quotesExpected: expected,
    };
  });

  // ---- Quotations (for RFQs that have quotes) ----
  const quotations: Quotation[] = [];
  let qCounter = 0;
  for (const rfq of rfqs) {
    if (rfq.status === "Draft" || rfq.status === "Sent") continue;
    const vendors = rfq.vendorIds.slice(0, Math.max(1, rfq.quotesReceived));
    const quotes = vendors.map((vid, k) => {
      const v = suppliers.find((s) => s.id === vid)!;
      const value = Math.round(rfq.estValue * (0.85 + rng() * 0.4));
      const lead = v.leadTimeAvg + Math.floor(rng() * 20 - 10);
      const score = Math.round(60 + rng() * 38);
      return {
        id: `Q-${++qCounter}`, rfqId: rfq.id, rfqNumber: rfq.number, vendorId: v.id, vendorName: v.name,
        totalValue: value, leadTimeDays: Math.max(3, lead), paymentTerms: v.paymentTerms,
        validityDays: pick(rng, [15, 30, 30, 45, 60]), deliveryTerms: pick(rng, ["Ex-works", "FOR site", "CIF", "DDP"]),
        status: "Received" as QuotationStatus, receivedAt: daysAgo(rng, 30), lineCount: rfq.lineItems, rank: 0, score,
      };
    });
    // rank by a blend of price (lower better) and score (higher better)
    quotes
      .map((q) => ({ q, metric: q.score - q.totalValue / Math.max(1, rfq.estValue) * 40 }))
      .sort((a, b) => b.metric - a.metric)
      .forEach((x, idx) => {
        x.q.rank = idx + 1;
        if (rfq.status === "Awarded" && idx === 0) x.q.status = "Awarded";
      });
    quotations.push(...quotes);
  }

  // ---- Activities ----
  const activityTemplates: { type: Activity["type"]; action: string }[] = [
    { type: "eco", action: "opened material change request" }, { type: "eco", action: "approved" },
    { type: "revision", action: "released revision of" }, { type: "comment", action: "commented on" },
    { type: "part", action: "created material" }, { type: "part", action: "updated last purchase price on" },
    { type: "document", action: "uploaded document to" }, { type: "inventory", action: "flagged low stock on" },
    { type: "purchase", action: "issued purchase order to" }, { type: "approval", action: "released BOM for" },
  ];
  const activities: Activity[] = range(3).map((i) => {
    const t = pick(rng, activityTemplates);
    let target = "";
    if (t.type === "eco" || t.type === "approval") target = pick(rng, ecos).number;
    else if (t.type === "purchase") target = pick(rng, suppliers).name;
    else if (t.type === "document") target = pick(rng, folders);
    else target = pick(rng, parts).partNumber;
    return { id: `ACT-${i + 1}`, type: t.type, userId: userId(), action: t.action, target, timestamp: daysAgo(rng, 14) };
  }).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  // ---- Notifications ----
  const notifications: Notification[] = range(3).map((i) => {
    const type = pick(rng, ["mention", "approval", "inventory", "eco", "system"] as const);
    const titleMap: Record<typeof type, string> = {
      mention: "You were mentioned", approval: "Approval requested", inventory: "Inventory alert",
      eco: "BOM / change update", system: "System notice",
    };
    const bodyMap: Record<typeof type, string> = {
      mention: `${pick(rng, users).name} mentioned you on ${pick(rng, ecos).number}`,
      approval: `${pick(rng, projectBoms).number} is awaiting commercial review`,
      inventory: `${pick(rng, parts).partNumber} dropped below minimum stock`,
      eco: `${pick(rng, ecos).number} moved to ${pick(rng, ecoStatuses)}`,
      system: "Scheduled BOM cost rollup completed successfully",
    };
    return { id: `N-${i + 1}`, type, title: titleMap[type], body: bodyMap[type], timestamp: daysAgo(rng, 6), read: rng() > 0.55, userId: pick(rng, users).id };
  }).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  // ---- Approvals (pending BOM/commercial) ----
  const pendingEcos = ecos.filter((e) => e.status === "Review" || e.status === "Approved");
  const approvals: Approval[] = pendingEcos.slice(0, 3).map((e, i) => ({
    id: `APR-${i + 1}`, ecoId: e.id, ecoNumber: e.number, title: e.title, type: e.type,
    requestedById: e.ownerId, assignedToId: userId(), priority: e.priority, requestedAt: e.createdAt,
    dueDate: e.dueDate, status: pick(rng, ["Pending", "Pending", "Pending", "Approved"] as const),
    costImpact: e.costImpact, affectedItems: e.affectedItems,
  }));

  return {
    users, suppliers, parts, products, ecos, revisions, documents, warehouses, inventory,
    purchaseOrders, activities, notifications, approvals, projectBoms, rfqs, quotations, projectBomLines,
  };
}
