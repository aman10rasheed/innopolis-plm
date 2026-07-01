"use client";

import * as React from "react";
import { KeyRound, Copy, Check, Loader2 } from "lucide-react";
import { useResetPassword } from "@/lib/api";
import type { ApiUserFull, ApiResetPasswordResponse } from "@/lib/api";
import type { Role } from "@/auth/credentials";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export const ROLE_VARIANT: Record<Role, "default" | "info" | "warning" | "success" | "muted"> = {
  Administrator: "default",
  Engineering: "info",
  Commercial: "warning",
  Purchase: "info",
  Stores: "success",
  Management: "muted",
};

export const TEAM_BY_ROLE: Record<Role, string> = {
  Administrator: "IT & Administration",
  Engineering: "Engineering",
  Commercial: "Commercial",
  Purchase: "Procurement",
  Stores: "Stores & Inventory",
  Management: "Management",
};

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

export function hueFrom(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function Avatar({ user, size = 36 }: { user: Pick<ApiUserFull, "name" | "initials" | "hue">; size?: number }) {
  const hue = user.hue ?? 210;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg font-semibold"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 55% 22%)`,
        color: `hsl(${hue} 80% 76%)`,
        fontSize: size / 2.8,
      }}
    >
      {user.initials || initialsOf(user.name)}
    </div>
  );
}

/** Admin reset-password flow: generate a one-time temporary password and reveal it once. */
export function ResetPasswordDialog({ user, onClose }: { user: ApiUserFull | null; onClose: () => void }) {
  const resetPassword = useResetPassword();
  const [result, setResult] = React.useState<ApiResetPasswordResponse | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setResult(null);
    setCopied(false);
  }, [user]);

  if (!user) return null;

  const doReset = () => {
    resetPassword.mutate(
      { id: user.id },
      {
        onSuccess: (r) => setResult(r),
        onError: (e) => toast.error("Couldn't reset password", e instanceof Error ? e.message : undefined),
      },
    );
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard?.writeText(result.temporary_password);
    setCopied(true);
    toast.success("Copied", "Temporary password copied to clipboard.");
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {result
              ? "Share this temporary password securely. It's shown only once."
              : <>Generate a new temporary password for <span className="font-medium text-foreground">{user.name}</span>. They'll be required to set a new one on next sign-in.</>}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-sunken p-3">
              <code className="flex-1 select-all font-mono text-sm">{result.temporary_password}</code>
              <Button size="xs" variant="outline" onClick={copy}>
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={doReset} disabled={resetPassword.isPending}>
              {resetPassword.isPending ? <Loader2 className="size-4 animate-spin" /> : <><KeyRound className="size-4" /> Generate</>}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
