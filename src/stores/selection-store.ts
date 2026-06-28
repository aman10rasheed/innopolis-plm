"use client";

import { create } from "zustand";

/**
 * Shared selection state powering the bidirectional BOM <-> 3D linkage
 * in the CAD viewer, plus hover sync.
 */
interface SelectionState {
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  hiddenComponentIds: Set<string>;
  isolatedComponentId: string | null;
  setSelected: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  toggleHidden: (id: string) => void;
  setIsolated: (id: string | null) => void;
  showAll: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedComponentId: null,
  hoveredComponentId: null,
  hiddenComponentIds: new Set(),
  isolatedComponentId: null,
  setSelected: (id) => set({ selectedComponentId: id }),
  setHovered: (id) => set({ hoveredComponentId: id }),
  toggleHidden: (id) =>
    set((s) => {
      const next = new Set(s.hiddenComponentIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { hiddenComponentIds: next };
    }),
  setIsolated: (id) => set((s) => ({ isolatedComponentId: s.isolatedComponentId === id ? null : id })),
  showAll: () => set({ hiddenComponentIds: new Set(), isolatedComponentId: null }),
}));
