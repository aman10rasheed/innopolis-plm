"use client";

import * as React from "react";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "loading";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = `toast-${++counter}`;
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    const duration = t.duration ?? (t.variant === "loading" ? 60000 : 4200);
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, duration);
    }
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Imperative helper, à la sonner. */
export const toast = Object.assign(
  (opts: Omit<ToastItem, "id">) => useToastStore.getState().push(opts),
  {
    success: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description, variant: "error" }),
    warning: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description, variant: "warning" }),
    info: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description, variant: "info" }),
    message: (title: string, description?: string) =>
      useToastStore.getState().push({ title, description }),
    dismiss: (id: string) => useToastStore.getState().dismiss(id),
  },
);

const icons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="size-4 text-muted-foreground" />,
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <XCircle className="size-4 text-destructive" />,
  warning: <AlertTriangle className="size-4 text-warning" />,
  info: <Info className="size-4 text-info" />,
  loading: <Loader2 className="size-4 animate-spin text-primary" />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[360px] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface-overlay/95 p-3.5 shadow-lg backdrop-blur-xl"
          >
            <div className="mt-0.5 shrink-0">{icons[t.variant ?? "default"]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight text-foreground">
                {t.title}
              </p>
              {t.description && (
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  {t.description}
                </p>
              )}
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className={cn(
                "shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground",
              )}
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
