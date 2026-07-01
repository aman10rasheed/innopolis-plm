"use client";

import * as React from "react";
import {
  History,
  CheckCircle2,
  Eye,
  Boxes,
  Search,
  GitCompare,
  RotateCcw,
  ArrowRight,
  FileClock,
} from "lucide-react";
import { db, getUser, addRevision } from "@/mock/db";
import type { Revision } from "@/types";
import { useUIStore } from "@/stores/ui-store";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { toast } from "@/components/ui/toast";
import { formatNumber, formatDate, timeAgo, cn } from "@/lib/utils";

const STATUS_VARIANT: Record<Revision["status"], BadgeProps["variant"]> = {
  Released: "success",
  Superseded: "muted",
  Working: "info",
  "In Review": "warning",
};

const STATUSES: Revision["status"][] = ["Released", "In Review", "Working", "Superseded"];

export function RevisionsView() {
  const revisions = db().revisions;
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");

  const sorted = React.useMemo(
    () => [...revisions].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [revisions],
  );

  const stats = React.useMemo(() => {
    const total = revisions.length;
    const released = revisions.filter((r) => r.status === "Released").length;
    const inReview = revisions.filter((r) => r.status === "In Review").length;
    const items = new Set(revisions.map((r) => r.itemId)).size;
    return { total, released, inReview, items };
  }, [revisions]);

  const feed = sorted.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!r.itemName.toLowerCase().includes(q) && !r.itemPartNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="grid grid-cols-2 gap-3 p-4 pb-0 lg:grid-cols-4">
          <StatCard label="Total revisions" value={formatNumber(stats.total)} icon={History} accent="primary" delta={8} />
          <StatCard label="Released" value={formatNumber(stats.released)} icon={CheckCircle2} accent="success" delta={5} />
          <StatCard label="In review" value={formatNumber(stats.inReview)} icon={Eye} accent="warning" delta={-2} invertDelta />
          <StatCard label="Items tracked" value={formatNumber(stats.items)} icon={Boxes} accent="info" delta={3} />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by item…" className="h-8 pl-8" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-2xs text-muted-foreground tabular">{feed.length} revisions</span>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="relative space-y-0 p-4 pl-8">
            <div className="absolute left-[26px] top-6 bottom-6 w-px bg-border" />
            {feed.map((r) => {
              const author = getUser(r.authorId);
              return (
                <div key={r.id} className="relative pb-3">
                  <div className="absolute -left-[14px] top-3 size-3 rounded-full border-2 border-surface bg-primary" />
                  <div className="rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong">
                    <div className="flex items-start gap-3">
                      {author && (
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="text-[10px]" style={{ background: `hsl(${author.hue} 55% 22%)`, color: `hsl(${author.hue} 80% 76%)` }}>{author.initials}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[13px] font-semibold">{r.itemName}</span>
                          <span className="font-mono text-2xs text-muted-foreground">{r.itemPartNumber}</span>
                          <Badge variant="muted">Rev {r.revision}</Badge>
                          <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                          {r.ecoNumber && <Badge variant="outline">{r.ecoNumber}</Badge>}
                          <span className="ml-auto text-2xs text-muted-foreground">{timeAgo(r.date)}</span>
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground">{r.changeSummary}</p>
                        <div className="mt-2 flex items-center gap-3 text-2xs">
                          <span className="font-medium tabular text-success">+{r.added} added</span>
                          <span className="font-medium tabular text-destructive">−{r.removed} removed</span>
                          <span className="font-medium tabular text-warning">~{r.modified} modified</span>
                          <span className="text-muted-foreground">· {r.changedFields} fields · {author?.name} · {formatDate(r.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <ComparePanel />
    </div>
  );
}

type DiffField = { field: string; before: string; after: string };
const DIFF_FIELDS: DiffField[] = [
  { field: "Material", before: "AISI 1045 Steel", after: "AISI 4140 Alloy Steel" },
  { field: "Unit Cost", before: "$12.40", after: "$10.85" },
  { field: "Tolerance", before: "±0.10 mm", after: "±0.05 mm" },
  { field: "Finish", before: "Zinc Plated", after: "Black Oxide" },
  { field: "Lead Time", before: "21 days", after: "14 days" },
];

function ComparePanel() {
  const dataRev = useUIStore((s) => s.dataRev);
  const bumpDataRev = useUIStore((s) => s.bumpDataRev);
  const revisions = db().revisions;
  const items = React.useMemo(() => {
    const byItem = new Map<string, { id: string; label: string; revs: Revision[] }>();
    for (const r of revisions) {
      if (!byItem.has(r.itemId)) byItem.set(r.itemId, { id: r.itemId, label: `${r.itemName} (${r.itemPartNumber})`, revs: [] });
      byItem.get(r.itemId)!.revs.push(r);
    }
    return [...byItem.values()].filter((i) => i.revs.length >= 2).slice(0, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revisions, dataRev]);

  const [itemId, setItemId] = React.useState<string>(items[0]?.id ?? "");
  const item = items.find((i) => i.id === itemId);
  const revs = React.useMemo(
    () => (item ? [...item.revs].sort((a, b) => +new Date(b.date) - +new Date(a.date)) : []),
    [item],
  );

  const [fromRev, setFromRev] = React.useState<string>("");
  const [toRev, setToRev] = React.useState<string>("");

  React.useEffect(() => {
    if (revs.length >= 2) {
      setToRev(revs[0].id);
      setFromRev(revs[1].id);
    } else {
      setToRev(revs[0]?.id ?? "");
      setFromRev("");
    }
  }, [revs]);

  const from = revs.find((r) => r.id === fromRev);
  const to = revs.find((r) => r.id === toRev);

  return (
    <div className="hidden w-[360px] shrink-0 flex-col border-l border-border bg-surface/40 lg:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <GitCompare className="size-4 text-primary" />
        <span className="text-[13px] font-semibold">Compare revisions</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-muted-foreground">Component</label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="h-8 w-full"><SelectValue placeholder="Select component" /></SelectTrigger>
              <SelectContent>
                {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-muted-foreground">Base</label>
              <Select value={fromRev} onValueChange={setFromRev}>
                <SelectTrigger className="h-8 w-full"><SelectValue placeholder="Rev" /></SelectTrigger>
                <SelectContent>
                  {revs.map((r) => <SelectItem key={r.id} value={r.id}>Rev {r.revision} · {formatDate(r.date)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-muted-foreground">Target</label>
              <Select value={toRev} onValueChange={setToRev}>
                <SelectTrigger className="h-8 w-full"><SelectValue placeholder="Rev" /></SelectTrigger>
                <SelectContent>
                  {revs.map((r) => <SelectItem key={r.id} value={r.id}>Rev {r.revision} · {formatDate(r.date)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {from && to ? (
            <>
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface p-2 text-2xs">
                <Badge variant="muted">Rev {from.revision}</Badge>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <Badge variant={STATUS_VARIANT[to.status]}>Rev {to.revision}</Badge>
              </div>

              <div className="space-y-2">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Field-level diff</p>
                {DIFF_FIELDS.map((d) => (
                  <div key={d.field} className="rounded-lg border border-border bg-surface p-2.5">
                    <p className="mb-1.5 text-2xs font-medium text-muted-foreground">{d.field}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5">
                        <p className="text-[10px] uppercase text-destructive/80">Before</p>
                        <p className="text-[13px] font-medium text-destructive line-through decoration-destructive/40">{d.before}</p>
                      </div>
                      <div className="rounded-md border border-success/30 bg-success/10 px-2 py-1.5">
                        <p className="text-[10px] uppercase text-success/80">After</p>
                        <p className="text-[13px] font-medium text-success">{d.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => {
                  if (!from || !item) return;
                  addRevision({
                    id: `rev-restore-${Date.now()}`,
                    itemId: item.id,
                    itemPartNumber: from.itemPartNumber,
                    itemName: from.itemName,
                    revision: from.revision,
                    status: "Working",
                    authorId: db().users[0]!.id,
                    date: new Date().toISOString(),
                    changeSummary: `Restored to Rev ${from.revision}`,
                    changedFields: 0,
                    added: 0,
                    removed: 0,
                    modified: 0,
                  });
                  bumpDataRev();
                  toast.success("Revision restored", `${item.label} reverted to Rev ${from.revision}`);
                }}
              >
                <RotateCcw className="size-3.5" /> Restore Rev {from.revision}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <FileClock className="size-8" />
              <p className="text-2xs">Select two revisions to compare.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
