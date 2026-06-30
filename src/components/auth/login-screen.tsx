"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Loader2, ShieldCheck, Boxes, Network, ShoppingCart } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_META } from "@/auth/credentials";

export function LoginScreen() {
  const router = useRouter();
  const loginRemote = useAuthStore((s) => s.loginRemote);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const go = (home: string) => {
    // tiny delay so the loading state reads as a real sign-in
    setTimeout(() => router.replace(home), 250);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await loginRemote(email, password);
      go(ROLE_META[user.role]?.home ?? "/");
    } catch (err) {
      setBusy(false);
      const msg = err instanceof Error ? err.message : "Sign-in failed.";
      // Network/connection failures get a friendlier hint.
      setError(/network error/i.test(msg) ? "Can't reach the server. Check your connection and try again." : msg);
    }
  };

  return (
    <div className="grid h-screen w-screen grid-cols-1 overflow-hidden bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[hsl(200_45%_9%)] via-[hsl(190_40%_7%)] to-[hsl(210_45%_6%)] p-12 lg:flex">
        <div className="absolute inset-0 bg-dots opacity-[0.18]" />
        <div
          className="absolute -right-24 -top-24 size-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(172 70% 40% / 0.5), transparent 70%)" }}
        />
        <div className="relative flex items-center gap-2.5">
          <LogoMark size={34} />
          <span className="text-lg font-semibold tracking-tight text-white">
            Innopolis
            <span className="ml-1.5 align-top text-[10px] font-bold uppercase tracking-[0.18em] text-primary">PLM</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold leading-tight tracking-tight text-white"
          >
            The engineering data backbone for{" "}
            <span className="text-gradient">Innopolis Bio Innovations</span>
          </motion.h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            From customer enquiry to material receipt — one source of truth for
            materials, BOMs, vendors, procurement and inventory.
          </p>

          <div className="mt-8 space-y-3">
            {[
              [Boxes, "Material Master", "Intelligently coded, defined once"],
              [Network, "Project BOM", "Multi-level cost rollup & approvals"],
              [ShoppingCart, "Procurement", "RFQ → quotation → purchase order"],
            ].map(([Icon, title, sub]) => (
              <div key={title as string} className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                  {React.createElement(Icon as any, { className: "size-[18px]" })}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title as string}</p>
                  <p className="text-xs text-white/50">{sub as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-white/40">
          <ShieldCheck className="size-3.5" /> Demo environment · frontend only · v0.1.0
        </div>
      </div>

      {/* ── Sign-in panel ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center overflow-y-auto p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <LogoMark size={28} />
            <span className="text-base font-semibold">Innopolis <span className="text-primary">PLM</span></span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace to continue.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@innopolis.bio"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-2xs text-primary hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-2xs text-muted-foreground/70">
            Use your Innopolis credentials. Trouble signing in? Contact your administrator.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
