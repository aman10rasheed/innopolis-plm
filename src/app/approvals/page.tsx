"use client";

import * as React from "react";
import { CheckCircle2, Clock, Timer, CircleDollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { ApprovalsView } from "@/features/approvals/approvals-view";
import { db } from "@/mock/db";
import { seededRandom, formatCompactCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export default function ApprovalsPage() {
  const approvals = db().approvals;
  const pending = approvals.filter((a) => a.status === "Pending");
  const approved = approvals.filter((a) => a.status === "Approved");

  // Deterministic avg cycle time (days)
  const rng = seededRandom(101);
  const avgCycle = (3.5 + rng() * 4).toFixed(1);
  const costPending = pending.reduce((s, a) => s + Math.max(0, a.costImpact), 0);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Approvals"
        description={`${pending.length} awaiting review · ${approved.length} approved`}
        icon={CheckCircle2}
        actions={
          <Button size="sm" onClick={() => toast.success("Reminders sent", "Pending reviewers notified")}>
            <CheckCircle2 className="size-4" /> Notify reviewers
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 lg:grid-cols-4">
        <StatCard
          label="Pending approvals"
          value={pending.length}
          delta={-8}
          deltaSuffix="vs last period"
          icon={Clock}
          accent="warning"
          invertDelta
          spark={[12, 14, 11, 13, 10, pending.length]}
        />
        <StatCard
          label="Approved this period"
          value={approved.length}
          delta={12}
          icon={CheckCircle2}
          accent="success"
          spark={[4, 5, 7, 6, 8, approved.length]}
        />
        <StatCard
          label="Avg cycle time"
          value={`${avgCycle}d`}
          delta={-6}
          icon={Timer}
          accent="info"
          invertDelta
          spark={[8, 7, 7, 6, 6, 5]}
        />
        <StatCard
          label="Cost impact pending"
          value={formatCompactCurrency(costPending)}
          delta={4}
          icon={CircleDollarSign}
          accent="primary"
          spark={[3, 4, 4, 5, 6, 7]}
        />
      </div>
      <div className="mt-4 min-h-0 flex-1">
        <ApprovalsView />
      </div>
    </div>
  );
}
