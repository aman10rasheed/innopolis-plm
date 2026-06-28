"use client";

import * as React from "react";
import {
  Search,
  FileText,
  Download,
  CalendarClock,
  Clock,
  DollarSign,
  ShieldCheck,
  Boxes,
  GitPullRequestArrow,
  Factory,
  AlertTriangle,
  Sparkles,
  Layers,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { StatCard } from "@/components/shared/stat-card";
import {
  AreaTrend,
  BarChartMini,
  DonutChart,
  LineTrend,
  MultiBar,
} from "@/components/shared/charts";
import { db, totalRolledCost } from "@/mock/db";
import {
  costTrendSeries,
  manufacturingProgress,
  monthlySeries,
  supplierPerfSeries,
} from "@/mock/series";
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  timeAgo,
} from "@/lib/utils";

type ReportType = "Cost" | "Supplier" | "Engineering" | "Inventory" | "Quality" | "Compliance";

interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  icon: React.ComponentType<{ className?: string }>;
  lastGenerated: string; // ISO
  schedule: string;
  owner: string;
  description: string;
}

const REPORTS: ReportTemplate[] = [
  {
    id: "r1",
    name: "Monthly BOM Cost Rollup",
    type: "Cost",
    icon: DollarSign,
    lastGenerated: iso(2),
    schedule: "Monthly",
    owner: "Finance Ops",
    description: "Rolled project BOM cost, actual vs. target and variance by family.",
  },
  {
    id: "r2",
    name: "Supplier Scorecard Q2",
    type: "Supplier",
    icon: ShieldCheck,
    lastGenerated: iso(5),
    schedule: "Quarterly",
    owner: "Procurement",
    description: "On-time, quality and risk ranking across active suppliers.",
  },
  {
    id: "r3",
    name: "Open ECO Summary",
    type: "Engineering",
    icon: GitPullRequestArrow,
    lastGenerated: iso(1),
    schedule: "Weekly",
    owner: "Eng. PMO",
    description: "Pipeline of in-flight engineering changes with aging and impact.",
  },
  {
    id: "r4",
    name: "Inventory Health",
    type: "Inventory",
    icon: Boxes,
    lastGenerated: iso(1),
    schedule: "Daily",
    owner: "Supply Chain",
    description: "On-hand vs. reorder coverage and at-risk SKUs by warehouse.",
  },
  {
    id: "r5",
    name: "Obsolescence Risk",
    type: "Engineering",
    icon: AlertTriangle,
    lastGenerated: iso(9),
    schedule: "Monthly",
    owner: "Sustaining Eng.",
    description: "Parts approaching end-of-life and single-source exposure.",
  },
  {
    id: "r6",
    name: "New Part Introductions",
    type: "Engineering",
    icon: Sparkles,
    lastGenerated: iso(3),
    schedule: "Weekly",
    owner: "NPI Team",
    description: "Recently released parts and their qualification status.",
  },
  {
    id: "r7",
    name: "Manufacturing Yield",
    type: "Quality",
    icon: Factory,
    lastGenerated: iso(1),
    schedule: "Daily",
    owner: "Quality",
    description: "First-pass yield, scrap and rework trends by line.",
  },
  {
    id: "r8",
    name: "Spend Analysis",
    type: "Cost",
    icon: Layers,
    lastGenerated: iso(4),
    schedule: "Monthly",
    owner: "Finance Ops",
    description: "Category and supplier spend concentration with YoY delta.",
  },
  {
    id: "r9",
    name: "Compliance (RoHS / REACH)",
    type: "Compliance",
    icon: ShieldCheck,
    lastGenerated: iso(7),
    schedule: "Quarterly",
    owner: "Compliance",
    description: "Material declarations coverage and exceptions by family.",
  },
  {
    id: "r10",
    name: "Revision Activity",
    type: "Engineering",
    icon: FileText,
    lastGenerated: iso(2),
    schedule: "Weekly",
    owner: "Eng. PMO",
    description: "Released revisions, churn and authorship over time.",
  },
];

const TYPE_VARIANT: Record<ReportType, "info" | "success" | "warning" | "secondary" | "destructive" | "default"> = {
  Cost: "info",
  Supplier: "success",
  Engineering: "default",
  Inventory: "warning",
  Quality: "secondary",
  Compliance: "destructive",
};

