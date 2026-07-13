"use client";

import * as React from "react";
import {
  ChevronRight,
  Box,
  Search,
  ChevronsDownUp,
  ChevronsUpDown,
  AlertTriangle,
  Copy,
  Package,
  Network,
  Download,
  Boxes,
  ArrowLeft,
  Plus,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Thumbnail } from "@/components/shared/thumbnail";
import { DonutChart } from "@/components/shared/charts";
import { useRouter } from "next/navigation";
import { flattenBom } from "@/mock/db";
import {
  useProjects,
  useBoms,
  useBom,
  useBomAnalysis,
  useParts,
  useAddBomLine,
  useUpdateBomLine,
  useCreateBom,
  useSetLineRequiredDate,
  toNumber,
} from "@/lib/api";
import { ensureCanCreate } from "@/auth/permissions";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiBomDetail, ApiBomLine } from "@/lib/api";
import type { BomNode, Product } from "@/types";
import { useUIStore } from "@/stores/ui-store";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { LIFECYCLE_VARIANT, PROJECT_STAGE_VARIANT } from "@/constants/status";
import { toast } from "@/components/ui/toast";
import { downloadCsv, copyToClipboard } from "@/lib/export";
import { QueryBoundary } from "@/components/shared/query-boundary";

const LEVEL_COLORS = [
  "border-l-primary",
  "border-l-info",
  "border-l-warning",
  "border-l-success",
  "border-l-destructive",
  "border-l-muted-foreground",
];

export function BomExplorer() {
  const [rootId, setRootId] = React.useState<string | null>(null);

  // Deep link: /bom?p=<projectId> opens that project's BOM directly
  // (used by the BOM Approvals drawer). Read from window.location — no
  // useSearchParams under static export.
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("p");
    if (p) setRootId(p);
  }, []);

  // The add-component dialog lives inside a BOM document view; on the project
  // picker the header button has nothing to open — explain instead of no-op.
  const addComponentOpen = useUIStore((s) => s.bomAddComponentOpen);
  const setBomAddComponentOpen = useUIStore((s) => s.setBomAddComponentOpen);
  React.useEffect(() => {
    if (addComponentOpen && rootId == null) {
      setBomAddComponentOpen(false);
      toast.info("Open a project first", "Pick a project to add components to its BOM.");
    }
  }, [addComponentOpen, rootId, setBomAddComponentOpen]);

  if (rootId == null) {
    return <ProjectPicker onSelect={setRootId} />;
  }

  return (
    <BomView
      key={rootId}
      rootId={rootId}
      onSelect={setRootId}
      onBack={() => setRootId(null)}
    />
  );
}

/* ---------------------------------------------------------------------------
 * Tree assembly — the API returns flat BOM lines; we build the same BomNode
 * tree shape the mock's buildProjectBom produced so the render code is reused.
 * ------------------------------------------------------------------------- */
function lineToNode(line: ApiBomLine): BomNode {
  const qty = toNumber(line.quantity);
  const unitCost = toNumber(line.unit_cost);
  const extended = toNumber(line.extended_cost);
  return {
    id: line.id,
    refId: line.part_id,
    type: "part",
    partNumber: line.part_number,
    name: line.name,
    category: line.category as BomNode["category"],
    quantity: qty,
    uom: line.uom,
    unitCost,
    extendedCost: extended || Math.round(unitCost * qty * 100) / 100,
    lifecycle: (line as { lifecycle?: BomNode["lifecycle"] }).lifecycle ?? "Released",
    revision: line.material_revision,
    refDesignator: line.ref_designator ?? undefined,
    leadTimeDays: line.lead_time_days,
    procurement: line.procurement,
    level: Math.max(1, line.level || 1),
    findNumber: line.find_number,
    hasIssue: line.is_critical === true,
    isDuplicate: false,
  };
}

