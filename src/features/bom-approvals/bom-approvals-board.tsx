"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  X,
  CheckCircle2,
  History,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Eye,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import {
  useBoms,
  useBom,
  useCreateBom,
  useUpdateBom,
  useDeleteBom,
  useTransitionBom,
} from "@/lib/api";
import { BOM_STAGES } from "@/types";
import type { ProjectBom, BomStage } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { cn, formatCompactCurrency, formatDate } from "@/lib/utils";
import { BOM_STAGE_COLOR, BOM_STAGE_VARIANT } from "@/constants/status";
import { toast } from "@/components/ui/toast";
import { useUIStore } from "@/stores/ui-store";
import { QueryBoundary } from "@/components/shared/query-boundary";

const BOM_TYPES: ProjectBom["bomType"][] = ["Engineering", "Procurement", "Final Released"];
const REVS = ["A", "B", "C", "D"];

export function BomApprovalsBoard() {
  const bomsQuery = useBoms();

  return (
    <QueryBoundary
      isLoading={bomsQuery.isLoading}
      isError={bomsQuery.isError}
      error={bomsQuery.error}
      onRetry={() => bomsQuery.refetch()}
    >
      <Board boms={bomsQuery.data?.items ?? []} />
    </QueryBoundary>
  );
}

function Board({ boms }: { boms: ProjectBom[] }) {
  const typeFilter = useUIStore((s) => s.boardFilters["bomApprovals"] ?? "");
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<BomStage | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);

  const createBom = useCreateBom();
  const updateBom = useUpdateBom();
  const deleteBom = useDeleteBom();
  const transitionBom = useTransitionBom();

  const editing = boms.find((b) => b.id === editId) ?? null;

  // The API workflow is a linear pipeline; moving forward = advance, backward = reject.
  const move = async (id: string, stage: BomStage) => {
    const bom = boms.find((b) => b.id === id);
    if (!bom || bom.stage === stage) return;
    const from = BOM_STAGES.indexOf(bom.stage);
    const to = BOM_STAGES.indexOf(stage);
    const action: "advance" | "reject" = to > from ? "advance" : "reject";
    try {
      await transitionBom.mutateAsync({ id, action, comment: `Moved to ${stage}.` });
      toast.success("BOM updated", `${bom.number} · ${action === "advance" ? "advanced" : "sent back"}`);
    } catch (e) {
      toast.error("Transition failed", e instanceof Error ? e.message : "Could not update BOM stage");
    }
  };

  const saveEdit = async (id: string, patch: { bom_type?: string; revision?: string }) => {
    const bom = boms.find((b) => b.id === id);
    try {
      await updateBom.mutateAsync({ id, body: patch });
      toast.success("Saved", bom?.number ?? "BOM");
    } catch (e) {
      toast.error("Save failed", e instanceof Error ? e.message : "Could not save BOM");
    }
  };

  const remove = async (id: string) => {
    const bom = boms.find((b) => b.id === id);
    if (!bom) return;
    if (editId === id) setEditId(null);
    try {
      await deleteBom.mutateAsync(id);
      toast({ title: "BOM deleted", description: bom.number, variant: "warning" });
    } catch (e) {
      toast.error("Delete failed", e instanceof Error ? e.message : "Could not delete BOM");
    }
  };

  const duplicate = async (src: ProjectBom) => {
    try {
      const created = await createBom.mutateAsync({
        project_id: src.projectId,
        bom_type: src.bomType,
        revision: src.revision,
      });
      toast.success("Duplicated", created.number);
    } catch (e) {
      toast.error("Duplicate failed", e instanceof Error ? e.message : "Could not duplicate BOM");
    }
  };

  // New draft BOMs always open in Draft on the backend; reuse the project from any
  // existing BOM (or first available) since a project reference is required.
  const addCard = async () => {
    const projectId = boms[0]?.projectId;
    if (!projectId) {
      toast.error("No project available", "Create a project before drafting a BOM.");
      return;
    }
    try {
      const created = await createBom.mutateAsync({ project_id: projectId, bom_type: "Engineering", revision: "A" });
      toast.success("BOM drafted", created.number);
      setEditId(created.id);
    } catch (e) {
      toast.error("Create failed", e instanceof Error ? e.message : "Could not draft BOM");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 gap-3 overflow-x-auto p-4">
        {BOM_STAGES.map((col) => {
          const items = boms.filter((b) => b.stage === col && (!typeFilter || b.bomType === typeFilter));
          const value = items.reduce((s, b) => s + b.totalValue, 0);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={() => { if (dragId) move(dragId, col); setDragId(null); setOverCol(null); }}
              className={cn(
                "flex w-[310px] shrink-0 flex-col rounded-xl border bg-surface/40 transition-colors",
                overCol === col ? "border-primary/50 bg-primary/[0.04]" : "border-border",
              )}
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <span className={cn("size-2 rounded-full", BOM_STAGE_COLOR[col])} />
                <span className="text-[13px] font-semibold">{col}</span>
                <Badge variant="muted" className="ml-0.5">{items.length}</Badge>
                <span className="ml-auto text-2xs text-muted-foreground tabular">{value > 0 && formatCompactCurrency(value)}</span>
                <button onClick={addCard} title="Draft a new BOM" className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Plus className="size-3.5" />
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                <AnimatePresence initial={false}>
                  {items.map((b) => {
                    return (
                      <ContextMenu key={b.id}>
                        <ContextMenuTrigger asChild>
                          <motion.div
                            layout
                            draggable
                            onDragStart={() => setDragId(b.id)}
                            onDragEnd={() => { setDragId(null); setOverCol(null); }}
                            onClick={() => setEditId(b.id)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: dragId === b.id ? 0.4 : 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group cursor-grab rounded-xl border border-border bg-surface p-3 shadow-xs transition-shadow hover:border-border-strong hover:shadow-sm active:cursor-grabbing"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono text-2xs text-muted-foreground">{b.number}</span>
                              <Badge variant="outline" className="font-normal">{b.bomType}</Badge>
                            </div>
                            <p className="mt-1.5 line-clamp-1 text-[13px] font-medium">{b.projectName}</p>
                            <div className="mt-1 flex items-center gap-1.5 text-2xs text-muted-foreground">
                              <Building2 className="size-3" /> {b.customer}
                              <span className="text-muted-foreground/40">·</span> Rev {b.revision}
                            </div>
                            <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-lg bg-surface-sunken/50 p-2 text-center">
                              <div><p className="text-sm font-semibold tabular">{b.lineItems}</p><p className="text-2xs text-muted-foreground">lines</p></div>
                              <div><p className={cn("text-sm font-semibold tabular", b.criticalItems > 0 && "text-warning")}>{b.criticalItems}</p><p className="text-2xs text-muted-foreground">critical</p></div>
                              <div><p className="text-sm font-semibold tabular">{b.longLeadItems}</p><p className="text-2xs text-muted-foreground">long-lead</p></div>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                              <span className="text-[13px] font-semibold tabular text-primary">{formatCompactCurrency(b.totalValue)}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-2xs text-muted-foreground">{b.audit.length} steps</span>
                                {b.ownerInitials && (
                                  <Avatar className="size-5"><AvatarFallback className="text-[8px]" style={{ background: `hsl(${b.ownerHue ?? 220} 55% 22%)`, color: `hsl(${b.ownerHue ?? 220} 80% 76%)` }}>{b.ownerInitials}</AvatarFallback></Avatar>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48">
                          <ContextMenuItem onClick={() => setEditId(b.id)}><Eye /> Open</ContextMenuItem>
                          <ContextMenuItem onClick={() => setEditId(b.id)}><Pencil /> Edit</ContextMenuItem>
                          <ContextMenuSub>
                            <ContextMenuSubTrigger><ArrowRightLeft /> Move to</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                              {BOM_STAGES.filter((s) => s !== b.stage).map((s) => (
                                <ContextMenuItem key={s} onClick={() => move(b.id, s)}>{s}</ContextMenuItem>
                              ))}
                            </ContextMenuSubContent>
                          </ContextMenuSub>
                          <ContextMenuItem onClick={() => duplicate(b)}><Copy /> Duplicate</ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem destructive onClick={() => remove(b.id)}><Trash2 /> Delete</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </AnimatePresence>
                {items.length === 0 && (
                  <button onClick={addCard} className="flex h-20 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-2xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                    <Plus className="size-3.5" /> Add BOM
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BomEditDrawer
        bom={editing}
        onClose={() => setEditId(null)}
        onSave={(patch) => { if (editing) saveEdit(editing.id, patch); }}
        onMove={(stage) => editing && move(editing.id, stage)}
        onDelete={() => editing && remove(editing.id)}
      />
    </div>
  );
}

function BomEditDrawer({
  bom,
  onClose,
  onSave,
  onMove,
  onDelete,
}: {
  bom: ProjectBom | null;
  onClose: () => void;
  onSave: (patch: { bom_type?: string; revision?: string }) => void;
  onMove: (stage: BomStage) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = React.useState<ProjectBom | null>(bom);
  React.useEffect(() => setForm(bom), [bom]);

  // The list endpoint omits audit — fetch the BOM detail for the trail.
  // User attribution (name/initials/hue) is returned inline on each entry,
  // so no separate (admin-only) users lookup is needed.
  const detailQ = useBom(bom?.id ?? "");
  const audit = React.useMemo(
    () =>
      (detailQ.data?.audit ?? []).map((a) => ({
        stage: a.to_stage,
        userId: a.user_id,
        date: a.created_at,
        comment: a.comment,
        userName: a.user_name ?? null,
        userInitials: a.user_initials ?? null,
        userHue: a.user_hue ?? null,
      })),
    [detailQ.data],
  );

  return (
    <AnimatePresence>
      {bom && form && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px]" />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed right-0 top-0 z-[141] flex h-full w-[440px] flex-col border-l border-border bg-surface-overlay shadow-lg"
          >
            <div className="flex items-start justify-between border-b border-border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xs text-muted-foreground">{form.number}</span>
                  <Badge variant={BOM_STAGE_VARIANT[form.stage]}>{form.stage}</Badge>
                </div>
                <h2 className="mt-1 text-base font-semibold">{form.projectName}</h2>
                <p className="text-xs text-muted-foreground">{form.projectNumber} · {form.customer}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>BOM type</Label>
                  <Select value={form.bomType} onValueChange={(v) => setForm({ ...form, bomType: v as ProjectBom["bomType"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Revision</Label>
                  <Select value={form.revision} onValueChange={(v) => setForm({ ...form, revision: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REVS.map((r) => <SelectItem key={r} value={r}>Rev {r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Computed on the server from BOM lines — shown read-only. */}
                <div className="space-y-1.5">
                  <Label>Line items</Label>
                  <Input type="number" value={form.lineItems} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>BOM value</Label>
                  <Input type="number" value={form.totalValue} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Critical items</Label>
                  <Input type="number" value={form.criticalItems} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Long-lead items</Label>
                  <Input type="number" value={form.longLeadItems} readOnly disabled />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={(v) => { setForm({ ...form, stage: v as BomStage }); onMove(v as BomStage); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BOM_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="mb-3 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <History className="size-3.5" /> Approval audit trail
                </p>
                {detailQ.isLoading ? (
                  <p className="text-[13px] text-muted-foreground">Loading audit history…</p>
                ) : audit.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">No audit history yet.</p>
                ) : (
                  <div className="relative space-y-0 pl-5">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                    {audit.map((a, i) => {
                      const isLast = i === audit.length - 1;
                      const hue = a.userHue ?? 220;
                      return (
                        <div key={i} className="relative pb-4">
                          <div className={cn("absolute -left-5 top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-surface", isLast ? "bg-primary" : "bg-success")}>
                            {!isLast && <CheckCircle2 className="size-2.5 text-white" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={BOM_STAGE_VARIANT[a.stage]}>{a.stage}</Badge>
                            <span className="text-2xs text-muted-foreground">{formatDate(a.date, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="mt-1 text-[13px]">{a.comment}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
                            <Avatar className="size-4"><AvatarFallback className="text-[7px]" style={{ background: `hsl(${hue} 55% 22%)`, color: `hsl(${hue} 80% 76%)` }}>{a.userInitials ?? "?"}</AvatarFallback></Avatar>
                            {a.userName ?? "Unknown user"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border p-4">
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
                <Trash2 className="size-4" /> Delete
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" onClick={() => { onSave({ bom_type: form.bomType, revision: form.revision }); onClose(); }}>
                  <Check className="size-4" /> Save
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
