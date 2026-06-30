/* ============================================================================
 * ENDPOINTS — one typed function per backend route, grouped under `api.*`.
 * Mirrors docs/API_GUIDE.md. Returns raw API DTOs; map with `mappers.ts`.
 * ==========================================================================*/

import { req, reqList, type Query } from "./client";
import type {
  ApiAuthResponse, ApiUser,
  ApiCategory, ApiSubtype, ApiMajorSpec, ApiGrade, ApiUnit,
  ApiPart, ApiPartInput,
  ApiSupplier,
  ApiProject,
  ApiBom, ApiBomDetail, ApiBomLine, ApiBomLineInput, ApiBomAnalysis,
  ApiRfq, ApiRfqDetail, ApiQuotation, ApiComparison,
  ApiPurchaseOrder, ApiPoDetail,
  ApiWarehouse, ApiWarehouseDetail, ApiInventoryBalance, ApiMovement,
  ApiDashboard,
} from "./types";
import type { BomStage, PoStatus } from "@/types";

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req<ApiAuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
    me: () => req<ApiUser>("/auth/me"),
  },

  /* ---- Module 1: Material Master masters ---- */
  masters: {
    categories: () => req<ApiCategory[]>("/material-categories"),
    createCategory: (body: Partial<ApiCategory>) => req<ApiCategory>("/material-categories", { method: "POST", body }),
    updateCategory: (id: string, body: Partial<ApiCategory>) => req<ApiCategory>(`/material-categories/${id}`, { method: "PATCH", body }),
    deleteCategory: (id: string) => req<void>(`/material-categories/${id}`, { method: "DELETE" }),
    subtypes: (categoryId: string) => req<ApiSubtype[]>(`/material-categories/${categoryId}/subtypes`),
    createSubtype: (body: Partial<ApiSubtype>) => req<ApiSubtype>("/subtypes", { method: "POST", body }),
    updateSubtype: (id: string, body: Partial<ApiSubtype>) => req<ApiSubtype>(`/subtypes/${id}`, { method: "PATCH", body }),
    deleteSubtype: (id: string) => req<void>(`/subtypes/${id}`, { method: "DELETE" }),
    majorSpecs: () => req<ApiMajorSpec[]>("/major-specs"),
    grades: () => req<ApiGrade[]>("/grades"),
    units: () => req<ApiUnit[]>("/units"),
  },

  /* ---- Module 1: Materials ---- */
  parts: {
    list: (query?: Query) => reqList<ApiPart>("/parts", { query }),
    get: (id: string) => req<ApiPart>(`/parts/${id}`),
    create: (body: ApiPartInput) => req<ApiPart>("/parts", { method: "POST", body }),
    update: (id: string, body: Partial<ApiPartInput>) => req<ApiPart>(`/parts/${id}`, { method: "PATCH", body }),
    remove: (id: string) => req<void>(`/parts/${id}`, { method: "DELETE" }),
  },

  /* ---- Module 3: Vendors ---- */
  vendors: {
    list: (query?: Query) => reqList<ApiSupplier>("/suppliers", { query }),
    get: (id: string) => req<ApiSupplier>(`/suppliers/${id}`),
    create: (body: Partial<ApiSupplier>) => req<ApiSupplier>("/suppliers", { method: "POST", body }),
    update: (id: string, body: Partial<ApiSupplier>) => req<ApiSupplier>(`/suppliers/${id}`, { method: "PATCH", body }),
    remove: (id: string) => req<void>(`/suppliers/${id}`, { method: "DELETE" }),
  },

  /* ---- Module 2: Projects ---- */
  projects: {
    list: (query?: Query) => reqList<ApiProject>("/projects", { query }),
    get: (id: string) => req<ApiProject>(`/projects/${id}`),
    create: (body: Partial<ApiProject>) => req<ApiProject>("/projects", { method: "POST", body }),
    update: (id: string, body: Partial<ApiProject>) => req<ApiProject>(`/projects/${id}`, { method: "PATCH", body }),
    remove: (id: string) => req<void>(`/projects/${id}`, { method: "DELETE" }),
  },

  /* ---- Module 2: BOMs ---- */
  boms: {
    list: (query?: Query) => reqList<ApiBom>("/project-boms", { query }),
    get: (id: string) => req<ApiBomDetail>(`/project-boms/${id}`),
    create: (body: { project_id: string; bom_type?: string; revision?: string }) =>
      req<ApiBom>("/project-boms", { method: "POST", body }),
    update: (id: string, body: { bom_type?: string; revision?: string }) =>
      req<ApiBom>(`/project-boms/${id}`, { method: "PATCH", body }),
    remove: (id: string) => req<void>(`/project-boms/${id}`, { method: "DELETE" }),
    lines: (bomId: string) => req<ApiBomLine[]>(`/project-boms/${bomId}/lines`),
    addLine: (bomId: string, body: ApiBomLineInput) =>
      req<ApiBomLine>(`/project-boms/${bomId}/lines`, { method: "POST", body }),
    updateLine: (lineId: string, body: Partial<ApiBomLineInput>) =>
      req<ApiBomLine>(`/bom-lines/${lineId}`, { method: "PATCH", body }),
    deleteLine: (lineId: string) => req<void>(`/bom-lines/${lineId}`, { method: "DELETE" }),
    transition: (id: string, action: "advance" | "reject", comment = "") =>
      req<ApiBomDetail>(`/project-boms/${id}/transition`, { method: "POST", body: { action, comment } }),
    analysis: (id: string, groupBy: "category" | "vendor" | "leadtime" | "procurement") =>
      req<ApiBomAnalysis>(`/project-boms/${id}/analysis`, { query: { groupBy } }),
  },

  /* ---- Module 4: RFQ / Quotations ---- */
  rfqs: {
    list: (query?: Query) => reqList<ApiRfq>("/rfqs", { query }),
    get: (id: string) => req<ApiRfqDetail>(`/rfqs/${id}`),
    create: (body: Record<string, unknown>) => req<ApiRfq>("/rfqs", { method: "POST", body }),
    update: (id: string, body: Record<string, unknown>) => req<ApiRfq>(`/rfqs/${id}`, { method: "PATCH", body }),
    remove: (id: string) => req<void>(`/rfqs/${id}`, { method: "DELETE" }),
    send: (id: string) => req<ApiRfq>(`/rfqs/${id}/send`, { method: "POST" }),
    quotations: (id: string) => req<ApiQuotation[]>(`/rfqs/${id}/quotations`),
    addQuotation: (id: string, body: Record<string, unknown>) =>
      req<ApiQuotation>(`/rfqs/${id}/quotations`, { method: "POST", body }),
    comparison: (id: string) => req<ApiComparison>(`/rfqs/${id}/comparison`),
  },
  quotations: {
    get: (id: string) => req<ApiQuotation & { lines: unknown[] }>(`/quotations/${id}`),
    award: (id: string) => req<ApiQuotation>(`/quotations/${id}/award`, { method: "POST" }),
  },

  /* ---- Module 4: Purchase Orders ---- */
  pos: {
    list: (query?: Query) => reqList<ApiPurchaseOrder>("/purchase-orders", { query }),
    get: (id: string) => req<ApiPoDetail>(`/purchase-orders/${id}`),
    create: (body: Record<string, unknown>) => req<ApiPurchaseOrder>("/purchase-orders", { method: "POST", body }),
    setStatus: (id: string, status: PoStatus) =>
      req<ApiPurchaseOrder>(`/purchase-orders/${id}/status`, { method: "POST", body: { status } }),
    receive: (id: string, body: { warehouse_id?: string; lines: { po_line_id: string; received_qty: number; rejected_qty?: number; batch?: string }[] }) =>
      req<ApiPoDetail>(`/purchase-orders/${id}/receive`, { method: "POST", body }),
    remove: (id: string) => req<void>(`/purchase-orders/${id}`, { method: "DELETE" }),
  },

  /* ---- Module 5: Inventory ---- */
  inventory: {
    warehouses: () => req<ApiWarehouse[]>("/warehouses"),
    warehouse: (id: string) => req<ApiWarehouseDetail>(`/warehouses/${id}`),
    createWarehouse: (body: Partial<ApiWarehouse>) => req<ApiWarehouse>("/warehouses", { method: "POST", body }),
    updateWarehouse: (id: string, body: Partial<ApiWarehouse>) => req<ApiWarehouse>(`/warehouses/${id}`, { method: "PATCH", body }),
    deleteWarehouse: (id: string) => req<void>(`/warehouses/${id}`, { method: "DELETE" }),
    stock: (query?: Query) => reqList<ApiInventoryBalance>("/inventory", { query }),
    movements: (query?: Query) => reqList<ApiMovement>("/inventory/movements", { query }),
    alerts: () => req<ApiInventoryBalance[]>("/inventory/alerts"),
    opening: (body: Record<string, unknown>) => req<ApiMovement>("/inventory/opening", { method: "POST", body }),
    adjust: (body: Record<string, unknown>) => req<ApiMovement>("/inventory/adjust", { method: "POST", body }),
    transfer: (body: Record<string, unknown>) => req<ApiMovement[]>("/inventory/transfer", { method: "POST", body }),
  },

  /* ---- Module 6: Reports ---- */
  reports: {
    dashboard: () => req<ApiDashboard>("/reports/dashboard"),
    purchaseValue: () => req<{ status: string; count: number; value: string }[]>("/reports/procurement/purchase-value"),
    vendorPerformance: () => req<Record<string, unknown>[]>("/reports/procurement/vendor-performance"),
    stockValue: () => req<Record<string, unknown>[]>("/reports/inventory/stock-value"),
    vendorSpend: () => req<Record<string, unknown>[]>("/reports/commercial/vendor-spend"),
    projectCost: () => req<Record<string, unknown>[]>("/reports/commercial/project-cost"),
  },
};

export type Api = typeof api;
// keep BomStage referenced for transition typing consumers
export type { BomStage };
