"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, ArrowUp, Loader2, Bot, Package, AlertTriangle, Copy, DollarSign } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { db, projectRolledCost } from "@/mock/db";

interface Msg {
  id: number;
  role: "user" | "assistant";
  content: React.ReactNode;
}

const SUGGESTIONS = [
  "Find duplicate parts",
  "Show stainless steel parts",
  "Estimate total project BOM cost",
  "Find obsolete components",
  "Which suppliers are high risk?",
];

let msgId = 0;

export function AiAssistant() {
  const { aiOpen, toggleAi } = useUIStore();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: ++msgId, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMessages((m) => [...m, { id: ++msgId, role: "assistant", content: answer(text) }]);
    }, 900 + Math.random() * 700);
  };

  return (
    <AnimatePresence>
      {aiOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className="fixed bottom-9 right-4 z-[150] flex h-[560px] w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-overlay/95 shadow-lg backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-none">Innopolis AI</p>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  Engineering copilot · grounded in your BOM
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={toggleAi}>
              <X className="size-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-3 pt-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">How can I help?</p>
                  <p className="mt-1 px-4 text-xs text-muted-foreground">
                    Ask about parts, cost rollups, changes, duplicates, or supplier risk.
                  </p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-surface",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Analyzing BOM data…
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-2xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface px-3 py-2 focus-within:border-ring">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask Innopolis AI…"
                className="max-h-24 flex-1 resize-none bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon-xs"
                className="shrink-0"
                disabled={!input.trim()}
                onClick={() => send(input)}
              >
                <ArrowUp className="size-3.5" />
              </Button>
            </div>
            <p className="mt-1.5 text-center text-2xs text-muted-foreground/70">
              Responses are generated from demo data
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ icon: Icon, label, value, tone = "primary" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-sunken/50 px-2.5 py-2">
      <Icon className={cn("size-4", tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-primary")} />
      <div className="flex-1">
        <p className="text-2xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular">{value}</p>
      </div>
    </div>
  );
}

function answer(q: string): React.ReactNode {
  const d = db();
  const t = q.toLowerCase();

  if (t.includes("duplicate")) {
    const byName = new Map<string, number>();
    d.parts.forEach((p) => byName.set(p.name, (byName.get(p.name) ?? 0) + 1));
    const dups = [...byName.entries()].filter(([, c]) => c > 1);
    return (
      <div className="space-y-2.5">
        <p>I scanned <b>{formatNumber(d.parts.length)}</b> parts and found <b>{dups.length}</b> potential duplicate groups by name + form-fit-function.</p>
        <Stat icon={Copy} label="Duplicate groups" value={`${dups.length}`} tone="warning" />
        <p className="text-muted-foreground">Top offenders: {dups.slice(0, 3).map(([n]) => n).join(", ")}. Consolidating these could remove redundant part numbers and simplify sourcing.</p>
      </div>
    );
  }
  if (t.includes("stainless")) {
    const ss = d.parts.filter((p) => p.material.includes("Stainless"));
    const cost = ss.reduce((s, p) => s + p.unitCost, 0);
    return (
      <div className="space-y-2.5">
        <p>Found <b>{ss.length}</b> parts using stainless steel (304 / 316L).</p>
        <Stat icon={Package} label="Stainless parts" value={`${ss.length}`} />
        <Stat icon={DollarSign} label="Combined unit cost" value={formatCurrency(cost)} />
        <p className="text-muted-foreground">Most are in the Fasteners and Machined categories. Want me to filter the Parts Library to these?</p>
      </div>
    );
  }
  if (t.includes("cost") || t.includes("estimate")) {
    const rolled = d.products.map((p) => ({ p, cost: projectRolledCost(p.id) }));
    const total = rolled.reduce((s, r) => s + r.cost, 0);
    const avg = total / Math.max(1, rolled.length);
    const top = rolled.slice().sort((a, b) => b.cost - a.cost)[0];
    return (
      <div className="space-y-2.5">
        <p>Rolled-up BOM cost across all <b>{rolled.length}</b> project BOMs:</p>
        <Stat icon={DollarSign} label="Total rolled cost" value={formatCurrency(total)} />
        <Stat icon={DollarSign} label="Average per project" value={formatCurrency(avg)} />
        <p className="text-muted-foreground">The top cost driver is <b>{top?.p.name}</b> at {formatCurrency(top?.cost ?? 0)}.</p>
      </div>
    );
  }
  if (t.includes("obsolete")) {
    const obs = d.parts.filter((p) => p.lifecycle === "Obsolete");
    const used = obs.filter((p) => p.whereUsedCount > 0);
    return (
      <div className="space-y-2.5">
        <p>There are <b>{obs.length}</b> obsolete components, of which <b>{used.length}</b> are still referenced in active BOMs.</p>
        <Stat icon={AlertTriangle} label="Obsolete & in use" value={`${used.length}`} tone="destructive" />
        <p className="text-muted-foreground">I recommend opening a cost-reduction ECO to replace the {used.length} in-use obsolete parts before they hit end-of-life.</p>
      </div>
    );
  }
  if (t.includes("risk") || t.includes("supplier")) {
    const risky = d.suppliers.filter((s) => s.riskScore > 55).sort((a, b) => b.riskScore - a.riskScore);
    return (
      <div className="space-y-2.5">
        <p><b>{risky.length}</b> suppliers exceed the risk threshold (score &gt; 55).</p>
        <Stat icon={AlertTriangle} label="High-risk suppliers" value={`${risky.length}`} tone="warning" />
        <p className="text-muted-foreground">Highest: {risky.slice(0, 3).map((s) => `${s.name} (${s.riskScore})`).join(", ")}. Several are single-source — consider qualifying alternates.</p>
      </div>
    );
  }
  if (t.includes("revision") || t.includes("change")) {
    const recent = d.ecos.filter((e) => e.status !== "Completed").length;
    return (
      <div className="space-y-2.5">
        <p>Since the last baseline there are <b>{recent}</b> in-flight changes touching <b>{d.ecos.reduce((s, e) => s + e.affectedItems, 0)}</b> items.</p>
        <Stat icon={Package} label="Active changes" value={`${recent}`} />
        <p className="text-muted-foreground">The most impactful is a supplier change affecting bearings across 3 products. Open the Changes board for the full diff.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p>Here's what I found in your workspace:</p>
      <Stat icon={Package} label="Parts indexed" value={formatNumber(d.parts.length)} />
      <p className="text-muted-foreground">Try one of the suggestions, or ask about cost, duplicates, obsolescence, or supplier risk.</p>
    </div>
  );
}
