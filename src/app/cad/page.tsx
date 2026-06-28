"use client";

import { Box, Upload, Share2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CadViewer } from "@/features/cad/cad-viewer";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/components/ui/toast";

export default function CadPage() {
  const setCadImportOpen = useUIStore((s) => s.setCadImportOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="CAD Viewer"
        description="Interactive 3D model with live BOM linkage — click a component to select it in the tree"
        icon={Box}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info("Share", "View link copied")}>
              <Share2 className="size-4" /> Share view
            </Button>
            <Button size="sm" onClick={() => setCadImportOpen(true)}>
              <Upload className="size-4" /> Import model
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1">
        <CadViewer />
      </div>
    </div>
  );
}
