"use client";

import * as React from "react";
import {
  Gauge,
  Timer,
  CheckCircle2,
  Rocket,
  Activity,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/stat-card";
import {
  AreaTrend,
  BarChartMini,
  DonutChart,
  LineTrend,
  MultiBar,
} from "@/components/shared/charts";
import { db } from "@/mock/db";
import {
  manufacturingProgress,
  monthlySeries,
  supplierPerfSeries,
  utilizationHeatmap,
} from "@/mock/series";
import { cn, formatNumber } from "@/lib/utils";

export function AnalyticsView() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
            <TabsTrigger value="supply">Supply Chain</TabsTrigger>
            <TabsTrigger value="engineering">Engineering</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="manufacturing" className="space-y-5">
            <ManufacturingTab />
          </TabsContent>
          <TabsContent value="supply" className="space-y-5">
            <SupplyChainTab />
          </TabsContent>
          <TabsContent value="engineering" className="space-y-5">
            <EngineeringTab />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

/* ------------------------------------------------------------------ */
function OverviewTab() {
  const supplierPerf = React.useMemo(supplierPerfSeries, []);
  const mfg = React.useMemo(manufacturingProgress, []);
  const throughput = React.useMemo(() => monthlySeries(91, 4200, 60, 400), []);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Throughput"
          value="4,820 / wk"
          delta={5.6}
          icon={Gauge}
          accent="primary"
          spark={[40, 42, 41, 45, 47, 46, 49, 52]}
        />
        <StatCard
          label="On-time Delivery"
          value="94.2%"
          delta={1.8}
          icon={Timer}
          accent="success"
          spark={[88, 89, 90, 91, 92, 93, 93, 94]}
        />
        <StatCard
          label="First-pass Yield"
          value="97.1%"
          delta={0.6}
          icon={CheckCircle2}
          accent="info"
          spark={[94, 95, 95, 96, 96, 96, 97, 97]}
        />
        <StatCard
          label="Eng. Velocity"
          value="38 pts"
          delta={-2.4}
          icon={Rocket}
          accent="warning"
          invertDelta
          spark={[44, 43, 42, 41, 40, 39, 39, 38]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-[15px]">Supplier Performance</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                On-time delivery vs. quality acceptance — trailing 12 months
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> On-time
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" /> Quality
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <LineTrend
              data={supplierPerf}
              height={240}
              keys={[
                { key: "onTime", color: "hsl(var(--primary))", name: "On-time %" },
                { key: "quality", color: "hsl(var(--success))", name: "Quality %" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">Weekly Throughput</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Units completed per week</p>
          </CardHeader>
          <CardContent>
            <AreaTrend data={throughput} height={240} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-[15px]">Build Plan Attainment</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Planned vs. actual builds by production line
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: "hsl(var(--muted-foreground) / 0.5)" }}
              />{" "}
              Planned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Actual
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <MultiBar
            data={mfg}
            height={250}
            keys={[
              { key: "planned", color: "hsl(var(--muted-foreground) / 0.4)", name: "Planned" },
              { key: "actual", color: "hsl(var(--primary))", name: "Actual" },
            ]}
          />
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
function ManufacturingTab() {
  const heatmap = React.useMemo(utilizationHeatmap, []);
  const days = heatmap[0]?.cells.map((c) => c.day) ?? [];

  const machineAvg = React.useMemo(
    () =>
      heatmap.map((row) => ({
        label: row.machine,
        value: Math.round(
          row.cells.reduce((s, c) => s + c.value, 0) / Math.max(1, row.cells.length),
        ),
      })),
    [heatmap],
  );

  const fleetAvg = React.useMemo(() => {
    const all = heatmap.flatMap((r) => r.cells.map((c) => c.value));
    return Math.round(all.reduce((s, v) => s + v, 0) / Math.max(1, all.length));
  }, [heatmap]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Fleet Utilization" value={`${fleetAvg}%`} delta={3.1} icon={Gauge} accent="primary" />
        <StatCard label="Active Machines" value={`${heatmap.length} / ${heatmap.length}`} delta={0} icon={Cpu} accent="success" />
        <StatCard label="OEE" value="82.4%" delta={1.2} icon={Gauge} accent="info" />
        <StatCard label="Downtime" value="3.1%" delta={-0.7} icon={Timer} accent="warning" invertDelta />
      </div>

      {/* Heatmap highlight */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-[15px]">Machine Utilization Heatmap</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Daily utilization by machine — darker is busier (hover for exact %)
            </p>
          </div>
          <div className="flex items-center gap-2 text-2xs text-muted-foreground">
            <span>Low</span>
            <div className="flex">
              {[0.12, 0.3, 0.5, 0.7, 0.9].map((o) => (
                <span
                  key={o}
                  className="size-3.5"
                  style={{ background: `hsl(var(--primary) / ${o})` }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {/* Day header */}
              <div className="flex items-center gap-1.5 pl-[88px]">
                {days.map((day) => (
                  <div
                    key={day}
                    className="flex-1 text-center text-2xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>
              {/* Rows */}
              <div className="mt-2 space-y-1.5">
                {heatmap.map((row) => (
                  <div key={row.machine} className="flex items-center gap-1.5">
                    <div className="w-[80px] shrink-0 truncate font-mono text-2xs text-muted-foreground">
                      {row.machine}
                    </div>
                    {row.cells.map((cell) => {
                      const opacity = 0.08 + (cell.value / 100) * 0.92;
                      const hot = cell.value >= 60;
                      return (
                        <div
                          key={cell.day}
                          title={`${row.machine} · ${cell.day}: ${cell.value}% utilized`}
                          className={cn(
                            "group flex h-9 flex-1 items-center justify-center rounded-md text-2xs font-semibold tabular ring-1 ring-inset ring-border/40 transition-transform hover:scale-[1.06] hover:ring-primary/60",
                            hot ? "text-primary-foreground" : "text-foreground/70",
                          )}
                          style={{
                            backgroundColor: `hsl(var(--primary) / ${opacity.toFixed(2)})`,
                          }}
                        >
                          {cell.value}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[15px]">Average Utilization by Machine</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Weekly mean per asset</p>
        </CardHeader>
        <CardContent>
          <BarChartMini data={machineAvg} suffix="%" height={240} color="hsl(var(--info))" />
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
function SupplyChainTab() {
  const d = db();
  const supplierPerf = React.useMemo(supplierPerfSeries, []);

  const riskDistribution = React.useMemo(() => {
    let low = 0,
      med = 0,
      high = 0;
    for (const s of d.suppliers) {
      if (s.riskScore < 33) low++;
      else if (s.riskScore < 66) med++;
      else high++;
    }
    return [
      { name: "Low risk", value: low, color: "hsl(var(--success))" },
      { name: "Medium risk", value: med, color: "hsl(var(--warning))" },
      { name: "High risk", value: high, color: "hsl(var(--destructive))" },
    ];
  }, [d]);

  const leadTimeHistogram = React.useMemo(() => {
    const buckets = [
      { label: "0–14d", min: 0, max: 14, value: 0 },
      { label: "15–30d", min: 15, max: 30, value: 0 },
      { label: "31–45d", min: 31, max: 45, value: 0 },
      { label: "46–60d", min: 46, max: 60, value: 0 },
      { label: "60d+", min: 61, max: Infinity, value: 0 },
    ];
    for (const s of d.suppliers) {
      const b = buckets.find((b) => s.leadTimeAvg >= b.min && s.leadTimeAvg <= b.max);
      if (b) b.value++;
    }
    return buckets.map(({ label, value }) => ({ label, value }));
  }, [d]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Suppliers" value={formatNumber(d.suppliers.length)} delta={2.0} icon={Activity} accent="primary" />
        <StatCard label="High-risk Suppliers" value={riskDistribution[2]!.value} delta={-1.0} icon={ShieldAlert} accent="destructive" invertDelta />
        <StatCard label="Avg Lead Time" value={`${Math.round(d.suppliers.reduce((s, x) => s + x.leadTimeAvg, 0) / Math.max(1, d.suppliers.length))}d`} delta={-3.2} icon={Timer} accent="info" invertDelta />
        <StatCard label="Open POs" value={formatNumber(d.suppliers.reduce((s, x) => s + x.openPOs, 0))} delta={4.5} icon={Activity} accent="warning" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-[15px]">Supplier Performance</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">On-time vs. quality trend</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> On-time
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Quality
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <LineTrend
            data={supplierPerf}
            height={240}
            keys={[
              { key: "onTime", color: "hsl(var(--primary))", name: "On-time %" },
              { key: "quality", color: "hsl(var(--success))", name: "Quality %" },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">Risk Distribution</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Suppliers bucketed by risk score</p>
          </CardHeader>
          <CardContent>
            <DonutChart data={riskDistribution} height={200} />
            <div className="mt-3 flex justify-center gap-4 text-xs">
              {riskDistribution.map((r) => (
                <span key={r.name} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: r.color }} />
                  <span className="text-muted-foreground">{r.name}</span>
                  <span className="font-semibold tabular">{r.value}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">Lead-time Distribution</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Supplier count by avg lead time</p>
          </CardHeader>
          <CardContent>
            <BarChartMini
              data={leadTimeHistogram}
              suffix=""
              height={200}
              color="hsl(var(--warning))"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
function EngineeringTab() {
  const d = db();
  const ecoActivity = React.useMemo(() => {
    const opened = monthlySeries(53, 14, 0, 8);
    const closed = monthlySeries(67, 11, 0.4, 7);
    return opened.map((o, i) => ({
      label: o.label,
      opened: o.value,
      closed: closed[i]!.value,
    }));
  }, []);

  const ecoStatus = React.useMemo(() => {
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
  }, [d]);

  const revisionActivity = React.useMemo(() => monthlySeries(73, 22, 0.5, 12), []);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open ECOs" value={d.ecos.filter((e) => e.status !== "Completed").length} delta={-6.0} icon={Activity} accent="primary" invertDelta />
        <StatCard label="Avg Cycle Time" value="9.4d" delta={-1.5} icon={Timer} accent="info" invertDelta />
        <StatCard label="Revisions / mo" value="247" delta={3.8} icon={Rocket} accent="success" />
        <StatCard label="ECO Backlog" value={d.ecos.filter((e) => e.status === "Draft" || e.status === "Review").length} delta={2.2} icon={ShieldAlert} accent="warning" invertDelta />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-[15px]">Engineering Productivity</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">ECOs opened vs. closed per month</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Opened
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Closed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <LineTrend
            data={ecoActivity}
            height={240}
            keys={[
              { key: "opened", color: "hsl(var(--primary))", name: "Opened" },
              { key: "closed", color: "hsl(var(--success))", name: "Closed" },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">ECO Status Mix</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Current pipeline distribution</p>
          </CardHeader>
          <CardContent>
            <DonutChart data={ecoStatus} height={200} />
            <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
              {ecoStatus.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold tabular">{s.value}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px]">Revision Activity</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Released revisions per month</p>
          </CardHeader>
          <CardContent>
            <BarChartMini data={revisionActivity} height={200} color="hsl(var(--info))" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
