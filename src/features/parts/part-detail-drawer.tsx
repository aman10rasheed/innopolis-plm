"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Network,
  Building2,
  Pencil,
  Share2,
} from "lucide-react";
import type { Part } from "@/types";
import { Thumbnail } from "@/components/shared/thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { LIFECYCLE_VARIANT, AVAILABILITY_VARIANT } from "@/constants/status";

export function PartDetailDrawer({ part, supplierName, onClose, onEdit }: { part: Part | null; supplierName: (id: string) => string; onClose: () => void; onEdit?: (part: Part) => void }) {
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
            <PartDrawerBody part={part} supplierName={supplierName} onClose={onClose} onEdit={onEdit} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function PartDrawerBody({ part, supplierName, onClose, onEdit }: { part: Part; supplierName: (id: string) => string; onClose: () => void; onEdit?: (part: Part) => void }) {
  const supplier = supplierName(part.supplierId);

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
              ["usage", "Where Used"],
              ["revisions", "Revisions"],
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
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{part.description}</p>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="text-[13px] font-medium">{supplier || "—"}</p>
                  <p className="text-2xs text-muted-foreground">MPN {part.manufacturerPartNumber}</p>
                </div>
              </div>
              <Badge variant={AVAILABILITY_VARIANT[part.availability]}>{part.availability}</Badge>
            </div>

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

          <TabsContent value="revisions" className="m-0 p-4">
            <p className="py-8 text-center text-sm text-muted-foreground">
              Current revision <span className="font-mono">{part.revision}</span> · full revision history is not exposed by the API.
            </p>
          </TabsContent>

          <TabsContent value="docs" className="m-0 p-4">
            <p className="py-8 text-center text-sm text-muted-foreground">No linked documents.</p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
}
