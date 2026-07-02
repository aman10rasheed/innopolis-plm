"use client";

import { Warehouse, Boxes, AlertTriangle, Truck, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { InventoryView } from "@/features/inventory/inventory-view";
import { useInventory } from "@/lib/api";
import { useUIStore } from "@/stores/ui-store";
import { formatCompactCurrency, formatNumber } from "@/lib/utils";

export default function InventoryPage() {
  const inventory = useInventory().data?.items ?? [];
  const stockValue = inventory.reduce((s, r) => s + r.onHand * r.unitCost, 0);
  const skuCount = inventory.length;
  const lowStock = inventory.filter((r) => r.status !== "In Stock").length;
  const incoming = inventory.reduce((s, r) => s + r.incoming, 0);
  const setCreateCountOpen = useUIStore((s) => s.setCreateCountOpen);
  const setCreateWarehouseOpen = useUIStore((s) => s.setCreateWarehouseOpen);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Inventory"
        description={`${formatNumber(skuCount)} SKUs · ${lowStock} alerts`}
        icon={Warehouse}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateWarehouseOpen(true)}>
              <Plus className="size-4" /> Add warehouse
            </Button>
            <Button size="sm" onClick={() => setCreateCountOpen(true)}>
              <Boxes className="size-4" /> New count
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4 lg:grid-cols-4">
        <StatCard label="Total stock value" value={formatCompactCurrency(stockValue)} icon={Boxes} accent="primary" delta={3} />
        <StatCard label="SKUs" value={formatNumber(skuCount)} icon={Warehouse} accent="info" delta={2} />
        <StatCard label="Low-stock alerts" value={lowStock} icon={AlertTriangle} accent="warning" delta={5} invertDelta />
        <StatCard label="Incoming units" value={formatNumber(incoming)} icon={Truck} accent="success" delta={8} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <InventoryView />
      </div>
    </div>
  );
}