/** Flag part ids that appear on more than one line (mirrors mock markDuplicates). */
function markDuplicates(root: BomNode) {
  const counts = new Map<string, number>();
  const walk = (n: BomNode) => {
    if (n.type === "part") counts.set(n.refId, (counts.get(n.refId) ?? 0) + 1);
    n.children?.forEach(walk);
  };
  walk(root);
  const dupSet = new Set([...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id));
  const mark = (n: BomNode) => {
    if (n.type === "part" && dupSet.has(n.refId)) n.isDuplicate = true;
    n.children?.forEach(mark);
  };
  mark(root);
}

function buildTree(detail: ApiBomDetail, project: Product | undefined): BomNode {
  const nodeById = new Map<string, BomNode>();
  for (const line of detail.lines) nodeById.set(line.id, lineToNode(line));

  const topLevel: BomNode[] = [];
  for (const line of detail.lines) {
    const node = nodeById.get(line.id)!;
    const parent = line.parent_line_id ? nodeById.get(line.parent_line_id) : undefined;
    if (parent) {
      (parent.children ??= []).push(node);
    } else {
      topLevel.push(node);
    }
  }

  const rolled = Math.round(topLevel.reduce((s, c) => s + c.extendedCost, 0) * 100) / 100;
  const root: BomNode = {
    id: "root",
    refId: detail.project_id,
    type: "project",
    partNumber: project?.code ?? detail.number,
    name: project?.name ?? detail.number,
    quantity: 1,
    uom: "ea",
    unitCost: rolled,
    extendedCost: rolled,
    lifecycle: project?.lifecycle ?? "Released",
    revision: detail.revision,
    leadTimeDays: 0,
    procurement: "Make",
    level: 0,
    findNumber: 0,
    children: topLevel,
    hasIssue: false,
    isDuplicate: false,
  };
  markDuplicates(root);
  return root;
}

