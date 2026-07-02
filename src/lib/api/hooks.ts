"use client";

/* ============================================================================
 * REACT QUERY HOOKS — the recommended way screens consume the API.
 * Each returns mapped domain types (`@/types`) so components stay shape-stable.
 * Mutations invalidate the right keys so aggregates/stages refresh after writes.
 * ==========================================================================*/

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "./endpoints";
import type { Query } from "./client";
import * as m from "./mappers";
import type { ApiPartInput, ApiUserFull, ApiCreateUserInput, ApiCategoryInput } from "./types";
import { useAuthStore } from "@/stores/auth-store";

export const qk = {
  masters: ["masters"] as const,
  categories: ["categories"] as const,
  parts: (f?: Query) => ["parts", f ?? {}] as const,
  part: (id: string) => ["part", id] as const,
  vendors: (f?: Query) => ["vendors", f ?? {}] as const,
  vendor: (id: string) => ["vendor", id] as const,
  projects: (f?: Query) => ["projects", f ?? {}] as const,
  project: (id: string) => ["project", id] as const,
  boms: (f?: Query) => ["boms", f ?? {}] as const,
  bom: (id: string) => ["bom", id] as const,
  bomAnalysis: (id: string, g: string) => ["bom", id, "analysis", g] as const,
  rfqs: (f?: Query) => ["rfqs", f ?? {}] as const,
  rfq: (id: string) => ["rfq", id] as const,
  comparison: (id: string) => ["rfq", id, "comparison"] as const,
  pos: (f?: Query) => ["pos", f ?? {}] as const,
  po: (id: string) => ["po", id] as const,
  inventory: (f?: Query) => ["inventory", f ?? {}] as const,
  movements: (f?: Query) => ["movements", f ?? {}] as const,
  alerts: ["inventory", "alerts"] as const,
  warehouses: ["warehouses"] as const,
  dashboard: ["dashboard"] as const,
  users: (f?: Query) => ["users", f ?? {}] as const,
  user: (id: string) => ["user", id] as const,
};

/* ---- Material Master masters (for the create-material dropdowns) ---- */
export function useMaterialMasters() {
  return useQuery({
    queryKey: qk.masters,
    queryFn: async () => {
      const [categories, majorSpecs, grades, units] = await Promise.all([
        api.masters.categories(),
        api.masters.majorSpecs(),
        api.masters.grades(),
        api.masters.units(),
      ]);
      return { categories, majorSpecs, grades, units };
    },
    staleTime: 5 * 60_000,
  });
}
export const useSubtypes = (categoryId: string | undefined) =>
  useQuery({
    queryKey: ["subtypes", categoryId],
    queryFn: () => api.masters.subtypes(categoryId!),
    enabled: !!categoryId,
    staleTime: 5 * 60_000,
  });

/* ---- Category (Material Type) management — Administrator only for writes ---- */
export const useCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: () => api.masters.categories(), staleTime: 5 * 60_000 });

/** Invalidate both the standalone categories list and the bundled masters query. */
function invalidateCategories(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.categories });
  qc.invalidateQueries({ queryKey: qk.masters });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApiCategoryInput) => api.masters.createCategory(body),
    onSuccess: () => invalidateCategories(qc),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ApiCategoryInput> }) => api.masters.updateCategory(id, body),
    onSuccess: () => invalidateCategories(qc),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.masters.deleteCategory(id),
    onSuccess: () => invalidateCategories(qc),
  });
}

/* ---- Materials ---- */
export const useParts = (filters?: Query) =>
  useQuery({
    queryKey: qk.parts(filters),
    queryFn: async () => {
      const { items, meta } = await api.parts.list(filters);
      return { items: items.map(m.mapPart), meta };
    },
    placeholderData: keepPreviousData,
  });
export const usePart = (id: string) =>
  useQuery({ queryKey: qk.part(id), queryFn: async () => m.mapPart(await api.parts.get(id)), enabled: !!id });

export function useCreatePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApiPartInput) => api.parts.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parts"] }),
  });
}
export function useUpdatePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ApiPartInput> }) => api.parts.update(id, body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: qk.part(v.id) });
    },
  });
}
export function useDeletePart() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.parts.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["parts"] }) });
}

