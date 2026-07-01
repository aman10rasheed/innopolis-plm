"use client";

import { Library, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PartsTable } from "@/features/parts/parts-table";
import { db } from "@/mock/db";
import { toast } from "@/components/ui/toast";
import { useUIStore } from "@/stores/ui-store";
import { pickTextFile, parseCsv } from "@/lib/export";
import { importPartsFromCsv } from "@/features/parts/import-parts";

export default function PartsPage() {
  const dataRev = useUIStore((s) => s.dataRev);
  const setCreatePartOpen = useUIStore((s) => s.setCreatePartOpen);
  const bumpDataRev = useUIStore((s) => s.bumpDataRev);
  // dataRev is read so the header counts refresh after an import.
  void dataRev;
  const total = db().parts.length;

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
        description={`${total.toLocaleString()} materials · ${new Set(db().parts.map((p) => p.category)).size} categories · single source of truth`}
        icon={Library}
        actions={
          <>
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
    </div>
  );
}
