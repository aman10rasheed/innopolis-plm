"use client";

import * as React from "react";
import {
  FileText,
  Scale,
  CircleDollarSign,
  Clock,
  ShieldAlert,
  Sparkles,
  Trophy,
  TrendingDown,
  Layers,
  Package,
  Boxes,
  Tag,
  Plus,
} from "lucide-react";
import { db, getSupplier } from "@/mock/db";
import type { Rfq, RfqMode, Quotation } from "@/types";
import { useUIStore } from "@/stores/ui-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  RFQ_STATUS_VARIANT,
  QUOTATION_STATUS_VARIANT,
  PO_STATUS_VARIANT,
  PRIORITY_VARIANT,
} from "@/constants/status";
import {
  cn,
  formatCurrency,
  formatCompactCurrency,
  formatDate,
} from "@/lib/utils";
import { toast } from "@/components/ui/toast";

// ---------------------------------------------------------------------------

const RFQ_MODES: { mode: RfqMode; icon: typeof Layers; hint: string }[] = [
  { mode: "Vendor-wise", icon: Boxes, hint: "Group all items by chosen vendors" },
  { mode: "Category-wise", icon: Tag, hint: "One RFQ per material category" },
  { mode: "Package-wise", icon: Package, hint: "Bundle items into work packages" },
  { mode: "Single Item", icon: FileText, hint: "Quote a single critical material" },
  { mode: "Bulk", icon: Layers, hint: "High-volume aggregated demand" },
];