function ProjectPicker({ onSelect }: { onSelect: (id: string) => void }) {
  const projectsQuery = useProjects();
  const projectsAll = projectsQuery.data?.items ?? [];
  const [query, setQuery] = React.useState("");

  const projects = React.useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return projectsAll;
    return projectsAll.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.code.toLowerCase().includes(t) ||
        p.customer.toLowerCase().includes(t),
    );
  }, [projectsAll, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/40 px-6 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">Select a project</h2>
          <p className="text-2xs text-muted-foreground">
            Choose a project to open its bill of materials
          </p>
        </div>
        <div className="relative ml-auto w-64">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <QueryBoundary
        className="min-h-0 flex-1"
        isLoading={projectsQuery.isLoading}
        isError={projectsQuery.isError}
        error={projectsQuery.error}
        onRetry={() => projectsQuery.refetch()}
      >
        <div className="min-h-0 flex-1 overflow-auto p-6">
          {projects.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No projects match “{query}”.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Thumbnail hue={p.thumbnailHue} size={40} icon={Boxes} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold group-hover:text-primary">
                        {p.name}
                      </p>
                      <p className="font-mono text-2xs text-muted-foreground">{p.code}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={PROJECT_STAGE_VARIANT[p.stage]}>{p.stage}</Badge>
                    <Badge variant="outline">Rev {p.revision}</Badge>
                  </div>
                  <p className="truncate text-2xs text-muted-foreground">{p.customer}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-2xs text-muted-foreground">{p.customer}</span>
                    <span className="text-[13px] font-semibold tabular text-primary">
                      {formatCurrency(p.targetCost || p.unitCost)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </QueryBoundary>
    </div>
  );
}

function BomView({
  rootId,
  onSelect,
  onBack,
}: {
  rootId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const projectsQuery = useProjects();
  const projects = projectsQuery.data?.items ?? [];
  const project = projects.find((p) => p.id === rootId);

  const bomsQuery = useBoms({ projectId: rootId });
  const projectBoms = bomsQuery.data?.items ?? [];

  const [bomId, setBomId] = React.useState<string | null>(null);
  // Auto-select the (first / only) BOM document once the list resolves.
  React.useEffect(() => {
    if (!bomId && projectBoms.length > 0) setBomId(projectBoms[0].id);
  }, [bomId, projectBoms]);

  const bomQuery = useBom(bomId ?? "");

  // Components are added to a BOM document; without one, the header
  // "Add component" button has nothing to open — explain instead of no-op.
  const createBom = useCreateBom();
  const noBoms = !bomsQuery.isLoading && projectBoms.length === 0;
  const addComponentOpen = useUIStore((s) => s.bomAddComponentOpen);
  const setBomAddComponentOpen = useUIStore((s) => s.setBomAddComponentOpen);
  React.useEffect(() => {
    if (addComponentOpen && noBoms) {
      setBomAddComponentOpen(false);
      toast.info(
        "No BOM document yet",
        "Components are added to a BOM document — create a draft BOM for this project first.",
      );
    }
  }, [addComponentOpen, noBoms, setBomAddComponentOpen]);

  const createDraft = async () => {
    if (!ensureCanCreate("bom")) return;
    try {
      await createBom.mutateAsync({ project_id: rootId, bom_type: "Engineering" });
      toast.success("Draft BOM created", `${project?.name ?? "Project"} — you can add components now`);
    } catch (e) {
      toast.error("Couldn't create BOM", e instanceof Error ? e.message : "Please try again");
    }
  };

  return (
    <QueryBoundary
      isLoading={bomsQuery.isLoading}
      isError={bomsQuery.isError}
      error={bomsQuery.error}
      onRetry={() => bomsQuery.refetch()}
    >
      {projectBoms.length === 0 ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
            <Button variant="ghost" size="icon-sm" onClick={onBack} title="Back to projects">
              <ArrowLeft className="size-4" />
            </Button>
            <span className="text-[13px] font-medium">{project?.name ?? "Project"}</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
            <p className="text-sm text-muted-foreground">This project has no BOM documents yet.</p>
            <p className="text-2xs text-muted-foreground">
              Components are added to a BOM document — create a draft to get started.
            </p>
            <Button size="sm" className="mt-2" onClick={createDraft} disabled={createBom.isPending}>
              {createBom.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create draft BOM
            </Button>
          </div>
        </div>
      ) : (
        <QueryBoundary
          isLoading={!!bomId && bomQuery.isLoading}
          isError={bomQuery.isError}
          error={bomQuery.error}
          onRetry={() => bomQuery.refetch()}
        >
          {bomQuery.data ? (
            <BomDocumentView
              key={bomId}
              detail={bomQuery.data}
              project={project}
              projects={projects}
              projectBoms={projectBoms}
              activeBomId={bomId!}
              onSelectBom={setBomId}
              onSelectProject={(id) => { setBomId(null); onSelect(id); }}
              onBack={onBack}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading BOM…</div>
          )}
        </QueryBoundary>
      )}
    </QueryBoundary>
  );
}

function BomDocumentView({
  detail,
  project,
  projects,
  projectBoms,
  activeBomId,
  onSelectBom,
  onSelectProject,
  onBack,
}: {
  detail: ApiBomDetail;
  project: Product | undefined;
  projects: Product[];
  projectBoms: { id: string; number: string; revision: string; bomType: string }[];
  activeBomId: string;
  onSelectBom: (id: string) => void;
  onSelectProject: (id: string) => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const setBomAddComponentOpen = useUIStore((s) => s.setBomAddComponentOpen);
  const addBomLine = useAddBomLine();
  const updateBomLine = useUpdateBomLine();

  const tree = React.useMemo(() => buildTree(detail, project), [detail, project]);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(["root"]));
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState("");
  const [activeNode, setActiveNode] = React.useState<BomNode | null>(null);

  const analysisQuery = useBomAnalysis(activeBomId, "category");

  const rootName = project?.name ?? detail.number;

  const allIds = React.useMemo(() => {
    const ids: string[] = [];
    const walk = (n: BomNode) => {
      if (n.children?.length) ids.push(n.id);
      n.children?.forEach(walk);
    };
    walk(tree);
    return ids;
  }, [tree]);

  const flat = React.useMemo(() => {
    let rows = flattenBom(tree, expanded);
    if (query.trim()) {
      const t = query.toLowerCase();
      rows = rows.filter(
        (n) => n.name.toLowerCase().includes(t) || n.partNumber.toLowerCase().includes(t),
      );
    }
    return rows;
  }, [tree, expanded, query]);

  const stats = React.useMemo(() => {
    const all = flattenBom(tree, new Set(allIds));
    const parts = all.filter((n) => n.type === "part");
    const unique = new Set(parts.map((p) => p.refId));
    const dups = parts.filter((p) => p.isDuplicate);
    const issues = all.filter((n) => n.hasIssue);
    const maxDepth = Math.max(...all.map((n) => n.level), 0);
    const maxLead = Math.max(...parts.map((p) => p.leadTimeDays), 0);
    return {
      totalParts: parts.reduce((s, p) => s + p.quantity, 0),
      uniqueParts: unique.size,
      lineItems: all.length - 1,
      totalCost: tree.extendedCost,
      maxDepth,
      maxLead,
      dups: new Set(dups.map((d) => d.refId)).size,
      issues: issues.length,
    };
  }, [tree, allIds]);

  // Cost-by-category donut is sourced from the server analysis endpoint.
  const catData = React.useMemo(() => {
    const groups = analysisQuery.data?.groups ?? [];
    return groups
      .slice()
      .sort((a, b) => toNumber(b.totalValue) - toNumber(a.totalValue))
      .slice(0, 6)
      .map((g, i) => ({
        name: g.key || "Other",
        value: Math.round(toNumber(g.totalValue)),
        color: `hsl(${(i * 47 + 168) % 360} 60% 50%)`,
      }));
  }, [analysisQuery.data]);
  const analysisTotal = analysisQuery.data ? toNumber(analysisQuery.data.total) : stats.totalCost;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exportBom = () => {
    const rows = flattenBom(tree, new Set(allIds)).filter((n) => n.id !== "root");
    downloadCsv(
      rows,
      [
        { header: "Level", value: (n) => n.level },
        { header: "Ref Des", value: (n) => n.refDesignator ?? "" },
        { header: "Part Number", value: (n) => n.partNumber },
        { header: "Name", value: (n) => n.name },
        { header: "Qty", value: (n) => n.quantity },
        { header: "Unit Cost", value: (n) => Math.round(n.unitCost) },
        { header: "Extended Cost", value: (n) => Math.round(n.extendedCost) },
        { header: "Lead Time (days)", value: (n) => (n.type === "part" ? n.leadTimeDays : "") },
        { header: "Procurement", value: (n) => n.procurement ?? "" },
        { header: "Lifecycle", value: (n) => n.lifecycle ?? "" },
      ],
      `bom-${detail.number ?? detail.id}-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("BOM exported", `${rows.length} lines downloaded as CSV`);
  };

  const showWhereUsed = (node: BomNode) => {
    // where-used across other BOMs isn't exposed by a single client call; the
    // per-part usage count is available on the mapped part list instead.
    toast.info("Where used", `${node.partNumber} — open the Material Master to see full usage.`);
  };

  // Set the same quantity on every selected BOM line via the API.
  const massEditQty = async () => {
    const lineIds = [...selected].filter((id) => id !== "root");
    if (lineIds.length === 0) return;
    const input = window.prompt(`Set quantity for ${lineIds.length} selected line(s):`, "1");
    if (input == null) return;
    const qty = Math.max(0, Math.round(Number(input)));
    if (!Number.isFinite(qty)) {
      toast.error("Invalid quantity", "Enter a whole number");
      return;
    }
    try {
      await Promise.all(lineIds.map((lineId) => updateBomLine.mutateAsync({ lineId, body: { quantity: qty } })));
      setSelected(new Set());
      toast.success("Quantities updated", `${lineIds.length} BOM line(s) set to qty ${qty}`);
    } catch (e) {
      toast.error("Update failed", e instanceof Error ? e.message : "Could not update line quantities");
    }
  };

  const existingRefIds = React.useMemo(
    () => new Set((tree.children ?? []).map((c) => c.refId)),
    [tree],
  );

  return (
    <div className="flex h-full min-h-0">
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
          <Button variant="ghost" size="icon-sm" onClick={onBack} title="Back to projects">
            <ArrowLeft className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Boxes className="size-4 text-primary" />
                <span className="max-w-[220px] truncate">{rootName}</span>
                <ChevronRight className="size-3.5 rotate-90 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
              <DropdownMenuLabel>Projects</DropdownMenuLabel>
              {projects.map((r) => (
                <DropdownMenuItem key={r.id} onClick={() => onSelectProject(r.id)}>
                  <Thumbnail hue={r.thumbnailHue} size={26} icon={Boxes} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{r.name}</p>
                    <p className="font-mono text-2xs text-muted-foreground">{r.code}</p>
                  </div>
                  {r.id === detail.project_id && <Badge variant="default">current</Badge>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* BOM document picker — only when the project has several */}
          {projectBoms.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Network className="size-4 text-primary" />
                  <span className="max-w-[160px] truncate font-mono">{detail.number}</span>
                  <ChevronRight className="size-3.5 rotate-90 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-80 w-64 overflow-y-auto">
                <DropdownMenuLabel>BOM documents</DropdownMenuLabel>
                {projectBoms.map((b) => (
                  <DropdownMenuItem key={b.id} onClick={() => onSelectBom(b.id)}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[13px] font-medium">{b.number}</p>
                      <p className="text-2xs text-muted-foreground">{b.bomType} · Rev {b.revision}</p>
                    </div>
                    {b.id === activeBomId && <Badge variant="default">current</Badge>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex items-center gap-1 text-2xs text-muted-foreground">
            <span>{project?.customer ?? ""}</span>
            <ChevronRight className="size-3" />
            <span className="font-mono">{project?.code ?? detail.number}</span>
            <Badge variant="outline" className="ml-1">Rev {detail.revision}</Badge>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter BOM…" className="h-8 pl-8" />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setExpanded(new Set(["root", ...allIds]))}>
              <ChevronsUpDown className="size-3.5" /> Expand
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setExpanded(new Set(["root"]))}>
              <ChevronsDownUp className="size-3.5" /> Collapse
            </Button>
            <Button variant="outline" size="icon-sm" onClick={exportBom} title="Export indented BOM as CSV">
              <Download className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-px overflow-x-auto border-b border-border bg-surface-sunken/40">
          {[
            ["Total Qty", formatNumber(stats.totalParts), null],
            ["Unique Parts", formatNumber(stats.uniqueParts), null],
            ["Line Items", formatNumber(stats.lineItems), null],
            ["Rolled Cost", formatCurrency(stats.totalCost), "text-primary"],
            ["Max Depth", `${stats.maxDepth} lvl`, null],
            ["Max Lead", `${stats.maxLead} d`, stats.maxLead > 45 ? "text-warning" : null],
            ["Duplicates", String(stats.dups), stats.dups ? "text-warning" : null],
            ["Critical", String(stats.issues), stats.issues ? "text-destructive" : null],
          ].map(([label, value, tone]) => (
            <div key={label as string} className="flex min-w-[110px] flex-col px-4 py-2">
              <span className="text-2xs text-muted-foreground">{label}</span>
              <span className={cn("text-sm font-semibold tabular", tone)}>{value}</span>
            </div>
          ))}
        </div>

        {/* Column header */}
        <div className="flex items-center border-b border-border bg-surface-sunken/30 px-4 py-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-8" />
          <span className="w-10 text-center">#</span>
          <span className="flex-1">Component</span>
          <span className="w-16 text-right">Qty</span>
          <span className="w-24 text-center">Lifecycle</span>
          <span className="w-20 text-center">Proc.</span>
          <span className="w-24 text-right">Unit</span>
          <span className="w-24 text-right">Extended</span>
          <span className="w-16 text-right">Lead</span>
        </div>

        {/* Tree rows */}
        <div className="min-h-0 flex-1 overflow-auto">
          {flat.map((node) => {
            if (node.id === "root") return <RootRow key="root" node={node} />;
            const isExpandable = !!node.children?.length;
            const isOpen = expanded.has(node.id);
            const isSel = selected.has(node.id);
            return (
              <ContextMenu key={node.id}>
                <ContextMenuTrigger asChild>
                  <div
                    onClick={() => setActiveNode(node)}
                    className={cn(
                      "group flex cursor-pointer items-center border-b border-l-2 border-border/50 px-4 py-1.5 transition-colors hover:bg-accent/40",
                      LEVEL_COLORS[node.level % LEVEL_COLORS.length],
                      isSel && "bg-primary/[0.07]",
                      activeNode?.id === node.id && "bg-accent/60",
                    )}
                  >
                    <div className="flex w-8 items-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSel} onCheckedChange={() => toggleSelect(node.id)} className="size-3.5" />
                    </div>
                    <span className="w-10 text-center font-mono text-2xs text-muted-foreground">{node.findNumber}</span>

                    <div className="flex flex-1 items-center gap-1.5" style={{ paddingLeft: node.level * 18 }}>
                      {isExpandable ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggle(node.id); }}
                          className="flex size-4 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                        >
                          <ChevronRight className={cn("size-3.5 transition-transform", isOpen && "rotate-90")} />
                        </button>
                      ) : (
                        <span className="size-4" />
                      )}
                      <Thumbnail hue={(node.findNumber * 47) % 360} size={26} icon={Box} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-medium">{node.name}</span>
                          {node.isDuplicate && (
                            <Badge variant="warning" className="gap-0.5"><Copy className="size-2.5" />dup</Badge>
                          )}
                          {node.hasIssue && <AlertTriangle className="size-3 text-destructive" />}
                          {node.refDesignator && (
                            <span className="rounded bg-muted px-1 font-mono text-2xs text-muted-foreground">{node.refDesignator}</span>
                          )}
                        </div>
                        <span className="font-mono text-2xs text-muted-foreground">{node.partNumber}</span>
                      </div>
                    </div>

                    <span className="w-16 text-right text-[13px] font-medium tabular">{node.quantity} {node.uom}</span>
                    <span className="flex w-24 justify-center">
                      <Badge variant={LIFECYCLE_VARIANT[node.lifecycle]}>{node.lifecycle}</Badge>
                    </span>
                    <span className="w-20 text-center text-2xs text-muted-foreground">{node.procurement}</span>
                    <span className="w-24 text-right text-[13px] tabular text-muted-foreground">{formatCurrency(node.unitCost)}</span>
                    <span className="w-24 text-right text-[13px] font-medium tabular">{formatCurrency(node.extendedCost)}</span>
                    <span className={cn("w-16 text-right text-[13px] tabular", node.leadTimeDays > 45 ? "text-warning" : "text-muted-foreground")}>
                      {node.type === "part" ? `${node.leadTimeDays}d` : "—"}
                    </span>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem onClick={() => setActiveNode(node)}><Package /> Inspect</ContextMenuItem>
                  <ContextMenuItem onClick={() => showWhereUsed(node)}><Network /> Where used</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => { copyToClipboard(node.partNumber); toast.success("Copied", node.partNumber); }}><Copy /> Copy part number</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 border-t border-border bg-surface/60 px-4 py-2">
            <span className="text-[13px] font-medium">{selected.size} selected</span>
            <div className="h-4 w-px bg-border" />
            <Button size="xs" variant="ghost" onClick={massEditQty}>Mass edit qty</Button>
            <Button size="xs" variant="ghost" onClick={() => setBomAddComponentOpen(true)}>Substitute</Button>
            <Button size="xs" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}
      </div>

      {/* Right detail panel */}
      <div className="hidden w-[300px] shrink-0 flex-col border-l border-border bg-surface/40 xl:flex">
        <div className="border-b border-border px-4 py-3">
          <p className="text-[13px] font-semibold">Cost Breakdown</p>
          <p className="text-2xs text-muted-foreground">By category · rolled up</p>
        </div>
        <div className="p-4">
          <div className="relative">
            <DonutChart data={catData} height={180} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xs text-muted-foreground">Total</span>
              <span className="text-base font-semibold tabular">{formatCurrency(analysisTotal)}</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {catData.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-2xs">
                <span className="size-2 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                <span className="font-medium tabular">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {activeNode && activeNode.id !== "root" && (
          <div className="border-t border-border p-4">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Selected line</p>
            <div className="flex items-center gap-2.5">
              <Thumbnail hue={(activeNode.findNumber * 47) % 360} size={40} icon={Box} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{activeNode.name}</p>
                <p className="font-mono text-2xs text-muted-foreground">{activeNode.partNumber}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-2xs">
              {[
                ["Qty", `${activeNode.quantity} ${activeNode.uom}`],
                ["Unit", formatCurrency(activeNode.unitCost)],
                ["Extended", formatCurrency(activeNode.extendedCost)],
                ["% of BOM", `${stats.totalCost ? ((activeNode.extendedCost / stats.totalCost) * 100).toFixed(1) : "0.0"}%`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-surface p-2">
                  <p className="text-muted-foreground">{k}</p>
                  <p className="mt-0.5 font-medium tabular">{v}</p>
                </div>
              ))}
            </div>
            <RequiredByDate
              key={activeNode.id}
              bomId={activeBomId}
              line={detail.lines.find((l) => l.id === activeNode.id)}
            />
          </div>
        )}
      </div>

      <AddComponentDialog
        bomId={activeBomId}
        projectName={rootName}
        existingRefIds={existingRefIds}
        addBomLine={addBomLine}
      />
    </div>
  );
}

/**
 * PM planning date on a BOM line (PATCH /bom-lines/:id/required-date).
 * Unlike other line edits this is allowed at ANY BOM stage — roles:
 * Project Manager (own projects), Engineering, Administrator.
 */
function RequiredByDate({ bomId, line }: { bomId: string; line: ApiBomLine | undefined }) {
  const role = useAuthStore((s) => s.user?.role);
  const setDate = useSetLineRequiredDate();
  const canEdit = role === "Project Manager" || role === "Engineering" || role === "Administrator";
  if (!line) return null;

  const commit = async (value: string) => {
    const date = value || null;
    if ((line.required_by_date ?? null) === date) return;
    try {
      await setDate.mutateAsync({ lineId: line.id, date, bomId });
      toast.success("Required-by date set", date ? `${line.part_number} → ${date}` : `${line.part_number} — date cleared`);
    } catch (e) {
      toast.error("Couldn't set date", e instanceof Error ? e.message : "Please try again");
    }
  };

  if (!canEdit) {
    return (
      <div className="mt-2 rounded-lg border border-border bg-surface p-2 text-2xs">
        <p className="text-muted-foreground">Required by</p>
        <p className="mt-0.5 font-medium tabular">{line.required_by_date ?? "—"}</p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-2xs text-muted-foreground">Required by (planning date — editable at any stage)</p>
      <Input
        type="date"
        className="h-7 text-xs"
        defaultValue={line.required_by_date ?? ""}
        disabled={setDate.isPending}
        onBlur={(e) => commit(e.target.value)}
      />
    </div>
  );
}

function AddComponentDialog({
  bomId,
  projectName,
  existingRefIds,
  addBomLine,
}: {
  bomId: string;
  projectName: string;
  existingRefIds: Set<string>;
  addBomLine: ReturnType<typeof useAddBomLine>;
}) {
  const open = useUIStore((s) => s.bomAddComponentOpen);
  const setOpen = useUIStore((s) => s.setBomAddComponentOpen);

  const [query, setQuery] = React.useState("");
  const [partId, setPartId] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState("1");
  const [refDes, setRefDes] = React.useState("");

  // reset the form each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setPartId(null);
      setQty("1");
      setRefDes("");
    }
  }, [open]);

  const partsQuery = useParts(query.trim() ? { search: query.trim(), limit: 50 } : { limit: 50 });
  const matches = partsQuery.data?.items ?? [];

  const selectedPart = partId ? matches.find((p) => p.id === partId) ?? null : null;
  const qtyNum = Number(qty);
  const canAdd = !!selectedPart && Number.isFinite(qtyNum) && qtyNum > 0 && !addBomLine.isPending;

  const submit = async () => {
    if (!selectedPart || !Number.isFinite(qtyNum) || qtyNum <= 0) return;
    try {
      await addBomLine.mutateAsync({
        bomId,
        body: {
          part_id: selectedPart.id,
          quantity: qtyNum,
          ref_designator: refDes.trim() || undefined,
        },
      });
      toast.success("Component added", `${selectedPart.name} ×${qtyNum} → ${projectName}`);
      setOpen(false);
    } catch (e) {
      toast.error("Add failed", e instanceof Error ? e.message : "Could not add component");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add component</DialogTitle>
          <DialogDescription>Insert a Material Master part into {projectName}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search parts by name or code…"
              className="pl-8"
            />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            {partsQuery.isLoading ? (
              <div className="px-3 py-6 text-center text-2xs text-muted-foreground">Loading parts…</div>
            ) : matches.length === 0 ? (
              <div className="px-3 py-6 text-center text-2xs text-muted-foreground">No matching parts</div>
            ) : (
              matches.map((p) => {
                const inBom = existingRefIds.has(p.id);
                const isSel = partId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPartId(p.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 border-b border-border/50 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-accent/50",
                      isSel && "bg-primary/10 hover:bg-primary/10",
                    )}
                  >
                    <Thumbnail hue={(p.partNumber.length * 47) % 360} size={26} icon={Box} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium">{p.name}</span>
                        {inBom && <Badge variant="muted">in BOM</Badge>}
                      </div>
                      <span className="font-mono text-2xs text-muted-foreground">{p.partNumber}</span>
                    </div>
                    <span className="shrink-0 text-2xs tabular text-muted-foreground">{formatCurrency(p.unitCost)}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-2xs font-medium text-muted-foreground">
                Quantity{selectedPart ? ` (${selectedPart.uom})` : ""}
              </span>
              <Input
                type="number"
                min={0}
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-2xs font-medium text-muted-foreground">Ref. designator (optional)</span>
              <Input value={refDes} onChange={(e) => setRefDes(e.target.value)} placeholder="e.g. P-101" />
            </label>
          </div>

          {selectedPart && Number.isFinite(qtyNum) && qtyNum > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-sunken/40 px-3 py-2 text-2xs">
              <span className="text-muted-foreground">Extended cost</span>
              <span className="font-semibold tabular">{formatCurrency(selectedPart.unitCost * qtyNum)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canAdd} onClick={submit}>
            Add component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RootRow({ node }: { node: BomNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-sunken/50 px-4 py-2">
      <Box className="ml-8 size-4 text-primary" />
      <span className="text-[13px] font-semibold">{node.name}</span>
      <span className="font-mono text-2xs text-muted-foreground">{node.partNumber}</span>
      <Badge variant="default" className="ml-1">Project BOM</Badge>
      <span className="ml-auto text-[13px] font-semibold tabular text-primary">{formatCurrency(node.extendedCost)}</span>
    </div>
  );
}
