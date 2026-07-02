"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ensureCanCreate, type CreateAction } from "@/auth/permissions";

/**
 * RBAC gate for create dialogs: opening (v = true) is blocked with an access
 * toast unless the signed-in role may create the entity; closing always works.
 * Guarding here covers every entry point (sidebar Create menu, ⌘K, page buttons).
 */
const guarded = (action: CreateAction, open: (v: boolean) => void) => (v: boolean) => {
  if (v && !ensureCanCreate(action)) return;
  open(v);
};

interface UIState {
  // Layout
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  inspectorWidth: number;
  sidebarWidth: number;
  aiOpen: boolean;
  // Overlays (not persisted)
  commandOpen: boolean;
  searchOpen: boolean;
  notificationsOpen: boolean;
  createPartOpen: boolean;
  createProductOpen: boolean;
  createPoOpen: boolean;
  createBomOpen: boolean;
  createVendorOpen: boolean;
  createReportOpen: boolean;
  createCountOpen: boolean;
  createWarehouseOpen: boolean;
  bomAddComponentOpen: boolean;
  // Pinned / favorites
  pinnedProjects: string[];
  // Bumped whenever the in-memory mock db is mutated outside React (e.g. CSV import),
  // so views that read db() directly can re-render.
  dataRev: number;
  // Reactive per-board quick filters (key → selected value, "" = All).
  boardFilters: Record<string, string>;
  // Actions
  bumpDataRev: () => void;
  setBoardFilter: (key: string, value: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleInspector: () => void;
  setInspectorOpen: (v: boolean) => void;
  setInspectorWidth: (w: number) => void;
  setSidebarWidth: (w: number) => void;
  toggleAi: () => void;
  setCommandOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
  setCreatePartOpen: (v: boolean) => void;
  setCreateProductOpen: (v: boolean) => void;
  setCreatePoOpen: (v: boolean) => void;
  setCreateBomOpen: (v: boolean) => void;
  setCreateVendorOpen: (v: boolean) => void;
  setCreateReportOpen: (v: boolean) => void;
  setCreateCountOpen: (v: boolean) => void;
  setCreateWarehouseOpen: (v: boolean) => void;
  setBomAddComponentOpen: (v: boolean) => void;
  togglePin: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      inspectorOpen: false,
      inspectorWidth: 340,
      sidebarWidth: 248,
      aiOpen: false,
      commandOpen: false,
      searchOpen: false,
      notificationsOpen: false,
      createPartOpen: false,
      createProductOpen: false,
      createPoOpen: false,
      createBomOpen: false,
      createVendorOpen: false,
      createReportOpen: false,
      createCountOpen: false,
      createWarehouseOpen: false,
      bomAddComponentOpen: false,
      pinnedProjects: ["PR-1", "PR-2", "PR-3"],
      dataRev: 0,
      boardFilters: {},

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      setInspectorOpen: (v) => set({ inspectorOpen: v }),
      setInspectorWidth: (w) =>
        set({ inspectorWidth: Math.min(560, Math.max(280, w)) }),
      setSidebarWidth: (w) =>
        set({ sidebarWidth: Math.min(340, Math.max(208, w)) }),
      toggleAi: () => set((s) => ({ aiOpen: !s.aiOpen })),
      setCommandOpen: (v) => set({ commandOpen: v }),
      setSearchOpen: (v) => set({ searchOpen: v }),
      setNotificationsOpen: (v) => set({ notificationsOpen: v }),
      setCreatePartOpen: guarded("material", (v) => set({ createPartOpen: v })),
      setCreateProductOpen: guarded("project", (v) => set({ createProductOpen: v })),
      setCreatePoOpen: guarded("purchaseOrder", (v) => set({ createPoOpen: v })),
      setCreateBomOpen: guarded("bom", (v) => set({ createBomOpen: v })),
      setCreateVendorOpen: guarded("vendor", (v) => set({ createVendorOpen: v })),
      setCreateReportOpen: guarded("report", (v) => set({ createReportOpen: v })),
      setCreateCountOpen: guarded("stockCount", (v) => set({ createCountOpen: v })),
      setCreateWarehouseOpen: guarded("warehouse", (v) => set({ createWarehouseOpen: v })),
      setBomAddComponentOpen: guarded("bomLine", (v) => set({ bomAddComponentOpen: v })),
      bumpDataRev: () => set((s) => ({ dataRev: s.dataRev + 1 })),
      setBoardFilter: (key, value) => set((s) => ({ boardFilters: { ...s.boardFilters, [key]: value } })),
      togglePin: (id) =>
        set((s) => ({
          pinnedProjects: s.pinnedProjects.includes(id)
            ? s.pinnedProjects.filter((x) => x !== id)
            : [...s.pinnedProjects, id],
        })),
    }),
    {
      name: "innopolis-ui",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        inspectorOpen: s.inspectorOpen,
        inspectorWidth: s.inspectorWidth,
        sidebarWidth: s.sidebarWidth,
        pinnedProjects: s.pinnedProjects,
      }),
    },
  ),
);
