"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, CheckCircle2, Warehouse, GitPullRequestArrow, Info, X, CheckCheck } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { db, getUser } from "@/mock/db";
import { timeAgo, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Notification } from "@/types";

const icon: Record<Notification["type"], React.ComponentType<{ className?: string }>> = {
  mention: AtSign,
  approval: CheckCircle2,
  inventory: Warehouse,
  eco: GitPullRequestArrow,
  system: Info,
};
const tone: Record<Notification["type"], string> = {
  mention: "text-info bg-info/10",
  approval: "text-warning bg-warning/10",
  inventory: "text-destructive bg-destructive/10",
  eco: "text-primary bg-primary/10",
  system: "text-muted-foreground bg-muted",
};

export function NotificationCenter() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const [items, setItems] = React.useState(() => db().notifications);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const shown = filter === "unread" ? items.filter((n) => !n.read) : items;
  const unread = items.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotificationsOpen(false)}
            className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 z-[141] flex h-full w-[400px] flex-col border-l border-border bg-surface-overlay shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Notifications</h2>
                {unread > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-2xs font-semibold text-primary">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  className="gap-1 text-muted-foreground"
                  onClick={() => setItems((i) => i.map((n) => ({ ...n, read: true })))}
                >
                  <CheckCheck className="size-3.5" /> Mark all read
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => setNotificationsOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-1 border-b border-border px-3 py-2">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {shown.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
                  <CheckCircle2 className="size-7 text-success" />
                  <p className="text-sm">You're all caught up</p>
                </div>
              ) : (
                shown.map((n) => {
                  const Icon = icon[n.type];
                  const user = n.userId ? getUser(n.userId) : null;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setItems((i) => i.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                      className={cn(
                        "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent/40",
                        !n.read && "bg-primary/[0.04]",
                      )}
                    >
                      <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", tone[n.type])}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium">{n.title}</p>
                          {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{n.body}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
                          {user && (
                            <Avatar className="size-4">
                              <AvatarFallback
                                className="text-[7px]"
                                style={{ background: `hsl(${user.hue} 55% 22%)`, color: `hsl(${user.hue} 80% 76%)` }}
                              >
                                {user.initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {timeAgo(n.timestamp)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