/* ---- Vendors ---- */
export const useVendors = (filters?: Query) =>
  useQuery({
    queryKey: qk.vendors(filters),
    queryFn: async () => {
      const { items, meta } = await api.vendors.list(filters);
      return { items: items.map(m.mapSupplier), meta };
    },
    placeholderData: keepPreviousData,
  });
export function useSaveVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? api.vendors.update(id, body) : api.vendors.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

/* ---- Projects ---- */
export const useProjects = (filters?: Query) =>
  useQuery({
    queryKey: qk.projects(filters),
    queryFn: async () => {
      const { items, meta } = await api.projects.list(filters);
      return { items: items.map(m.mapProject), meta };
    },
    placeholderData: keepPreviousData,
  });
export const useProject = (id: string) =>
  useQuery({ queryKey: qk.project(id), queryFn: async () => m.mapProject(await api.projects.get(id)), enabled: !!id });
export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => api.projects.create(body), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}

/* ---- BOMs + approval workflow ---- */
export const useBoms = (filters?: Query) =>
  useQuery({
    queryKey: qk.boms(filters),
    queryFn: async () => {
      const { items, meta } = await api.boms.list(filters);
      return { items: items.map(m.mapBom), meta };
    },
    placeholderData: keepPreviousData,
  });
export const useBom = (id: string) =>
  useQuery({ queryKey: qk.bom(id), queryFn: () => api.boms.get(id), enabled: !!id });
export const useBomAnalysis = (id: string, groupBy: "category" | "vendor" | "leadtime" | "procurement") =>
  useQuery({ queryKey: qk.bomAnalysis(id, groupBy), queryFn: () => api.boms.analysis(id, groupBy), enabled: !!id });

export function useCreateBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { project_id: string; bom_type?: string; revision?: string }) => api.boms.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boms"] }),
  });
}
export function useAddBomLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bomId, body }: { bomId: string; body: Parameters<typeof api.boms.addLine>[1] }) => api.boms.addLine(bomId, body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: qk.bom(v.bomId) }); qc.invalidateQueries({ queryKey: ["boms"] }); },
  });
}
export function useTransitionBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: "advance" | "reject"; comment?: string }) =>
      api.boms.transition(id, action, comment),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: qk.bom(v.id) }); qc.invalidateQueries({ queryKey: ["boms"] }); },
  });
}

/* ---- RFQ / Quotation ---- */
export const useRfqs = (filters?: Query) =>
  useQuery({
    queryKey: qk.rfqs(filters),
    queryFn: async () => {
      const { items, meta } = await api.rfqs.list(filters);
      return { items: items.map(m.mapRfq), meta };
    },
    placeholderData: keepPreviousData,
  });
export const useRfq = (id: string) =>
  useQuery({ queryKey: qk.rfq(id), queryFn: () => api.rfqs.get(id), enabled: !!id });
export const useComparison = (id: string) =>
  useQuery({
    queryKey: qk.comparison(id),
    // The /comparison endpoint computes rank + weighted score per quote;
    // the plain /quotations list does not. Map to domain quotations here.
    queryFn: async () => {
      const c = await api.rfqs.comparison(id);
      return {
        recommended: c.recommended ? m.mapQuotation(c.recommended) : null,
        quotations: c.quotations.map(m.mapQuotation),
      };
    },
    enabled: !!id,
  });
export function useSendRfq() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.rfqs.send(id), onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: qk.rfq(id) }); qc.invalidateQueries({ queryKey: ["rfqs"] }); } });
}
export function useAwardQuotation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (quotationId: string) => api.quotations.award(quotationId), onSuccess: () => { qc.invalidateQueries({ queryKey: ["rfqs"] }); qc.invalidateQueries({ queryKey: ["rfq"] }); } });
}

/* ---- Purchase Orders ---- */
export const usePurchaseOrders = (filters?: Query) =>
  useQuery({
    queryKey: qk.pos(filters),
    queryFn: async () => {
      const { items, meta } = await api.pos.list(filters);
      return { items: items.map(m.mapPurchaseOrder), meta };
    },
    placeholderData: keepPreviousData,
  });
export const usePurchaseOrder = (id: string) =>
  useQuery({ queryKey: qk.po(id), queryFn: () => api.pos.get(id), enabled: !!id });
