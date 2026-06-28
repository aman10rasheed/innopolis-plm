import { cn } from "@/lib/utils";

export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-2xs font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const MOD = isMac ? "⌘" : "Ctrl";

export function Shortcut({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((k, i) => (
        <Kbd key={i}>{k === "mod" ? MOD : k}</Kbd>
      ))}
    </span>
  );
}
