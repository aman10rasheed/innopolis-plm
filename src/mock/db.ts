import { generateDatabase, type Database, type BomEdge } from "./generate";
import type { BomNode } from "@/types";

let _db: Database | null = null;

/** Lazily generate the in-memory database once per session. */
export function db(): Database {
  if (!_db) _db = generateDatabase();
  return _db;
}

// ---- Lookup maps (memoized) ----
let _maps: {
  partById: Map<string, Database["parts"][number]>;
  productById: Map<string, Database["products"][number]>;
  supplierById: Map<string, Database["suppliers"][number]>;
  userById: Map<string, Database["users"][number]>;
} | null = null;

export function maps() {
  if (!_maps) {
    const d = db();
    _maps = {
      partById: new Map(d.parts.map((p) => [p.id, p])),
      productById: new Map(d.products.map((p) => [p.id, p])),
      supplierById: new Map(d.suppliers.map((s) => [s.id, s])),
      userById: new Map(d.users.map((u) => [u.id, u])),
    };
  }
  return _maps;
}

/** Insert helpers — prepend a freshly-created entity so it shows up first. */
export function addProduct(p: Database["products"][number]) {
  db().products.unshift(p);
  maps().productById.set(p.id, p);
}
export function addEco(e: Database["ecos"][number]) {
  db().ecos.unshift(e);
}
export function addPurchaseOrder(po: Database["purchaseOrders"][number]) {
  db().purchaseOrders.unshift(po);
}
export function addProjectBom(b: Database["projectBoms"][number]) {
  db().projectBoms.unshift(b);
}
/** Append a part line-item to a project's BOM (the BOM Explorer "Add component" seam). */
export function addProjectBomLine(productId: string, edge: BomEdge) {
  const lines = db().projectBomLines;
  (lines[productId] ??= []).push(edge);
}

/** Update / delete helpers so board edits persist across navigation. */
export function updateEco(id: string, patch: Partial<Database["ecos"][number]>) {
  const arr = db().ecos;
  const i = arr.findIndex((e) => e.id === id);
  if (i >= 0) arr[i] = { ...arr[i]!, ...patch };
}
export function deleteEco(id: string) {
  const arr = db().ecos;
  const i = arr.findIndex((e) => e.id === id);
  if (i >= 0) arr.splice(i, 1);
}
export function updateProjectBom(id: string, patch: Partial<Database["projectBoms"][number]>) {
  const arr = db().projectBoms;
  const i = arr.findIndex((b) => b.id === id);
  if (i >= 0) arr[i] = { ...arr[i]!, ...patch };
}
export function deleteProjectBom(id: string) {
  const arr = db().projectBoms;
  const i = arr.findIndex((b) => b.id === id);
  if (i >= 0) arr.splice(i, 1);
}
export function addSupplier(s: Database["suppliers"][number]) {
  db().suppliers.unshift(s);
  maps().supplierById.set(s.id, s);
}
export function addRevision(r: Database["revisions"][number]) {
  db().revisions.unshift(r);
}
export function addDocument(doc: Database["documents"][number]) {
  db().documents.unshift(doc);
}
export function addWarehouse(w: Database["warehouses"][number]) {
  db().warehouses.unshift(w);
}

export const getUser = (id: string) => maps().userById.get(id);
export const getSupplier = (id: string) => maps().supplierById.get(id);
export const getPart = (id: string) => maps().partById.get(id);
export const getProduct = (id: string) => maps().productById.get(id);

/**
 * Build a project's BOM as a single-level tree: a project root whose children
 * are the flat list of part line-items. Costs roll up from the line extended cost.
 */
export function buildProjectBom(productId: string): BomNode | null {
  const d = db();
  const m = maps();
  const product = m.productById.get(productId);
  if (!product) return null;

  const edges: BomEdge[] = d.projectBomLines[productId] ?? [];
  let findCounter = 0;
  const children: BomNode[] = edges.map((e, i) => {
    const p = m.partById.get(e.refId)!;
    findCounter++;
    return {
      id: `root.${i}`,
      refId: p.id,
      type: "part",
      partNumber: p.partNumber,
      name: p.name,
      category: p.category,
      quantity: e.qty,
      uom: p.uom,
      unitCost: p.unitCost,
      extendedCost: Math.round(p.unitCost * e.qty * 100) / 100,
      lifecycle: p.lifecycle,
      revision: p.revision,
      refDesignator: e.refDes,
      leadTimeDays: p.leadTimeDays,
      procurement: p.sourcing,
      level: 1,
      findNumber: findCounter,
      hasIssue: p.lifecycle === "Obsolete" || p.availability === "Out of Stock",
      isDuplicate: false,
    };
  });

  const rolled = Math.round(children.reduce((s, c) => s + c.extendedCost, 0) * 100) / 100;
  const root: BomNode = {
    id: "root",
    refId: product.id,
    type: "project",
    partNumber: product.code,
    name: product.name,
    quantity: 1,
    uom: "ea",
    unitCost: rolled,
    extendedCost: rolled,
    lifecycle: product.lifecycle,
    revision: product.revision,
    leadTimeDays: 0,
    procurement: "Make",
    level: 0,
    findNumber: 0,
    children,
    hasIssue: false,
    isDuplicate: false,
  };
  markDuplicates(root);
  return root;
}

/** Flag parts that appear under multiple different parents (duplicate usage). */
function markDuplicates(root: BomNode) {
  const counts = new Map<string, number>();
  const walk = (n: BomNode) => {
    if (n.type === "part") counts.set(n.refId, (counts.get(n.refId) ?? 0) + 1);
    n.children?.forEach(walk);
  };
  walk(root);
  const dupSet = new Set([...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id));
  const mark = (n: BomNode) => {
    if (n.type === "part" && dupSet.has(n.refId)) n.isDuplicate = true;
    n.children?.forEach(mark);
  };
  mark(root);
}

/** Flatten a BOM tree to a list (for indented table view). */
export function flattenBom(
  node: BomNode,
  expanded: Set<string>,
  out: BomNode[] = [],
): BomNode[] {
  out.push(node);
  if (node.children && expanded.has(node.id)) {
    for (const c of node.children) flattenBom(c, expanded, out);
  }
  return out;
}

/** Where-used: projects whose BOM directly consumes a given part id. */
export function whereUsed(refId: string): { projectId: string; qty: number }[] {
  const d = db();
  const result: { projectId: string; qty: number }[] = [];
  for (const [projectId, edges] of Object.entries(d.projectBomLines)) {
    for (const e of edges) {
      if (e.refId === refId) result.push({ projectId, qty: e.qty });
    }
  }
  return result;
}

/** Rolled-up part cost of a project's BOM. */
export function projectRolledCost(productId: string): number {
  const d = db();
  const m = maps();
  let cost = 0;
  for (const e of d.projectBomLines[productId] ?? []) {
    const p = m.partById.get(e.refId);
    if (p) cost += p.unitCost * e.qty;
  }
  return Math.round(cost * 100) / 100;
}

/** Total rolled BOM cost across every project. */
export function totalRolledCost(): number {
  const d = db();
  return Object.keys(d.projectBomLines).reduce((s, id) => s + projectRolledCost(id), 0);
}

/** Projects that have a BOM — for the BOM Explorer picker. */
export function rootProjects() {
  const d = db();
  return d.products.filter((p) => (d.projectBomLines[p.id]?.length ?? 0) > 0);
}
