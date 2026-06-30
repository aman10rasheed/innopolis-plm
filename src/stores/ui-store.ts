"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  createEcoOpen: boolean;
  createPoOpen: boolean;
  createBomOpen: boolean;
  createVendorOpen: boolean;
  createRevisionOpen: boolean;
  createDocumentOpen: boolean;
  createWorkOrderOpen: boolean;
  createReportOpen: boolean;
  createCountOpen: boolean;
  createWarehouseOpen: boolean;
  bomAddComponentOpen: boolean;
  cadImportOpen: boolean;
  // CAD model currently shown in the viewer (set after an import)
  cadModel: { name: string; format: string } | null;
  // Pinned / favorites
  pinnedProjects: string[];
  // Actions
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
  setCreateEcoOpen: (v: boolean) => void;
  setCreatePoOpen: (v: boolean) => void;
  setCreateBomOpen: (v: boolean) => void;
  setCreateVendorOpen: (v: boolean) => void;
  setCreateRevisionOpen: (v: boolean) => void;
  setCreateDocumentOpen: (v: boolean) => void;
  setCreateWorkOrderOpen: (v: boolean) => void;
  setCreateReportOpen: (v: boolean) => void;
  setCreateCountOpen: (v: boolean) => void;
  setCreateWarehouseOpen: (v: boolean) => void;
  setBomAddComponentOpen: (v: boolean) => void;
  setCadImportOpen: (v: boolean) => void;
  setCadModel: (m: { name: string; format: string } | null) => void;
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
      createEcoOpen: false,
      createPoOpen: false,
      createBomOpen: false,
      createVendorOpen: false,
      createRevisionOpen: false,
      createDocumentOpen: false,
      createWorkOrderOpen: false,
      createReportOpen: false,
      createCountOpen: false,
      createWarehouseOpen: false,
      bomAddComponentOpen: false,
      cadImportOpen: false,
      cadModel: null,
      pinnedProjects: ["PR-1", "PR-2", "PR-3"],

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
      setCreatePartOpen: (v) => set({ createPartOpen: v }),
      setCreateProductOpen: (v) => set({ createProductOpen: v }),
      setCreateEcoOpen: (v) => set({ createEcoOpen: v }),
      setCreatePoOpen: (v) => set({ createPoOpen: v }),
      setCreateBomOpen: (v) => set({ createBomOpen: v }),
      setCreateVendorOpen: (v) => set({ createVendorOpen: v }),
      setCreateRevisionOpen: (v) => set({ createRevisionOpen: v }),
      setCreateDocumentOpen: (v) => set({ createDocumentOpen: v }),
      setCreateWorkOrderOpen: (v) => set({ createWorkOrderOpen: v }),
      setCreateReportOpen: (v) => set({ createReportOpen: v }),
      setCreateCountOpen: (v) => set({ createCountOpen: v }),
      setCreateWarehouseOpen: (v) => set({ createWarehouseOpen: v }),
      setBomAddComponentOpen: (v) => set({ bomAddComponentOpen: v }),
      setCadImportOpen: (v) => set({ cadImportOpen: v }),
      setCadModel: (m) => set({ cadModel: m }),
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
