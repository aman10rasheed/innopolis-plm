"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type GroupingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Search,
  SlidersHorizontal,
  Columns3,
  Download,
  Group,
  ChevronRight,
  X,
  Pencil,
  Eye,
  Copy,
  Trash2,
  GitCompare,
  Network,
  Check,
  Filter,
} from "lucide-react";
import { partColumns } from "./columns";
import type { Part } from "@/types";
import { db } from "@/mock/db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { PartDetailDrawer } from "./part-detail-drawer";
import { CreatePartDialog } from "./create-part-dialog";
import { EditPartDialog } from "./edit-part-dialog";
import { downloadCsv, copyToClipboard } from "@/lib/export";
import { getSupplier } from "@/mock/db";
import { useUIStore } from "@/stores/ui-store";

const CATEGORIES = [...new Set(db().parts.map((p) => p.category))];
const LIFECYCLES = [...new Set(db().parts.map((p) => p.lifecycle))];
const AVAILABILITIES = [...new Set(db().parts.map((p) => p.availability))];

function FacetFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-dashed">
          <Filter className="size-3.5" />
          {label}
          {selected.length > 0 && (
            <>
              <span className="mx-0.5 h-3.5 w-px bg-border" />
              <Badge variant="default" className="rounded px-1">
                {selected.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <div className="max-h-72 overflow-y-auto">
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <div
                key={opt}
                role="button"
                tabIndex={0}
                onClick={() =>
                  onChange(
                    checked ? selected.filter((s) => s !== opt) : [...selected, opt],
                  )
                }
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span className="flex-1 text-left">{opt}</span>
              </div>
            );
          })}
        </div>
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              onClick={() => onChange([])}
              className="w-full rounded-md px-2 py-1.5 text-center text-xs text-muted-foreground hover:bg-accent"
            >
              Clear filter
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function PartsTable() {
  const { createPartOpen, setCreatePartOpen } = useUIStore();
  const dataRev = useUIStore((s) => s.dataRev);
  const [extraParts, setExtraParts] = React.useState<Part[]>([]);
  const [editPart, setEditPart] = React.useState<Part | null>(null);
  const [archivedIds, setArchivedIds] = React.useState<Set<string>>(() => new Set());
  // Bumped after editing a seeded part (mutated in place) to force the memo to recompute.
  const [rev, setRev] = React.useState(0);
  const data = React.useMemo(
    () => [...extraParts, ...db().parts].filter((p) => !archivedIds.has(p.id)),
    [extraParts, rev, archivedIds, dataRev],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [activePart, setActivePart] = React.useState<Part | null>(null);
  const [density, setDensity] = React.useState<"comfortable" | "compact">("comfortable");

  const catFilter = (columnFilters.find((f) => f.id === "category")?.value as string[]) ?? [];
  const lifeFilter = (columnFilters.find((f) => f.id === "lifecycle")?.value as string[]) ?? [];
  const availFilter = (columnFilters.find((f) => f.id === "availability")?.value as string[]) ?? [];

  const setFilter = (id: string, value: string[]) =>
    setColumnFilters((prev) => {
      const rest = prev.filter((f) => f.id !== id);
      return value.length ? [...rest, { id, value }] : rest;
    });

  const table = useReactTable({
    data,
    columns: partColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter, grouping },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    globalFilterFn: (row, _id, value) => {
      const p = row.original;
      const t = String(value).toLowerCase();
      return (
        p.name.toLowerCase().includes(t) ||
        p.partNumber.toLowerCase().includes(t) ||
        p.material.toLowerCase().includes(t)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableRowSelection: true,
    // Don't let the table schedule async state-resets on mount (they fire a
    // microtask setState before mount completes → React 19 dev warning).
    autoResetExpanded: false,
    autoResetPageIndex: false,
    autoResetAll: false,
  });

  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const rowHeight = density === "compact" ? 40 : 52;
  const TABLE_MIN_WIDTH = 1180;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const selectedCount = Object.keys(rowSelection).length;
  const activeFilterCount = catFilter.length + lifeFilter.length + availFilter.length;

  const exportRows = (parts: Part[], label: string) => {
    if (!parts.length) {
      toast.info("Nothing to export", "No parts match the current view");
      return;
    }
    downloadCsv(
      parts,
      [
        { header: "Part Number", value: (p) => p.partNumber },
        { header: "Name", value: (p) => p.name },
        { header: "Category", value: (p) => p.category },
        { header: "Material", value: (p) => p.material },
        { header: "Lifecycle", value: (p) => p.lifecycle },
        { header: "Revision", value: (p) => p.revision },
        { header: "Sourcing", value: (p) => p.sourcing },
        { header: "Unit Cost", value: (p) => p.unitCost },
        { header: "Lead Time (days)", value: (p) => p.leadTimeDays },
        { header: "Vendor", value: (p) => getSupplier(p.supplierId)?.name ?? "" },
        { header: "Stock Qty", value: (p) => p.stockQty },
        { header: "UoM", value: (p) => p.uom },
      ],
      `material-master-${label}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("Export complete", `${parts.length} parts downloaded as CSV`);
  };

  const exportCsv = () => exportRows(table.getFilteredRowModel().rows.map((r) => r.original), "filtered");

  const selectedParts = () => table.getSelectedRowModel().rows.map((r) => r.original);

  const duplicatePart = (part: Part) => {
    const clone: Part = {
      ...part,
      id: `P-dup-${Date.now()}`,
      partNumber: `${part.partNumber}-COPY`,
      name: `${part.name} (copy)`,
      lifecycle: "In Design",
      revision: "A",
      stockQty: 0,
      whereUsedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExtraParts((prev) => [clone, ...prev]);
    if (parentRef.current) parentRef.current.scrollTo({ top: 0 });
    toast.success("Duplicated", `${part.partNumber} cloned as ${clone.partNumber}`);
  };

  const archivePart = (part: Part) => {
    setArchivedIds((prev) => new Set(prev).add(part.id));
    setRowSelection({});
    toast({
      title: "Archived",
      description: `${part.partNumber} removed from the active master`,
      variant: "success",
      action: {
        label: "Undo",
        onClick: () =>
          setArchivedIds((prev) => {
            const next = new Set(prev);
            next.delete(part.id);
            return next;
          }),
      },
    });
  };

  const promoteSelected = () => {
    const sel = selectedParts();
    const ids = new Set(sel.map((p) => p.id));
    setExtraParts((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, lifecycle: "Released" as const } : p)));
    // Seeded parts are mutated in place; bump rev to re-render.
    sel.forEach((p) => {
      if (!extraParts.some((e) => e.id === p.id)) p.lifecycle = "Released";
    });
    setRev((r) => r + 1);
    setRowSelection({});
    toast.success("Lifecycle promoted", `${sel.length} part(s) moved to Released`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search parts…"
            className="h-8 pl-8"
          />
        </div>

        <FacetFilter label="Category" options={CATEGORIES} selected={catFilter} onChange={(v) => setFilter("category", v)} />
        <FacetFilter label="Lifecycle" options={LIFECYCLES} selected={lifeFilter} onChange={(v) => setFilter("lifecycle", v)} />
        <FacetFilter label="Availability" options={AVAILABILITIES} selected={availFilter} onChange={(v) => setFilter("availability", v)} />

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => setColumnFilters([])}>
            Reset <X className="size-3.5" />
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Group by */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Group className="size-3.5" />
                {grouping.length ? `Grouped: ${grouping[0]}` : "Group"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Group by</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={grouping[0] ?? ""}
                onValueChange={(v) => setGrouping(v ? [v] : [])}
              >
                <DropdownMenuRadioItem value="">None</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="category">Category</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="lifecycle">Lifecycle</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="availability">Availability</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column chooser */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Columns3 className="size-3.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={c.getIsVisible()}
                    onCheckedChange={(v) => c.toggleVisibility(!!v)}
                    onSelect={(e) => e.preventDefault()}
                    className="capitalize"
                  >
                    {c.id.replace(/([A-Z])/g, " $1").replace("Id", "")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <SlidersHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Density</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={density} onValueChange={(v) => setDensity(v as any)}>
                <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Header */}
      <div ref={headerRef} className="overflow-hidden border-b border-border bg-surface-sunken/40">
        <div className="flex items-center px-4" style={{ minWidth: TABLE_MIN_WIDTH }}>
          {table.getHeaderGroups()[0]?.headers.map((header) => (
            <div
              key={header.id}
              style={{ width: header.getSize(), flex: header.column.id === "partNumber" ? "1 0 auto" : "0 0 auto" }}
              className="flex h-9 items-center px-2 first:pl-0"
            >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))}
        </div>
      </div>

      {/* Body (virtualized) */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        onScroll={(e) => {
          if (headerRef.current) headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }}
      >
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative", minWidth: TABLE_MIN_WIDTH }}>
          {virtualizer.getVirtualItems().map((vRow) => {
            const row = rows[vRow.index]!;
            if (row.getIsGrouped()) {
              return (
                <div
                  key={row.id}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: rowHeight, transform: `translateY(${vRow.start}px)` }}
                  className="flex items-center gap-2 border-b border-border bg-surface-sunken/60 px-4 text-[13px] font-semibold"
                >
                  <button onClick={row.getToggleExpandedHandler()} className="flex items-center gap-1.5">
                    <ChevronRight className={cn("size-4 transition-transform", row.getIsExpanded() && "rotate-90")} />
                    <span className="capitalize">{String(row.groupingValue)}</span>
                  </button>
                  <Badge variant="muted">{row.subRows.length}</Badge>
                </div>
              );
            }
            return (
              <ContextMenu key={row.id}>
                <ContextMenuTrigger asChild>
                  <div
                    onClick={() => setActivePart(row.original)}
                    data-selected={row.getIsSelected()}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: rowHeight, transform: `translateY(${vRow.start}px)` }}
                    className={cn(
                      "row-hover flex cursor-pointer items-center border-b border-border/60 px-4 data-[selected=true]:bg-primary/[0.07]",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        style={{ width: cell.column.getSize(), flex: cell.column.id === "partNumber" ? "1 0 auto" : "0 0 auto" }}
                        className="truncate px-2 first:pl-0"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                  <ContextMenuItem onClick={() => setActivePart(row.original)}>
                    <Eye /> Open details
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setEditPart(row.original)}>
                    <Pencil /> Edit material
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setActivePart(row.original)}>
                    <Network /> Where used
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => duplicatePart(row.original)}>
                    <Copy /> Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => { copyToClipboard(row.original.partNumber); toast.success("Copied", row.original.partNumber); }}>
                    <GitCompare /> Copy part number
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem destructive onClick={() => archivePart(row.original)}>
                    <Trash2 /> Archive
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-surface/40 px-4 py-2 text-2xs text-muted-foreground">
        <span>
          {table.getFilteredRowModel().rows.length.toLocaleString()} of {data.length.toLocaleString()} materials
          {activeFilterCount > 0 && ` · ${activeFilterCount} filters`}
        </span>
        <span>
          Total cost basis:{" "}
          <span className="font-medium text-foreground tabular">
            ${table.getFilteredRowModel().rows.reduce((s, r) => s + r.original.unitCost, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </span>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-surface-overlay/95 px-3 py-2 shadow-lg backdrop-blur-xl">
            <span className="px-1 text-[13px] font-medium">{selectedCount} selected</span>
            <div className="h-5 w-px bg-border" />
            <Button size="xs" variant="ghost" onClick={() => { const s = selectedParts(); if (s[0]) setEditPart(s[0]); }}>
              <Pencil className="size-3.5" /> Edit
            </Button>
            <Button size="xs" variant="ghost" onClick={() => exportRows(selectedParts(), "selection")}>
              <Download className="size-3.5" /> Export
            </Button>
            <Button size="xs" variant="ghost" onClick={promoteSelected}>
              <Check className="size-3.5" /> Promote
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button size="xs" variant="ghost" onClick={() => setRowSelection({})}>
              <X className="size-3.5" /> Clear
            </Button>
          </div>
        </div>
      )}

      <PartDetailDrawer
        part={activePart}
        onClose={() => setActivePart(null)}
        onEdit={(part) => {
          setActivePart(null);
          setEditPart(part);
        }}
      />

      <CreatePartDialog
        open={createPartOpen}
        onOpenChange={setCreatePartOpen}
        onCreate={(part) => {
          setExtraParts((prev) => [part, ...prev]);
          if (parentRef.current) parentRef.current.scrollTo({ top: 0 });
        }}
      />

      <EditPartDialog
        part={editPart}
        onOpenChange={(open) => !open && setEditPart(null)}
        onSave={(patch) => {
          if (!editPart) return;
          const inExtra = extraParts.some((p) => p.id === editPart.id);
          if (inExtra) {
            setExtraParts((prev) => prev.map((p) => (p.id === editPart.id ? { ...p, ...patch } : p)));
          } else {
            // Seeded parts live in the mock db array — patch in place, then force a re-render.
            Object.assign(editPart, patch);
            setRev((r) => r + 1);
          }
        }}
      />
    </div>
  );
}
