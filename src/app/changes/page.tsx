"use client";

import { GitPullRequestArrow, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BoardFilterButton } from "@/components/shared/board-filter-button";
import { ChangesBoard } from "@/features/changes/changes-board";
import { db } from "@/mock/db";
import { useUIStore } from "@/stores/ui-store";

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
            <BoardFilterButton
              boardKey="changes"
              options={[
                { value: "Critical", label: "Critical priority" },
                { value: "High", label: "High priority" },
                { value: "Medium", label: "Medium priority" },
                { value: "Low", label: "Low priority" },
              ]}
            />
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
