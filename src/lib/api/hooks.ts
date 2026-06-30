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
import type { ApiPartInput } from "./types";

export const qk = {
  masters: ["masters"] as const,
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
  useQuery({ queryKey: qk.comparison(id), queryFn: () => api.rfqs.comparison(id), enabled: !!id });
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
