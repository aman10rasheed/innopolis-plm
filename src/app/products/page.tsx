"use client";

import { FolderKanban, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProductsView } from "@/features/products/products-view";
import { useProjects } from "@/lib/api";
import { useUIStore } from "@/stores/ui-store";

export default function ProjectsPage() {
  const projectsQuery = useProjects();
  const count = projectsQuery.data?.meta?.total ?? projectsQuery.data?.items.length ?? 0;
  const setCreateProductOpen = useUIStore((s) => s.setCreateProductOpen);
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Projects"
        description={`${count} projects · enquiry to delivery`}
        icon={FolderKanban}
        actions={
          <Button size="sm" onClick={() => setCreateProductOpen(true)}>
            <Plus className="size-4" /> New project
          </Button>
        }
      />
      <div className="min-h-0 flex-1">
        <ProductsView />
      </div>
    </div>
  );
}
