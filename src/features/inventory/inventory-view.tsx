"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  PackagePlus,
  X,
  Boxes,
  Factory,
  Truck,
  Building,
  Filter,
  MapPin,
  Plus,
} from "lucide-react";
import { db } from "@/mock/db";
import type { InventoryRecord, Warehouse, Availability } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaTrend } from "@/components/shared/charts";
import { AVAILABILITY_VARIANT } from "@/constants/status";
import { cn, formatCurrency, formatNumber, formatCompactCurrency } from "@/lib/utils";
import { monthlySeries } from "@/mock/series";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/components/ui/toast";

const WH_ICON: Record<Warehouse["type"], typeof WarehouseIcon> = {
  Distribution: WarehouseIcon,
  Manufacturing: Factory,
  Buffer: Building,
  Transit: Truck,
};

const STATUS_FILTERS: ("all" | Availability)[] = [
  "all",
  "In Stock",
  "Low Stock",
  "Backorder",
  "Out of Stock",
];

export function InventoryView() {
  const warehouses = db().warehouses;
  const inventory = db().inventory;

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | Availability>("all");
  const [activeWh, setActiveWh] = React.useState<string | null>(null);
  const [detailWh, setDetailWh] = React.useState<Warehouse | null>(null);
  const [reordered, setReordered] = React.useState<Set<string>>(() => new Set());
  const setCreateWarehouseOpen = useUIStore((s) => s.setCreateWarehouseOpen);

  const reorder = (ids: string[], label: string) => {
    const fresh = ids.filter((id) => !reordered.has(id));
    if (!fresh.length) {
      toast.info("Already queued", "Those lines are already on a replenishment order");
      return;
    }
    setReordered((prev) => {
      const next = new Set(prev);
      fresh.forEach((id) => next.add(id));
      return next;
    });
    toast.success("Replenishment queued", label);
  };

  const series = React.useMemo(() => {
    const incoming = monthlySeries(101, 4200, 60, 900);
    const outgoing = monthlySeries(202, 4000, 40, 800);
    return incoming.map((d, i) => ({
      label: d.label,
      incoming: d.value,
      outgoing: outgoing[i]!.value,
    }));
  }, []);

  const alerts = React.useMemo(
    () =>
      inventory
        .filter((r) => r.status !== "In Stock")
        .sort((a, b) => a.available - b.available),
    [inventory],
  );

  const filtered = React.useMemo(
    () =>
      inventory.filter(
        (r) =>
          (!activeWh || r.warehouseId === activeWh) &&
          (status === "all" || r.status === status) &&
          (!query ||
            r.partName.toLowerCase().includes(query.toLowerCase()) ||
            r.partNumber.toLowerCase().includes(query.toLowerCase())),
      ),
    [inventory, activeWh, status, query],
  );

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Warehouses */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Warehouses
            </h2>
            <div className="flex items-center gap-1.5">
              {activeWh && (
                <Button variant="ghost" size="xs" onClick={() => setActiveWh(null)}>
                  <X className="size-3.5" /> Clear filter
                </Button>
              )}
              <Button variant="outline" size="xs" onClick={() => setCreateWarehouseOpen(true)}>
                <Plus className="size-3.5" /> Add warehouse
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {warehouses.map((w) => {
              const Icon = WH_ICON[w.type];
              const selected = activeWh === w.id;
              return (
                <Card
                  key={w.id}
                  interactive
                  onClick={() => setDetailWh(w)}
                  className={cn("group p-4", selected && "ring-2 ring-primary")}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{w.name}</p>
                      <p className="font-mono text-2xs text-muted-foreground">{w.code} · {w.city}, {w.country}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveWh((cur) => (cur === w.id ? null : w.id));
                      }}
                      title="Filter stock table to this warehouse"
                      className={cn(
                        "rounded-md p-1 transition-colors",
                        selected ? "text-primary" : "text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100",
                      )}
                    >
                      <Filter className="size-3.5" />
                    </button>
                    <Badge variant="outline">{w.type}</Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-2xs">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium tabular">{w.capacityPct}%</span>
                    </div>
                    <Progress
                      value={w.capacityPct}
                      className="h-1.5"
                      indicatorClassName={w.capacityPct > 90 ? "bg-destructive" : w.capacityPct > 75 ? "bg-warning" : "bg-success"}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                    <div>
                      <p className="text-2xs text-muted-foreground">SKUs</p>
                      <p className="text-[13px] font-semibold tabular">{formatNumber(w.skuCount)}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-muted-foreground">Value</p>
                      <p className="text-[13px] font-semibold tabular">{formatCompactCurrency(w.stockValue)}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-muted-foreground">Low stock</p>
                      <p className={cn("text-[13px] font-semibold tabular", w.lowStockItems > 0 ? "text-destructive" : "text-success")}>
                        {w.lowStockItems}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Chart */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold">Inbound vs. outbound flow</p>
              <p className="text-2xs text-muted-foreground">Units moved — trailing 12 months</p>
            </div>
            <div className="flex items-center gap-3 text-2xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Incoming</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" /> Outgoing</span>
            </div>
          </div>
          <AreaTrend data={series} dataKey="incoming" secondKey="outgoing" height={180} showAxis />
        </section>

        {/* Low inventory alerts */}
        {alerts.length > 0 && (
          <section className="rounded-xl border border-warning/40 bg-warning/[0.06] p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              <h2 className="text-[13px] font-semibold">Low inventory alerts</h2>
              <Badge variant="warning">{alerts.length}</Badge>
              <Button
                variant="outline"
                size="xs"
                className="ml-auto"
                onClick={() => reorder(alerts.map((a) => a.id), `${alerts.length} replenishment line(s) queued`)}
              >
                <PackagePlus className="size-3.5" /> Reorder all
              </Button>
            </div>
            <div className="space-y-1.5">
              {alerts.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{r.partName}</p>
                    <p className="font-mono text-2xs text-muted-foreground">{r.partNumber} · {r.warehouseCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xs text-muted-foreground">Available</p>
                    <p className="text-[13px] font-semibold tabular text-destructive">{formatNumber(r.available)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xs text-muted-foreground">Reorder pt</p>
                    <p className="text-[13px] font-semibold tabular">{formatNumber(r.reorderPoint)}</p>
                  </div>
                  <Badge variant={AVAILABILITY_VARIANT[r.status]}>{r.status}</Badge>
                  <Button
                    size="xs"
                    variant={reordered.has(r.id) ? "outline" : "default"}
                    disabled={reordered.has(r.id)}
                    onClick={() => reorder([r.id], `${r.partNumber} → ${r.warehouseCode}`)}
                  >
                    {reordered.has(r.id) ? "Queued" : "Reorder"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stock table */}
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Stock on hand
            </h2>
            {activeWh && (
              <Badge variant="info">
                {db().warehouses.find((w) => w.id === activeWh)?.code}
              </Badge>
            )}
            <div className="relative ml-auto w-56">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stock…"
                className="h-8 pl-8"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as "all" | Availability)}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr_1fr] items-center gap-2 border-b border-border bg-surface/80 px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Part</span>
              <span>Warehouse</span>
              <span className="text-right">On hand</span>
              <span className="text-right">Reserved</span>
              <span className="text-right">Available</span>
              <span className="text-right">Incoming</span>
              <span className="text-right">Reorder pt</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-border bg-surface/30">
              {filtered.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-[13px] text-muted-foreground">
                  No stock records match these filters.
                </div>
              ) : (
                filtered.map((r) => {
                  const below = r.available < r.reorderPoint;
                  const critical = r.available <= r.reorderPoint * 0.5;
                  return (
                    <div
                      key={r.id}
                      className="grid grid-cols-[2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr_1fr] items-center gap-2 px-4 py-2.5 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Boxes className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{r.partName}</p>
                          <p className="font-mono text-2xs text-muted-foreground">{r.partNumber}</p>
                        </div>
                      </div>
                      <span className="font-mono text-2xs text-muted-foreground">{r.warehouseCode}</span>
                      <span className="text-right text-[13px] tabular">{formatNumber(r.onHand)}</span>
                      <span className="text-right text-[13px] tabular text-muted-foreground">{formatNumber(r.reserved)}</span>
                      <span
                        className={cn(
                          "text-right text-[13px] font-semibold tabular",
                          critical ? "text-destructive" : below ? "text-warning" : "text-foreground",
                        )}
                      >
                        {formatNumber(r.available)}
                      </span>
                      <span className="text-right text-[13px] tabular text-info">
                        {r.incoming > 0 ? `+${formatNumber(r.incoming)}` : "—"}
                      </span>
                      <span className="text-right text-[13px] tabular text-muted-foreground">{formatNumber(r.reorderPoint)}</span>
                      <Badge variant={AVAILABILITY_VARIANT[r.status]}>{r.status}</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      <WarehouseDetailDrawer
        warehouse={detailWh}
        onClose={() => setDetailWh(null)}
        onFilter={(id) => {
          setActiveWh(id);
          setDetailWh(null);
        }}
      />
    </ScrollArea>
  );
}

function WarehouseDetailDrawer({
  warehouse,
  onClose,
  onFilter,
}: {
  warehouse: Warehouse | null;
  onClose: () => void;
  onFilter: (id: string) => void;
}) {
  const records = React.useMemo(
    () => (warehouse ? db().inventory.filter((r) => r.warehouseId === warehouse.id) : []),
    [warehouse],
  );
  const lowStock = records.filter((r) => r.status !== "In Stock").length;
  const stockValue = records.reduce((s, r) => s + r.onHand * r.unitCost, 0);
  const incoming = records.reduce((s, r) => s + r.incoming, 0);

  return (
    <AnimatePresence>
      {warehouse && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed right-0 top-0 z-[141] flex h-full w-[480px] flex-col border-l border-border bg-surface-overlay shadow-lg"
          >
            <div className="flex items-start justify-between border-b border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {React.createElement(WH_ICON[warehouse.type], { className: "size-5" })}
                </div>
                <div>
                  <h2 className="text-base font-semibold">{warehouse.name}</h2>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {warehouse.code} · {warehouse.city}, {warehouse.country}
                  </p>
                  <Badge variant="outline" className="mt-1.5">{warehouse.type}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
            </div>

            <div className="border-b border-border p-4">
              <div className="flex justify-between text-2xs">
                <span className="text-muted-foreground">Capacity utilization</span>
                <span className="font-medium tabular">{warehouse.capacityPct}%</span>
              </div>
              <Progress
                value={warehouse.capacityPct}
                className="mt-1.5 h-2"
                indicatorClassName={warehouse.capacityPct > 90 ? "bg-destructive" : warehouse.capacityPct > 75 ? "bg-warning" : "bg-success"}
              />
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden border-b border-border bg-border">
              {[
                ["SKUs", formatNumber(warehouse.skuCount)],
                ["Stock value", formatCompactCurrency(warehouse.stockValue)],
                ["Records here", formatNumber(records.length)],
                ["Low stock", String(lowStock)],
                ["On-hand value", formatCompactCurrency(stockValue)],
                ["Incoming units", formatNumber(incoming)],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface p-3">
                  <p className="text-2xs text-muted-foreground">{k}</p>
                  <p className="mt-0.5 text-[13px] font-semibold tabular">{v}</p>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stock in this warehouse
              </p>
              {records.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No stock records here.</p>
              ) : (
                <div className="space-y-1.5">
                  {records.slice(0, 40).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Boxes className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{r.partName}</p>
                        <p className="font-mono text-2xs text-muted-foreground">{r.partNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xs text-muted-foreground">Available</p>
                        <p className="text-[13px] font-semibold tabular">{formatNumber(r.available)}</p>
                      </div>
                      <Badge variant={AVAILABILITY_VARIANT[r.status]}>{r.status}</Badge>
                    </div>
                  ))}
                  {records.length > 40 && (
                    <p className="pt-1 text-center text-2xs text-muted-foreground">
                      +{formatNumber(records.length - 40)} more records
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <Button className="w-full" onClick={() => onFilter(warehouse.id)}>
                <Filter className="size-4" /> Show in stock table
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
