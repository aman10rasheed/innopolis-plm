"use client";

import { Library, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PartsTable } from "@/features/parts/parts-table";
import { db } from "@/mock/db";
import { toast } from "@/components/ui/toast";
import { useUIStore } from "@/stores/ui-store";

export default function PartsPage() {
  const total = db().parts.length;
  const setCreatePartOpen = useUIStore((s) => s.setCreatePartOpen);
  return (
    <div className="relative flex h-full flex-col">
      <PageHeader
        title="Material Master"
        description={`${total.toLocaleString()} materials · ${new Set(db().parts.map((p) => p.category)).size} categories · single source of truth`}
        icon={Library}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Bulk import", "Upload an Excel material list")}>
              <Upload className="size-4" /> Import
            </Button>
            <Button size="sm" onClick={() => setCreatePartOpen(true)}>
              <Plus className="size-4" /> New material
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1">
        <PartsTable />
      </div>
    </div>
  );
}
