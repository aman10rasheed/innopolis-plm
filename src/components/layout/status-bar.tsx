"use client";

import * as React from "react";
import { Cloud, Cpu, Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function StatusBar() {
  const { toggleAi } = useUIStore();
  const [time, setTime] = React.useState<string>("");
  const [version, setVersion] = React.useState<string>("");

  // Real app version from the Tauri shell; browser builds show nothing.
  React.useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;
    import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then(setVersion)
      .catch(() => {});
  }, []);

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

  return (
    <footer className="flex h-7 shrink-0 items-center justify-end border-t border-border bg-surface/80 px-3 text-2xs text-muted-foreground backdrop-blur-xl">
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
        {version && (
          <span className="flex items-center gap-1.5">
            <Cloud className="size-3" />
            v{version}
          </span>
        )}
        <span className="tabular">{time}</span>
      </div>
    </footer>
  );
}
