"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  deltaSuffix = "vs last month",
  icon: Icon,
  accent = "primary",
  spark,
  invertDelta = false,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaSuffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "success" | "warning" | "destructive" | "info";
  spark?: number[];
  invertDelta?: boolean;
}) {
  const positive = (delta ?? 0) >= 0;
  const good = invertDelta ? !positive : positive;
  const accentMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10",
  };

  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              accentMap[accent],
            )}
          >
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-semibold tracking-tight tabular">
            {value}
          </div>
          {delta !== undefined && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              <span
                className={cn(
                  "flex items-center gap-0.5 font-semibold",
                  good ? "text-success" : "text-destructive",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(delta)}%
              </span>
              <span className="text-muted-foreground">{deltaSuffix}</span>
            </div>
          )}
        </div>
        {spark && <MiniSpark data={spark} accent={accent} />}
      </div>
    </Card>
  );
}

function MiniSpark({
  data,
  accent,
}: {
  data: number[];
  accent: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 28;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const strokeMap: Record<string, string> = {
    primary: "hsl(var(--primary))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))",
    info: "hsl(var(--info))",
  };
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={strokeMap[accent]}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
