"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Lock, Loader2, ShieldAlert } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_META } from "@/auth/credentials";

/**
 * Forced first-login / reset gate. Shown whenever the backend reports
 * `must_change_password` (login flag or a 403 PASSWORD_CHANGE_REQUIRED).
 * On success the store swaps in a fresh unrestricted token and clears the gate.
 */
export function SetPasswordScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setPassword = useAuthStore((s) => s.setPassword);
  const logout = useAuthStore((s) => s.logout);

  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (next === current) {
      setError("Choose a password different from your temporary one.");
      return;
    }
    setBusy(true);
    try {
      await setPassword(current, next);
      const home = user ? ROLE_META[user.role]?.home ?? "/" : "/";
      setTimeout(() => router.replace(home), 200);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Couldn't update your password.");
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-y-auto bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-base font-semibold">Innopolis <span className="text-primary">PLM</span></span>
        </div>

        <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
          <ShieldAlert className="size-5" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">Set a new password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? <>Signed in as <span className="font-medium text-foreground">{user.email}</span>. </> : null}
          You must change your password before continuing.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current">Current / temporary password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-9"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="next"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="pl-9"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                className="pl-9"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <>Update password <ArrowRight className="size-4" /></>}
          </Button>
        </form>

        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full text-center text-2xs text-muted-foreground/70 hover:text-foreground"
        >
          Sign out instead
        </button>
      </motion.div>
    </div>
  );
}
