"use client";

import { History, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { RevisionsView } from "@/features/revisions/revisions-view";
import { db } from "@/mock/db";
import { useUIStore } from "@/stores/ui-store";

export default function RevisionsPage() {
  const revisions = db().revisions;
  const released = revisions.filter((r) => r.status === "Released").length;
  const setCreateRevisionOpen = useUIStore((s) => s.setCreateRevisionOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Revisions"
        description={`${revisions.length} revisions · ${released} released`}
        icon={History}
        actions={
          <Button size="sm" onClick={() => setCreateRevisionOpen(true)}>
            <Plus className="size-4" /> New revision
          </Button>
        }
      />
      <div className="min-h-0 flex-1">
        <RevisionsView />
      </div>
    </div>
  );
}
