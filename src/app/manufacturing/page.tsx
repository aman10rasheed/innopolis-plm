"use client";

import * as React from "react";
import { Factory, ClipboardList, Boxes, Gauge, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { ManufacturingView, manufacturingStats } from "@/features/manufacturing/manufacturing-view";
import { formatNumber } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export default function ManufacturingPage() {
  const stats = React.useMemo(() => manufacturingStats(), []);
  const setCreateWorkOrderOpen = useUIStore((s) => s.setCreateWorkOrderOpen);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Manufacturing"
        description="Shop floor execution and machine utilization"
        icon={Factory}
        actions={
          <Button size="sm" onClick={() => setCreateWorkOrderOpen(true)}>
            <ClipboardList className="size-4" /> New work order
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 lg:grid-cols-4">
        <StatCard
          label="Active work orders"
          value={stats.active}
          delta={5}
          icon={ClipboardList}
          accent="primary"
          spark={[8, 9, 7, 10, 9, stats.active]}
        />
        <StatCard
          label="Units in production"
          value={formatNumber(stats.inProd)}
          delta={9}
          icon={Boxes}
          accent="info"
          spark={[3, 4, 5, 4, 6, 7]}
        />
        <StatCard
          label="Machine utilization"
          value={`${stats.util}%`}
          delta={3}
          icon={Gauge}
          accent="success"
          spark={[62, 65, 61, 68, 70, stats.util]}
        />
        <StatCard
          label="On-time build"
          value={`${stats.onTime}%`}
          delta={2}
          icon={CalendarCheck}
          accent="success"
          spark={[88, 90, 89, 92, 91, stats.onTime]}
        />
      </div>
      <div className="mt-4 min-h-0 flex-1">
        <ManufacturingView />
      </div>
    </div>
  );
}
