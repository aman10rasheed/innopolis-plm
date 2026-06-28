"use client";

import { Network, Plus, GitCompare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BomExplorer } from "@/features/bom/bom-explorer";
import { toast } from "@/components/ui/toast";

export default function BomPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="BOM Explorer"
        description="Multi-level bill of materials with live cost rollup, where-used and duplicate detection"
        icon={Network}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Compare", "Select two revisions to diff")}>
              <GitCompare className="size-4" /> Compare revisions
            </Button>
            <Button size="sm" onClick={() => toast.success("Add component", "Search a part to insert")}>
              <Plus className="size-4" /> Add component
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1">
        <BomExplorer />
      </div>
    </div>
  );
}