export function useSetPoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof api.pos.setStatus>[1] }) => api.pos.setStatus(id, status),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: qk.po(v.id) }); qc.invalidateQueries({ queryKey: ["pos"] }); },
  });
}
export function useReceivePo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.pos.receive>[1] }) => api.pos.receive(id, body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.po(v.id) });
      qc.invalidateQueries({ queryKey: ["pos"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

/* ---- Inventory ---- */
export const useInventory = (filters?: Query) =>
  useQuery({
    queryKey: qk.inventory(filters),
    queryFn: async () => {
      const { items, meta } = await api.inventory.stock(filters);
      return { items: items.map(m.mapInventory), meta };
    },
    placeholderData: keepPreviousData,
  });
export const useStockAlerts = () =>
  useQuery({ queryKey: qk.alerts, queryFn: async () => (await api.inventory.alerts()).map(m.mapInventory) });
export const useWarehouses = () =>
  useQuery({ queryKey: qk.warehouses, queryFn: async () => (await api.inventory.warehouses()).map(m.mapWarehouse) });

/* ---- Dashboard ---- */
export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: () => api.reports.dashboard() });

/* ---- User management (Administrator only) ---- */
export const useUsers = (filters?: Query) =>
  useQuery({
    queryKey: qk.users(filters),
    queryFn: async () => {
      const { items, meta } = await api.users.list(filters);
      return { items, meta };
    },
    placeholderData: keepPreviousData,
  });
export const useUser = (id: string) =>
  useQuery({ queryKey: qk.user(id), queryFn: () => api.users.get(id), enabled: !!id });
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApiCreateUserInput) => api.users.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ApiUserFull> }) => api.users.update(id, body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: qk.user(v.id) });
    },
  });
}
export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, temporaryPassword }: { id: string; temporaryPassword?: string }) =>
      api.users.resetPassword(id, temporaryPassword),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: qk.user(v.id) });
    },
  });
}
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
/** Forced first-login password change — delegates to the auth store (token swap + gate clear). */
export function useSetPassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      useAuthStore.getState().setPassword(currentPassword, newPassword),
  });
}

/* ============================================================================
 * Additional hooks — full CRUD coverage for the remaining backend routes.
 * ==========================================================================*/

/* ---- Material Master: Subtypes / Major Specs / Grades / Units ---- */
const invalidateMasters = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: qk.masters });
  qc.invalidateQueries({ queryKey: ["subtypes"] });
  qc.invalidateQueries({ queryKey: ["majorSpecs"] });
  qc.invalidateQueries({ queryKey: ["grades"] });
  qc.invalidateQueries({ queryKey: ["units"] });
};

export const useMajorSpecs = () =>
  useQuery({ queryKey: ["majorSpecs"], queryFn: () => api.masters.majorSpecs(), staleTime: 5 * 60_000 });
export const useGrades = () =>
  useQuery({ queryKey: ["grades"], queryFn: () => api.masters.grades(), staleTime: 5 * 60_000 });
export const useUnits = () =>
  useQuery({ queryKey: ["units"], queryFn: () => api.masters.units(), staleTime: 5 * 60_000 });

export function useSaveSubtype() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? api.masters.updateSubtype(id, body) : api.masters.createSubtype(body),
    onSuccess: () => invalidateMasters(qc),
  });
}
export function useDeleteSubtype() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.masters.deleteSubtype(id), onSuccess: () => invalidateMasters(qc) });
}
export function useSaveMajorSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? api.masters.updateMajorSpec(id, body) : api.masters.createMajorSpec(body),
    onSuccess: () => invalidateMasters(qc),
  });
}
export function useDeleteMajorSpec() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.masters.deleteMajorSpec(id), onSuccess: () => invalidateMasters(qc) });
}
export function useSaveGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? api.masters.updateGrade(id, body) : api.masters.createGrade(body),
    onSuccess: () => invalidateMasters(qc),
  });
}
export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.masters.deleteGrade(id), onSuccess: () => invalidateMasters(qc) });
}
export function useSaveUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? api.masters.updateUnit(id, body) : api.masters.createUnit(body),
    onSuccess: () => invalidateMasters(qc),
  });
}
export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.masters.deleteUnit(id), onSuccess: () => invalidateMasters(qc) });
}

/* ---- Projects: update + delete ---- */
export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? api.projects.update(id, body) : api.projects.create(body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (v.id) qc.invalidateQueries({ queryKey: qk.project(v.id) });
    },
  });
}
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.projects.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
}

