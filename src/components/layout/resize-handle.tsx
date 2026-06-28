"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A thin draggable divider for resizable panels.
 * `side` indicates which edge the handle lives on relative to the panel.
 */
export function ResizeHandle({
  onResize,
  side = "right",
  className,
}: {
  onResize: (delta: number) => void;
  side?: "left" | "right";
  className?: string;
}) {
  const dragging = React.useRef(false);
  const lastX = React.useRef(0);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onResize(side === "right" ? delta : -delta);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onResize, side]);

  return (
    <div
      onMouseDown={(e) => {
        dragging.current = true;
        lastX.current = e.clientX;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }}
      className={cn(
        "group relative z-10 w-1 shrink-0 cursor-col-resize",
        className,
      )}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary/60" />
    </div>
  );
}
