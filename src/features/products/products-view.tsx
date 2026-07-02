"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderKanban,
  Search,
  LayoutGrid,
  Rows3,
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  CircleDollarSign,
  TrendingUp,
  Coins,
  ShieldCheck,
  Layers,
  CalendarDays,
  Check,
  ListTree,
  FileText,
  GitPullRequestArrow,
  Activity as ActivityIcon,
  User as UserIcon,
} from "lucide-react";
import { useProjects, useProject, useBoms, useRfqs, useSaveProject } from "@/lib/api";
import { QueryBoundary } from "@/components/shared/query-boundary";
import { toast } from "@/components/ui/toast";
import { canCreate } from "@/auth/permissions";
import { useAuthStore } from "@/stores/auth-store";
import type { Product, ProjectStage, Eco } from "@/types";
import { PROJECT_STAGES } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Thumbnail } from "@/components/shared/thumbnail";
import { AreaTrend } from "@/components/shared/charts";
import {
  PROJECT_STAGE_VARIANT,
  LIFECYCLE_VARIANT,
  BOM_STAGE_VARIANT,
  RFQ_STATUS_VARIANT,
} from "@/constants/status";
import {
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatDate,
  cn,
} from "@/lib/utils";
import { monthlySeries } from "@/mock/series";

function healthColor(h: number) {
  return h > 80 ? "bg-success" : h > 60 ? "bg-warning" : "bg-destructive";
}

/** Minimal engineer display shape — sourced from the record's inline
 * attribution fields (no admin-only users lookup). */
type UserLike = { name?: string | null; initials?: string | null; hue?: number | null; role?: string };

/** Build an engineer display object from a project's inline fields, or
 * undefined when the API didn't return attribution (e.g. list responses). */
function engineerOf(p: Product): UserLike | undefined {
  return p.engineerName || p.engineerInitials
    ? { name: p.engineerName, initials: p.engineerInitials, hue: p.engineerHue }
    : undefined;
}

export function ProductsView() {
  const q = useProjects();
  const projects = q.data?.items ?? [];
  const FAMILIES = React.useMemo(
    () => [...new Set(projects.map((p) => p.family))],
    [projects],
  );
  const [query, setQuery] = React.useState("");
  const [family, setFamily] = React.useState<string | null>(null);
  const [stage, setStage] = React.useState<ProjectStage | null>(null);
  const [view, setView] = React.useState<"grid" | "stage">("grid");
  const [active, setActive] = React.useState<Product | null>(null);

  const stageCounts = React.useMemo(() => {
    const m = new Map<ProjectStage, number>();
    for (const s of PROJECT_STAGES) m.set(s, 0);
    for (const p of projects) m.set(p.stage, (m.get(p.stage) ?? 0) + 1);
    return m;
  }, [projects]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (!family || p.family === family) &&
        (!stage || p.stage === stage) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.projectNumber.toLowerCase().includes(q) ||
          p.customer.toLowerCase().includes(q)),
    );
  }, [projects, family, stage, query]);

  return (
    <QueryBoundary
      isLoading={q.isLoading}
      isError={q.isError}
      error={q.error}
      onRetry={q.refetch}
      className="h-full"
    >
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Lifecycle pipeline rail ────────────────────────────────── */}
      <PipelineRail
        counts={stageCounts}
        total={projects.length}
        active={stage}
        onPick={(s) => setStage((cur) => (cur === s ? null : s))}
      />

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search project, number, customer…"
            className="h-8 pl-8"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Button
            variant={family === null ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setFamily(null)}
          >
            All packages
          </Button>
          {FAMILIES.map((f) => (
            <Button
              key={f}
              variant={family === f ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setFamily(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {(stage || family || query) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setStage(null);
                setFamily(null);
                setQuery("");
              }}
            >
              <X className="size-3.5" /> Clear
            </Button>
          )}
          <span className="text-2xs text-muted-foreground tabular">
            {filtered.length} of {projects.length}
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView("grid")}
              title="Grid"
              className={cn(
                "rounded p-1.5 transition-colors",
                view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setView("stage")}
              title="Group by stage"
              className={cn(
                "rounded p-1.5 transition-colors",
                view === "stage" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Rows3 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <ScrollArea className="min-h-0 flex-1">
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} engineer={engineerOf(p)} onOpen={() => setActive(p)} />
            ))}
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {PROJECT_STAGES.map((s) => {
              const group = filtered.filter((p) => p.stage === s);
              if (group.length === 0) return null;
              return (
                <section key={s}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <Badge variant={PROJECT_STAGE_VARIANT[s]}>{s}</Badge>
                    <span className="text-2xs text-muted-foreground tabular">{group.length}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {group.map((p) => (
                      <ProjectCard key={p.id} project={p} engineer={engineerOf(p)} onOpen={() => setActive(p)} />
                    ))}
                  </div>
                </section>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No projects match your filters.</p>
            )}
          </div>
        )}
      </ScrollArea>

      {(() => {
        // Re-read the selected project from the live query so the drawer reflects
        // stage changes (and any other edits) after a refetch, not a stale snapshot.
        const live = active ? projects.find((p) => p.id === active.id) ?? active : null;
        return (
          <ProjectDrawer
            project={live}
            onClose={() => setActive(null)}
          />
        );
      })()}
    </div>
    </QueryBoundary>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  Lifecycle pipeline rail — the centrepiece
 * ════════════════════════════════════════════════════════════════════ */
