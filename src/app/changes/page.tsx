"use client";

import { GitPullRequestArrow, Plus, Filter, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ChangesBoard } from "@/features/changes/changes-board";
import { db } from "@/mock/db";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/components/ui/toast";

export default function ChangesPage() {
  const open = db().ecos.filter((e) => e.status !== "Completed").length;
  const setCreateEcoOpen = useUIStore((s) => s.setCreateEcoOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Change Requests"
        description={`${open} active material change requests (MCR) · drag cards to move between stages`}
        icon={GitPullRequestArrow}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Filters")}>
              <Filter className="size-4" /> Filter
            </Button>
            <Button size="sm" onClick={() => setCreateEcoOpen(true)}>
              <Plus className="size-4" /> New change
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1">
        <ChangesBoard />
      </div>
    </div>
  );
}
