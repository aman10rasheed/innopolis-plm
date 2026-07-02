"use client";

import * as React from "react";
import { Library, Plus, Upload, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PartsTable } from "@/features/parts/parts-table";
import { CategoryManagerDialog } from "@/features/parts/category-manager-dialog";
import { toast } from "@/components/ui/toast";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { pickTextFile, parseCsv } from "@/lib/export";
import { importPartsFromCsv } from "@/features/parts/import-parts";
import { useParts, useMaterialMasters } from "@/lib/api";

export default function PartsPage() {
  const setCreatePartOpen = useUIStore((s) => s.setCreatePartOpen);
  const bumpDataRev = useUIStore((s) => s.bumpDataRev);
  const isAdmin = useAuthStore((s) => s.user?.role === "Administrator");
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);

  // Header counts come from the same API the grid consumes.
  const partsQuery = useParts();
  const mastersQuery = useMaterialMasters();
  const total = partsQuery.data?.meta.total ?? partsQuery.data?.items.length ?? 0;
  const categoryCount =
    mastersQuery.data?.categories.length ??
    new Set((partsQuery.data?.items ?? []).map((p) => p.category)).size;

  const handleImport = async () => {
    const file = await pickTextFile();
    if (!file) return;
    try {
      const added = importPartsFromCsv(parseCsv(file.text));
      if (added === 0) {
        toast.warning("Nothing imported", "No valid rows found — needs a 'Part Number' or 'Name' column");
        return;
      }
      bumpDataRev();
      toast.success("Import complete", `${added} material${added === 1 ? "" : "s"} added from ${file.name}`);
    } catch {
      toast.error("Import failed", "Could not parse the file as CSV");
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      <PageHeader
        title="Material Master"
        description={`${total.toLocaleString()} materials · ${categoryCount} categories · single source of truth`}
        icon={Library}
        actions={
          <>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setCategoriesOpen(true)}>
                <Layers className="size-4" /> Manage types
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleImport}>
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
      <CategoryManagerDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}
