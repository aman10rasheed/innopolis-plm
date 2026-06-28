"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Boxes,
  Grid3x3,
  Eye,
  EyeOff,
  Scissors,
  Ruler,
  Focus,
  Sparkles,
  Layers,
  Box,
  Loader2,
  Spline,
  SquareDashed,
  RotateCw,
  Crosshair,
} from "lucide-react";
import { CAD_COMPONENTS } from "./components-data";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ViewerOptions } from "./cad-scene";
import { toast } from "@/components/ui/toast";

const CadScene = dynamic(() => import("./cad-scene").then((m) => m.CadScene), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-surface-sunken/40">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading 3D engine…</span>
      </div>
    </div>
  ),
});

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Hint label={label} side="right">
      <button
        onClick={onClick}
        className={cn(
          "flex size-9 items-center justify-center rounded-lg border transition-colors",
          active
            ? "border-primary/50 bg-primary/15 text-primary"
            : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className="size-[18px]" />
      </button>
    </Hint>
  );
}

export function CadViewer() {
  const [opts, setOpts] = React.useState<ViewerOptions>({
    exploded: 0,
    wireframe: false,
    transparent: false,
    showBounds: false,
    shaded: true,
    section: false,
    sectionPos: 0,
  });
  const [fitTrigger, setFitTrigger] = React.useState(0);
  const [measuring, setMeasuring] = React.useState(false);
  const {
    selectedComponentId,
    hoveredComponentId,
    hiddenComponentIds,
    isolatedComponentId,
    setSelected,
    setHovered,
    toggleHidden,
    setIsolated,
    showAll,
  } = useSelectionStore();

  const cadModel = useUIStore((s) => s.cadModel);
  const modelName = cadModel?.name ?? "AeroDrive Drive Module";
  const modelChip = cadModel ? `${cadModel.name} · ${cadModel.format}` : "Drive Module · STEP";

  const set = (patch: Partial<ViewerOptions>) => setOpts((o) => ({ ...o, ...patch }));
  const selected = CAD_COMPONENTS.find((c) => c.id === selectedComponentId);

  return (
    <div className="relative flex h-full min-h-0">
      {/* Component tree (synced) */}
      <div className="flex w-[270px] shrink-0 flex-col border-r border-border bg-surface/40">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <span className="text-[13px] font-semibold">Model Tree</span>
          </div>
          <Badge variant="muted">{CAD_COMPONENTS.length}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          <TreeRow root title={modelName} />
          {CAD_COMPONENTS.map((c) => {
            const isSel = selectedComponentId === c.id;
            const isHidden = hiddenComponentIds.has(c.id);
            const isIso = isolatedComponentId === c.id;
            return (
              <div
                key={c.id}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(isSel ? null : c.id)}
                className={cn(
                  "group ml-3 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                  isSel ? "bg-primary/15 text-foreground" : "hover:bg-accent/60",
                  hoveredComponentId === c.id && !isSel && "bg-accent/60",
                )}
              >
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[13px]", isHidden && "text-muted-foreground/50 line-through")}>
                    {c.name}
                  </p>
                  <p className="font-mono text-2xs text-muted-foreground">{c.partNumber} · ×{c.qty}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsolated(isIso ? null : c.id); }}
                  className={cn("opacity-0 transition-opacity group-hover:opacity-100", isIso && "opacity-100 text-primary")}
                >
                  <Focus className="size-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleHidden(c.id); }}
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
        {(hiddenComponentIds.size > 0 || isolatedComponentId) && (
          <div className="border-t border-border p-2">
            <Button variant="outline" size="sm" className="w-full" onClick={showAll}>
              <Eye className="size-3.5" /> Show all components
            </Button>
          </div>
        )}
      </div>

      {/* Viewport */}
      <div className="relative min-w-0 flex-1 bg-gradient-to-b from-[hsl(206_30%_10%)] to-[hsl(210_34%_6%)]">
        <CadScene opts={opts} fitTrigger={fitTrigger} />

        {/* Floating vertical toolbar */}
        <div className="absolute left-3 top-3 flex flex-col gap-1 rounded-xl border border-border bg-surface-overlay/80 p-1.5 shadow-md backdrop-blur-xl">
          <ToolButton icon={Crosshair} label="Fit to screen" onClick={() => setFitTrigger((t) => t + 1)} />
          <ToolButton icon={RotateCw} label="Reset camera" onClick={() => { setFitTrigger((t) => t + 1); toast.info("Camera reset"); }} />
          <div className="my-0.5 h-px bg-border" />
          <ToolButton icon={Boxes} label="Exploded view" active={opts.exploded > 0} onClick={() => set({ exploded: opts.exploded > 0 ? 0 : 1 })} />
          <ToolButton icon={Spline} label="Wireframe" active={opts.wireframe} onClick={() => set({ wireframe: !opts.wireframe })} />
          <ToolButton icon={Sparkles} label={opts.shaded ? "Shaded" : "Flat"} active={opts.shaded} onClick={() => set({ shaded: !opts.shaded })} />
          <ToolButton icon={Box} label="Transparency" active={opts.transparent} onClick={() => set({ transparent: !opts.transparent })} />
          <ToolButton icon={SquareDashed} label="Bounding boxes" active={opts.showBounds} onClick={() => set({ showBounds: !opts.showBounds })} />
          <ToolButton icon={Scissors} label="Section view" active={opts.section} onClick={() => set({ section: !opts.section })} />
          <ToolButton icon={Ruler} label="Measure" active={measuring} onClick={() => { setMeasuring((m) => !m); toast.info(measuring ? "Measure off" : "Measure tool", "Click two points to measure"); }} />
        </div>

        {/* Exploded slider */}
        {opts.exploded > 0 && (
          <div className="absolute left-1/2 top-3 flex w-64 -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-surface-overlay/80 px-3 py-2 shadow-md backdrop-blur-xl">
            <Boxes className="size-4 shrink-0 text-primary" />
            <span className="shrink-0 text-2xs text-muted-foreground">Explode</span>
            <Slider value={[opts.exploded * 100]} max={100} step={1} onValueChange={([v]) => set({ exploded: (v ?? 0) / 100 })} />
            <span className="w-8 shrink-0 text-right text-2xs tabular">{Math.round(opts.exploded * 100)}%</span>
          </div>
        )}

        {/* Section slider */}
        {opts.section && (
          <div className="absolute bottom-16 left-1/2 flex w-64 -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-surface-overlay/80 px-3 py-2 shadow-md backdrop-blur-xl">
            <Scissors className="size-4 shrink-0 text-primary" />
            <span className="shrink-0 text-2xs text-muted-foreground">Section X</span>
            <Slider value={[opts.sectionPos]} min={-2} max={2} step={0.05} onValueChange={([v]) => set({ sectionPos: v ?? 0 })} />
          </div>
        )}

        {/* Measure overlay hint */}
        {measuring && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-2xs font-medium text-primary backdrop-blur-xl">
            Measurement mode · click two vertices
          </div>
        )}

        {/* Selected component card */}
        {selected && (
          <div className="absolute bottom-3 right-3 w-64 rounded-xl border border-border bg-surface-overlay/90 p-3 shadow-lg backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm" style={{ background: selected.color }} />
              <span className="flex-1 text-[13px] font-semibold">{selected.name}</span>
              <Badge variant="default">selected</Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-2xs">
              <div className="rounded-lg border border-border bg-surface p-2">
                <p className="text-muted-foreground">Part No.</p>
                <p className="mt-0.5 font-mono font-medium">{selected.partNumber}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-2">
                <p className="text-muted-foreground">Qty</p>
                <p className="mt-0.5 font-medium">{selected.qty}</p>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-surface p-2">
                <p className="text-muted-foreground">Material</p>
                <p className="mt-0.5 font-medium">{selected.material}</p>
              </div>
            </div>
          </div>
        )}

        {/* View mode chip */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-border bg-surface-overlay/80 px-2.5 py-1 text-2xs text-muted-foreground backdrop-blur-xl">
          <Grid3x3 className="size-3" /> {modelChip}
        </div>
      </div>
    </div>
  );
}

function TreeRow({ root, title }: { root?: boolean; title?: string }) {
  if (!root) return null;
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-semibold">
      <Box className="size-4 shrink-0 text-primary" />
      <span className="truncate">{title ?? "AeroDrive Drive Module"}</span>
    </div>
  );
}
