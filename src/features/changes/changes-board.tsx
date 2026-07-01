"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Paperclip,
  GitPullRequestArrow,
  Plus,
  CircleDollarSign,
  Layers,
  Pencil,
  Copy,
  Trash2,
  Eye,
  ArrowRightLeft,
  X,
  Check,
} from "lucide-react";
import { db, getUser, addEco, updateEco, deleteEco } from "@/mock/db";
import type { Eco, EcoStatus, EcoPriority, EcoType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ECO_STATUS_COLOR, PRIORITY_VARIANT } from "@/constants/status";
import { toast } from "@/components/ui/toast";
import { useUIStore } from "@/stores/ui-store";

const COLUMNS: EcoStatus[] = ["Draft", "Review", "Approved", "Released", "Completed"];
const PRIORITIES: EcoPriority[] = ["Low", "Medium", "High", "Critical"];
const ECO_TYPES: EcoType[] = ["Design Change", "Cost Reduction", "Supplier Change", "Quality", "Compliance", "Documentation"];
const rnd = (n: number) => Math.floor(Math.random() * n);

export function ChangesBoard() {
  const [ecos, setEcos] = React.useState<Eco[]>(() => db().ecos.slice());
  const priorityFilter = useUIStore((s) => s.boardFilters["changes"] ?? "");
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<EcoStatus | null>(null);
  const [editId, setEditId] = React.useState<string | null>(null);

  const editing = ecos.find((e) => e.id === editId) ?? null;

  // ---- CRUD (local state is authoritative; db is synced so it persists) ----
  const move = (id: string, status: EcoStatus) => {
    const eco = ecos.find((e) => e.id === id);
    if (!eco || eco.status === status) return;
    setEcos((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    updateEco(id, { status });
    toast.success("Change moved", `${eco.number} → ${status}`);
  };

  const update = (id: string, patch: Partial<Eco>) => {
    setEcos((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    updateEco(id, patch);
  };

  const remove = (id: string) => {
    const eco = ecos.find((e) => e.id === id);
    if (!eco) return;
    setEcos((prev) => prev.filter((e) => e.id !== id));
    deleteEco(id);
    if (editId === id) setEditId(null);
    toast({
      title: "Change deleted",
      description: eco.number,
      variant: "warning",
      action: {
        label: "Undo",
        onClick: () => {
          addEco(eco);
          setEcos((prev) => [eco, ...prev]);
        },
      },
    });
  };

  const duplicate = (src: Eco) => {
    const copy: Eco = {
      ...src,
      id: `E-new-${Date.now()}`,
      number: `MCR-${4500 + rnd(999)}`,
      title: `${src.title} (copy)`,
      status: "Draft",
    };
    addEco(copy);
    setEcos((prev) => [copy, ...prev]);
    toast.success("Duplicated", copy.number);
  };

  const addCard = (status: EcoStatus) => {
    const me = db().users[0]!;
    const eco: Eco = {
      id: `E-new-${Date.now()}`,
      number: `MCR-${4500 + rnd(999)}`,
      title: "New change request",
      description: "",
      status,
      priority: "Medium",
      type: "Design Change",
      ownerId: me.id,
      reviewerIds: [],
      affectedItems: 1,
      productId: db().products[0]?.id,
      costImpact: 0,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      progress: status === "Completed" ? 100 : 0,
      commentsCount: 0,
      attachmentsCount: 0,
      approvalsNeeded: 1,
      approvalsReceived: 0,
    };
    addEco(eco);
    setEcos((prev) => [eco, ...prev]);
    setEditId(eco.id); // open editor immediately
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 gap-3 overflow-x-auto p-4">
        {COLUMNS.map((col) => {
          const items = ecos.filter((e) => e.status === col && (!priorityFilter || e.priority === priorityFilter));
          const cost = items.reduce((s, e) => s + e.costImpact, 0);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={() => { if (dragId) move(dragId, col); setDragId(null); setOverCol(null); }}
              className={cn(
                "flex w-[300px] shrink-0 flex-col rounded-xl border bg-surface/40 transition-colors",
                overCol === col ? "border-primary/50 bg-primary/[0.04]" : "border-border",
              )}
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <span className={cn("size-2 rounded-full", ECO_STATUS_COLOR[col])} />
                <span className="text-[13px] font-semibold">{col}</span>
                <Badge variant="muted" className="ml-0.5">{items.length}</Badge>
                <span className="ml-auto text-2xs text-muted-foreground tabular">{cost !== 0 && formatCurrency(cost, { maximumFractionDigits: 0 })}</span>
                <button onClick={() => addCard(col)} title={`Add change to ${col}`} className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Plus className="size-3.5" />
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                <AnimatePresence initial={false}>
                  {items.map((eco) => {
                    const owner = getUser(eco.ownerId);
                    return (
                      <ContextMenu key={eco.id}>
                        <ContextMenuTrigger asChild>
                          <motion.div
                            layout
                            draggable
                            onDragStart={() => setDragId(eco.id)}
                            onDragEnd={() => { setDragId(null); setOverCol(null); }}
                            onClick={() => setEditId(eco.id)}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: dragId === eco.id ? 0.4 : 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group cursor-grab rounded-xl border border-border bg-surface p-3 shadow-xs transition-shadow hover:border-border-strong hover:shadow-sm active:cursor-grabbing"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono text-2xs text-muted-foreground">{eco.number}</span>
                              <Badge variant={PRIORITY_VARIANT[eco.priority]}>{eco.priority}</Badge>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug">{eco.title}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="gap-1 font-normal"><GitPullRequestArrow className="size-2.5" />{eco.type}</Badge>
                            </div>
                            {eco.progress > 0 && eco.progress < 100 && (
                              <div className="mt-2.5">
                                <div className="mb-1 flex justify-between text-2xs text-muted-foreground">
                                  <span>Progress</span><span className="tabular">{eco.progress}%</span>
                                </div>
                                <Progress value={eco.progress} className="h-1" />
                              </div>
                            )}
                            <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                              <div className="flex items-center gap-2.5 text-2xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Layers className="size-3" />{eco.affectedItems}</span>
                                <span className="flex items-center gap-1"><MessageSquare className="size-3" />{eco.commentsCount}</span>
                                {eco.attachmentsCount > 0 && <span className="flex items-center gap-1"><Paperclip className="size-3" />{eco.attachmentsCount}</span>}
                                {eco.costImpact !== 0 && (
                                  <span className={cn("flex items-center gap-0.5 font-medium", eco.costImpact < 0 ? "text-success" : "text-warning")}>
                                    <CircleDollarSign className="size-3" />{eco.costImpact < 0 ? "-" : "+"}{formatCurrency(Math.abs(eco.costImpact), { maximumFractionDigits: 0 })}
                                  </span>
                                )}
                              </div>
                              <Avatar className="size-5">
                                <AvatarFallback className="text-[8px]" style={{ background: `hsl(${owner?.hue} 55% 22%)`, color: `hsl(${owner?.hue} 80% 76%)` }}>{owner?.initials}</AvatarFallback>
                              </Avatar>
                            </div>
                          </motion.div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48">
                          <ContextMenuItem onClick={() => setEditId(eco.id)}><Eye /> Open</ContextMenuItem>
                          <ContextMenuItem onClick={() => setEditId(eco.id)}><Pencil /> Edit</ContextMenuItem>
                          <ContextMenuSub>
                            <ContextMenuSubTrigger><ArrowRightLeft /> Move to</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                              {COLUMNS.filter((c) => c !== eco.status).map((c) => (
                                <ContextMenuItem key={c} onClick={() => move(eco.id, c)}>{c}</ContextMenuItem>
                              ))}
                            </ContextMenuSubContent>
                          </ContextMenuSub>
                          <ContextMenuItem onClick={() => duplicate(eco)}><Copy /> Duplicate</ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem destructive onClick={() => remove(eco.id)}><Trash2 /> Delete</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </AnimatePresence>
                {items.length === 0 && (
                  <button onClick={() => addCard(col)} className="flex h-20 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-2xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                    <Plus className="size-3.5" /> Add change
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EcoEditDrawer
        eco={editing}
        onClose={() => setEditId(null)}
        onSave={(patch) => editing && update(editing.id, patch)}
        onDelete={() => editing && remove(editing.id)}
      />
    </div>
  );
}

function EcoEditDrawer({
  eco,
  onClose,
  onSave,
  onDelete,
}: {
  eco: Eco | null;
  onClose: () => void;
  onSave: (patch: Partial<Eco>) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = React.useState<Eco | null>(eco);
  React.useEffect(() => setForm(eco), [eco]);

  return (
    <AnimatePresence>
      {eco && form && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px]" />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed right-0 top-0 z-[141] flex h-full w-[420px] flex-col border-l border-border bg-surface-overlay shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xs text-muted-foreground">{form.number}</span>
                <Badge variant={PRIORITY_VARIANT[form.priority]}>{form.priority}</Badge>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="size-4" /></Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Textarea rows={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as EcoType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ECO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as EcoPriority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EcoStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COLUMNS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Affected items</Label>
                  <Input type="number" value={form.affectedItems} onChange={(e) => setForm({ ...form, affectedItems: Number(e.target.value) })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Cost impact (negative = saving)</Label>
                  <Input type="number" value={form.costImpact} onChange={(e) => setForm({ ...form, costImpact: Number(e.target.value) })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Progress</Label>
                    <span className="text-2xs tabular text-muted-foreground">{form.progress}%</span>
                  </div>
                  <Slider value={[form.progress]} max={100} step={5} onValueChange={([v]) => setForm({ ...form, progress: v ?? 0 })} />
                </div>
              </div>
              <p className="text-2xs text-muted-foreground">Created {formatDate(form.createdAt)} · due {formatDate(form.dueDate)}</p>
            </div>

            <div className="flex items-center gap-2 border-t border-border p-4">
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
                <Trash2 className="size-4" /> Delete
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" onClick={() => { onSave({ title: form.title, type: form.type, priority: form.priority, status: form.status, affectedItems: form.affectedItems, costImpact: form.costImpact, progress: form.progress }); toast.success("Saved", form.number); onClose(); }}>
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