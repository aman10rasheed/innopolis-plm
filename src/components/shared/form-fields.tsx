import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Field({
  label,
  error,
  className,
  hint,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <Label className="text-[13px]">{label}</Label>
        {hint && <span className="text-2xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-2xs text-destructive">{error}</p>}
    </div>
  );
}
