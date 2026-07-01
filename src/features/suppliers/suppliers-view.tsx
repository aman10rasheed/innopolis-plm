"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Star,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Gauge,
  Boxes,
  TrendingUp,
  CircleDollarSign,
  FileText,
  CheckCircle2,
  Receipt,
  CreditCard,
  Clock,
  Download,
} from "lucide-react";
import { useVendors, usePurchaseOrders } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { Supplier } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineTrend } from "@/components/shared/charts";
import { PO_STATUS_VARIANT } from "@/constants/status";
import {
  cn,
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  formatDate,
} from "@/lib/utils";
import { supplierPerfSeries } from "@/mock/series";
import { toast } from "@/components/ui/toast";
import { downloadJson, downloadText } from "@/lib/export";

const STATUS_VARIANT: Record<Supplier["status"], "success" | "info" | "warning" | "muted"> = {
  Preferred: "success",
  Approved: "info",
  Conditional: "warning",
  "Under Review": "muted",
};

function riskColor(score: number) {
  if (score < 35) return "text-success";
  if (score <= 60) return "text-warning";
  return "text-destructive";
}
function riskBar(score: number) {
  if (score < 35) return "bg-success";
  if (score <= 60) return "bg-warning";
  return "bg-destructive";
}
function supplierHue(s: Supplier) {
  // deterministic hue from the vendor code
  let h = 0;
  for (const c of s.code) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function Stars({ rating, showValue = true }: { rating: number; showValue?: boolean }) {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
            i < Math.round(rating)
              ? "fill-warning text-warning"
              : "text-muted-foreground/40",
          )}
        />
      ))}
      {showValue && <span className="ml-1 text-2xs tabular text-muted-foreground">{rating.toFixed(1)}</span>}
    </span>
  );
}

/** Small category chips: first 1-2 categories + "+N" overflow. */
function CategoryChips({ categories, max = 2 }: { categories: string[]; max?: number }) {
  if (!categories || categories.length === 0) {
    return <span className="text-2xs text-muted-foreground">—</span>;
  }
  const shown = categories.slice(0, max);
  const rest = categories.length - shown.length;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {shown.map((c) => (
        <Badge key={c} variant="outline" className="max-w-[120px] truncate px-1.5 py-0 text-[10px]">
          {c}
        </Badge>
      ))}
      {rest > 0 && (
        <Badge variant="muted" className="px-1.5 py-0 text-[10px]">+{rest}</Badge>
      )}
    </div>
  );
}

function Initial({ s, size = 36 }: { s: Supplier; size?: number }) {
  const hue = supplierHue(s);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg font-semibold"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 55% 22%)`,
        color: `hsl(${hue} 80% 76%)`,
        fontSize: size / 2.6,
      }}
    >
      {s.code.slice(0, 2)}
    </div>
  );
}

type SortKey = "name" | "rating" | "onTimePct" | "qualityPct" | "leadTimeAvg" | "annualSpend" | "openPOs";

export function SuppliersView() {
  const vendorsQuery = useVendors();
  const vendors = vendorsQuery.data?.items ?? [];
  const statuses = React.useMemo(
    () => [...new Set(vendors.map((s) => s.status))],
    [vendors],
  );

  const [query, setQuery] = React.useState("");
  const [region, setRegion] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [view, setView] = React.useState<"directory" | "scorecards">("directory");
  const [active, setActive] = React.useState<Supplier | null>(null);
  const [sort, setSort] = React.useState<SortKey>("annualSpend");
  const [dir, setDir] = React.useState<"asc" | "desc">("desc");

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    const out = vendors.filter(
      (s) =>
        (region === "all" || s.region === region) &&
        (status === "all" || s.status === status) &&
        (!query ||
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.gstVat.toLowerCase().includes(q) ||
          s.categoriesSupplied.some((c) => c.toLowerCase().includes(q))),
    );
    out.sort((a, b) => {
      const mul = dir === "asc" ? 1 : -1;
      if (sort === "name") return mul * a.name.localeCompare(b.name);
      return mul * ((a[sort] as number) - (b[sort] as number));
    });
    return out;
  }, [vendors, region, status, query, sort, dir]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
        <div className="relative w-60">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors, GST, category…"
            className="h-8 pl-8"
          />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            <SelectItem value="Domestic">Domestic</SelectItem>
            <SelectItem value="Import">Import</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setView("directory")}
            className={cn("rounded px-2.5 py-1 text-xs font-medium", view === "directory" ? "bg-accent text-foreground" : "text-muted-foreground")}
          >
            Directory
          </button>
          <button
            onClick={() => setView("scorecards")}
            className={cn("rounded px-2.5 py-1 text-xs font-medium", view === "scorecards" ? "bg-accent text-foreground" : "text-muted-foreground")}
          >
            Scorecards
          </button>
        </div>
        <span className="text-2xs text-muted-foreground tabular">{filtered.length} vendors</span>
      </div>

      {view === "directory" ? (
        <DirectoryTable
          rows={filtered}
          sort={sort}
          dir={dir}
          onSort={toggleSort}
          onOpen={setActive}
        />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <Scorecard key={s.id} s={s} onOpen={() => setActive(s)} />
            ))}
          </div>
        </ScrollArea>
      )}

      <SupplierDrawer supplier={active} onClose={() => setActive(null)} />
    </div>
  );
}

