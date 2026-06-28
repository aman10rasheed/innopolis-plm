"use client";

import { FileBarChart, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { ReportsView } from "@/features/reports/reports-view";

export default function ReportsPage() {
  const setCreateReportOpen = useUIStore((s) => s.setCreateReportOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Reports"
        description="Scheduled and on-demand reporting across cost, quality and supply"
        icon={FileBarChart}
        actions={
          <Button size="sm" onClick={() => setCreateReportOpen(true)}>
            <Plus className="size-4" /> New report
          </Button>
        }
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <ReportsView />
      </div>
    </div>
  );
}
