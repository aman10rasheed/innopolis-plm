import { cn } from "@/lib/utils";

/**
 * Theme-adaptive Innopolis mark — an abstract molecular node graph
 * echoing the brand icon, rendered in vector so it stays crisp and
 * recolours cleanly between light and dark themes.
 */
export function LogoMark({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("text-primary", className)}
      aria-hidden
    >
      <path
        d="M10 11.5 L21.5 20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M9.5 12 L9.5 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="9" cy="11" r="3.4" fill="currentColor" />
      <circle cx="22" cy="21" r="5" fill="currentColor" />
      <circle cx="22" cy="21" r="2.1" fill="hsl(var(--background))" />
      <circle cx="20" cy="9" r="2.1" fill="currentColor" opacity="0.7" />
      <path
        d="M11 10 L18.5 9.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
  size = 22,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Innopolis
          <span className="ml-1 align-top text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
            PLM
          </span>
        </span>
      )}
    </div>
  );
}
