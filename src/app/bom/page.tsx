"use client";

import Link from "next/link";
import { Network, Plus, GitCompare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { BomExplorer } from "@/features/bom/bom-explorer";
import { useUIStore } from "@/stores/ui-store";

export default function BomPage() {
  const setBomAddComponentOpen = useUIStore((s) => s.setBomAddComponentOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="BOM Explorer"
        description="Multi-level bill of materials with live cost rollup, where-used and duplicate detection"
        icon={Network}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/revisions"><GitCompare className="size-4" /> Compare revisions</Link>
            </Button>
            <Button size="sm" onClick={() => setBomAddComponentOpen(true)}>
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
