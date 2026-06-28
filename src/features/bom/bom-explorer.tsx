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
  GitCompare,
  Boxes,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Thumbnail } from "@/components/shared/thumbnail";
import { DonutChart } from "@/components/shared/charts";
import { buildProjectBom, flattenBom, rootProjects } from "@/mock/db";
import type { BomNode } from "@/types";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { LIFECYCLE_VARIANT } from "@/constants/status";
import { toast } from "@/components/ui/toast";

const ROOTS = rootProjects();
const LEVEL_COLORS = [
  "border-l-primary",
  "border-l-info",
  "border-l-warning",
  "border-l-success",
  "border-l-destructive",
  "border-l-muted-foreground",
];

export function BomExplorer() {
  const [rootIdx, setRootIdx] = React.useState(0);
  const root = ROOTS[rootIdx]!;
  const tree = React.useMemo(() => buildProjectBom(root.id), [root.id]);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(["root"]));
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState("");
  const [activeNode, setActiveNode] = React.useState<BomNode | null>(null);

  // reset when root changes
  React.useEffect(() => {
    setExpanded(new Set(["root"]));
    setSelected(new Set());
    setActiveNode(null);
  }, [root.id]);

  const allIds = React.useMemo(() => {
    const ids: string[] = [];
    const walk = (n: BomNode) => {
      if (n.children?.length) ids.push(n.id);
      n.children?.forEach(walk);
    };
    if (tree) walk(tree);
    return ids;
  }, [tree]);

  const flat = React.useMemo(() => {
    if (!tree) return [];
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
    if (!tree) return null;
    const all = flattenBom(tree, new Set(allIds));
    const parts = all.filter((n) => n.type === "part");
    const unique = new Set(parts.map((p) => p.refId));
    const dups = parts.filter((p) => p.isDuplicate);
    const issues = all.filter((n) => n.hasIssue);
    const maxDepth = Math.max(...all.map((n) => n.level));
    const maxLead = Math.max(...parts.map((p) => p.leadTimeDays), 0);
    // cost by category
    const byCat = new Map<string, number>();
    parts.forEach((p) => byCat.set(p.category ?? "Other", (byCat.get(p.category ?? "Other") ?? 0) + p.extendedCost));
    const catData = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name,
        value: Math.round(value),
        color: `hsl(${(i * 47 + 168) % 360} 60% 50%)`,
      }));
    return {
      totalParts: parts.reduce((s, p) => s + p.quantity, 0),
      uniqueParts: unique.size,
      lineItems: all.length - 1,
      totalCost: tree.extendedCost,
      maxDepth,
      maxLead,
      dups: new Set(dups.map((d) => d.refId)).size,
      issues: issues.length,
      catData,
    };
  }, [tree, allIds]);

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

  if (!tree || !stats) return null;

  return (
    <div className="flex h-full min-h-0">
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Boxes className="size-4 text-primary" />
                <span className="max-w-[220px] truncate">{root.name}</span>
                <ChevronRight className="size-3.5 rotate-90 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
              <DropdownMenuLabel>Project BOMs</DropdownMenuLabel>
              {ROOTS.map((r, i) => (
                <DropdownMenuItem key={r.id} onClick={() => setRootIdx(i)}>
                  <Thumbnail hue={r.thumbnailHue} size={26} icon={Boxes} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{r.name}</p>
                    <p className="font-mono text-2xs text-muted-foreground">{r.code}</p>
                  </div>
                  {i === rootIdx && <Badge variant="default">current</Badge>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1 text-2xs text-muted-foreground">
            <span>{root.customer}</span>
            <ChevronRight className="size-3" />
            <span className="font-mono">{root.code}</span>
            <Badge variant="outline" className="ml-1">Rev {root.revision}</Badge>
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
            <Button variant="outline" size="icon-sm" onClick={() => toast.success("Export BOM", "Indented BOM exported as XLSX")}>
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
            ["Issues", String(stats.issues), stats.issues ? "text-destructive" : null],
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
                  <ContextMenuItem onClick={() => toast.info("Where used", `${node.partNumber}`)}><Network /> Where used</ContextMenuItem>
                  <ContextMenuItem onClick={() => toast.info("Compare", "Pick a revision to diff")}><GitCompare /> Compare revision</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => toast.success("Copied", node.partNumber)}><Copy /> Copy part number</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 border-t border-border bg-surface/60 px-4 py-2">
            <span className="text-[13px] font-medium">{selected.size} selected</span>
            <div className="h-4 w-px bg-border" />
            <Button size="xs" variant="ghost" onClick={() => toast.success("Mass edit", `${selected.size} lines`)}>Mass edit qty</Button>
            <Button size="xs" variant="ghost" onClick={() => toast.info("Substitute", "Choose replacement part")}>Substitute</Button>
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
            <DonutChart data={stats.catData} height={180} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xs text-muted-foreground">Total</span>
              <span className="text-base font-semibold tabular">{formatCurrency(stats.totalCost)}</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {stats.catData.map((c) => (
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
                ["% of BOM", `${((activeNode.extendedCost / stats.totalCost) * 100).toFixed(1)}%`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-surface p-2">
                  <p className="text-muted-foreground">{k}</p>
                  <p className="mt-0.5 font-medium tabular">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
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
