"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import type { Part } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Thumbnail } from "@/components/shared/thumbnail";
import { getSupplier } from "@/mock/db";
import { formatCurrency, cn } from "@/lib/utils";
import { LIFECYCLE_VARIANT, AVAILABILITY_VARIANT } from "@/constants/status";

function SortHeader({ column, label, align = "left" }: { column: any; label: string; align?: "left" | "right" }) {
  return (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={cn(
        "flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
        align === "right" && "ml-auto flex-row-reverse",
      )}
    >
      {label}
      <ArrowUpDown className={cn("size-3", column.getIsSorted() ? "text-primary" : "opacity-40")} />
    </button>
  );
}

export const partColumns: ColumnDef<Part>[] = [
  {
    id: "select",
    size: 36,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "partNumber",
    size: 230,
    header: ({ column }) => <SortHeader column={column} label="Part" />,
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <Thumbnail hue={p.thumbnailHue} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-foreground">{p.name}</span>
              {p.lifecycle === "Obsolete" && (
                <AlertTriangle className="size-3 shrink-0 text-destructive" />
              )}
            </div>
            <span className="font-mono text-2xs text-muted-foreground">{p.partNumber}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    size: 130,
    header: ({ column }) => <SortHeader column={column} label="Category" />,
    cell: ({ getValue }) => (
      <Badge variant="muted" className="font-normal">
        {getValue<string>()}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) =>
      value.length === 0 || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "material",
    size: 150,
    header: ({ column }) => <SortHeader column={column} label="Material" />,
    cell: ({ getValue }) => (
      <span className="truncate text-[13px] text-muted-foreground">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "weightKg",
    size: 90,
    header: ({ column }) => <SortHeader column={column} label="Weight" align="right" />,
    cell: ({ getValue }) => (
      <span className="block text-right text-[13px] tabular text-muted-foreground">
        {getValue<number>().toFixed(3)} kg
      </span>
    ),
  },
  {
    accessorKey: "revision",
    size: 70,
    header: "Rev",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="inline-flex h-5 items-center rounded border border-border px-1.5 font-mono text-2xs">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "supplierId",
    size: 150,
    header: ({ column }) => <SortHeader column={column} label="Supplier" />,
    cell: ({ getValue }) => {
      const s = getSupplier(getValue<string>());
      return <span className="truncate text-[13px] text-muted-foreground">{s?.name ?? "—"}</span>;
    },
  },
  {
    accessorKey: "lifecycle",
    size: 110,
    header: ({ column }) => <SortHeader column={column} label="Lifecycle" />,
    cell: ({ getValue }) => {
      const v = getValue<Part["lifecycle"]>();
      return <Badge variant={LIFECYCLE_VARIANT[v]}>{v}</Badge>;
    },
    filterFn: (row, id, value: string[]) =>
      value.length === 0 || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "unitCost",
    size: 100,
    header: ({ column }) => <SortHeader column={column} label="Unit Cost" align="right" />,
    cell: ({ getValue }) => (
      <span className="block text-right text-[13px] font-medium tabular">
        {formatCurrency(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "leadTimeDays",
    size: 100,
    header: ({ column }) => <SortHeader column={column} label="Lead Time" align="right" />,
    cell: ({ getValue }) => {
      const v = getValue<number>();
      return (
        <span
          className={cn(
            "block text-right text-[13px] tabular",
            v > 45 ? "text-warning" : "text-muted-foreground",
          )}
        >
          {v} d
        </span>
      );
    },
  },
  {
    accessorKey: "availability",
    size: 120,
    header: ({ column }) => <SortHeader column={column} label="Availability" />,
    cell: ({ getValue }) => {
      const v = getValue<Part["availability"]>();
      return <Badge variant={AVAILABILITY_VARIANT[v]}>{v}</Badge>;
    },
    filterFn: (row, id, value: string[]) =>
      value.length === 0 || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "whereUsedCount",
    size: 90,
    header: ({ column }) => <SortHeader column={column} label="Used In" align="right" />,
    cell: ({ getValue }) => (
      <span className="block text-right text-[13px] tabular text-muted-foreground">
        {getValue<number>()}×
      </span>
    ),
  },
];
