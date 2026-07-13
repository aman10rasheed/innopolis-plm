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
  PackageCheck,
  Send,
  ShoppingCart,
} from "lucide-react";
import {
  useRfqs,
  useRfq,
  useComparison,
  useCreateRfq,
  useSendRfq,
  useAddQuotation,
  useAwardQuotation,
  useCreatePo,
  usePurchaseOrders,
  usePurchaseOrder,
  useSetPoStatus,
  useReceivePo,
  usePoReceipts,
  useVendors,
  useBoms,
  useCategories,
  useWarehouses,
  toNumber,
} from "@/lib/api";
import type { ApiPoDetail } from "@/lib/api";
import type {
  RfqMode,
  Rfq,
  Quotation,
  PoStatus,
} from "@/types";
import { useUIStore } from "@/stores/ui-store";
import { ensureCanCreate } from "@/auth/permissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryBoundary } from "@/components/shared/query-boundary";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/** Build an id→vendor-name lookup from the vendors list (replaces getSupplier). */
function useVendorNameMap() {
  const vendors = useVendors().data?.items ?? [];
  return React.useMemo(() => {
    const map = new Map<string, string>();
    for (const v of vendors) map.set(v.id, v.name);
    return map;
  }, [vendors]);
}

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
          onCreatedPo={() => setTab("pos")}
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
  const q = useRfqs();
  const rfqs = q.data?.items ?? [];
  const nameMap = useVendorNameMap();
  const [genOpen, setGenOpen] = React.useState(false);
  const [quoteRfqId, setQuoteRfqId] = React.useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Requests for Quotation
        </h2>
        <Badge variant="muted">{rfqs.length}</Badge>
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => ensureCanCreate("rfq") && setGenOpen(true)}
        >
          <Sparkles className="size-4" /> Generate RFQ
        </Button>
      </div>

      <ScrollArea className="h-full">
        <QueryBoundary isLoading={q.isLoading} isError={q.isError} error={q.error} onRetry={q.refetch}>
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
                  <div
                    key={rfq.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenComparison(rfq.id)}
                    onKeyDown={(e) => e.key === "Enter" && onOpenComparison(rfq.id)}
                    className="grid w-full cursor-pointer grid-cols-[1fr_2fr_1.1fr_1fr_0.9fr_0.8fr_0.7fr_0.9fr_1.1fr] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent/40"
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
                    <VendorStack vendorIds={rfq.vendorIds} nameMap={nameMap} />
                    <span className="text-right text-[13px] tabular text-muted-foreground">
                      {rfq.lineItems}
                    </span>
                    <span className="text-right text-[13px] font-semibold tabular">
                      {formatCompactCurrency(rfq.estValue)}
                    </span>
                    {rfq.status === "Draft" ? (
                      <SendRfqButton rfqId={rfq.id} rfqNumber={rfq.number} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(rfq.quotesReceived / Math.max(1, rfq.quotesExpected)) * 100}
                          className="h-1.5 flex-1"
                        />
                        <span className="w-8 shrink-0 text-right text-2xs tabular text-muted-foreground">
                          {rfq.quotesReceived}/{rfq.quotesExpected}
                        </span>
                        {(rfq.status === "Sent" || rfq.status === "Quotes In") && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuoteRfqId(rfq.id);
                            }}
                          >
                            Quote
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 px-1 text-2xs text-muted-foreground">
              Tip: select a row to compare received quotations.
            </p>
          </div>
        </QueryBoundary>
      </ScrollArea>

      <GenerateRfqDialog open={genOpen} onOpenChange={setGenOpen} />
      <RecordQuotationDialog rfqId={quoteRfqId} onClose={() => setQuoteRfqId(null)} />
    </div>
  );
}

/**
 * Record a vendor's quotation against a Sent RFQ — one unit price per RFQ line.
 * POST /api/rfqs/:id/quotations (one quotation per vendor).
 */