function SortHead({
  label,
  k,
  sort,
  dir,
  onSort,
  className,
}: {
  label: string;
  k: SortKey;
  sort: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const Icon = sort !== k ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={() => onSort(k)}
      className={cn("flex items-center gap-1 hover:text-foreground", sort === k && "text-foreground", className)}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

const GRID_COLS =
  "grid-cols-[1.7fr_0.9fr_1fr_1.3fr_1.1fr_0.7fr_0.7fr_1fr_0.9fr_0.6fr_0.5fr]";

function DirectoryTable({
  rows,
  sort,
  dir,
  onSort,
  onOpen,
}: {
  rows: Supplier[];
  sort: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  onOpen: (s: Supplier) => void;
}) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="min-w-[1280px]">
        <div className={cn("sticky top-0 z-10 grid items-center gap-2 border-b border-border bg-surface/80 px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur", GRID_COLS)}>
          <SortHead label="Vendor" k="name" sort={sort} dir={dir} onSort={onSort} />
          <span>Region</span>
          <span>GST / VAT</span>
          <span>Categories</span>
          <SortHead label="Rating" k="rating" sort={sort} dir={dir} onSort={onSort} />
          <SortHead label="On-time" k="onTimePct" sort={sort} dir={dir} onSort={onSort} className="justify-end" />
          <SortHead label="Quality" k="qualityPct" sort={sort} dir={dir} onSort={onSort} className="justify-end" />
          <span>Approved</span>
          <span>Terms</span>
          <SortHead label="Lead" k="leadTimeAvg" sort={sort} dir={dir} onSort={onSort} className="justify-end" />
          <SortHead label="POs" k="openPOs" sort={sort} dir={dir} onSort={onSort} className="justify-end" />
        </div>
        <div className="divide-y divide-border">
          {rows.map((s) => (
            <button
              key={s.id}
              onClick={() => onOpen(s)}
              className={cn("grid w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent/40", GRID_COLS)}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Initial s={s} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{s.name}</p>
                  <p className="font-mono text-2xs text-muted-foreground">{s.code} · {s.country}</p>
                </div>
              </div>
              <span className="truncate text-[13px] text-muted-foreground">{s.region}</span>
              <span className="truncate font-mono text-2xs text-muted-foreground" title={s.gstVat}>{s.gstVat}</span>
              <CategoryChips categories={s.categoriesSupplied} />
              <Stars rating={s.rating} />
              <span className="text-right text-[13px] tabular">{s.onTimePct}%</span>
              <span className="text-right text-[13px] tabular">{s.qualityPct}%</span>
              <div className="flex items-center gap-1.5">
                {s.approved && <CheckCircle2 className="size-3.5 shrink-0 text-success" />}
                <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
              </div>
              <span className="truncate text-2xs text-muted-foreground" title={s.paymentTerms}>{s.paymentTerms}</span>
              <span className="text-right text-[13px] tabular text-muted-foreground">{s.leadTimeAvg}d</span>
              <span className="text-right text-[13px] tabular text-muted-foreground">{s.openPOs}</span>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

function Scorecard({ s, onOpen }: { s: Supplier; onOpen: () => void }) {
  return (
    <Card interactive onClick={onOpen} className="p-4">
      <div className="flex items-start gap-3">
        <Initial s={s} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{s.name}</p>
          <p className="font-mono text-2xs text-muted-foreground">{s.code} · {s.country}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge variant={STATUS_VARIANT[s.status]}>
              {s.approved && <CheckCircle2 className="mr-0.5 size-3" />}
              {s.status}
            </Badge>
            <Badge variant="outline">Tier {s.tier}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-3"><Stars rating={s.rating} /></div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric label="On-time" value={`${s.onTimePct}%`} pct={s.onTimePct} good />
        <Metric label="Quality" value={`${s.qualityPct}%`} pct={s.qualityPct} good />
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-2xs">
          <span className="text-muted-foreground">Risk score</span>
          <span className={cn("font-semibold tabular", riskColor(s.riskScore))}>{s.riskScore}/100</span>
        </div>
        <Progress value={s.riskScore} className="h-1.5" indicatorClassName={riskBar(s.riskScore)} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <div>
          <p className="text-2xs text-muted-foreground">Parts</p>
          <p className="text-[13px] font-semibold tabular">{formatNumber(s.partsSupplied)}</p>
        </div>
        <div>
          <p className="text-2xs text-muted-foreground">Lead</p>
          <p className="text-[13px] font-semibold tabular">{s.leadTimeAvg}d</p>
        </div>
        <div>
          <p className="text-2xs text-muted-foreground">Spend</p>
          <p className="text-[13px] font-semibold tabular">{formatCompactCurrency(s.annualSpend)}</p>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, pct, good }: { label: string; value: string; pct: number; good?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-2">
      <p className="text-2xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular">{value}</p>
      <Progress
        value={pct}
        className="mt-1 h-1"
        indicatorClassName={good ? (pct >= 90 ? "bg-success" : pct >= 80 ? "bg-warning" : "bg-destructive") : undefined}
      />
    </div>
  );
}

function SupplierDrawer({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {supplier && (
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
            className="fixed right-0 top-0 z-[141] flex h-full w-[520px] flex-col border-l border-border bg-surface-overlay shadow-lg"
          >
            <SupplierDrawerBody supplier={supplier} onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const VENDOR_DOCS = [
  { name: "GST Certificate", meta: "Registration · PDF" },
  { name: "ISO 9001:2015", meta: "Quality cert · PDF" },
  { name: "Vendor Agreement", meta: "Signed contract · PDF" },
  { name: "Bank Details", meta: "Payment mandate · PDF" },
];

function SupplierDrawerBody({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const pos = usePurchaseOrders({ supplierId: supplier.id }).data?.items ?? [];
  const series = React.useMemo(() => supplierPerfSeries(), []);

  return (
    <>
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Initial s={supplier} size={56} />
            <div>
              <h2 className="text-base font-semibold">{supplier.name}</h2>
              <p className="font-mono text-xs text-muted-foreground">{supplier.code} · {supplier.country} · {supplier.region}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge variant={STATUS_VARIANT[supplier.status]}>
                  {supplier.approved && <CheckCircle2 className="mr-0.5 size-3" />}
                  {supplier.status}
                </Badge>
                <Badge variant="outline">Tier {supplier.tier}</Badge>
                <Stars rating={supplier.rating} />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-4 pt-2">
          <TabsList className="h-8 bg-transparent p-0">
            {[["overview", "Overview"], ["performance", "Performance"], ["pos", "Purchase Orders"], ["documents", "Documents"]].map(([v, l]) => (
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
                ["GST / VAT", supplier.gstVat, Receipt, true],
                ["Payment terms", supplier.paymentTerms, CreditCard, false],
                ["Avg lead time", `${supplier.leadTimeAvg}d`, Clock, false],
                ["Tier", `Tier ${supplier.tier}`, ShieldCheck, false],
                ["Parts supplied", formatNumber(supplier.partsSupplied), Boxes, false],
                ["Annual spend", formatCompactCurrency(supplier.annualSpend), CircleDollarSign, false],
              ] as [string, string, typeof Receipt, boolean][]).map(([k, v, Icon, mono]) => (
                <div key={k} className="bg-surface p-3">
                  <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <Icon className="size-3" /> {k}
                  </div>
                  <p className={cn("mt-1 truncate text-sm font-semibold", mono ? "font-mono text-[13px]" : "tabular")} title={v}>{v}</p>
                </div>
              ))}
            </div>

            {/* Categories supplied */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Categories supplied</p>
              {supplier.categoriesSupplied.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No categories listed.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {supplier.categoriesSupplied.map((c) => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Risk gauge */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                  <ShieldAlert className={cn("size-4", riskColor(supplier.riskScore))} /> Risk assessment
                </p>
                <span className={cn("text-sm font-bold tabular", riskColor(supplier.riskScore))}>{supplier.riskScore}/100</span>
              </div>
              <Progress value={supplier.riskScore} className="h-2.5" indicatorClassName={riskBar(supplier.riskScore)} />
              <div className="mt-1.5 flex justify-between text-2xs text-muted-foreground">
                <span>Low</span><span>Moderate</span><span>High</span>
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</p>
              <div className="space-y-1.5 text-[13px]">
                <p className="font-medium">{supplier.contact}</p>
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Mail className="size-3.5" /> {supplier.email}
                </a>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5" /> {supplier.country} · {supplier.category}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="xs"
                  onClick={() => {
                    window.location.href = `mailto:${supplier.email}?subject=${encodeURIComponent(`Innopolis — ${supplier.name}`)}`;
                    toast.success("Opening mail", `Composing to ${supplier.contact}`);
                  }}
                >
                  <Mail className="size-3.5" /> Contact
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    downloadJson(
                      {
                        vendor: supplier.name,
                        code: supplier.code,
                        contact: supplier.contact,
                        email: supplier.email,
                        country: supplier.country,
                        category: supplier.category,
                        tier: supplier.tier,
                        status: supplier.status,
                        approved: supplier.approved,
                        rating: supplier.rating,
                        onTimePct: supplier.onTimePct,
                        qualityPct: supplier.qualityPct,
                        riskScore: supplier.riskScore,
                        leadTimeAvg: supplier.leadTimeAvg,
                        openPOs: supplier.openPOs,
                        annualSpend: supplier.annualSpend,
                        paymentTerms: supplier.paymentTerms,
                      },
                      `scorecard-${supplier.name.replace(/\s+/g, "-")}.json`,
                    );
                    toast.success("Scorecard exported", supplier.name);
                  }}
                >
                  Export scorecard
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="m-0 space-y-3 p-4">
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="mb-1 text-[13px] font-semibold">On-time vs quality</p>
              <p className="mb-2 text-2xs text-muted-foreground">Trailing 12 months (%)</p>
              <LineTrend
                data={series}
                height={200}
                keys={[
                  { key: "onTime", color: "hsl(var(--primary))", name: "On-time" },
                  { key: "quality", color: "hsl(var(--success))", name: "Quality" },
                ]}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="flex items-center gap-1 text-2xs text-muted-foreground"><Truck className="size-3" /> On-time</p>
                <p className="text-lg font-semibold tabular text-primary">{supplier.onTimePct}%</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="flex items-center gap-1 text-2xs text-muted-foreground"><Gauge className="size-3" /> Quality</p>
                <p className="text-lg font-semibold tabular text-success">{supplier.qualityPct}%</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3">
                <p className="flex items-center gap-1 text-2xs text-muted-foreground"><ShieldAlert className="size-3" /> Risk</p>
                <p className={cn("text-lg font-semibold tabular", riskColor(supplier.riskScore))}>{supplier.riskScore}</p>
              </div>
            </div>
          </TabsContent>

          {/* Purchase Orders */}
          <TabsContent value="pos" className="m-0 p-4">
            {pos.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-foreground">No purchase orders for this vendor.</p>
            ) : (
              <div className="space-y-1.5">
                {pos.map((po) => (
                  <div key={po.id} className="rounded-lg border border-border bg-surface p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-medium">{po.number}</span>
                      <Badge variant={PO_STATUS_VARIANT[po.status]}>{po.status}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-2xs text-muted-foreground">
                      <span>{po.lineItems} lines · expected {formatDate(po.expectedDate)}</span>
                      <span className="text-[13px] font-semibold tabular text-foreground">{formatCurrency(po.totalValue)}</span>
                    </div>
                    <Progress value={po.receivedPct} className="mt-2 h-1" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="m-0 p-4">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Document repository</p>
            <div className="space-y-1.5">
              {VENDOR_DOCS.map((doc) => (
                <div key={doc.name} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{doc.name}</p>
                    <p className="text-2xs text-muted-foreground">{doc.meta}</p>
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      downloadText(
                        `${doc.name}\n${doc.meta}\nVendor: ${supplier.name}\n\n[Generated stand-in for this vendor document.]\n`,
                        `${doc.name.replace(/\s+/g, "-")}.txt`,
                      );
                      toast.success("Document downloaded", `${doc.name} — ${supplier.name}`);
                    }}
                  >
                    <Download className="size-3.5" /> View
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
}
