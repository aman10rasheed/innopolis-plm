"use client";

import { BarChart3, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AnalyticsView } from "@/features/analytics/analytics-view";

export default function AnalyticsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Analytics"
        description="Operational intelligence across manufacturing, supply chain and engineering"
        icon={BarChart3}
        actions={
          <Button
            size="sm"
            onClick={() => toast.success("Snapshot saved", "Analytics export queued")}
          >
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
