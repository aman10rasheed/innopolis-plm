"use client";

import * as React from "react";
import {
  GitBranch,
  Check,
  Cloud,
  Cpu,
  Database,
  Sparkles,
  CircleDot,
} from "lucide-react";
import { db } from "@/mock/db";
import { formatNumber } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

export function StatusBar() {
  const { toggleAi } = useUIStore();
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const d = db();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-surface/80 px-3 text-2xs text-muted-foreground backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <GitBranch className="size-3" />
          main
        </span>
        <span className="flex items-center gap-1.5 text-success">
          <Check className="size-3" />
          Synced
        </span>
        <span className="flex items-center gap-1.5">
          <Database className="size-3" />
          {formatNumber(d.parts.length + d.products.length)} items indexed
        </span>
        <span className="hidden items-center gap-1.5 lg:flex">
          <CircleDot className="size-3 text-info" />
          {d.ecos.filter((e) => e.status !== "Completed").length} active changes
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleAi}
          className="flex items-center gap-1.5 transition-colors hover:text-primary"
        >
          <Sparkles className="size-3" /> Ask Innopolis AI
        </button>
        <span className="hidden items-center gap-1.5 md:flex">
          <Cpu className="size-3" />
          Rollup engine idle
        </span>
        <span className="flex items-center gap-1.5">
          <Cloud className="size-3" />
          v0.1.0
        </span>
        <span className="tabular">{time}</span>
      </div>
    </footer>
  );
}
