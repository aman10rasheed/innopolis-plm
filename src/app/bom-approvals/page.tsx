"use client";

import { ClipboardCheck, Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BomApprovalsBoard } from "@/features/bom-approvals/bom-approvals-board";
import { db } from "@/mock/db";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/components/ui/toast";

export default function BomApprovalsPage() {
  const pending = db().projectBoms.filter((b) => b.stage !== "Released for Purchase").length;
  const setCreateBomOpen = useUIStore((s) => s.setCreateBomOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="BOM Approvals"
        description={`${pending} BOMs in review · Draft → Technical → Commercial → Approved → Released · full audit trail`}
        icon={ClipboardCheck}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Filter")}>
              <Filter className="size-4" /> Filter
            </Button>
            <Button size="sm" onClick={() => setCreateBomOpen(true)}>
              <Plus className="size-4" /> Draft BOM
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1">
        <BomApprovalsBoard />
      </div>
    </div>
  );
}
