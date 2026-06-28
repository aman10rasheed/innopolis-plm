"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Clock,
  CircleDollarSign,
  Layers,
  X,
  ArrowDownUp,
  CircleDot,
  Check,
} from "lucide-react";
import { db, getUser } from "@/mock/db";
import type { Approval } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PRIORITY_VARIANT } from "@/constants/status";
import { cn, formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

type Filter = "Pending" | "Approved" | "All";
type Sort = "priority" | "due";

const PRIORITY_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function UserAvatar({ id, size = 24 }: { id: string; size?: number }) {
  const u = getUser(id);
  return (
    <Avatar style={{ width: size, height: size }}>
      <AvatarFallback
        className="text-[9px]"
        style={{ background: `hsl(${u?.hue} 55% 22%)`, color: `hsl(${u?.hue} 80% 76%)` }}
      >
        {u?.initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function ApprovalsView() {
  const [approvals, setApprovals] = React.useState<Approval[]>(() => db().approvals);
  const [filter, setFilter] = React.useState<Filter>("Pending");
  const [sort, setSort] = React.useState<Sort>("priority");
  const [active, setActive] = React.useState<Approval | null>(null);

  const decide = (
    id: string,
    next: "Approved" | "Rejected",
    label: string,
  ) => {
    const a = approvals.find((x) => x.id === id);
    if (!a) return;
    setApprovals((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
    if (next === "Approved") toast.success(`${a.ecoNumber} approved`, a.title);
    else toast.error(`${a.ecoNumber} rejected`, label);
    setActive((cur) => (cur?.id === id ? { ...cur, status: next } : cur));
  };

  const counts = {
    Pending: approvals.filter((a) => a.status === "Pending").length,
    Approved: approvals.filter((a) => a.status === "Approved").length,
    All: approvals.length,
  };

  const filtered = approvals
    .filter((a) => (filter === "All" ? true : a.status === filter))
    .sort((a, b) =>
      sort === "priority"
        ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        : +new Date(a.dueDate) - +new Date(b.dueDate),
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          {(["Pending", "Approved", "All"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
                filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
              <Badge variant="muted">{counts[f]}</Badge>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ArrowDownUp className="size-3.5 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Sort by priority</SelectItem>
              <SelectItem value="due">Sort by due date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2.5 p-4">
          {filtered.map((a) => (
            <ApprovalRow
              key={a.id}
              approval={a}
              onOpen={() => setActive(a)}
              onApprove={() => decide(a.id, "Approved", "")}
              onReject={() => decide(a.id, "Rejected", "Rejected by reviewer")}
              onRequestChanges={() =>
                toast.info(`Changes requested on ${a.ecoNumber}`, "Returned to requester")
              }
            />
          ))}
          {filtered.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              No {filter.toLowerCase()} approvals
            </div>
          )}
        </div>
      </ScrollArea>

      <ApprovalDrawer
        approval={active}
        onClose={() => setActive(null)}
        onApprove={() => active && decide(active.id, "Approved", "")}
        onReject={() => active && decide(active.id, "Rejected", "Rejected by reviewer")}
      />
    </div>
  );
}

function ApprovalRow({
  approval: a,
  onOpen,
  onApprove,
  onReject,
  onRequestChanges,
}: {
  approval: Approval;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
}) {
  const decided = a.status !== "Pending";
  const overdue = new Date(a.dueDate) < new Date() && !decided;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card interactive onClick={onOpen} className="p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-2xs text-muted-foreground">{a.ecoNumber}</span>
            <Badge variant="outline">{a.type}</Badge>
            <Badge variant={PRIORITY_VARIANT[a.priority]}>{a.priority}</Badge>
            {a.status === "Approved" && (
              <Badge variant="success" className="gap-1">
                <Check className="size-2.5" /> Approved
              </Badge>
            )}
            {a.status === "Rejected" && (
              <Badge variant="destructive" className="gap-1">
                <X className="size-2.5" /> Rejected
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug">{a.title}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <UserAvatar id={a.requestedById} size={18} />
              {getUser(a.requestedById)?.name}
            </span>
            <span className="flex items-center gap-1">
              <CircleDot className="size-3" /> Assigned to {getUser(a.assignedToId)?.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {timeAgo(a.requestedAt)}
            </span>
            <span className={cn("flex items-center gap-1", overdue && "font-medium text-destructive")}>
              Due {formatDate(a.dueDate)}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="size-3" /> {a.affectedItems} items
            </span>
            {a.costImpact !== 0 && (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-medium",
                  a.costImpact < 0 ? "text-success" : "text-warning",
                )}
              >
                <CircleDollarSign className="size-3" />
                {a.costImpact < 0 ? "-" : "+"}
                {formatCurrency(Math.abs(a.costImpact), { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>

        {!decided && (
          <div className="flex shrink-0 items-center gap-1.5" onClick={stop}>
            <Button size="xs" variant="outline" onClick={onRequestChanges}>
              <MessageSquarePlus className="size-3.5" /> Changes
            </Button>
            <Button size="xs" variant="outline" onClick={onReject}>
              <XCircle className="size-3.5" /> Reject
            </Button>
            <Button size="xs" onClick={onApprove}>
              <CheckCircle2 className="size-3.5" /> Approve
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

const CHAIN: { key: string; label: string }[] = [
  { key: "Requested", label: "Requested" },
  { key: "Review", label: "Review" },
  { key: "Approved", label: "Approved" },
];

function ApprovalDrawer({
  approval,
  onClose,
  onApprove,
  onReject,
}: {
  approval: Approval | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <AnimatePresence>
      {approval && (
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
            <DrawerBody approval={approval} onClose={onClose} onApprove={onApprove} onReject={onReject} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({
  approval: a,
  onClose,
  onApprove,
  onReject,
}: {
  approval: Approval;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const eco = db().ecos.find((e) => e.id === a.ecoId);
  const reviewers = (eco?.reviewerIds ?? [a.assignedToId]).slice(0, 4);
  const stage = a.status === "Approved" ? 2 : a.status === "Rejected" ? 1 : 1;

  return (
    <>
      <div className="flex items-start justify-between border-b border-border p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs text-muted-foreground">{a.ecoNumber}</span>
            <Badge variant={PRIORITY_VARIANT[a.priority]}>{a.priority}</Badge>
            <Badge variant="outline">{a.type}</Badge>
          </div>
          <h2 className="mt-1.5 text-base font-semibold leading-snug">{a.title}</h2>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          <section>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Approval chain
            </p>
            <div className="flex items-center">
              {CHAIN.map((s, i) => {
                const done = i < stage || (a.status === "Approved" && i <= 2);
                const current = i === stage && a.status === "Pending";
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full border-2",
                          done
                            ? "border-success bg-success/15 text-success"
                            : current
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border bg-surface text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-4" /> : <CircleDot className="size-4" />}
                      </div>
                      <span className="text-2xs text-muted-foreground">{s.label}</span>
                    </div>
                    {i < CHAIN.length - 1 && (
                      <div className={cn("mx-1 mb-5 h-0.5 flex-1", i < stage ? "bg-success" : "bg-border")} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
            {[
              ["Affected items", `${a.affectedItems}`],
              [
                "Cost impact",
                `${a.costImpact < 0 ? "-" : "+"}${formatCurrency(Math.abs(a.costImpact), { maximumFractionDigits: 0 })}`,
              ],
              ["Requested", timeAgo(a.requestedAt)],
              ["Due", formatDate(a.dueDate)],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-3">
                <p className="text-2xs text-muted-foreground">{k}</p>
                <p className="mt-1 text-sm font-semibold tabular">{v}</p>
              </div>
            ))}
          </section>

          {eco?.description && (
            <section>
              <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Change summary
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{eco.description}</p>
            </section>
          )}

          <section>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Requester
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <UserAvatar id={a.requestedById} size={36} />
              <div>
                <p className="text-[13px] font-medium">{getUser(a.requestedById)?.name}</p>
                <p className="text-2xs text-muted-foreground">{getUser(a.requestedById)?.role}</p>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reviewers
            </p>
            <div className="space-y-1.5">
              {reviewers.map((rid) => (
                <div key={rid} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                  <UserAvatar id={rid} size={28} />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium">{getUser(rid)?.name}</p>
                    <p className="text-2xs text-muted-foreground">{getUser(rid)?.team}</p>
                  </div>
                  <StatusBadge id={rid} approved={a.status === "Approved"} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      {a.status === "Pending" ? (
        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="outline" className="flex-1" onClick={onReject}>
            <XCircle className="size-4" /> Reject
          </Button>
          <Button className="flex-1" onClick={onApprove}>
            <CheckCircle2 className="size-4" /> Approve
          </Button>
        </div>
      ) : (
        <div className="border-t border-border p-4">
          <Badge variant={a.status === "Approved" ? "success" : "destructive"} className="w-full justify-center py-1.5">
            {a.status}
          </Badge>
        </div>
      )}
    </>
  );
}

function StatusBadge({ id, approved }: { id: string; approved: boolean }) {
  void id;
  return approved ? (
    <Badge variant="success">Signed</Badge>
  ) : (
    <Badge variant="muted">Awaiting</Badge>
  );
}
