/* ============================================================================
 * In-memory database shape.
 *
 * Mock seed data has been removed — the app is backend-only. This module now
 * only defines the `Database`/`BomEdge` shapes and returns an EMPTY database.
 * All screens fetch from the API via `@/lib/api` hooks; anything still reading
 * `db()` sees empty collections (no fabricated demo data).
 * ==========================================================================*/

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
  ProjectBom,
  Rfq,
  Quotation,
} from "@/types";

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

/** Returns an empty in-memory database — all data now comes from the backend. */
export function generateDatabase(): Database {
  return {
    users: [],
    suppliers: [],
    parts: [],
    products: [],
    ecos: [],
    revisions: [],
    documents: [],
    warehouses: [],
    inventory: [],
    purchaseOrders: [],
    activities: [],
    notifications: [],
    approvals: [],
    projectBoms: [],
    rfqs: [],
    quotations: [],
    projectBomLines: {},
  };
}
