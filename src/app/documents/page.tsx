"use client";

import { FileText, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DocumentsView } from "@/features/documents/documents-view";
import { db } from "@/mock/db";
import { useUIStore } from "@/stores/ui-store";

export default function DocumentsPage() {
  const documents = db().documents;
  const approved = documents.filter((d) => d.status === "Approved").length;
  const setCreateDocumentOpen = useUIStore((s) => s.setCreateDocumentOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Documents"
        description={`${documents.length} documents · ${approved} approved`}
        icon={FileText}
        actions={
          <Button size="sm" onClick={() => setCreateDocumentOpen(true)}>
            <Upload className="size-4" /> Upload
          </Button>
        }
      />
      <div className="min-h-0 flex-1">
        <DocumentsView />
      </div>
    </div>
  );
}
