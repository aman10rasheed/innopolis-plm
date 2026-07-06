"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Network,
  Building2,
  Pencil,
  Share2,
  ReceiptText,
} from "lucide-react";
import type { Part } from "@/types";
import { Thumbnail } from "@/components/shared/thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LIFECYCLE_VARIANT, AVAILABILITY_VARIANT } from "@/constants/status";
import { usePart, usePartPriceHistory, toNumber } from "@/lib/api";

export function PartDetailDrawer({ part, onClose, onEdit }: { part: Part | null; onClose: () => void; onEdit?: (part: Part) => void }) {
  return (
    <AnimatePresence>
      {part && (
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
            className="fixed right-0 top-0 z-[141] flex h-full w-[480px] flex-col border-l border-border bg-surface-overlay shadow-lg"
          >
            <PartDrawerBody part={part} onClose={onClose} onEdit={onEdit} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function PartDrawerBody({ part, onClose, onEdit }: { part: Part; onClose: () => void; onEdit?: (part: Part) => void }) {
  // Vendors / resource specs / last-purchase attribution only come on the
  // single-material read — list rows don't carry them.
  const detailQ = usePart(part.id);
  const detail = detailQ.data ?? part;

  return (
    <>
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Thumbnail hue={part.thumbnailHue} size={56} />
            <div>
              <h2 className="text-base font-semibold leading-tight">{part.name}</h2>
              <p className="font-mono text-xs text-muted-foreground">{part.partNumber}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={LIFECYCLE_VARIANT[part.lifecycle]}>{part.lifecycle}</Badge>
                <Badge variant="muted">{part.category}</Badge>
                <Badge variant="outline">Rev {part.revision}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onEdit?.(part)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Network className="size-3.5" /> Where used
          </Button>
          <Button size="icon-sm" variant="outline">
            <Share2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-4 pt-2">
          <TabsList className="h-8 bg-transparent p-0">
            {[
              ["overview", "Overview"],
              ["pricing", "Pricing"],
              ["usage", "Where Used"],
              ["docs", "Documents"],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="h-8 rounded-none border-b-2 border-transparent px-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="overview" className="m-0 p-4">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
              {[
                ["Unit Cost", formatCurrency(part.unitCost)],
                ["Lead Time", `${part.leadTimeDays} days`],
                ["Weight", `${part.weightKg.toFixed(3)} kg`],
                ["Sourcing", part.sourcing],
                ["Material", part.material],
                ["Finish", part.finish],
                ["UoM", part.uom],
                ["In Stock", `${part.stockQty.toLocaleString()} ${part.uom}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface p-3">
                  <p className="text-2xs text-muted-foreground">{k}</p>
                  <p className="mt-0.5 text-[13px] font-medium">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Remarks</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{detail.remarks || "—"}</p>
            </div>

            {/* Preferred vendors (many-to-many) */}
            <div className="mt-4 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="size-3.5" /> Preferred vendors
                </p>
                <Badge variant={AVAILABILITY_VARIANT[part.availability]}>{part.availability}</Badge>
              </div>
              {detailQ.isLoading ? (
                <p className="mt-2 text-2xs text-muted-foreground">Loading vendors…</p>
              ) : detail.preferredVendors.length === 0 ? (
                <p className="mt-2 text-[13px] text-muted-foreground">No preferred vendors set.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.preferredVendors.map((v) => (
                    <span key={v.id} className="rounded-md border border-border bg-surface-sunken px-2 py-1 text-xs font-medium">
                      {v.name} <span className="text-muted-foreground">· {v.country}</span>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-2xs text-muted-foreground">MPN {part.manufacturerPartNumber || "—"}</p>
            </div>

            {/* Resource specs */}
            {detail.resourceSpecs.length > 0 && (
              <div className="mt-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Resource specifications</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {detail.resourceSpecs.map((r) => (
                    <Badge key={r.id} variant="outline" title={r.description}>
                      <span className="font-mono">{r.code}</span>&nbsp;{r.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {part.compliance.length > 0 && (
              <div className="mt-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {part.compliance.map((c) => (
                    <Badge key={c} variant="success">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
            {part.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {part.tags.map((t) => (
                    <span key={t} className="rounded-md border border-border px-1.5 py-0.5 text-2xs text-muted-foreground">#{t}</span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="m-0 p-4">
            <PricingTab partId={part.id} />
          </TabsContent>

          <TabsContent value="usage" className="m-0 p-4">
            {/* The where-used detail list has no dedicated API endpoint in the
                current contract; the material carries an aggregate usage count. */}
            {part.whereUsedCount > 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Used in {part.whereUsedCount} project BOM{part.whereUsedCount === 1 ? "" : "s"}.
              </p>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Not used in any project BOM.</p>
            )}
          </TabsContent>

          <TabsContent value="docs" className="m-0 p-4">
            <p className="py-8 text-center text-sm text-muted-foreground">No linked documents.</p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
}

/**
 * Purchase-price ledger: the last purchase (price · date · vendor) plus the
 * full history from GET /parts/:id/price-history. `last_purchase_price` is
 * system-maintained — every goods receipt appends a Purchase row.
 */
function PricingTab({ partId }: { partId: string }) {
  const q = usePartPriceHistory(partId);
  const data = q.data;

  if (q.isLoading) return <p className="py-8 text-center text-sm text-muted-foreground">Loading price history…</p>;
  if (q.isError || !data) return <p className="py-8 text-center text-sm text-muted-foreground">Price history unavailable.</p>;

  return (
    <>
      <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-primary">
          <ReceiptText className="size-3.5" /> Last purchase (system-maintained)
        </p>
        <p className="mt-1 text-lg font-semibold tabular">{formatCurrency(toNumber(data.last_purchase_price))}</p>
        <p className="text-2xs text-muted-foreground">
          {data.last_purchase_date ? formatDate(data.last_purchase_date) : "No purchases yet"}
          {data.last_purchase_vendor ? ` · from ${data.last_purchase_vendor.name}` : " · manual opening value"}
        </p>
      </div>

      {data.history.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No price events recorded.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[0.9fr_0.8fr_1.1fr_0.6fr_0.9fr] items-center gap-2 border-b border-border bg-surface/80 px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Price</span>
            <span>Source</span>
            <span>Reference</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Date</span>
          </div>
          <div className="divide-y divide-border">
            {data.history.map((h, i) => (
              <div key={i} className="grid grid-cols-[0.9fr_0.8fr_1.1fr_0.6fr_0.9fr] items-center gap-2 px-3 py-2 text-[13px]">
                <span className="font-medium tabular">{formatCurrency(toNumber(h.unit_price))}</span>
                <Badge variant={h.source === "Purchase" ? "default" : "muted"} className="w-fit">{h.source}</Badge>
                <span className="truncate font-mono text-2xs text-muted-foreground">{h.reference}</span>
                <span className="text-right tabular text-muted-foreground">{toNumber(h.quantity) || "—"}</span>
                <span className="text-right text-2xs text-muted-foreground">{formatDate(h.effective_date, { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
