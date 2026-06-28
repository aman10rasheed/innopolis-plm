"use client";

import { CircleDollarSign, Download, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CostAnalysisView } from "@/features/cost/cost-view";

export default function CostPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Cost Analysis"
        description="Rolled-up product cost, margin and spend intelligence across the portfolio"
        icon={CircleDollarSign}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Cost filters", "Adjust currency, period and family")}
            >
              <SlidersHorizontal className="size-4" /> Filters
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Export started", "Cost rollup will download shortly")}
            >
              <Download className="size-4" /> Export
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <CostAnalysisView />
      </div>
    </div>
  );
}
