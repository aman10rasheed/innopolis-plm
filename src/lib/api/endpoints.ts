/* ============================================================================
 * ENDPOINTS — one typed function per backend route, grouped under `api.*`.
 * Mirrors docs/API_GUIDE.md. Returns raw API DTOs; map with `mappers.ts`.
 * ==========================================================================*/

import { req, reqList, API_BASE, type Query } from "./client";
import type {
  ApiAuthResponse, ApiUser, ApiUserFull, ApiCreateUserInput, ApiResetPasswordResponse,
  ApiCategory, ApiSubtype, ApiMajorSpec, ApiGrade, ApiUnit, ApiResourceSpec,
  ApiPart, ApiPartInput, ApiPriceHistory,
  ApiSupplier,
  ApiProject,
  ApiBom, ApiBomDetail, ApiBomLine, ApiBomLineInput, ApiBomAnalysis,
  ApiRfq, ApiRfqDetail, ApiQuotation, ApiComparison,
  ApiPurchaseOrder, ApiPoDetail,
  ApiWarehouse, ApiWarehouseDetail, ApiInventoryBalance, ApiMovement,
  ApiDashboard,
} from "./types";
import type { BomStage, PoStatus, ProjectStage } from "@/types";

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req<ApiAuthResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
    me: () => req<ApiUser>("/auth/me"),
    /** Forced first-login change — returns a fresh, unrestricted token. */
    setPassword: (current_password: string, new_password: string) =>
      req<ApiAuthResponse>("/auth/set-password", { method: "POST", body: { current_password, new_password } }),
  },

  /* ---- User management (Administrator only) ---- */
  users: {
    list: (query?: Query) => reqList<ApiUserFull>("/users", { query }),
    get: (id: string) => req<ApiUserFull>(`/users/${id}`),
    create: (body: ApiCreateUserInput) => req<ApiUserFull>("/users", { method: "POST", body }),
    update: (id: string, body: Partial<ApiUserFull>) => req<ApiUserFull>(`/users/${id}`, { method: "PATCH", body }),
    resetPassword: (id: string, temporary_password?: string) =>
      req<ApiResetPasswordResponse>(`/users/${id}/reset-password`, { method: "POST", body: temporary_password ? { temporary_password } : {} }),
    remove: (id: string) => req<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
  },

  /* ---- Module 1: Material Master masters ---- */
  masters: {
    categories: () => req<ApiCategory[]>("/material-categories"),
    getCategory: (id: string) => req<ApiCategory>(`/material-categories/${id}`),
    createCategory: (body: Partial<ApiCategory>) => req<ApiCategory>("/material-categories", { method: "POST", body }),
    updateCategory: (id: string, body: Partial<ApiCategory>) => req<ApiCategory>(`/material-categories/${id}`, { method: "PATCH", body }),
    deleteCategory: (id: string) => req<void>(`/material-categories/${id}`, { method: "DELETE" }),

    subtypes: (categoryId: string) => req<ApiSubtype[]>(`/material-categories/${categoryId}/subtypes`),
    getSubtype: (id: string) => req<ApiSubtype>(`/subtypes/${id}`),
    createSubtype: (body: Partial<ApiSubtype>) => req<ApiSubtype>("/subtypes", { method: "POST", body }),
    updateSubtype: (id: string, body: Partial<ApiSubtype>) => req<ApiSubtype>(`/subtypes/${id}`, { method: "PATCH", body }),
    deleteSubtype: (id: string) => req<void>(`/subtypes/${id}`, { method: "DELETE" }),

    majorSpecs: () => req<ApiMajorSpec[]>("/major-specs"),
    getMajorSpec: (id: string) => req<ApiMajorSpec>(`/major-specs/${id}`),
    createMajorSpec: (body: Partial<ApiMajorSpec>) => req<ApiMajorSpec>("/major-specs", { method: "POST", body }),
    updateMajorSpec: (id: string, body: Partial<ApiMajorSpec>) => req<ApiMajorSpec>(`/major-specs/${id}`, { method: "PATCH", body }),
    deleteMajorSpec: (id: string) => req<void>(`/major-specs/${id}`, { method: "DELETE" }),

    grades: () => req<ApiGrade[]>("/grades"),
    getGrade: (id: string) => req<ApiGrade>(`/grades/${id}`),
    createGrade: (body: Partial<ApiGrade>) => req<ApiGrade>("/grades", { method: "POST", body }),
    updateGrade: (id: string, body: Partial<ApiGrade>) => req<ApiGrade>(`/grades/${id}`, { method: "PATCH", body }),
    deleteGrade: (id: string) => req<void>(`/grades/${id}`, { method: "DELETE" }),

    units: () => req<ApiUnit[]>("/units"),
    getUnit: (id: string) => req<ApiUnit>(`/units/${id}`),
    createUnit: (body: Partial<ApiUnit>) => req<ApiUnit>("/units", { method: "POST", body }),
    updateUnit: (id: string, body: Partial<ApiUnit>) => req<ApiUnit>(`/units/${id}`, { method: "PATCH", body }),
    deleteUnit: (id: string) => req<void>(`/units/${id}`, { method: "DELETE" }),

    resourceSpecs: () => req<ApiResourceSpec[]>("/resource-specs"),
    getResourceSpec: (id: string) => req<ApiResourceSpec>(`/resource-specs/${id}`),
    createResourceSpec: (body: Partial<ApiResourceSpec>) => req<ApiResourceSpec>("/resource-specs", { method: "POST", body }),
    updateResourceSpec: (id: string, body: Partial<ApiResourceSpec>) => req<ApiResourceSpec>(`/resource-specs/${id}`, { method: "PATCH", body }),
    /** 409 if the spec is still assigned to any material. */
    deleteResourceSpec: (id: string) => req<void>(`/resource-specs/${id}`, { method: "DELETE" }),
  },

  /* ---- Module 1: Materials ---- */
  parts: {
    list: (query?: Query) => reqList<ApiPart>("/parts", { query }),
    get: (id: string) => req<ApiPart>(`/parts/${id}`),
    create: (body: ApiPartInput) => req<ApiPart>("/parts", { method: "POST", body }),
    update: (id: string, body: Partial<ApiPartInput>) => req<ApiPart>(`/parts/${id}`, { method: "PATCH", body }),
    remove: (id: string) => req<void>(`/parts/${id}`, { method: "DELETE" }),
    /** Purchase-price ledger (newest first). */
    priceHistory: (id: string) => req<ApiPriceHistory>(`/parts/${id}/price-history`),
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
    /** Project coordination (roles: Project Manager on own projects, Engineering). */
    setStage: (id: string, stage: ProjectStage) =>
      req<ApiProject>(`/projects/${id}/stage`, { method: "PATCH", body: { stage } }),
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
    /** PM planning date — allowed at any BOM stage (roles: Project Manager, Engineering). */
    setLineRequiredDate: (lineId: string, required_by_date: string | null) =>
      req<ApiBomLine>(`/bom-lines/${lineId}/required-date`, { method: "PATCH", body: { required_by_date } }),
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
    /** Goods receipt. warehouse_id REQUIRED; received_qty is GROSS (accepted + rejected). */
    receive: (id: string, body: { warehouse_id: string; lines: { po_line_id: string; received_qty: number; rejected_qty?: number; batch?: string }[] }) =>
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

  /* ---- Service health (lives outside /api) ---- */
  health: async (): Promise<{ ok: boolean; status?: string }> => {
    const res = await fetch(`${API_BASE}/health`);
    const json = (await res.json().catch(() => null)) as { status?: string } | null;
    return { ok: res.ok, status: json?.status };
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
