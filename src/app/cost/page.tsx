"use client";

import { CircleDollarSign, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CostAnalysisView } from "@/features/cost/cost-view";
import { db, projectRolledCost } from "@/mock/db";
import { downloadCsv } from "@/lib/export";

export default function CostPage() {
  const exportCost = () => {
    const products = db().products;
    downloadCsv(
      products,
      [
        { header: "Project", value: (p) => p.projectNumber },
        { header: "Name", value: (p) => p.name },
        { header: "Customer", value: (p) => p.customer },
        { header: "Stage", value: (p) => p.stage },
        { header: "Est. Unit Cost", value: (p) => p.unitCost },
        { header: "BOM Rolled Cost", value: (p) => Math.round(projectRolledCost(p.id)) },
        { header: "Quoted (MSRP)", value: (p) => p.msrp },
        { header: "Margin %", value: (p) => p.marginPct },
      ],
      `cost-rollup-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("Export complete", `${products.length} projects downloaded as CSV`);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Cost Analysis"
        description="Rolled-up product cost, margin and spend intelligence across the portfolio"
        icon={CircleDollarSign}
        actions={
          <Button size="sm" onClick={exportCost}>
            <Download className="size-4" /> Export
          </Button>
        }
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <CostAnalysisView />
      </div>
    </div>
  );
}