function iso(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

export function ReportsView() {
  const [selectedId, setSelectedId] = React.useState(REPORTS[0]!.id);
  const [query, setQuery] = React.useState("");

  const filtered = REPORTS.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.type.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = REPORTS.find((r) => r.id === selectedId) ?? REPORTS[0]!;

  return (
    <div className="flex h-full">
      {/* Left: template list */}
      <div className="flex w-[340px] shrink-0 flex-col border-r border-border bg-surface/30">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports…"
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filtered.map((r) => {
              const active = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all",
                    active
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-transparent hover:border-border hover:bg-accent/40",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <r.icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{r.name}</p>
                      <p className="mt-0.5 line-clamp-1 text-2xs text-muted-foreground">
                        {r.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant={TYPE_VARIANT[r.type]}>{r.type}</Badge>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground">
                          <CalendarClock className="size-3" /> {r.schedule}
                        </span>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1 text-2xs text-muted-foreground">
                        <Clock className="size-3" /> {timeAgo(r.lastGenerated)} · {r.owner}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right: preview */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <ReportPreview report={selected} />
        </div>
      </ScrollArea>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function ReportPreview({ report }: { report: ReportTemplate }) {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="size-4" />
          Preview · generated {timeAgo(report.lastGenerated)}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Schedule", `${report.name} runs ${report.schedule.toLowerCase()}`)}
          >
            <CalendarClock className="size-4" /> Schedule
          </Button>
          <Button
            size="sm"
            onClick={() => toast.success("Export started", `${report.name}.pdf is being prepared`)}
          >
            <Download className="size-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Page-like document */}
      <div className="overflow-hidden rounded-xl border border-border bg-white text-slate-900 shadow-xl ring-1 ring-black/5 dark:bg-zinc-50">
        {/* Title block */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-8 py-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <report.icon className="size-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Acme Robotics · {report.type} Report
              </p>
              <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                {report.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{report.description}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p className="font-mono font-semibold text-slate-600">
              RPT-{report.id.toUpperCase()}
            </p>
            <p className="mt-1">Owner · {report.owner}</p>
            <p>Cadence · {report.schedule}</p>
          </div>
        </div>

        {/* Body — light themed so it reads like a printed doc */}
        <div className="space-y-7 px-8 py-7 [--card:0_0%_100%]">
          <ReportBody report={report} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-8 py-3 text-2xs text-slate-400">
          <span>Confidential · Innopolis PLM</span>
          <span>Page 1 of 1 · {new Date().toLocaleDateString("en-US")}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function ReportTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h3>
  );
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-2xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold tabular text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-2xs text-slate-400">{sub}</p>}
    </div>
  );
}

function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <table className="w-full text-[13px] text-slate-700">
      <thead>
        <tr className="border-b border-slate-200 text-2xs uppercase tracking-wide text-slate-400">
          {headers.map((h, i) => (
            <th key={i} className={cn("px-2 py-2 font-medium", i === 0 ? "text-left" : "text-right")}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td key={j} className={cn("px-2 py-2", j === 0 ? "text-left font-medium text-slate-900" : "text-right tabular")}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
function ReportBody({ report }: { report: ReportTemplate }) {
  const d = db();

  // COST family
  if (report.type === "Cost") {
    const costTrend = costTrendSeries();
    const rolled = totalRolledCost();
    const families = familyAgg(d);
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Rolled Cost" value={formatCompactCurrency(rolled)} sub="all project BOMs" />
          <KpiTile label="Avg Unit" value={formatCurrency(avg(d.products.map((p) => p.unitCost)), { maximumFractionDigits: 0 })} />
          <KpiTile label="Avg Margin" value={`${avg(d.products.map((p) => p.marginPct)).toFixed(1)}%`} />
          <KpiTile label="YoY" value="-6.8%" sub="vs prior year" />
        </div>
        <div>
          <ReportTitle>Cost Trend — Actual vs. Target</ReportTitle>
          <AreaTrend data={costTrend} dataKey="actual" secondKey="target" prefix="$" height={200} />
        </div>
        <div>
          <ReportTitle>Cost & Margin by Family</ReportTitle>
          <DocTable
            headers={["Family", "Avg Cost", "Avg Target", "Margin", "Revenue"]}
            rows={families.map((f) => [
              f.family,
              formatCurrency(f.avgUnit, { maximumFractionDigits: 0 }),
              formatCurrency(f.avgTarget, { maximumFractionDigits: 0 }),
              <span className={cn("font-semibold", f.margin >= 30 ? "text-emerald-600" : "text-amber-600")}>
                {f.margin.toFixed(1)}%
              </span>,
              formatCompactCurrency(f.revenue),
            ])}
          />
        </div>
      </>
    );
  }

  // SUPPLIER
  if (report.type === "Supplier") {
    const perf = supplierPerfSeries();
    const top = [...d.suppliers].sort((a, b) => b.rating - a.rating).slice(0, 6);
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Suppliers" value={formatNumber(d.suppliers.length)} />
          <KpiTile label="Avg On-time" value={`${Math.round(avg(d.suppliers.map((s) => s.onTimePct)))}%`} />
          <KpiTile label="Avg Quality" value={`${Math.round(avg(d.suppliers.map((s) => s.qualityPct)))}%`} />
          <KpiTile label="Annual Spend" value={formatCompactCurrency(d.suppliers.reduce((s, x) => s + x.annualSpend, 0))} />
        </div>
        <div>
          <ReportTitle>Performance Trend</ReportTitle>
          <LineTrend
            data={perf}
            height={200}
            keys={[
              { key: "onTime", color: "hsl(var(--primary))", name: "On-time %" },
              { key: "quality", color: "hsl(var(--success))", name: "Quality %" },
            ]}
          />
        </div>
        <div>
          <ReportTitle>Top Suppliers</ReportTitle>
          <DocTable
            headers={["Supplier", "Tier", "On-time", "Quality", "Spend"]}
            rows={top.map((s) => [
              s.name,
              `T${s.tier}`,
              `${s.onTimePct}%`,
              `${s.qualityPct}%`,
              formatCompactCurrency(s.annualSpend),
            ])}
          />
        </div>
      </>
    );
  }

  // INVENTORY
  if (report.type === "Inventory") {
    const shortages = d.inventory.filter((i) => i.status !== "In Stock");
    const byWarehouse = d.warehouses.map((w) => ({ label: w.code, value: w.skuCount }));
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="SKUs" value={formatNumber(d.inventory.length)} />
          <KpiTile label="Shortages" value={formatNumber(shortages.length)} sub="below reorder" />
          <KpiTile label="Stock Value" value={formatCompactCurrency(d.warehouses.reduce((s, w) => s + w.stockValue, 0))} />
          <KpiTile label="Warehouses" value={formatNumber(d.warehouses.length)} />
        </div>
        <div>
          <ReportTitle>SKU Coverage by Warehouse</ReportTitle>
          <BarChartMini data={byWarehouse} height={190} color="hsl(var(--warning))" />
        </div>
        <div>
          <ReportTitle>At-risk Items</ReportTitle>
          <DocTable
            headers={["Part", "Warehouse", "Available", "Reorder", "Status"]}
            rows={shortages.slice(0, 8).map((i) => [
              i.partName,
              i.warehouseCode,
              formatNumber(i.available),
              formatNumber(i.reorderPoint),
              <span className="text-amber-600">{i.status}</span>,
            ])}
          />
        </div>
      </>
    );
  }

  // QUALITY
  if (report.type === "Quality") {
    const mfg = manufacturingProgress();
    const yieldTrend = monthlySeries(101, 95, 0.2, 3).map((m) => ({ label: m.label, value: Math.min(100, m.value) }));
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="First-pass Yield" value="97.1%" sub="rolling 30d" />
          <KpiTile label="Scrap" value="1.4%" />
          <KpiTile label="Rework" value="1.5%" />
          <KpiTile label="Lines" value={`${mfg.length}`} />
        </div>
        <div>
          <ReportTitle>First-pass Yield Trend</ReportTitle>
          <AreaTrend data={yieldTrend} prefix="" height={200} color="hsl(var(--success))" />
        </div>
        <div>
          <ReportTitle>Build Attainment by Line</ReportTitle>
          <MultiBar
            data={mfg}
            height={200}
            keys={[
              { key: "planned", color: "hsl(var(--muted-foreground) / 0.4)", name: "Planned" },
              { key: "actual", color: "hsl(var(--primary))", name: "Actual" },
            ]}
          />
        </div>
      </>
    );
  }

  // COMPLIANCE
  if (report.type === "Compliance") {
    const asme = d.parts.filter((p) => p.compliance.includes("ASME")).length;
    const gmp = d.parts.filter((p) => p.compliance.includes("GMP")).length;
    const coverage = [
      { name: "ASME covered", value: asme, color: "hsl(var(--success))" },
      { name: "GMP covered", value: gmp, color: "hsl(var(--info))" },
      { name: "Uncovered", value: Math.max(0, d.parts.length - Math.max(asme, gmp)), color: "hsl(var(--destructive))" },
    ];
    const families = familyAgg(d).slice(0, 6);
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Total Materials" value={formatNumber(d.parts.length)} />
          <KpiTile label="ASME" value={formatNumber(asme)} sub="certified" />
          <KpiTile label="GMP" value={formatNumber(gmp)} sub="contact parts" />
          <KpiTile label="Coverage" value={`${Math.round((asme / Math.max(1, d.parts.length)) * 100)}%`} />
        </div>
        <div>
          <ReportTitle>Declaration Coverage</ReportTitle>
          <DonutChart data={coverage} height={200} />
        </div>
        <div>
          <ReportTitle>Family Exposure</ReportTitle>
          <DocTable
            headers={["Family", "Products", "Avg Cost", "Status"]}
            rows={families.map((f) => [
              f.family,
              formatNumber(f.count),
              formatCurrency(f.avgUnit, { maximumFractionDigits: 0 }),
              <span className="text-emerald-600">Compliant</span>,
            ])}
          />
        </div>
      </>
    );
  }

  // ENGINEERING (default — ECO summary, NPI, obsolescence, revision activity)
  const ecoStatusMix = (() => {
    const map = new Map<string, number>();
    for (const e of d.ecos) map.set(e.status, (map.get(e.status) ?? 0) + 1);
    const colors: Record<string, string> = {
      Draft: "hsl(var(--muted-foreground))",
      Review: "hsl(var(--warning))",
      Approved: "hsl(var(--info))",
      Released: "hsl(var(--primary))",
      Completed: "hsl(var(--success))",
    };
    return [...map.entries()].map(([name, value]) => ({
      name,
      value,
      color: colors[name] ?? "hsl(var(--muted-foreground))",
    }));
  })();
  const recentEcos = [...d.ecos]
    .filter((e) => e.status !== "Completed")
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 7);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile label="Open ECOs" value={formatNumber(d.ecos.filter((e) => e.status !== "Completed").length)} />
        <KpiTile label="Critical" value={formatNumber(d.ecos.filter((e) => e.priority === "Critical").length)} />
        <KpiTile label="Avg Progress" value={`${Math.round(avg(d.ecos.map((e) => e.progress)))}%`} />
        <KpiTile label="Cost Impact" value={formatCompactCurrency(d.ecos.reduce((s, e) => s + e.costImpact, 0))} />
      </div>
      <div>
        <ReportTitle>ECO Pipeline</ReportTitle>
        <DonutChart data={ecoStatusMix} height={200} />
      </div>
      <div>
        <ReportTitle>In-flight Changes</ReportTitle>
        <DocTable
          headers={["ECO", "Title", "Priority", "Items", "Progress"]}
          rows={recentEcos.map((e) => [
            <span className="font-mono">{e.number}</span>,
            e.title,
            e.priority,
            formatNumber(e.affectedItems),
            `${e.progress}%`,
          ])}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
function avg(arr: number[]) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function familyAgg(d: ReturnType<typeof db>) {
  const map = new Map<
    string,
    { unit: number; target: number; margin: number; revenue: number; count: number }
  >();
  for (const p of d.products) {
    const cur = map.get(p.family) ?? { unit: 0, target: 0, margin: 0, revenue: 0, count: 0 };
    cur.unit += p.unitCost;
    cur.target += p.targetCost;
    cur.margin += p.marginPct;
    cur.revenue += p.msrp * p.unitsBuilt;
    cur.count += 1;
    map.set(p.family, cur);
  }
  return [...map.entries()]
    .map(([family, v]) => ({
      family,
      avgUnit: v.unit / v.count,
      avgTarget: v.target / v.count,
      margin: v.margin / v.count,
      revenue: v.revenue,
      count: v.count,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
