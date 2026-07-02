"use client";

import { Loader2, WifiOff, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** True when an error looks like the backend is unreachable (network / 0 status). */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

function errorTitle(error: unknown): string {
  if (isNetworkError(error)) return "Network issue";
  if (error instanceof ApiError && error.status === 401) return "Session expired";
  return "Something went wrong";
}

function errorMessage(error: unknown): string {
  if (isNetworkError(error))
    return "Can't reach the server. Check your connection and try again.";
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

/**
 * Renders loading / error UI for a React Query result and only shows `children`
 * once data has resolved. On a dropped backend it surfaces a clear network-issue
 * state (with a retry) rather than a silently-empty screen.
 */
export function QueryBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  children,
  className,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    const network = isNetworkError(error);
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
        <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-surface-sunken text-muted-foreground">
          <WifiOff className="size-6" />
        </div>
        <div className="max-w-sm space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{errorTitle(error)}</h3>
          <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-1 gap-1.5" onClick={onRetry}>
            <RefreshCw className={cn("size-3.5", network && "")} /> Retry
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
