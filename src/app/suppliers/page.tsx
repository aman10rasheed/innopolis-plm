"use client";

import { Building2, Plus, Star, Truck, CircleDollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { SuppliersView } from "@/features/suppliers/suppliers-view";
import { db } from "@/mock/db";
import { useUIStore } from "@/stores/ui-store";
import { formatCompactCurrency } from "@/lib/utils";

export default function VendorsPage() {
  const vendors = db().suppliers;
  const approved = vendors.filter((v) => v.approved || v.status === "Preferred" || v.status === "Approved").length;
  const avgOnTime = Math.round(
    vendors.reduce((s, x) => s + x.onTimePct, 0) / Math.max(1, vendors.length),
  );
  const annualSpend = vendors.reduce((s, x) => s + x.annualSpend, 0);
  const setCreateVendorOpen = useUIStore((s) => s.setCreateVendorOpen);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Vendors"
        description={`${vendors.length} vendors · ${approved} approved`}
        icon={Building2}
        actions={
          <Button size="sm" onClick={() => setCreateVendorOpen(true)}>
            <Plus className="size-4" /> Add vendor
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4 lg:grid-cols-4">
        <StatCard label="Total vendors" value={vendors.length} icon={Building2} accent="primary" delta={4} />
        <StatCard label="Approved / Preferred" value={approved} icon={Star} accent="success" delta={2} />
        <StatCard label="Avg on-time" value={`${avgOnTime}%`} icon={Truck} accent="info" delta={1} />
        <StatCard label="Total annual spend" value={formatCompactCurrency(annualSpend)} icon={CircleDollarSign} accent="warning" delta={6} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <SuppliersView />
      </div>
    </div>
  );
}