/* ---- BOMs: update, delete, line update/delete ---- */
export function useUpdateBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { bom_type?: string; revision?: string } }) => api.boms.update(id, body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: qk.bom(v.id) }); qc.invalidateQueries({ queryKey: ["boms"] }); },
  });
}
export function useDeleteBom() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.boms.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["boms"] }) });
}
export function useUpdateBomLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, body }: { lineId: string; body: Parameters<typeof api.boms.updateLine>[1] }) => api.boms.updateLine(lineId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bom"] }); qc.invalidateQueries({ queryKey: ["boms"] }); },
  });
}
export function useDeleteBomLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineId: string) => api.boms.deleteLine(lineId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bom"] }); qc.invalidateQueries({ queryKey: ["boms"] }); },
  });
}

/* ---- RFQ / Quotations ---- */
export function useCreateRfq() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => api.rfqs.create(body), onSuccess: () => qc.invalidateQueries({ queryKey: ["rfqs"] }) });
}
export function useUpdateRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.rfqs.update(id, body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: qk.rfq(v.id) }); qc.invalidateQueries({ queryKey: ["rfqs"] }); },
  });
}
export function useDeleteRfq() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.rfqs.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["rfqs"] }) });
}
export const useRfqQuotations = (rfqId: string) =>
  useQuery({
    queryKey: ["rfq", rfqId, "quotations"],
    queryFn: async () => (await api.rfqs.quotations(rfqId)).map(m.mapQuotation),
    enabled: !!rfqId,
  });
export function useAddQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rfqId, body }: { rfqId: string; body: Record<string, unknown> }) => api.rfqs.addQuotation(rfqId, body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["rfq", v.rfqId] });
      qc.invalidateQueries({ queryKey: qk.comparison(v.rfqId) });
      qc.invalidateQueries({ queryKey: ["rfqs"] });
    },
  });
}
export const useQuotation = (id: string) =>
  useQuery({ queryKey: ["quotation", id], queryFn: () => api.quotations.get(id), enabled: !!id });

/* ---- Purchase Orders: create + delete ---- */
export function useCreatePo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.pos.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos"] }); qc.invalidateQueries({ queryKey: ["rfqs"] }); },
  });
}
export function useDeletePo() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.pos.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["pos"] }) });
}

/* ---- Inventory: movements, warehouse CRUD, stock transactions ---- */
export const useMovements = (filters?: Query) =>
  useQuery({ queryKey: qk.movements(filters), queryFn: () => api.inventory.movements(filters), placeholderData: keepPreviousData });

function invalidateInventory(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["inventory"] });
  qc.invalidateQueries({ queryKey: ["movements"] });
  qc.invalidateQueries({ queryKey: qk.warehouses });
  qc.invalidateQueries({ queryKey: qk.alerts });
}

export function useSaveWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      id ? api.inventory.updateWarehouse(id, body) : api.inventory.createWarehouse(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.warehouses }),
  });
}
export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.inventory.deleteWarehouse(id), onSuccess: () => qc.invalidateQueries({ queryKey: qk.warehouses }) });
}
export function useOpeningStock() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => api.inventory.opening(body), onSuccess: () => invalidateInventory(qc) });
}
export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => api.inventory.adjust(body), onSuccess: () => invalidateInventory(qc) });
}
export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: Record<string, unknown>) => api.inventory.transfer(body), onSuccess: () => invalidateInventory(qc) });
}

/* ---- Reports & Analytics ---- */
export const usePurchaseValueReport = () =>
  useQuery({ queryKey: ["reports", "purchase-value"], queryFn: () => api.reports.purchaseValue() });
export const useVendorPerformanceReport = () =>
  useQuery({ queryKey: ["reports", "vendor-performance"], queryFn: () => api.reports.vendorPerformance() });
export const useStockValueReport = () =>
  useQuery({ queryKey: ["reports", "stock-value"], queryFn: () => api.reports.stockValue() });
export const useVendorSpendReport = () =>
  useQuery({ queryKey: ["reports", "vendor-spend"], queryFn: () => api.reports.vendorSpend() });
export const useProjectCostReport = () =>
  useQuery({ queryKey: ["reports", "project-cost"], queryFn: () => api.reports.projectCost() });
