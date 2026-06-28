"use client";

import * as React from "react";
import {
  Activity as ActivityIcon,
  GitPullRequestArrow,
  History,
  MessageSquare,
  FileText,
  Package,
  Warehouse,
  ShoppingCart,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { db, getUser } from "@/mock/db";
import { timeAgo, formatCompactCurrency } from "@/lib/utils";
import type { ActivityType } from "@/types";
import { useUIStore } from "@/stores/ui-store";

const activityIcon: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  eco: GitPullRequestArrow,
  revision: History,
  comment: MessageSquare,
  approval: CheckCircle2,
  part: Package,
  document: FileText,
  inventory: Warehouse,
  purchase: ShoppingCart,
};

export function Inspector() {
  const { inspectorWidth } = useUIStore();
  const activities = db().activities.slice(0, 24);

  const stats = React.useMemo(() => {
    const d = db();
    return {
      openEcos: d.ecos.filter((e) => e.status !== "Completed").length,
      pendingApprovals: d.approvals.filter((a) => a.status === "Pending").length,
      lowStock: d.inventory.filter((i) => i.status !== "In Stock").length,
      spend: d.purchaseOrders
        .filter((p) => p.status === "Open" || p.status === "Partially Received")
        .reduce((s, p) => s + p.totalValue, 0),
    };
  }, []);

  return (
    <aside
      className="flex shrink-0 flex-col border-l border-border bg-surface/60"
      style={{ width: inspectorWidth }}
    >
      <div className="flex h-10 items-center justify-between border-b border-border px-4">
        <span className="text-[13px] font-semibold">Inspector</span>
        <span className="flex items-center gap-1 text-2xs text-muted-foreground">
          <Zap className="size-3 text-primary" /> Live
        </span>
      </div>

      <Tabs defaultValue="activity" className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 pt-2.5">
          <TabsList className="w-full">
            <TabsTrigger value="activity" className="flex-1">
              Activity
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">
              Insights
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="activity" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-0.5 p-3">
              {activities.map((a) => {
                const user = getUser(a.userId);
                const Icon = activityIcon[a.type];
                return (
                  <div
                    key={a.id}
                    className="group flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-accent/50"
                  >
                    <div className="relative mt-0.5">
                      <Avatar className="size-6">
                        <AvatarFallback
                          className="text-[9px]"
                          style={{
                            background: `hsl(${user?.hue ?? 0} 55% 22%)`,
                            color: `hsl(${user?.hue ?? 0} 80% 76%)`,
                          }}
                        >
                          {user?.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-surface">
                        <Icon className="size-2.5 text-muted-foreground" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-foreground">
                        <span className="font-medium">{user?.name.split(" ")[0]}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>{" "}
                        <span className="font-medium text-foreground">{a.target}</span>
                      </p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        {timeAgo(a.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="insights" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-3">
              <InsightRow
                icon={GitPullRequestArrow}
                label="Open changes"
                value={stats.openEcos.toString()}
                tone="info"
              />
              <InsightRow
                icon={CheckCircle2}
                label="Awaiting your approval"
                value={stats.pendingApprovals.toString()}
                tone="warning"
              />
              <InsightRow
                icon={Warehouse}
                label="Stock alerts"
                value={stats.lowStock.toString()}
                tone="destructive"
              />
              <InsightRow
                icon={ShoppingCart}
                label="Open PO commitment"
                value={formatCompactCurrency(stats.spend)}
                tone="primary"
              />

              <div className="rounded-xl border border-border bg-surface-sunken/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
                  <ActivityIcon className="size-4 text-primary" /> System health
                </div>
                {[
                  ["BOM integrity", 98],
                  ["Cost data freshness", 91],
                  ["Supplier compliance", 86],
                  ["CAD link coverage", 79],
                ].map(([label, val]) => (
                  <div key={label as string} className="mb-2 last:mb-0">
                    <div className="flex justify-between text-2xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium tabular">{val}%</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function InsightRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "info" | "warning" | "destructive" | "primary";
}) {
  const toneMap = {
    info: "text-info bg-info/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
    primary: "text-primary bg-primary/10",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <div className={`flex size-8 items-center justify-center rounded-lg ${toneMap[tone]}`}>
        <Icon className="size-4" />
      </div>
      <span className="flex-1 text-[13px] text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular">{value}</span>
    </div>
  );
}
