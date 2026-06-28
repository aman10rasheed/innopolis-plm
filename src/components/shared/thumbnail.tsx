import { cn } from "@/lib/utils";
import { Box } from "lucide-react";

/**
 * A deterministic, generated "CAD-ish" thumbnail derived from a hue seed.
 * Renders an isometric-looking gradient tile — gives every part/product a
 * distinct visual identity without bundling image assets.
 */
export function Thumbnail({
  hue,
  size = 40,
  className,
  icon: Icon = Box,
  rounded = "rounded-lg",
}: {
  hue: number;
  size?: number;
  className?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  rounded?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-border/60",
        rounded,
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 45% 24%) 0%, hsl(${(hue + 40) % 360} 40% 14%) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(0 0% 100% / 0.18) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 100% / 0.18) 1px, transparent 1px)",
          backgroundSize: `${Math.max(6, size / 5)}px ${Math.max(6, size / 5)}px`,
        }}
      />
      <Icon
        className="relative"
        style={{ width: size * 0.42, height: size * 0.42, color: `hsl(${hue} 70% 72%)` } as React.CSSProperties}
      />
    </div>
  );
}
