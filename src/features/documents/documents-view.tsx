"use client";

import * as React from "react";
import {
  Search,
  Folder,
  FolderOpen,
  ChevronRight,
  Star,
  Clock,
  Files,
  FileText,
  FileImage,
  FileBox,
  Download,
  Share2,
  Tag,
  Link2,
  User as UserIcon,
  HardDrive,
  GitBranch,
} from "lucide-react";
import { db, getUser } from "@/mock/db";
import type { DocItem, DocType } from "@/types";
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
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber, timeAgo, formatDate, cn } from "@/lib/utils";

const DOC_TYPES: DocType[] = [
  "Drawing", "Specification", "Datasheet", "CAD Model", "Test Report",
  "Certificate", "Work Instruction", "Image", "Contract",
];

const STATUS_VARIANT: Record<DocItem["status"], BadgeProps["variant"]> = {
  Approved: "success",
  Draft: "muted",
  "In Review": "warning",
};

function typeIcon(type: DocType) {
  if (type === "Image") return FileImage;
  if (type === "CAD Model" || type === "Drawing") return FileBox;
  return FileText;
}

function formatSize(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${formatNumber(kb)} KB`;
}

type TreeNode = { name: string; children: Map<string, TreeNode>; count: number };

function buildFolderTree(docs: DocItem[]) {
  const root = new Map<string, TreeNode>();
  for (const doc of docs) {
    const parts = doc.folder.split(" / ");
    const top = parts[0];
    const sub = parts[1];
    if (!root.has(top)) root.set(top, { name: top, children: new Map(), count: 0 });
    const topNode = root.get(top)!;
    topNode.count++;
    if (sub) {
      if (!topNode.children.has(sub)) topNode.children.set(sub, { name: sub, children: new Map(), count: 0 });
      topNode.children.get(sub)!.count++;
    }
  }
  return root;
}

export function DocumentsView() {
  const documents = db().documents;
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);
  const [quickFilter, setQuickFilter] = React.useState<"none" | "favorites" | "recent">("none");
  const [favorites, setFavorites] = React.useState<Set<string>>(
    () => new Set(documents.filter((d) => d.favorite).map((d) => d.id)),
  );
  const [activeId, setActiveId] = React.useState<string | null>(documents[0]?.id ?? null);

  const tree = React.useMemo(() => buildFolderTree(documents), [documents]);
  const [openTops, setOpenTops] = React.useState<Set<string>>(() => new Set([...tree.keys()]));

  const toggleTop = (name: string) =>
    setOpenTops((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const toggleFav = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Removed from favorites");
      } else {
        next.add(id);
        toast.success("Added to favorites");
      }
      return next;
    });
  };

  const recentCutoff = React.useMemo(() => Date.now() - 1000 * 60 * 60 * 24 * 30, []);

  const filtered = React.useMemo(() => {
    return documents
      .filter((d) => {
        // selectedFolder is either a top-level name (match by prefix) or a full "Top / Sub" path
        if (selectedFolder && d.folder !== selectedFolder && d.folder.split(" / ")[0] !== selectedFolder) return false;
        if (typeFilter !== "all" && d.type !== typeFilter) return false;
        if (quickFilter === "favorites" && !favorites.has(d.id)) return false;
        if (quickFilter === "recent" && +new Date(d.updatedAt) < recentCutoff) return false;
        if (query) {
          const q = query.toLowerCase();
          if (!d.name.toLowerCase().includes(q) && !d.type.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [documents, selectedFolder, typeFilter, quickFilter, favorites, query, recentCutoff]);

  const active = documents.find((d) => d.id === activeId) ?? null;

  return (
    <div className="flex h-full min-h-0">
      {/* Left: folder tree */}
      <div className="flex w-56 shrink-0 flex-col border-r border-border bg-surface/40">
        <div className="border-b border-border p-3">
          <div className="space-y-0.5">
            <button
              onClick={() => { setSelectedFolder(null); setQuickFilter("none"); }}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/60", selectedFolder === null && quickFilter === "none" && "bg-accent text-foreground")}
            >
              <Files className="size-4 text-muted-foreground" /> All documents
              <span className="ml-auto text-2xs text-muted-foreground tabular">{documents.length}</span>
            </button>
            <button
              onClick={() => { setQuickFilter("favorites"); setSelectedFolder(null); }}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/60", quickFilter === "favorites" && "bg-accent text-foreground")}
            >
              <Star className="size-4 text-warning" /> Favorites
              <span className="ml-auto text-2xs text-muted-foreground tabular">{favorites.size}</span>
            </button>
            <button
              onClick={() => { setQuickFilter("recent"); setSelectedFolder(null); }}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/60", quickFilter === "recent" && "bg-accent text-foreground")}
            >
              <Clock className="size-4 text-info" /> Recent
            </button>
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-2">
            <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Folders</p>
            {[...tree.values()].map((top) => {
              const isOpen = openTops.has(top.name);
              const topSelected = selectedFolder === top.name;
              return (
                <div key={top.name}>
                  <button
                    onClick={() => { toggleTop(top.name); setSelectedFolder(top.name); setQuickFilter("none"); }}
                    className={cn("flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/60", topSelected && "bg-accent text-foreground")}
                  >
                    <ChevronRight className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                    {isOpen ? <FolderOpen className="size-4 text-primary" /> : <Folder className="size-4 text-muted-foreground" />}
                    <span className="truncate">{top.name}</span>
                    <span className="ml-auto text-2xs text-muted-foreground tabular">{top.count}</span>
                  </button>
                  {isOpen && [...top.children.values()].map((sub) => {
                    const full = `${top.name} / ${sub.name}`;
                    return (
                      <button
                        key={full}
                        onClick={() => { setSelectedFolder(full); setQuickFilter("none"); }}
                        className={cn("flex w-full items-center gap-1.5 rounded-md py-1.5 pl-9 pr-2 text-[13px] transition-colors hover:bg-accent/60", selectedFolder === full && "bg-accent text-foreground")}
                      >
                        <Folder className="size-3.5 text-muted-foreground" />
                        <span className="truncate">{sub.name}</span>
                        <span className="ml-auto text-2xs text-muted-foreground tabular">{sub.count}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Center: file list */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents…" className="h-8 pl-8" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-2xs text-muted-foreground tabular">{filtered.length} files</span>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Files} title="No documents" description="Try clearing filters or selecting another folder." />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((d) => {
                const Icon = typeIcon(d.type);
                const isFav = favorites.has(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/40", activeId === d.id && "bg-primary/[0.07]")}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{d.name}</p>
                      <p className="truncate text-2xs text-muted-foreground">{d.folder}</p>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex">{d.type}</Badge>
                    <span className="hidden w-16 text-right font-mono text-2xs text-muted-foreground md:inline">{d.format}</span>
                    <span className="w-16 text-right text-2xs tabular text-muted-foreground">{formatSize(d.sizeKb)}</span>
                    <span className="hidden w-10 text-right text-2xs tabular text-muted-foreground lg:inline">v{d.version}</span>
                    <Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge>
                    <span className="hidden w-16 text-right text-2xs text-muted-foreground xl:inline">{timeAgo(d.updatedAt)}</span>
                    <span onClick={(e) => toggleFav(d.id, e)} className="shrink-0 rounded p-1 hover:bg-accent" role="button" aria-label="favorite">
                      <Star className={cn("size-4", isFav ? "fill-warning text-warning" : "text-muted-foreground")} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right: metadata preview */}
      <div className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface/40 xl:flex">
        {active ? <DocPreview doc={active} isFav={favorites.has(active.id)} onToggleFav={() => toggleFav(active.id)} /> : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState icon={FileText} title="No file selected" description="Select a document to preview." />
          </div>
        )}
      </div>
    </div>
  );
}

function DocPreview({ doc, isFav, onToggleFav }: { doc: DocItem; isFav: boolean; onToggleFav: () => void }) {
  const owner = getUser(doc.ownerId);
  const Icon = typeIcon(doc.type);
  const isVisual = doc.type === "Drawing" || doc.type === "Image" || doc.type === "CAD Model";

  const versions = React.useMemo(() => {
    const base = parseFloat(doc.version) || 1;
    return [
      { v: doc.version, note: "Current — released", who: owner?.initials ?? "—", when: timeAgo(doc.updatedAt), current: true },
      { v: (base - 0.1).toFixed(1), note: "Markups incorporated", who: "JL", when: "2 weeks ago", current: false },
      { v: (base - 0.2).toFixed(1), note: "Initial review draft", who: "MR", when: "1 month ago", current: false },
      { v: "0.1", note: "Created", who: "AK", when: "3 months ago", current: false },
    ];
  }, [doc, owner]);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-4 p-4">
        {/* faux preview */}
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-sunken">
          {isVisual ? (
            <>
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative flex flex-col items-center gap-2 text-muted-foreground">
                <Icon className="size-12" />
                <span className="text-2xs uppercase tracking-wider">{doc.format} preview</span>
              </div>
            </>
          ) : (
            <div className="relative flex h-full w-2/3 flex-col gap-1.5 rounded-md bg-card p-4 shadow-sm">
              <Icon className="mb-1 size-8 text-primary" />
              {[100, 88, 94, 70, 96, 60].map((w, i) => (
                <div key={i} className="h-1.5 rounded-full bg-muted" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{doc.name}</h3>
            <button onClick={onToggleFav} className="shrink-0 rounded p-1 hover:bg-accent">
              <Star className={cn("size-4", isFav ? "fill-warning text-warning" : "text-muted-foreground")} />
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge variant="outline">{doc.type}</Badge>
            <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => toast.success("Download started", `${doc.name}.${doc.format.toLowerCase()}`)}>
            <Download className="size-3.5" /> Download
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => toast.info("Share link copied", doc.name)}>
            <Share2 className="size-3.5" /> Share
          </Button>
        </div>

        {/* metadata */}
        <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
          {[
            [HardDrive, "Format", doc.format],
            [HardDrive, "Size", formatSize(doc.sizeKb)],
            [GitBranch, "Version", `v${doc.version}`],
            [Folder, "Folder", doc.folder],
            [UserIcon, "Owner", owner?.name ?? "—"],
            [Link2, "Linked item", doc.linkedItemId ?? "None"],
            [Clock, "Updated", formatDate(doc.updatedAt)],
          ].map(([I, k, v]) => (
            <div key={k as string} className="flex items-center gap-2 text-2xs">
              {React.createElement(I as any, { className: "size-3.5 shrink-0 text-muted-foreground" })}
              <span className="w-20 shrink-0 text-muted-foreground">{k as string}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{v as string}</span>
            </div>
          ))}
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Tag className="size-3.5 text-muted-foreground" />
              {doc.tags.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}
            </div>
          )}
        </div>

        {/* version history */}
        <div>
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Version history</p>
          <div className="space-y-1.5">
            {versions.map((ver) => (
              <div key={ver.v} className={cn("flex items-center gap-2.5 rounded-lg border border-border p-2.5", ver.current ? "bg-primary/[0.06]" : "bg-surface")}>
                <Badge variant={ver.current ? "default" : "muted"}>v{ver.v}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{ver.note}</p>
                  <p className="text-2xs text-muted-foreground">{ver.who} · {ver.when}</p>
                </div>
                {!ver.current && (
                  <Button size="xs" variant="ghost" onClick={() => toast.success("Restored", `Reverted to v${ver.v}`)}>Restore</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
