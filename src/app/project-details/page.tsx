"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileText, Download } from "lucide-react";
import { db } from "@/mock/db";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectInvoice } from "@/features/project-details/project-invoice";
import { toast } from "@/components/ui/toast";

export default function ProjectDetailsPage() {
  const projects = db().products;
  const [id, setId] = React.useState(projects[0]?.id ?? "");

  // Pick up ?p=<projectId> from the URL (deep-link from the Projects page).
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("p");
    if (q && projects.some((p) => p.id === q)) setId(q);
  }, [projects]);

  const project = projects.find((p) => p.id === id) ?? projects[0];
  if (!project) return null;

  return (
    <div className="print-root flex h-full flex-col">
      {/* Toolbar (hidden when printing) */}
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-6 py-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/products"><ArrowLeft className="size-4" /> Projects</Link>
        </Button>
        <div className="h-5 w-px bg-border" />
        <FileText className="size-4 text-primary" />
        <span className="text-sm font-medium">Project Details · Proforma Invoice</span>
        <div className="ml-auto flex items-center gap-2">
          <Select value={id} onValueChange={setId}>
            <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="font-mono text-2xs text-muted-foreground">{p.projectNumber}</span> · {p.customer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => toast.success("Exported", "Proforma saved to Documents")}>
            <Download className="size-4" /> Export
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Document canvas */}
      <div className="flex-1 overflow-auto bg-zinc-300/50 p-6 dark:bg-black/40">
        <ProjectInvoice project={project} />
      </div>
    </div>
  );
}
