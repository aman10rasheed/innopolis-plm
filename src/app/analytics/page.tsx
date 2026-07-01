"use client";

import { BarChart3, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AnalyticsView } from "@/features/analytics/analytics-view";
import { db, totalRolledCost } from "@/mock/db";
import { downloadJson } from "@/lib/export";

export default function AnalyticsPage() {
  const exportSnapshot = () => {
    const d = db();
    const snapshot = {
      generatedAt: new Date().toISOString(),
      projects: d.products.length,
      materials: d.parts.length,
      vendors: d.suppliers.length,
      openChangeRequests: d.ecos.filter((e) => e.status !== "Completed").length,
      bomsInReview: d.projectBoms.filter((b) => b.stage !== "Released for Purchase").length,
      purchaseOrders: d.purchaseOrders.length,
      totalRolledCost: Math.round(totalRolledCost()),
      projectsByStage: d.products.reduce<Record<string, number>>((acc, p) => {
        acc[p.stage] = (acc[p.stage] ?? 0) + 1;
        return acc;
      }, {}),
    };
    downloadJson(snapshot, `analytics-snapshot-${new Date().toISOString().slice(0, 10)}.json`);
    toast.success("Snapshot exported", "Analytics snapshot downloaded as JSON");
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Analytics"
        description="Operational intelligence across manufacturing, supply chain and engineering"
        icon={BarChart3}
        actions={
          <Button size="sm" onClick={exportSnapshot}>
            <Download className="size-4" /> Export
          </Button>
        }
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnalyticsView />
      </div>
    </div>
  );
}
