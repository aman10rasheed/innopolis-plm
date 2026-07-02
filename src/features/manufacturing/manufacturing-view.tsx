"use client";

import * as React from "react";
import { Cpu, Gauge, Wrench } from "lucide-react";
import { db } from "@/mock/db";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MultiBar, LineTrend } from "@/components/shared/charts";
import { cn, formatNumber, formatDate, seededRandom, pick } from "@/lib/utils";
import { manufacturingProgress, monthlySeries } from "@/mock/series";

type WoStatus = "Queued" | "In Progress" | "Completed" | "On Hold";

interface WorkOrder {
  id: string;
  number: string;
  itemName: string;
  itemCode: string;
  qty: number;
  status: WoStatus;
  progress: number;
  station: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
}

const WO_STATUS: Record<WoStatus, { dot: string; badge: "muted" | "info" | "success" | "warning" }> = {
  Queued: { dot: "bg-muted-foreground", badge: "muted" },
  "In Progress": { dot: "bg-info", badge: "info" },
  Completed: { dot: "bg-success", badge: "success" },
  "On Hold": { dot: "bg-warning", badge: "warning" },
};

const PRIORITY_BADGE = { Low: "muted", Medium: "info", High: "warning", Critical: "destructive" } as const;

const STATIONS = ["Line A · CNC", "Line A · Mill", "Line B · Assembly", "Line B · Weld", "Line C · Paint", "Line C · Test"];
const WO_STATUSES: WoStatus[] = ["Queued", "In Progress", "Completed", "On Hold"];

function buildWorkOrders(): WorkOrder[] {
  const d = db();
  const rng = seededRandom(73);
  const sources = [
    ...d.products.map((p) => ({ name: p.name, code: p.code })),
  ];
  // Backend-only: with no project data there are no work orders to derive.
  if (sources.length === 0) return [];
  return Array.from({ length: 14 }, (_, i) => {
    const src = sources[Math.floor(rng() * sources.length)]!;
    const status = pick(rng, WO_STATUSES);
    const progress =
      status === "Completed" ? 100 : status === "Queued" ? 0 : status === "On Hold" ? 20 + Math.floor(rng() * 40) : 25 + Math.floor(rng() * 65);
    const due = new Date();
    due.setDate(due.getDate() + Math.floor(rng() * 30) - 6);
    return {
      id: `WO-${i + 1}`,
      number: `WO-${(4810 + i).toString()}`,
      itemName: src.name,
      itemCode: src.code,
      qty: 25 + Math.floor(rng() * 480),
      status,
      progress,
      station: pick(rng, STATIONS),
      dueDate: due.toISOString(),
      priority: pick(rng, ["Low", "Medium", "High", "Critical"] as const),
    };
  });
}

interface Machine {
  name: string;
  status: "Running" | "Idle" | "Maintenance";
  utilization: number;
  job: string;
  oee: number;
}

const MACHINE_STATUS: Record<Machine["status"], string> = {
  Running: "bg-success",
  Idle: "bg-muted-foreground",
  Maintenance: "bg-warning",
};

function buildMachines(workOrders: WorkOrder[]): Machine[] {
  const rng = seededRandom(91);
  const names = ["CNC-01", "Mill-03", "Lathe-04", "EDM-05", "Press-06", "Weld-07", "Paint-08", "Assembly-09"];
  return names.map((name, i) => {
    const status = pick(rng, ["Running", "Running", "Running", "Idle", "Maintenance"] as const);
    return {
      name,
      status,
      utilization: status === "Maintenance" ? 0 : status === "Idle" ? 5 + Math.floor(rng() * 20) : 55 + Math.floor(rng() * 44),
      job: status === "Running" && workOrders.length ? workOrders[i % workOrders.length]!.number : "—",
      oee: 60 + Math.floor(rng() * 38),
    };
  });
}

