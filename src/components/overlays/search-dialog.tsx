"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Boxes, Building2, FileText, GitPullRequestArrow, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { db } from "@/mock/db";
import { cn } from "@/lib/utils";

interface Result {
  id: string;
  title: string;
  sub: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export function SearchDialog() {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useUIStore();
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);

  const results = React.useMemo<Result[]>(() => {
    if (!q.trim()) return [];
    const d = db();
    const term = q.toLowerCase();
    const r: Result[] = [];
    for (const p of d.parts) {
      if (p.name.toLowerCase().includes(term) || p.partNumber.toLowerCase().includes(term)) {
        r.push({ id: p.id, title: p.name, sub: `${p.partNumber} · ${p.category}`, type: "Part", icon: Boxes, href: "/parts" });
      }
      if (r.length > 40) break;
    }
    for (const p of d.products) {
      if (p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term))
        r.push({ id: p.id, title: p.name, sub: `${p.code} · Project`, type: "Project", icon: Package, href: "/products" });
    }
    for (const s of d.suppliers) {
      if (s.name.toLowerCase().includes(term))
        r.push({ id: s.id, title: s.name, sub: `${s.country} · Tier ${s.tier}`, type: "Supplier", icon: Building2, href: "/suppliers" });
    }
    for (const e of d.ecos) {
      if (e.title.toLowerCase().includes(term) || e.number.toLowerCase().includes(term))
        r.push({ id: e.id, title: e.title, sub: `${e.number} · ${e.status}`, type: "Change", icon: GitPullRequestArrow, href: "/changes" });
    }
    for (const doc of d.documents) {
      if (doc.name.toLowerCase().includes(term))
        r.push({ id: doc.id, title: doc.name, sub: `${doc.type} · ${doc.format}`, type: "Document", icon: FileText, href: "/documents" });
    }
    return r.slice(0, 24);
  }, [q]);

  React.useEffect(() => {
    setActive(0);
  }, [q]);

  React.useEffect(() => {
    if (!searchOpen) setQ("");
  }, [searchOpen]);

  const choose = (r: Result) => {
    setSearchOpen(false);
    router.push(r.href);
  };

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent
        hideClose
        className="top-[16%] max-w-[600px] translate-y-0 gap-0 overflow-hidden p-0"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            choose(results[active]!);
          }
        }}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search everything — parts, projects, suppliers, changes…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <span className="text-2xs text-muted-foreground">{results.length} results</span>
          )}
        </div>

        <div className="max-h-[440px] overflow-y-auto p-2">
          {!q.trim() && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Search className="size-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Start typing to search across the entire workspace
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {["BLDC", "ASM-2000", "Bosch", "ECO-45", "Stainless"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ(s)}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-2xs text-muted-foreground hover:border-border-strong hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matches for “{q}”
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(r)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                i === active ? "bg-accent" : "hover:bg-accent/50",
              )}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <r.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="truncate text-2xs text-muted-foreground">{r.sub}</p>
              </div>
              <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-2xs text-muted-foreground">
                {r.type}
              </span>
              {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