function PipelineRail({
  counts,
  total,
  active,
  onPick,
}: {
  counts: Map<ProjectStage, number>;
  total: number;
  active: ProjectStage | null;
  onPick: (s: ProjectStage) => void;
}) {
  return (
    <div className="border-b border-border bg-surface-sunken/40 px-3 py-3">
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {PROJECT_STAGES.map((s, i) => {
          const count = counts.get(s) ?? 0;
          const isActive = active === s;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <React.Fragment key={s}>
              <button
                onClick={() => onPick(s)}
                title={`${s} — ${count} project${count === 1 ? "" : "s"}`}
                className={cn(
                  "group relative flex min-w-[7.5rem] flex-1 flex-col justify-between rounded-lg border px-2.5 py-2 text-left transition-all",
                  isActive
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.5)]"
                    : "border-border bg-surface hover:border-border-strong hover:bg-accent/40",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold tabular",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-raised text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-base font-semibold leading-none tabular",
                      isActive ? "text-primary" : count > 0 ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </div>
                <span
                  className={cn(
                    "mt-1.5 line-clamp-2 text-2xs font-medium leading-tight",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {s}
                </span>
                <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-full rounded-full transition-all", isActive ? "bg-primary" : "bg-muted-foreground/50")}
                    style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </button>
              {i < PROJECT_STAGES.length - 1 && (
                <div className="flex shrink-0 items-center text-border-strong">
                  <ChevronRight className="size-3.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  Project card
 * ════════════════════════════════════════════════════════════════════ */
function ProjectCard({ project: p, engineer, onOpen }: { project: Product; engineer?: UserLike; onOpen: () => void }) {
  return (
    <Card interactive onClick={onOpen} className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <Thumbnail hue={p.thumbnailHue} size={44} icon={FolderKanban} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{p.customer}</p>
          <p className="truncate text-xs text-muted-foreground">{p.name}</p>
          <p className="mt-0.5 font-mono text-2xs text-muted-foreground">{p.projectNumber}</p>
        </div>
        <Badge variant={PROJECT_STAGE_VARIANT[p.stage]}>{p.stage}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-2xs text-muted-foreground">
        <Layers className="size-3" />
        <span className="truncate">{p.family}</span>
        <span className="text-border-strong">·</span>
        <span className="truncate">{p.category}</span>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-2xs">
          <span className="text-muted-foreground">Health</span>
          <span className="font-medium tabular">{p.health}%</span>
        </div>
        <Progress value={p.health} className="h-1.5" indicatorClassName={healthColor(p.health)} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <div>
          <p className="text-2xs text-muted-foreground">Est. cost</p>
          <p className="text-[13px] font-semibold tabular">{formatCompactCurrency(p.unitCost)}</p>
        </div>
        <div>
          <p className="text-2xs text-muted-foreground">Quoted</p>
          <p className="text-[13px] font-semibold tabular">{formatCompactCurrency(p.msrp)}</p>
        </div>
        <div>
          <p className="text-2xs text-muted-foreground">Margin</p>
          <p className="text-[13px] font-semibold tabular text-success">{p.marginPct}%</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          {engineer ? (
            <>
              <Avatar className="size-6">
                <AvatarFallback
                  className="text-[9px]"
                  style={{ background: `hsl(${engineer.hue ?? 220} 55% 22%)`, color: `hsl(${engineer.hue ?? 220} 80% 76%)` }}
                >
                  {engineer.initials ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-2xs text-muted-foreground">{engineer.name ?? "Unassigned"}</span>
            </>
          ) : (
            <span className="text-2xs text-muted-foreground/60">No lead engineer</span>
          )}
        </div>
        <span className="flex items-center gap-1 text-2xs text-muted-foreground">
          <ListTree className="size-3" />
          {formatNumber(p.unitsBuilt)} lines
          {p.openEcos > 0 && (
            <Badge variant="warning" className="ml-1">
              {p.openEcos}
            </Badge>
          )}
        </span>
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  Detail drawer
 * ════════════════════════════════════════════════════════════════════ */
function ProjectDrawer({ project, onClose }: { project: Product | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed right-0 top-0 z-[141] flex h-full w-[540px] max-w-[94vw] flex-col border-l border-border bg-surface-overlay shadow-lg"
          >
            <ProjectDrawerBody project={project} onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ProjectDrawerBody({ project, onClose }: { project: Product; onClose: () => void }) {
  // The detail endpoint returns inline engineer attribution (name/initials/hue);
  // list responses don't, so fetch the detail to show the lead engineer.
  const detailQ = useProject(project.id);
  const engineer = engineerOf(detailQ.data ?? project);
  const boms = (useBoms({ project_id: project.id }).data?.items ?? []).filter((b) => b.projectId === project.id);
  const rfqs = (useRfqs({ project_id: project.id }).data?.items ?? []).filter((r) => r.projectId === project.id);
  // No ECO/change-request endpoint is exposed by the API layer, so project
  // activity has no data source yet — the Activity tab renders its empty state.
  const ecos: Eco[] = [];
  const series = React.useMemo(
    () => monthlySeries(project.thumbnailHue, project.unitCost / 12, 30, 400),
    [project],
  );
  const currentIdx = PROJECT_STAGES.indexOf(project.stage);

  const saveProject = useSaveProject();
  const role = useAuthStore((s) => s.user?.role);
  const canMoveStage = canCreate(role, "project");

  const moveToStage = async (target: ProjectStage) => {
    if (target === project.stage || saveProject.isPending) return;
    try {
      await saveProject.mutateAsync({ id: project.id, body: { stage: target } });
      toast.success("Stage updated", `${project.projectNumber} → ${target}`);
    } catch (err) {
      toast.error(
        "Couldn't update stage",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  return (
    <>
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Thumbnail hue={project.thumbnailHue} size={52} icon={FolderKanban} />
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-tight">{project.name}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3" /> {project.customer}
              </p>
              <p className="font-mono text-2xs text-muted-foreground">
                {project.projectNumber} · Rev {project.revision}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge variant={PROJECT_STAGE_VARIANT[project.stage]}>{project.stage}</Badge>
                <Badge variant={LIFECYCLE_VARIANT[project.lifecycle]}>{project.lifecycle}</Badge>
                <Badge variant="muted">{project.family}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Lifecycle stepper */}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Lifecycle progress
        </p>
        <div className="flex items-center justify-between">
          {PROJECT_STAGES.map((s, i) => {
            const done = i < currentIdx;
            const isCurrent = i === currentIdx;
            const node = (
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[9px] font-semibold tabular transition-colors",
                  done && "border-success bg-success text-white",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !done && !isCurrent && "border-border bg-surface text-muted-foreground",
                  canMoveStage && !isCurrent && "cursor-pointer hover:border-primary hover:ring-2 hover:ring-primary/30",
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </div>
            );
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center" title={canMoveStage ? `Move to ${s}` : s}>
                  {canMoveStage ? (
                    <button
                      type="button"
                      onClick={() => moveToStage(s)}
                      disabled={saveProject.isPending || isCurrent}
                      aria-label={`Move to ${s}`}
                    >
                      {node}
                    </button>
                  ) : (
                    node
                  )}
                </div>
                {i < PROJECT_STAGES.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1",
                      i < currentIdx ? "bg-success" : "bg-border",
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-2xs text-muted-foreground">
            Stage {currentIdx + 1} of {PROJECT_STAGES.length} ·{" "}
            <span className="text-foreground">{project.stage}</span>
          </p>
          {canMoveStage && (
            <div className="flex items-center gap-1.5">
              <Button
                size="xs"
                variant="outline"
                className="gap-1"
                disabled={currentIdx <= 0 || saveProject.isPending}
                onClick={() => moveToStage(PROJECT_STAGES[currentIdx - 1])}
              >
                <ChevronLeft className="size-3" /> Back
              </Button>
              <Button
                size="xs"
                className="gap-1"
                disabled={currentIdx >= PROJECT_STAGES.length - 1 || saveProject.isPending}
                onClick={() => moveToStage(PROJECT_STAGES[currentIdx + 1])}
              >
                Advance <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-4 pt-2">
          <TabsList className="h-8 bg-transparent p-0">
            {[
              ["overview", "Overview"],
              ["boms", `BOMs${boms.length ? ` (${boms.length})` : ""}`],
              ["rfqs", `RFQs${rfqs.length ? ` (${rfqs.length})` : ""}`],
              ["activity", "Activity"],
            ].map(([v, l]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="h-8 rounded-none border-b-2 border-transparent px-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {/* Overview */}
          <TabsContent value="overview" className="m-0 space-y-4 p-4">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
              {([
                ["Estimated cost", formatCurrency(project.unitCost), CircleDollarSign],
                ["Quoted price", formatCurrency(project.msrp), Coins],
                ["Target cost", formatCurrency(project.targetCost), TrendingUp],
                ["Margin", `${project.marginPct}%`, TrendingUp],
                ["BOM lines", formatNumber(project.unitsBuilt), ListTree],
                ["Health", `${project.health}%`, ShieldCheck],
              ] as const).map(([k, v, Icon]) => (
                <div key={k} className="bg-surface p-3">
                  <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <Icon className="size-3" /> {k}
                  </div>
                  <p className="mt-1 text-sm font-semibold tabular">{v}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-2xs">
                <span className="text-muted-foreground">Project health</span>
                <span className="font-medium tabular">{project.health}%</span>
              </div>
              <Progress value={project.health} className="h-1.5" indicatorClassName={healthColor(project.health)} />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <Avatar className="size-9">
                <AvatarFallback
                  style={{ background: `hsl(${engineer?.hue ?? 220} 55% 22%)`, color: `hsl(${engineer?.hue ?? 220} 80% 76%)` }}
                >
                  {engineer?.initials ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13px] font-medium">
                  <UserIcon className="size-3 text-muted-foreground" /> {engineer?.name ?? "Unassigned"}
                </p>
                <p className="text-2xs text-muted-foreground">Lead engineer</p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-2xs text-muted-foreground">
                  <CalendarDays className="size-3" /> Enquiry
                </p>
                <p className="text-2xs font-medium">{formatDate(project.releaseDate)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="mb-1 text-[13px] font-semibold">Estimated cost trend</p>
              <p className="mb-2 text-2xs text-muted-foreground">Modelled spend — trailing 12 months</p>
              <AreaTrend data={series} height={150} prefix="$" showAxis />
            </div>

            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{project.description}</p>
            </div>
          </TabsContent>

          {/* BOMs */}
          <TabsContent value="boms" className="m-0 p-4">
            {boms.length === 0 ? (
              <EmptyTab icon={FileText} label="No BOMs raised for this project yet." />
            ) : (
              <div className="space-y-1.5">
                {boms.map((b) => (
                  <div key={b.id} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-medium">{b.number}</span>
                        <Badge variant="muted">{b.bomType}</Badge>
                      </div>
                      <Badge variant={BOM_STAGE_VARIANT[b.stage]}>{b.stage}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-2xs text-muted-foreground">
                      <span className="tabular">{formatNumber(b.lineItems)} line items · Rev {b.revision}</span>
                      <span className="text-[13px] font-semibold tabular text-foreground">
                        {formatCompactCurrency(b.totalValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* RFQs */}
          <TabsContent value="rfqs" className="m-0 p-4">
            {rfqs.length === 0 ? (
              <EmptyTab icon={GitPullRequestArrow} label="No RFQs issued for this project yet." />
            ) : (
              <div className="space-y-1.5">
                {rfqs.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-medium">{r.number}</span>
                        <Badge variant="muted">{r.mode}</Badge>
                      </div>
                      <Badge variant={RFQ_STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-2xs text-muted-foreground">
                      <span className="tabular">
                        {formatNumber(r.lineItems)} items · {r.quotesReceived}/{r.quotesExpected} quotes
                      </span>
                      <span className="text-[13px] font-semibold tabular text-foreground">
                        {formatCompactCurrency(r.estValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="m-0 p-4">
            {ecos.length === 0 ? (
              <EmptyTab icon={ActivityIcon} label="No activity recorded for this project yet." />
            ) : (
              <div className="relative space-y-0 pl-5">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
                {ecos.map((e) => (
                  <div key={e.id} className="relative pb-4">
                    <div className="absolute -left-5 top-1 size-3.5 rounded-full border-2 border-surface bg-primary" />
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs text-muted-foreground">{e.number}</span>
                      <Badge variant="muted">{e.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-[13px]">{e.title}</p>
                    <p className="text-2xs text-muted-foreground">{formatDate(e.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
}

function EmptyTab({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-surface text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-2xs text-muted-foreground">{label}</p>
    </div>
  );
}
