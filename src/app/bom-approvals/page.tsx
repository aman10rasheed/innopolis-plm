"use client";

import { ClipboardCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BoardFilterButton } from "@/components/shared/board-filter-button";
import { BomApprovalsBoard } from "@/features/bom-approvals/bom-approvals-board";
import { useBoms } from "@/lib/api";
import { useUIStore } from "@/stores/ui-store";

export default function BomApprovalsPage() {
  const boms = useBoms().data?.items ?? [];
  const pending = boms.filter((b) => b.stage !== "Released for Purchase").length;
  const setCreateBomOpen = useUIStore((s) => s.setCreateBomOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="BOM Approvals"
        description={`${pending} BOMs in review · Draft → Technical → Commercial → Approved → Released · full audit trail`}
        icon={ClipboardCheck}
        actions={
          <>
            <BoardFilterButton
              boardKey="bomApprovals"
              options={[
                { value: "Engineering", label: "Engineering" },
                { value: "Procurement", label: "Procurement" },
                { value: "Final Released", label: "Final Released" },
              ]}
            />
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