export function ProcurementView() {
  const [selectedRfqId, setSelectedRfqId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("rfqs");

  const jumpToComparison = (rfqId: string) => {
    setSelectedRfqId(rfqId);
    setTab("comparison");
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 pt-3">
        <TabsList>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="comparison">Quotation Comparison</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="rfqs" className="min-h-0 flex-1 overflow-hidden">
        <RfqsTab onOpenComparison={jumpToComparison} />
      </TabsContent>
      <TabsContent value="comparison" className="min-h-0 flex-1 overflow-hidden">
        <ComparisonTab
          selectedRfqId={selectedRfqId}
          setSelectedRfqId={setSelectedRfqId}
        />
      </TabsContent>
      <TabsContent value="pos" className="min-h-0 flex-1 overflow-hidden">
        <PurchaseOrdersTab />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// TAB 1 — RFQs
// ---------------------------------------------------------------------------

function RfqsTab({ onOpenComparison }: { onOpenComparison: (id: string) => void }) {
  useUIStore((s) => s.dataRev); // re-render when an RFQ is generated
  const rfqs = db().rfqs;
  const [genOpen, setGenOpen] = React.useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Requests for Quotation
        </h2>
        <Badge variant="muted">{rfqs.length}</Badge>
        <Button size="sm" className="ml-auto" onClick={() => setGenOpen(true)}>
          <Sparkles className="size-4" /> Generate RFQ
        </Button>
      </div>

      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_2fr_1.1fr_1fr_0.9fr_0.8fr_0.7fr_0.9fr_1.1fr] items-center gap-2 border-b border-border bg-surface/80 px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>RFQ</span>
              <span>Title</span>
              <span>Mode</span>
              <span>Status</span>
              <span>Project</span>
              <span>Vendors</span>
              <span className="text-right">Lines</span>
              <span className="text-right">Est. value</span>
              <span>Quotes</span>
            </div>
            <div className="divide-y divide-border bg-surface/30">
              {rfqs.map((rfq) => (
                <button
                  key={rfq.id}
                  onClick={() => onOpenComparison(rfq.id)}
                  className="grid w-full grid-cols-[1fr_2fr_1.1fr_1fr_0.9fr_0.8fr_0.7fr_0.9fr_1.1fr] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent/40"
                >
                  <span className="font-mono text-[13px] font-medium">{rfq.number}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{rfq.title}</p>
                    {rfq.category && (
                      <p className="truncate text-2xs text-muted-foreground">{rfq.category}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="font-normal">{rfq.mode}</Badge>
                  <Badge variant={RFQ_STATUS_VARIANT[rfq.status]}>{rfq.status}</Badge>
                  <span className="font-mono text-2xs text-muted-foreground">
                    {rfq.projectNumber ?? "—"}
                  </span>
                  <VendorStack vendorIds={rfq.vendorIds} />
                  <span className="text-right text-[13px] tabular text-muted-foreground">
                    {rfq.lineItems}
                  </span>
                  <span className="text-right text-[13px] font-semibold tabular">
                    {formatCompactCurrency(rfq.estValue)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(rfq.quotesReceived / Math.max(1, rfq.quotesExpected)) * 100}
                      className="h-1.5 flex-1"
                    />
                    <span className="w-8 shrink-0 text-right text-2xs tabular text-muted-foreground">
                      {rfq.quotesReceived}/{rfq.quotesExpected}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 px-1 text-2xs text-muted-foreground">
            Tip: select a row to compare received quotations.
          </p>
        </div>
      </ScrollArea>

      <GenerateRfqDialog open={genOpen} onOpenChange={setGenOpen} />
    </div>
  );
}

function VendorStack({ vendorIds }: { vendorIds: string[] }) {
  const shown = vendorIds.slice(0, 3);
  const extra = vendorIds.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((id) => {
          const sup = getSupplier(id);
          const initials =
            sup?.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() ?? "?";
          const hue = ((parseInt(id.replace(/\D/g, "") || "0", 10) * 47) % 360);
          return (
            <Avatar key={id} className="size-5 ring-1 ring-surface">
              <AvatarFallback
                className="text-[8px]"
                style={{ background: `hsl(${hue} 55% 22%)`, color: `hsl(${hue} 80% 76%)` }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          );
        })}
      </div>
      {extra > 0 && (
        <span className="ml-1.5 text-2xs tabular text-muted-foreground">+{extra}</span>
      )}
    </div>
  );
}

function GenerateRfqDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mode, setMode] = React.useState<RfqMode>("Vendor-wise");
  const bumpDataRev = useUIStore((s) => s.bumpDataRev);

  const generate = () => {
    const root = db().products[0];
    const vendorIds = db().suppliers.slice(0, 3).map((s) => s.id);
    const rfq: Rfq = {
      id: `RFQ-new-${Date.now()}`,
      number: `RFQ-${Math.floor(1000 + Math.random() * 8999)}`,
      title: `${mode} RFQ — ${root?.name ?? "Current project"}`,
      mode,
      status: "Draft",
      projectId: root?.id,
      projectNumber: root?.projectNumber,
      vendorIds,
      lineItems: 8,
      category: undefined,
      estValue: Math.round(50000 + Math.random() * 200000),
      requiredDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
      ownerId: db().users[0]!.id,
      quotesReceived: 0,
      quotesExpected: vendorIds.length,
    };
    db().rfqs.unshift(rfq);
    bumpDataRev();
    toast.success("RFQ generated", `${rfq.number} created from current BOM`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate RFQ</DialogTitle>
          <DialogDescription>
            Choose how line items should be grouped into requests for quotation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RFQ_MODES.map(({ mode: m, icon: Icon, hint }) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/[0.06] ring-1 ring-primary/40"
                    : "border-border hover:bg-accent/40",
                )}
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-primary/15 text-primary" : "bg-surface-sunken text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{m}</p>
                  <p className="text-2xs leading-snug text-muted-foreground">{hint}</p>
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="sm" onClick={generate}>
              <Sparkles className="size-4" /> Generate
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TAB 2 — Quotation Comparison
// ---------------------------------------------------------------------------

function ComparisonTab({
  selectedRfqId,
  setSelectedRfqId,
}: {
  selectedRfqId: string | null;
  setSelectedRfqId: (id: string) => void;
}) {
  useUIStore((s) => s.dataRev); // re-render after an award
  const quotations = db().quotations;
  const rfqs = db().rfqs;

  const rfqsWithQuotes = React.useMemo(
    () => rfqs.filter((rfq) => quotations.some((q) => q.rfqId === rfq.id)),
    [rfqs, quotations],
  );

  // Default to first RFQ with quotes if nothing valid selected.
  const activeRfq =
    rfqsWithQuotes.find((r) => r.id === selectedRfqId) ?? rfqsWithQuotes[0] ?? null;

  if (rfqsWithQuotes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          icon={Scale}
          title="No quotations received yet"
          description="Once vendors respond to your RFQs, side-by-side comparisons appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left selector */}
      <div className="flex w-64 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            RFQs with quotes
          </p>
        </div>
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {rfqsWithQuotes.map((rfq) => {
              const count = quotations.filter((q) => q.rfqId === rfq.id).length;
              const active = activeRfq?.id === rfq.id;
              return (
                <button
                  key={rfq.id}
                  onClick={() => setSelectedRfqId(rfq.id)}
                  className={cn(
                    "w-full rounded-lg border p-2.5 text-left transition-colors",
                    active
                      ? "border-primary/50 bg-primary/[0.06]"
                      : "border-transparent hover:bg-accent/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs text-muted-foreground">{rfq.number}</span>
                    <Badge variant={RFQ_STATUS_VARIANT[rfq.status]} className="ml-auto">
                      {rfq.status}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug">
                    {rfq.title}
                  </p>
                  <p className="mt-1 text-2xs text-muted-foreground">
                    {count} quote{count === 1 ? "" : "s"} · {formatCompactCurrency(rfq.estValue)}
                  </p>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Comparison grid */}
      <div className="min-w-0 flex-1">
        {activeRfq && <ComparisonGrid rfq={activeRfq} />}
      </div>
    </div>
  );
}

interface CmpRow {
  label: string;
  render: (q: Quotation) => React.ReactNode;
  best?: (q: Quotation, quotes: Quotation[]) => boolean;
}

function ComparisonGrid({ rfq }: { rfq: Rfq }) {
  const dataRev = useUIStore((s) => s.dataRev);
  const bumpDataRev = useUIStore((s) => s.bumpDataRev);
  const quotes = React.useMemo(
    () =>
      db()
        .quotations.filter((q) => q.rfqId === rfq.id)
        .sort((a, b) => a.rank - b.rank),
    [rfq.id, dataRev],
  );

  const award = (q: Quotation) => {
    db().quotations.forEach((x) => {
      if (x.rfqId === q.rfqId) x.status = x.id === q.id ? "Awarded" : "Rejected";
    });
    const awardedRfq = db().rfqs.find((r) => r.id === q.rfqId);
    if (awardedRfq) awardedRfq.status = "Awarded";
    bumpDataRev();
    toast.success("Quotation awarded", `${q.rfqNumber} awarded to ${q.vendorName}`);
  };

  const minTotal = Math.min(...quotes.map((q) => q.totalValue));
  const maxTotal = Math.max(...quotes.map((q) => q.totalValue));
  const minLead = Math.min(...quotes.map((q) => q.leadTimeDays));
  const saving = maxTotal - minTotal;

  const rows: CmpRow[] = [
    {
      label: "Total Value",
      render: (q) => formatCurrency(q.totalValue),
      best: (q) => q.totalValue === minTotal,
    },
    {
      label: "Lead Time",
      render: (q) => `${q.leadTimeDays}d`,
      best: (q) => q.leadTimeDays === minLead,
    },
    { label: "Payment Terms", render: (q) => q.paymentTerms },
    { label: "Delivery Terms", render: (q) => q.deliveryTerms },
    { label: "Validity", render: (q) => `${q.validityDays}d` },
    {
      label: "Weighted Score",
      render: (q) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="tabular">{q.score}</span>
          <span className="text-2xs text-muted-foreground">/100</span>
        </span>
      ),
    },
    {
      label: "Rank",
      render: (q) => `#${q.rank}`,
    },
  ];

  // grid columns: first label column + one per quote
  const gridCols = `200px repeat(${quotes.length}, minmax(180px, 1fr))`;

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Header summary */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-2xs text-muted-foreground">{rfq.number}</span>
          <h3 className="text-[15px] font-semibold">{rfq.title}</h3>
          <Badge variant={RFQ_STATUS_VARIANT[rfq.status]}>{rfq.status}</Badge>
          {saving > 0 && (
            <span className="ml-auto flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/[0.06] px-2.5 py-1 text-2xs font-medium text-success">
              <TrendingDown className="size-3.5" />
              Potential saving {formatCurrency(saving)} vs highest quote
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          {/* Vendor header row */}
          <div className="grid items-stretch" style={{ gridTemplateColumns: gridCols }}>
            <div className="border-b border-r border-border bg-surface/80 px-3 py-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendor
            </div>
            {quotes.map((q) => {
              const recommended = q.rank === 1;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "border-b border-r border-border px-3 py-3 last:border-r-0",
                    recommended ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/40" : "bg-surface/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{q.vendorName}</p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        {q.lineCount} lines · {formatDate(q.receivedAt)}
                      </p>
                    </div>
                    {recommended && (
                      <Badge variant="default" className="shrink-0 gap-1">
                        <Trophy className="size-2.5" /> Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={QUOTATION_STATUS_VARIANT[q.status]}>{q.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metric rows */}
          {rows.map((row, ri) => (
            <div
              key={row.label}
              className="grid items-stretch"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div
                className={cn(
                  "flex items-center border-r border-border bg-surface/60 px-3 py-2.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground",
                  ri !== rows.length - 1 && "border-b",
                )}
              >
                {row.label}
              </div>
              {quotes.map((q) => {
                const recommended = q.rank === 1;
                const isBest = row.best?.(q, quotes) ?? false;
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-center border-r border-border px-3 py-2.5 text-[13px] tabular last:border-r-0",
                      ri !== rows.length - 1 && "border-b",
                      recommended ? "bg-primary/[0.04]" : "bg-surface/20",
                      isBest && "font-semibold text-success",
                    )}
                  >
                    {row.render(q)}
                    {isBest && <span className="ml-1.5 text-2xs font-medium text-success">best</span>}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Award action row */}
          <div className="grid items-stretch" style={{ gridTemplateColumns: gridCols }}>
            <div className="flex items-center border-t border-r border-border bg-surface/60 px-3 py-3 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              Decision
            </div>
            {quotes.map((q) => {
              const recommended = q.rank === 1;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "flex items-center border-t border-r border-border px-3 py-3 last:border-r-0",
                    recommended ? "bg-primary/[0.04]" : "bg-surface/20",
                  )}
                >
                  <Button
                    size="xs"
                    variant={recommended ? "default" : "outline"}
                    className="w-full"
                    onClick={() => award(q)}
                  >
                    Award
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// TAB 3 — Purchase Orders
// ---------------------------------------------------------------------------

const OPEN_STATUSES = new Set(["Open", "Partially Received", "Pending Approval"]);

const RISK_VARIANT: Record<"Low" | "Medium" | "High", "muted" | "warning" | "destructive"> = {
  Low: "muted",
  Medium: "warning",
  High: "destructive",
};

function PurchaseOrdersTab() {
  useUIStore((s) => s.dataRev); // re-render after a PO is created
  const setCreatePoOpen = useUIStore((s) => s.setCreatePoOpen);
  const pos = db().purchaseOrders;
  const [activePo, setActivePo] = React.useState<(typeof pos)[number] | null>(null);

  const openPos = pos.filter((p) => OPEN_STATUSES.has(p.status));
  const openValue = openPos.reduce(
    (s, p) => s + p.totalValue * (1 - p.receivedPct / 100),
    0,
  );
  const receivedPct = Math.round(
    pos.reduce((s, p) => s + p.receivedPct, 0) / Math.max(1, pos.length),
  );
  const atRisk = pos.filter((p) => p.onTimeRisk === "High").length;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Open POs" value={openPos.length} icon={FileText} accent="primary" delta={3} />
          <StatCard
            label="Open value"
            value={formatCompactCurrency(openValue)}
            icon={CircleDollarSign}
            accent="info"
            delta={6}
          />
          <StatCard
            label="Received this period"
            value={`${receivedPct}%`}
            icon={Clock}
            accent="success"
            delta={4}
          />
          <StatCard
            label="On-time risk"
            value={atRisk}
            icon={ShieldAlert}
            accent="destructive"
            delta={1}
            invertDelta
          />
        </div>

        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Purchase orders
            </h2>
            <Badge variant="muted">{pos.length}</Badge>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => setCreatePoOpen(true)}
            >
              <Plus className="size-4" /> Create PO
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_1.5fr_1.1fr_0.6fr_0.9fr_1fr_1fr_1.2fr_0.8fr_0.9fr] items-center gap-2 border-b border-border bg-surface/80 px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>PO</span>
              <span>Supplier</span>
              <span>Status</span>
              <span className="text-right">Lines</span>
              <span className="text-right">Value</span>
              <span>Ordered</span>
              <span>Expected</span>
              <span>Received</span>
              <span>Priority</span>
              <span>On-time</span>
            </div>
            <div className="divide-y divide-border bg-surface/30">
              {pos.map((po) => (
                <button
                  key={po.id}
                  onClick={() => setActivePo(po)}
                  className="grid w-full grid-cols-[1fr_1.5fr_1.1fr_0.6fr_0.9fr_1fr_1fr_1.2fr_0.8fr_0.9fr] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent/40"
                >
                  <span className="font-mono text-[13px] font-medium">{po.number}</span>
                  <span className="truncate text-[13px]">{po.supplierName}</span>
                  <Badge variant={PO_STATUS_VARIANT[po.status]}>{po.status}</Badge>
                  <span className="text-right text-[13px] tabular text-muted-foreground">{po.lineItems}</span>
                  <span className="text-right text-[13px] font-semibold tabular">{formatCurrency(po.totalValue)}</span>
                  <span className="text-2xs text-muted-foreground">{formatDate(po.orderedDate)}</span>
                  <span
                    className={cn(
                      "text-2xs",
                      po.onTimeRisk === "High" ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {formatDate(po.expectedDate)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress value={po.receivedPct} className="h-1.5 flex-1" />
                    <span className="w-8 shrink-0 text-right text-2xs tabular text-muted-foreground">
                      {po.receivedPct}%
                    </span>
                  </div>
                  <Badge variant={PRIORITY_VARIANT[po.priority]}>{po.priority}</Badge>
                  <Badge variant={RISK_VARIANT[po.onTimeRisk]}>{po.onTimeRisk}</Badge>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Dialog open={!!activePo} onOpenChange={(o) => !o && setActivePo(null)}>
        <DialogContent>
          {activePo && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{activePo.number}</DialogTitle>
                <DialogDescription>{activePo.supplierName}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-[13px]">
                {[
                  ["Status", activePo.status],
                  ["Priority", activePo.priority],
                  ["Total value", formatCurrency(activePo.totalValue)],
                  ["Line items", String(activePo.lineItems)],
                  ["Ordered", formatDate(activePo.orderedDate)],
                  ["Expected", formatDate(activePo.expectedDate)],
                  ["Received", `${activePo.receivedPct}%`],
                  ["On-time risk", activePo.onTimeRisk],
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