export function ManufacturingView() {
  const workOrders = React.useMemo(() => buildWorkOrders(), []);
  const machines = React.useMemo(() => buildMachines(workOrders), [workOrders]);
  const [activeWo, setActiveWo] = React.useState<(typeof workOrders)[number] | null>(null);
  const [activeMachine, setActiveMachine] = React.useState<(typeof machines)[number] | null>(null);
  const progressData = React.useMemo(() => manufacturingProgress(), []);
  const throughput = React.useMemo(() => {
    const a = monthlySeries(5, 900, 30, 300);
    const b = monthlySeries(17, 820, 28, 280);
    return a.map((d, i) => ({ label: d.label, units: d.value, target: b[i]!.value }));
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="p-4">
            <p className="text-[13px] font-semibold">Production by line</p>
            <p className="mb-3 text-2xs text-muted-foreground">Planned vs actual units</p>
            <MultiBar
              data={progressData}
              height={220}
              keys={[
                { key: "planned", color: "hsl(var(--muted-foreground))", name: "Planned" },
                { key: "actual", color: "hsl(var(--primary))", name: "Actual" },
              ]}
            />
          </Card>
          <Card className="p-4">
            <p className="text-[13px] font-semibold">Throughput</p>
            <p className="mb-3 text-2xs text-muted-foreground">Units completed — trailing 12 months</p>
            <LineTrend
              data={throughput}
              height={220}
              keys={[
                { key: "units", color: "hsl(var(--success))", name: "Units" },
                { key: "target", color: "hsl(var(--muted-foreground))", name: "Target" },
              ]}
            />
          </Card>
        </div>

        {/* Machine grid */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Cpu className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Machine status</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {machines.map((m) => (
              <Card
                key={m.name}
                interactive
                onClick={() => setActiveMachine(m)}
                className="p-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-semibold">{m.name}</span>
                  <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <StatusDot className={MACHINE_STATUS[m.status]} pulse={m.status === "Running"} />
                    {m.status}
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-2xs text-muted-foreground">
                    <span>Utilization</span>
                    <span className="tabular">{m.utilization}%</span>
                  </div>
                  <Progress
                    value={m.utilization}
                    className="h-1.5"
                    indicatorClassName={cn(
                      m.utilization > 70 ? "bg-success" : m.utilization > 30 ? "bg-warning" : "bg-muted-foreground",
                    )}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-2xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wrench className="size-3" /> {m.job}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Gauge className="size-3 text-muted-foreground" /> OEE {m.oee}%
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Work orders table */}
        <div>
          <h2 className="mb-2 text-sm font-semibold">Work orders</h2>
          <Card className="overflow-hidden p-0">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface/40 text-left text-2xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">WO</th>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Progress</th>
                  <th className="px-3 py-2 font-medium">Station</th>
                  <th className="px-3 py-2 font-medium">Due</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workOrders.map((w) => (
                  <tr
                    key={w.id}
                    className="cursor-pointer transition-colors hover:bg-accent/40"
                    onClick={() => setActiveWo(w)}
                  >
                    <td className="px-3 py-2.5 font-mono text-2xs text-muted-foreground">{w.number}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{w.itemName}</p>
                      <p className="font-mono text-2xs text-muted-foreground">{w.itemCode}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">{formatNumber(w.qty)}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <StatusDot className={WO_STATUS[w.status].dot} />
                        <Badge variant={WO_STATUS[w.status].badge}>{w.status}</Badge>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={w.progress} className="h-1.5 w-24" />
                        <span className="w-8 text-right text-2xs tabular text-muted-foreground">{w.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{w.station}</td>
                    <td className="px-3 py-2.5 tabular text-muted-foreground">{formatDate(w.dueDate)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={PRIORITY_BADGE[w.priority]}>{w.priority}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      <Dialog open={!!activeWo} onOpenChange={(o) => !o && setActiveWo(null)}>
        <DialogContent>
          {activeWo && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{activeWo.number}</DialogTitle>
                <DialogDescription>{activeWo.itemName} · {activeWo.itemCode}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-[13px]">
                {[
                  ["Status", activeWo.status],
                  ["Priority", activeWo.priority],
                  ["Quantity", formatNumber(activeWo.qty)],
                  ["Progress", `${activeWo.progress}%`],
                  ["Station", activeWo.station],
                  ["Due", formatDate(activeWo.dueDate)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface p-3">
                    <p className="text-2xs text-muted-foreground">{k}</p>
                    <p className="mt-0.5 font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeMachine} onOpenChange={(o) => !o && setActiveMachine(null)}>
        <DialogContent>
          {activeMachine && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{activeMachine.name}</DialogTitle>
                <DialogDescription>{activeMachine.status}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-[13px]">
                {[
                  ["Status", activeMachine.status],
                  ["OEE", `${activeMachine.oee}%`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface p-3">
                    <p className="text-2xs text-muted-foreground">{k}</p>
                    <p className="mt-0.5 font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

export function manufacturingStats() {
  const workOrders = buildWorkOrders();
  const machines = buildMachines(workOrders);
  const active = workOrders.filter((w) => w.status === "In Progress" || w.status === "Queued").length;
  const inProd = workOrders
    .filter((w) => w.status === "In Progress")
    .reduce((s, w) => s + Math.round((w.qty * w.progress) / 100), 0);
  const util = Math.round(machines.reduce((s, m) => s + m.utilization, 0) / machines.length);
  const completed = workOrders.filter((w) => w.status === "Completed");
  const onTime = workOrders.length ? Math.round((completed.length / workOrders.length) * 100) + 58 : 0;
  return { active, inProd, util, onTime: Math.min(98, onTime) };
}
