"use client";

import * as React from "react";
import {
  CircleDollarSign,
  Boxes,
  Layers,
  TrendingDown,
  Factory,
  Truck,
  Package,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { Thumbnail } from "@/components/shared/thumbnail";
import { AreaTrend, DonutChart, MultiBar } from "@/components/shared/charts";
import { db, getSupplier, totalRolledCost } from "@/mock/db";
import { costTrendSeries } from "@/mock/series";
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
} from "@/lib/utils";

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export function CostAnalysisView() {
  const d = db();
  const costTrend = React.useMemo(costTrendSeries, []);

  const metrics = React.useMemo(() => {
    const rolled = totalRolledCost();
    const avgUnit =
      d.products.reduce((s, p) => s + p.unitCost, 0) / Math.max(1, d.products.length);
    const totalUnitCost = d.parts.reduce((s, p) => s + p.unitCost, 0);
    // material vs mfg split derived deterministically from sourcing mix
    const materialShare =
      d.parts
        .filter((p) => p.sourcing !== "Make")
        .reduce((s, p) => s + p.unitCost, 0) / Math.max(1, totalUnitCost);
    return {
      rolled,
      avgUnit,
      materialPct: Math.round(materialShare * 100),
      mfgPct: 100 - Math.round(materialShare * 100),
    };
  }, [d]);

  // Cost breakdown by category (top 6)
  const categoryBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of d.parts) {
      const spend = p.unitCost * Math.max(1, p.whereUsedCount);
      map.set(p.category, (map.get(p.category) ?? 0) + spend);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name,
        value: Math.round(value),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]!,
      }));
  }, [d]);

  // Material / Mfg / Overhead split by product family
  const familyStack = React.useMemo(() => {
    const map = new Map<string, { unit: number; count: number }>();
    for (const p of d.products) {
      const cur = map.get(p.family) ?? { unit: 0, count: 0 };
      cur.unit += p.unitCost;
      cur.count += 1;
      map.set(p.family, cur);
    }
    return [...map.entries()]
      .map(([family, { unit, count }]) => {
        const avg = unit / count;
        return {
          label: family.length > 10 ? family.slice(0, 9) + "…" : family,
          material: Math.round(avg * 0.52),
          mfg: Math.round(avg * 0.33),
          overhead: Math.round(avg * 0.15),
        };
      })
      .slice(0, 7);
  }, [d]);

  // Profitability per family
  const profitability = React.useMemo(() => {
    const map = new Map<
      string,
      { unit: number; target: number; margin: number; units: number; revenue: number; n: number }
    >();
    for (const p of d.products) {
      const cur =
        map.get(p.family) ?? { unit: 0, target: 0, margin: 0, units: 0, revenue: 0, n: 0 };
      cur.unit += p.unitCost;
      cur.target += p.targetCost;
      cur.margin += p.marginPct;
      cur.units += p.unitsBuilt;
      cur.revenue += p.msrp * p.unitsBuilt;
      cur.n += 1;
      map.set(p.family, cur);
    }
    return [...map.entries()]
      .map(([family, v]) => ({
        family,
        avgUnit: v.unit / v.n,
        avgTarget: v.target / v.n,
        margin: v.margin / v.n,
        units: v.units,
        revenue: v.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [d]);

  // Top cost drivers
  const topDrivers = React.useMemo(() => {
    const sorted = [...d.parts].sort((a, b) => b.unitCost - a.unitCost).slice(0, 8);
    const max = sorted[0]?.unitCost ?? 1;
    return sorted.map((p) => ({ part: p, pct: (p.unitCost / max) * 100 }));
  }, [d]);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Rolled Cost"
            value={formatCompactCurrency(metrics.rolled)}
            delta={-3.4}
            deltaSuffix="vs last quarter"
            icon={CircleDollarSign}
            accent="primary"
            invertDelta
            spark={[82, 80, 79, 77, 76, 74, 73, 71]}
          />
          <StatCard
            label="Avg Unit Cost"
            value={formatCurrency(metrics.avgUnit, { maximumFractionDigits: 0 })}
            delta={-1.9}
            icon={Boxes}
            accent="info"
            invertDelta
            spark={[40, 39, 38, 38, 37, 36, 36, 35]}
          />
          <StatCard
            label="Material vs Mfg"
            value={`${metrics.materialPct}/${metrics.mfgPct}`}
            delta={2.1}
            deltaSuffix="material share"
            icon={Layers}
            accent="warning"
            spark={[55, 56, 57, 58, 59, 60, 61, 62]}
          />
          <StatCard
            label="YoY Cost Change"
            value="-6.8%"
            delta={-6.8}
            deltaSuffix="year over year"
            icon={TrendingDown}
            accent="success"
            invertDelta
            spark={[100, 98, 95, 94, 92, 90, 88, 86]}
          />
        </div>

        {/* Trend + breakdown */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-[15px]">Cost Trend</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Actual vs. target rolled cost — trailing 12 months
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" /> Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-info" /> Target
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <AreaTrend
                data={costTrend}
                dataKey="actual"
                secondKey="target"
                prefix="$"
                height={248}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px]">Cost Breakdown</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Extended spend by part category
              </p>
            </CardHeader>
            <CardContent>
              <DonutChart data={categoryBreakdown} height={180} />
              <div className="mt-3 space-y-1.5">
                {categoryBreakdown.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
                    <span className="font-medium tabular">
                      {formatCompactCurrency(c.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost composition by family */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-[15px]">Cost Composition by Family</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Material, manufacturing and overhead split of average unit cost
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Material
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-info" /> Manufacturing
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: "hsl(var(--muted-foreground))" }}
                />{" "}
                Overhead
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <MultiBar
              data={familyStack}
              prefix="$"
              height={260}
              keys={[
                { key: "material", color: "hsl(var(--primary))", name: "Material" },
                { key: "mfg", color: "hsl(var(--info))", name: "Manufacturing" },
                { key: "overhead", color: "hsl(var(--muted-foreground))", name: "Overhead" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Profitability + cost drivers */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">Profitability by Family</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Unit cost, target, margin and realized revenue
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-2xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2 text-left font-medium">Family</th>
                      <th className="px-2 py-2 text-right font-medium">Avg Cost</th>
                      <th className="px-2 py-2 text-right font-medium">Target</th>
                      <th className="px-2 py-2 text-right font-medium">Margin</th>
                      <th className="px-2 py-2 text-right font-medium">Units</th>
                      <th className="px-2 py-2 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {profitability.map((r) => (
                      <tr key={r.family} className="transition-colors hover:bg-accent/40">
                        <td className="px-2 py-2.5 font-medium">{r.family}</td>
                        <td className="px-2 py-2.5 text-right tabular">
                          {formatCurrency(r.avgUnit, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular text-muted-foreground">
                          {formatCurrency(r.avgTarget, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <span
                            className={cn(
                              "font-semibold tabular",
                              r.margin >= 35
                                ? "text-success"
                                : r.margin >= 20
                                  ? "text-warning"
                                  : "text-destructive",
                            )}
                          >
                            {r.margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right tabular text-muted-foreground">
                          {formatNumber(r.units)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-medium tabular">
                          {formatCompactCurrency(r.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">Top Cost Drivers</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Highest unit-cost parts by supplier
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {topDrivers.map(({ part, pct }) => {
                const supplier = getSupplier(part.supplierId);
                return (
                  <div key={part.id} className="group">
                    <div className="flex items-center gap-2.5">
                      <Thumbnail hue={part.thumbnailHue} size={30} icon={Package} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{part.name}</p>
                        <p className="truncate font-mono text-2xs text-muted-foreground">
                          {part.partNumber} · {supplier?.name ?? "—"}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold tabular">
                        {formatCurrency(part.unitCost)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Footer note row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="size-5" />
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wide text-muted-foreground">
                  Material spend
                </p>
                <p className="text-lg font-semibold tabular">
                  {formatCompactCurrency(metrics.rolled * (metrics.materialPct / 100))}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-info/10 text-info">
                <Factory className="size-5" />
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wide text-muted-foreground">
                  Manufacturing
                </p>
                <p className="text-lg font-semibold tabular">
                  {formatCompactCurrency(metrics.rolled * (metrics.mfgPct / 100))}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
                <Truck className="size-5" />
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wide text-muted-foreground">
                  Annual supplier spend
                </p>
                <p className="text-lg font-semibold tabular">
                  {formatCompactCurrency(
                    d.suppliers.reduce((s, sup) => s + sup.annualSpend, 0),
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