function RecordQuotationDialog({ rfqId, onClose }: { rfqId: string | null; onClose: () => void }) {
  const detailQ = useRfq(rfqId ?? "");
  const detail = detailQ.data;
  const vendors = useVendors().data?.items ?? [];
  const addQuotation = useAddQuotation();

  const [vendorId, setVendorId] = React.useState("");
  const [leadTime, setLeadTime] = React.useState("21");
  const [paymentTerms, setPaymentTerms] = React.useState("30 days");
  const [prices, setPrices] = React.useState<Record<string, string>>({});

  // reset whenever a different RFQ is opened
  React.useEffect(() => {
    setVendorId("");
    setLeadTime("21");
    setPaymentTerms("30 days");
    setPrices({});
  }, [rfqId]);

  // vendors on the RFQ that haven't quoted yet
  const alreadyQuoted = new Set((detail?.quotations ?? []).map((qt) => qt.vendor_id));
  const eligibleVendors = vendors.filter(
    (v) => (detail?.vendor_ids ?? []).includes(v.id) && !alreadyQuoted.has(v.id),
  );

  const lines = detail?.lines ?? [];
  const allPriced = lines.length > 0 && lines.every((l) => Number(prices[l.id]) > 0);
  const canSubmit = !!rfqId && !!vendorId && allPriced && !addQuotation.isPending;

  const submit = async () => {
    if (!canSubmit || !rfqId) return;
    try {
      await addQuotation.mutateAsync({
        rfqId,
        body: {
          vendor_id: vendorId,
          lead_time_days: Math.max(1, Math.round(Number(leadTime) || 21)),
          payment_terms: paymentTerms,
          lines: lines.map((l) => ({ rfq_line_id: l.id, unit_price: Number(prices[l.id]) })),
        },
      });
      toast.success("Quotation recorded", `${detail?.number ?? "RFQ"} — quote saved for comparison`);
      onClose();
    } catch (err) {
      toast.error("Could not record quotation", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <Dialog open={!!rfqId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record quotation</DialogTitle>
          <DialogDescription>
            {detail ? `${detail.number} · ${detail.title}` : "Loading RFQ…"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block space-y-1 sm:col-span-1">
              <span className="text-2xs font-medium text-muted-foreground">Vendor</span>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder={eligibleVendors.length ? "Select…" : "All quoted"} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleVendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block space-y-1">
              <span className="text-2xs font-medium text-muted-foreground">Lead time (days)</span>
              <Input type="number" min={1} value={leadTime} onChange={(e) => setLeadTime(e.target.value)} />
            </label>
            <label className="block space-y-1">
              <span className="text-2xs font-medium text-muted-foreground">Payment terms</span>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-2xs font-medium text-muted-foreground">Unit price per line</span>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              {lines.length === 0 ? (
                <div className="px-3 py-4 text-center text-2xs text-muted-foreground">
                  {detailQ.isLoading ? "Loading lines…" : "No lines on this RFQ"}
                </div>
              ) : (
                lines.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2.5 border-b border-border/50 px-3 py-2 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{l.name}</p>
                      <p className="font-mono text-2xs text-muted-foreground">
                        {l.part_number} · qty {toNumber(l.quantity)}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="Unit price"
                      className="w-32"
                      value={prices[l.id] ?? ""}
                      onChange={(e) => setPrices((p) => ({ ...p, [l.id]: e.target.value }))}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={submit} disabled={!canSubmit}>
            Record quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Inline "Send" action for Draft RFQs — issues the RFQ to its vendors. */
function SendRfqButton({ rfqId, rfqNumber }: { rfqId: string; rfqNumber: string }) {
  const sendRfq = useSendRfq();
  const send = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await sendRfq.mutateAsync(rfqId);
      toast.success("RFQ sent", `${rfqNumber} issued to vendors — quotes can now be recorded`);
    } catch (err) {
      toast.error("Could not send RFQ", err instanceof Error ? err.message : "Please try again.");
    }
  };
  return (
    <Button size="xs" variant="outline" className="gap-1.5" onClick={send} disabled={sendRfq.isPending}>
      <Send className="size-3" /> Send
    </Button>
  );
}

function VendorStack({
  vendorIds,
  nameMap,
}: {
  vendorIds: string[];
  nameMap: Map<string, string>;
}) {
  const shown = vendorIds.slice(0, 3);
  const extra = vendorIds.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((id) => {
          const name = nameMap.get(id);
          const initials =
            name
              ?.split(" ")
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
  const [title, setTitle] = React.useState("");
  const [bomId, setBomId] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("");
  const [vendorIds, setVendorIds] = React.useState<Set<string>>(new Set());
  const createRfq = useCreateRfq();

  const bomsQuery = useBoms();
  // Only BOMs that actually have lines can seed an RFQ (server rejects empty ones).
  const boms = (bomsQuery.data?.items ?? []).filter((b) => b.lineItems > 0);
  const vendors = useVendors().data?.items ?? [];
  const categories = useCategories().data ?? [];

  // reset the form each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setMode("Vendor-wise");
      setTitle("");
      setBomId("");
      setCategory("");
      setVendorIds(new Set());
    }
  }, [open]);

  const toggleVendor = (id: string) =>
    setVendorIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const canGenerate = !!bomId && vendorIds.size > 0 && !createRfq.isPending;

  const generate = async () => {
    if (!canGenerate) return;
    const bom = boms.find((b) => b.id === bomId);
    try {
      await createRfq.mutateAsync({
        title: title.trim() || `${mode} RFQ — ${bom?.number ?? "BOM"}`,
        mode,
        from_bom_id: bomId,
        vendor_ids: [...vendorIds],
        ...(mode === "Category-wise" && category ? { category } : {}),
      });
      toast.success("RFQ generated", `New ${mode} RFQ created from ${bom?.number ?? "BOM"}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        "Could not generate RFQ",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate RFQ</DialogTitle>
          <DialogDescription>
            Pick a source BOM, the vendors to quote, and how line items should be grouped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-2xs font-medium text-muted-foreground">Title (optional)</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fermenter valves & bearings"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-2xs font-medium text-muted-foreground">Source BOM</span>
              <Select value={bomId} onValueChange={setBomId}>
                <SelectTrigger>
                  <SelectValue placeholder={boms.length ? "Select a BOM…" : "No BOMs with lines"} />
                </SelectTrigger>
                <SelectContent>
                  {boms.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.number} · {b.projectNumber || b.projectName || "—"} · {b.lineItems} lines
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            {mode === "Category-wise" && (
              <label className="block space-y-1">
                <span className="text-2xs font-medium text-muted-foreground">Category filter</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-2xs font-medium text-muted-foreground">
              Vendors ({vendorIds.size} selected)
            </span>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
              {vendors.length === 0 ? (
                <div className="px-3 py-4 text-center text-2xs text-muted-foreground">No vendors available</div>
              ) : (
                vendors.map((v) => (
                  <label
                    key={v.id}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-border/50 px-3 py-2 last:border-b-0 hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={vendorIds.has(v.id)}
                      onCheckedChange={() => toggleVendor(v.id)}
                      className="size-3.5"
                    />
                    <span className="flex-1 truncate text-[13px]">{v.name}</span>
                    <span className="font-mono text-2xs text-muted-foreground">{v.code}</span>
                  </label>
                ))
              )}
            </div>
          </div>

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
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={generate} disabled={!canGenerate}>
            <Sparkles className="size-4" /> Generate
          </Button>
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
  onCreatedPo,
}: {
  selectedRfqId: string | null;
  setSelectedRfqId: (id: string) => void;
  onCreatedPo: () => void;
}) {
  const q = useRfqs();
  const rfqs = q.data?.items ?? [];

  // RFQs that (per their aggregate) have received at least one quote.
  const rfqsWithQuotes = React.useMemo(
    () => rfqs.filter((rfq) => rfq.quotesReceived > 0),
    [rfqs],
  );

  // Default to first RFQ with quotes if nothing valid selected.
  const activeRfq =
    rfqsWithQuotes.find((r) => r.id === selectedRfqId) ?? rfqsWithQuotes[0] ?? null;

  return (
    <QueryBoundary
      isLoading={q.isLoading}
      isError={q.isError}
      error={q.error}
      onRetry={q.refetch}
    >
      {rfqsWithQuotes.length === 0 ? (
        <div className="flex h-full items-center justify-center p-8">
          <EmptyState
            icon={Scale}
            title="No quotations received yet"
            description="Once vendors respond to your RFQs, side-by-side comparisons appear here."
          />
        </div>
      ) : (
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
                        {rfq.quotesReceived} quote{rfq.quotesReceived === 1 ? "" : "s"} · {formatCompactCurrency(rfq.estValue)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Comparison grid */}
          <div className="min-w-0 flex-1">
            {activeRfq && <ComparisonGrid rfq={activeRfq} onCreatedPo={onCreatedPo} />}
          </div>
        </div>
      )}
    </QueryBoundary>
  );
}

interface CmpRow {
  label: string;
  render: (q: Quotation) => React.ReactNode;
  best?: (q: Quotation, quotes: Quotation[]) => boolean;
}

function ComparisonGrid({ rfq, onCreatedPo }: { rfq: Rfq; onCreatedPo: () => void }) {
  const qq = useComparison(rfq.id);
  const awardMut = useAwardQuotation();
  const createPoMut = useCreatePo();

  const quotes = React.useMemo(
    () => [...(qq.data?.quotations ?? [])].sort((a, b) => a.rank - b.rank),
    [qq.data],
  );

  const award = async (quote: Quotation) => {
    try {
      await awardMut.mutateAsync(quote.id);
      toast.success("Quotation awarded", `${quote.rfqNumber} awarded to ${quote.vendorName}`);
    } catch (err) {
      toast.error(
        "Could not award quotation",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const createPo = async (quote: Quotation) => {
    try {
      const po = await createPoMut.mutateAsync({ from_quotation_id: quote.id });
      toast.success(
        "Purchase order drafted",
        `${po.number} · ${quote.vendorName} — from ${quote.rfqNumber}`,
      );
      onCreatedPo();
    } catch (err) {
      toast.error(
        "Could not create PO",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  return (
    <QueryBoundary
      isLoading={qq.isLoading}
      isError={qq.isError}
      error={qq.error}
      onRetry={qq.refetch}
    >
      {quotes.length === 0 ? (
        <div className="flex h-full items-center justify-center p-8">
          <EmptyState
            icon={Scale}
            title="No quotations received yet"
            description="Once vendors respond to this RFQ, a comparison appears here."
          />
        </div>
      ) : (
        <ComparisonGridInner
          rfq={rfq}
          quotes={quotes}
          onAward={award}
          onCreatePo={createPo}
          isCreatingPo={createPoMut.isPending}
        />
      )}
    </QueryBoundary>
  );
}

function ComparisonGridInner({
  rfq,
  quotes,
  onAward,
  onCreatePo,
  isCreatingPo,
}: {
  rfq: Rfq;
  quotes: Quotation[];
  onAward: (q: Quotation) => void;
  onCreatePo: (q: Quotation) => void;
  isCreatingPo: boolean;
}) {
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
                  {q.status === "Awarded" ? (
                    <Button
                      size="xs"
                      variant="default"
                      className="w-full gap-1.5"
                      onClick={() => onCreatePo(q)}
                      disabled={isCreatingPo}
                    >
                      <ShoppingCart className="size-3" /> Create PO
                    </Button>
                  ) : q.status === "Rejected" ? (
                    <Button size="xs" variant="ghost" className="w-full" disabled>
                      Not selected
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant={recommended ? "default" : "outline"}
                      className="w-full"
                      onClick={() => onAward(q)}
                    >
                      Award
                    </Button>
                  )}
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

/** The next status a PO can be advanced to via the /status pipeline.
 * `Received` / `Partially Received` are receipt-derived and set ONLY by the
 * goods-receipt endpoint — never via /status (backend rejects them with 400).
 * From `Open`/`Partially Received`, receive goods; `Partially Received` may
 * also be short-closed to `Closed`. */
const NEXT_PO_STATUS: Partial<Record<PoStatus, PoStatus>> = {
  Draft: "Pending Approval",
  "Pending Approval": "Open",
  "Partially Received": "Closed",
  Received: "Closed",
};

function PurchaseOrdersTab() {
  const setCreatePoOpen = useUIStore((s) => s.setCreatePoOpen);
  const q = usePurchaseOrders();
  const pos = q.data?.items ?? [];
  const [activePoId, setActivePoId] = React.useState<string | null>(null);

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

          <QueryBoundary isLoading={q.isLoading} isError={q.isError} error={q.error} onRetry={q.refetch}>
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
                    onClick={() => setActivePoId(po.id)}
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
          </QueryBoundary>
        </section>
      </div>

      <PoDetailDialog poId={activePoId} onClose={() => setActivePoId(null)} />
    </ScrollArea>
  );
}

function PoDetailDialog({
  poId,
  onClose,
}: {
  poId: string | null;
  onClose: () => void;
}) {
  const detail = usePurchaseOrder(poId ?? "");
  const receipts = usePoReceipts(poId ?? "");
  const setStatus = useSetPoStatus();
  const receive = useReceivePo();
  const po = detail.data;
  const grns = receipts.data ?? [];
  const [receiveOpen, setReceiveOpen] = React.useState(false);

  const advance = async () => {
    if (!po) return;
    const next = NEXT_PO_STATUS[po.status];
    if (!next) return;
    try {
      await setStatus.mutateAsync({ id: po.id, status: next });
      toast.success("Status updated", `${po.number} → ${next}`);
    } catch (err) {
      toast.error(
        "Could not update status",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const nextStatus = po ? NEXT_PO_STATUS[po.status] : undefined;
  const canReceive =
    po?.status === "Open" || po?.status === "Partially Received";

  return (
    <Dialog open={!!poId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <QueryBoundary
          isLoading={detail.isLoading}
          isError={detail.isError}
          error={detail.error}
          onRetry={detail.refetch}
        >
          {po && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{po.number}</DialogTitle>
                <DialogDescription>{po.supplier_name}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-[13px]">
                {[
                  ["Status", po.status],
                  ["Priority", po.priority],
                  ["Total value", formatCurrency(toNumber(po.total_value))],
                  ["Line items", String(po.line_items)],
                  ["Ordered", formatDate(po.ordered_date)],
                  ["Expected", po.expected_date ? formatDate(po.expected_date) : "—"],
                  ["Received", `${Math.round(toNumber(po.received_pct))}%`],
                  ["On-time risk", po.on_time_risk ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface p-3">
                    <p className="text-2xs text-muted-foreground">{k}</p>
                    <p className="mt-0.5 font-medium">{v}</p>
                  </div>
                ))}
              </div>

              {/* Line items */}
              {po.lines.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="grid grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr] items-center gap-2 border-b border-border bg-surface/80 px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Material</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Unit price</span>
                    <span className="text-right">Received</span>
                  </div>
                  <div className="max-h-56 divide-y divide-border overflow-auto">
                    {po.lines.map((line) => (
                      <div
                        key={line.id}
                        className="grid grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr] items-center gap-2 px-3 py-2 text-[13px]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{line.name}</p>
                          <p className="truncate font-mono text-2xs text-muted-foreground">{line.part_number}</p>
                        </div>
                        <span className="text-right tabular">{toNumber(line.quantity)}</span>
                        <span className="text-right tabular">{formatCurrency(toNumber(line.unit_price))}</span>
                        <span className="text-right tabular text-muted-foreground">
                          {toNumber(line.received_qty)}/{toNumber(line.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery history — one GRN per (partial) receipt */}
              {grns.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="border-b border-border bg-surface/80 px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Deliveries ({grns.length})
                  </div>
                  <div className="max-h-44 divide-y divide-border overflow-auto">
                    {grns.map((g) => (
                      <div key={g.grn_number} className="px-3 py-2 text-[13px]">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono font-medium">{g.grn_number}</span>
                          <span className="text-2xs text-muted-foreground">
                            {formatDate(g.received_at)} · {g.received_by_name}
                          </span>
                        </div>
                        {g.note && <p className="mt-0.5 text-2xs text-muted-foreground">{g.note}</p>}
                        <div className="mt-1 space-y-0.5">
                          {g.lines.map((l, i) => (
                            <div key={i} className="flex justify-between gap-2 text-2xs text-muted-foreground">
                              <span className="truncate font-mono">
                                {l.part_number}
                                {l.batch ? ` · ${l.batch}` : ""}
                              </span>
                              <span className="shrink-0 tabular">
                                +{toNumber(l.accepted_qty)}
                                {toNumber(l.rejected_qty) > 0 ? ` · ${toNumber(l.rejected_qty)} rejected` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                {nextStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={advance}
                    disabled={setStatus.isPending}
                  >
                    <Send className="size-4" /> Advance to {nextStatus}
                  </Button>
                )}
                {canReceive && (
                  <Button size="sm" onClick={() => setReceiveOpen(true)} disabled={receive.isPending}>
                    <PackageCheck className="size-4" /> Receive goods
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </QueryBoundary>
      </DialogContent>
      {po && (
        <ReceiveGoodsDialog
          po={po}
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          receive={receive}
        />
      )}
    </Dialog>
  );
}

/**
 * Goods receipt — books received/rejected quantities per PO line into a chosen
 * warehouse (POST /purchase-orders/:id/receive with warehouse_id + batch).
 */
function ReceiveGoodsDialog({
  po,
  open,
  onOpenChange,
  receive,
}: {
  po: ApiPoDetail;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  receive: ReturnType<typeof useReceivePo>;
}) {
  const warehousesQuery = useWarehouses();
  const warehouses = warehousesQuery.data ?? [];
  const [warehouseId, setWarehouseId] = React.useState("");
  const [note, setNote] = React.useState("");

  // lines with anything left to receive, with editable qty / rejected / batch
  const outstanding = React.useMemo(
    () =>
      po.lines
        .map((l) => ({ line: l, remaining: toNumber(l.quantity) - toNumber(l.received_qty) }))
        .filter((x) => x.remaining > 0),
    [po.lines],
  );
  const [rows, setRows] = React.useState<Record<string, { qty: string; rejected: string; batch: string }>>({});

  // reset the form each time the dialog opens: default to receive the full remainder
  React.useEffect(() => {
    if (!open) return;
    setRows(
      Object.fromEntries(
        outstanding.map(({ line, remaining }) => [
          line.id,
          { qty: String(remaining), rejected: "0", batch: "" },
        ]),
      ),
    );
    setNote("");
    setWarehouseId((prev) => prev || warehouses[0]?.id || "");
  }, [open, outstanding, warehouses]);

  const setRow = (id: string, patch: Partial<{ qty: string; rejected: string; batch: string }>) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }));

  const parsed = outstanding.map(({ line, remaining }) => {
    const row = rows[line.id] ?? { qty: "0", rejected: "0", batch: "" };
    const qty = Number(row.qty);
    const rejected = Number(row.rejected);
    const valid =
      Number.isFinite(qty) && Number.isFinite(rejected) &&
      qty >= 0 && rejected >= 0 && qty + rejected <= remaining;
    return { line, remaining, row, qty, rejected, valid };
  });
  const anyQuantity = parsed.some((p) => p.qty > 0 || p.rejected > 0);
  const canSubmit =
    !!warehouseId && anyQuantity && parsed.every((p) => p.valid) && !receive.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    const wh = warehouses.find((w) => w.id === warehouseId);
    try {
      await receive.mutateAsync({
        id: po.id,
        body: {
          warehouse_id: warehouseId,
          note: note.trim() || undefined,
          lines: parsed
            .filter((p) => p.qty > 0 || p.rejected > 0)
            .map((p) => ({
              po_line_id: p.line.id,
              // API semantics: received_qty is gross (accepted + rejected) for
              // THIS delivery only — the backend accumulates deltas onto the
              // line and books received_qty − rejected_qty into stock.
              received_qty: p.qty + p.rejected,
              rejected_qty: p.rejected > 0 ? p.rejected : undefined,
              batch: p.row.batch.trim() || undefined,
            })),
        },
      });
      toast.success(
        "Goods received",
        `${po.number} → ${wh ? `${wh.code} · ${wh.name}` : "warehouse"}`,
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(
        "Could not receive goods",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive goods</DialogTitle>
          <DialogDescription>
            Book a delivery against {po.number} — enter only what arrived in this
            delivery; the remaining balance updates automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-2xs font-medium text-muted-foreground">Receiving warehouse</span>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder={warehousesQuery.isLoading ? "Loading warehouses…" : "Select warehouse"} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code} · {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="block space-y-1">
            <span className="text-2xs font-medium text-muted-foreground">Delivery note (optional)</span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Courier LR-88213"
            />
          </label>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1.5fr_0.6fr_0.7fr_0.7fr_0.9fr] items-center gap-2 border-b border-border bg-surface/80 px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Material</span>
              <span className="text-right">Remaining</span>
              <span className="text-right">Receive now</span>
              <span className="text-right">Reject</span>
              <span>Batch</span>
            </div>
            <div className="max-h-64 divide-y divide-border overflow-auto">
              {parsed.map(({ line, remaining, row, valid }) => (
                <div
                  key={line.id}
                  className="grid grid-cols-[1.5fr_0.6fr_0.7fr_0.7fr_0.9fr] items-center gap-2 px-3 py-2 text-[13px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{line.name}</p>
                    <p className="truncate font-mono text-2xs text-muted-foreground">{line.part_number}</p>
                  </div>
                  <span className="text-right tabular text-muted-foreground">{remaining}</span>
                  <Input
                    type="number"
                    min={0}
                    max={remaining}
                    step="any"
                    value={row.qty}
                    onChange={(e) => setRow(line.id, { qty: e.target.value })}
                    className={cn("h-7 text-right tabular", !valid && "border-destructive")}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={remaining}
                    step="any"
                    value={row.rejected}
                    onChange={(e) => setRow(line.id, { rejected: e.target.value })}
                    className={cn("h-7 text-right tabular", !valid && "border-destructive")}
                  />
                  <Input
                    value={row.batch}
                    onChange={(e) => setRow(line.id, { batch: e.target.value })}
                    placeholder="e.g. LOT-042"
                    className="h-7 font-mono text-2xs"
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="text-2xs text-muted-foreground">
            Accept + reject cannot exceed the open quantity per line. Only accepted units enter stock; rejected units are recorded on the movement.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!canSubmit}>
            <PackageCheck className="size-4" /> Book receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
