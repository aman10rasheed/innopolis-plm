"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Box,
  Network,
  History,
  Building2,
  FileText,
  ExternalLink,
  Pencil,
  Share2,
  Layers,
} from "lucide-react";
import type { Part } from "@/types";
import { Thumbnail } from "@/components/shared/thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSupplier, getProduct, whereUsed, db } from "@/mock/db";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { LIFECYCLE_VARIANT, AVAILABILITY_VARIANT } from "@/constants/status";

export function PartDetailDrawer({ part, onClose }: { part: Part | null; onClose: () => void }) {
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
            <PartDrawerBody part={part} onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function PartDrawerBody({ part, onClose }: { part: Part; onClose: () => void }) {
  const supplier = getSupplier(part.supplierId);
  const usages = whereUsed(part.id);
  const revs = db().revisions.filter((r) => r.itemId === part.id).slice(0, 6);
  const docs = db().documents.filter((d) => d.linkedItemId === part.id).slice(0, 6);

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
          <Button size="sm" className="flex-1">
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
                  <p className="text-[13px] font-medium">{supplier?.name}</p>
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
            {usages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Not used in any project BOM.</p>
            ) : (
              <div className="space-y-1.5">
                <p className="mb-2 text-2xs text-muted-foreground">Used in {usages.length} project BOMs</p>
                {usages.map((u, i) => {
                  const p = getProduct(u.projectId);
                  if (!p) return null;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Layers className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{p.name}</p>
                        <p className="font-mono text-2xs text-muted-foreground">{p.code}</p>
                      </div>
                      <Badge variant="muted">×{u.qty}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="revisions" className="m-0 p-4">
            <div className="relative space-y-0 pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {revs.map((r) => (
                <div key={r.id} className="relative pb-4">
                  <div className={cn("absolute -left-5 top-1 size-3.5 rounded-full border-2 border-surface", r.status === "Released" ? "bg-success" : "bg-muted-foreground")} />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold">Rev {r.revision}</span>
                    <Badge variant={r.status === "Released" ? "success" : "muted"}>{r.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{r.changeSummary}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{formatDate(r.date)} {r.ecoNumber && `· ${r.ecoNumber}`}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="docs" className="m-0 p-4">
            {docs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No linked documents.</p>
            ) : (
              <div className="space-y-1.5">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{doc.name}</p>
                      <p className="text-2xs text-muted-foreground">{doc.type} · {doc.format} · v{doc.version}</p>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground" />
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
