"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  GitPullRequestArrow,
  CheckCircle2,
  CircleDollarSign,
  ArrowRight,
  Plus,
  Upload,
  Network,
  FileBarChart,
  Clock,
  AlertTriangle,
  TrendingDown,
  Boxes,
  Star,
  Pin,
  ShoppingCart,
  Warehouse,
  Building2,
  BarChart3,
  Library,
  ClipboardCheck,
} from "lucide-react";
import type { Role } from "@/auth/credentials";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/shared/stat-card";
import { Thumbnail } from "@/components/shared/thumbnail";
import { AreaTrend, MultiBar } from "@/components/shared/charts";
import { QueryBoundary } from "@/components/shared/query-boundary";
import { useDashboard, useProjects, useStockAlerts, toNumber } from "@/lib/api";
// no backend endpoint — ecos/approvals still come from the mock db
import { db, getUser } from "@/mock/db";
import { costTrendSeries, manufacturingProgress } from "@/mock/series";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  timeAgo,
  formatDate,
  cn,
} from "@/lib/utils";
import { ECO_STATUS_VARIANT, PRIORITY_VARIANT, LIFECYCLE_VARIANT } from "@/constants/status";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_META } from "@/auth/credentials";

const ROLE_LINKS: Record<Role, { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  Administrator: [
    { label: "Material Master", href: "/parts", icon: Library },
    { label: "Reports", href: "/reports", icon: FileBarChart },
    { label: "Approvals", href: "/approvals", icon: CheckCircle2 },
  ],
  Engineering: [
    { label: "Material Master", href: "/parts", icon: Library },
    { label: "BOM Explorer", href: "/bom", icon: Network },
    { label: "Change Requests", href: "/changes", icon: GitPullRequestArrow },
  ],
  Commercial: [
    { label: "Approvals", href: "/approvals", icon: CheckCircle2 },
    { label: "Cost Analysis", href: "/cost", icon: CircleDollarSign },
    { label: "Reports", href: "/reports", icon: FileBarChart },
  ],
  Purchase: [
    { label: "Procurement", href: "/procurement", icon: ShoppingCart },
    { label: "Vendors", href: "/suppliers", icon: Building2 },
    { label: "BOM Approvals", href: "/bom-approvals", icon: ClipboardCheck },
  ],
  Stores: [
    { label: "Inventory", href: "/inventory", icon: Warehouse },
    { label: "Vendors", href: "/suppliers", icon: Building2 },
    { label: "Manufacturing", href: "/manufacturing", icon: Boxes },
  ],
  Management: [
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Reports", href: "/reports", icon: FileBarChart },
    { label: "Cost Analysis", href: "/cost", icon: CircleDollarSign },
  ],
};

export default function DashboardPage() {
  const d = db();
  const { pinnedProjects } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(" ")[0] ?? "there";
  const roleMeta = user ? ROLE_META[user.role] : null;

  // API-backed data (KPIs, projects, stock alerts)
  const dashboardQuery = useDashboard();
  const projectsQuery = useProjects();
  const alertsQuery = useStockAlerts();
  const dashboard = dashboardQuery.data;
  const projectMap = React.useMemo(
    () => new Map((projectsQuery.data?.items ?? []).map((p) => [p.id, p])),
    [projectsQuery.data],
  );
  const stockAlerts = alertsQuery.data ?? [];

  // API KPIs
  const kpis = {
    products: dashboard?.projects ?? 0,
    inventoryValue: toNumber(dashboard?.stockValue),
    shortages: dashboard?.lowStockItems ?? 0,
  };

  // no backend endpoint — ecos/approvals metrics still from the mock db
  const mockMetrics = React.useMemo(() => {
    const openEcos = d.ecos.filter((e) => e.status !== "Completed");
    const pending = d.approvals.filter((a) => a.status === "Pending");
    return { openEcos: openEcos.length, pending: pending.length };
  }, [d]);

  const costTrend = React.useMemo(costTrendSeries, []);
  const mfg = React.useMemo(manufacturingProgress, []);

  // no backend endpoint — mock retained
  const openEcos = d.ecos
    .filter((e) => e.status === "Review" || e.status === "Approved")
    .slice(0, 5);
  // no backend endpoint — mock retained
  const approvals = d.approvals.filter((a) => a.status === "Pending").slice(0, 4);
  // API-backed: stock alerts (low stock / out of stock)
  const shortages = [...stockAlerts]
    .sort((a, b) => a.available - b.available)
    .slice(0, 5);
  // API-backed: pinned projects resolved against the projects list
  const pinned = pinnedProjects
    .map((id) => projectMap.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 3);
  // no backend endpoint — mock retained
  const deadlines = d.ecos
    .filter((e) => e.status !== "Completed")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 5);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface/40 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Good afternoon, {firstName}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {roleMeta ? `Signed in as ${user!.role} · ` : ""}Here's what's happening across Innopolis Bio Innovations — {formatDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileBarChart className="size-4" /> Weekly report
          </Button>
          <Button size="sm">
            <Plus className="size-4" /> New change
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-6">
          {/* Role workspace banner */}
          {user && roleMeta && (
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/[0.07] via-card to-card">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{ background: `hsl(${user.hue} 55% 22%)`, color: `hsl(${user.hue} 80% 76%)` }}
                >
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold">{user.role} workspace</p>
                    <Badge variant="default">{roleMeta.capabilities.length} permissions</Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground">{roleMeta.blurb}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLE_LINKS[user.role].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <l.icon className="size-4 text-primary" /> {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* KPI row — Active Projects + Inventory Value from the API; ECO/approval
              tiles have no backend endpoint and stay on the mock db. */}
          <QueryBoundary
            isLoading={dashboardQuery.isLoading}
            isError={dashboardQuery.isError}
            error={dashboardQuery.error}
            onRetry={() => dashboardQuery.refetch()}
          >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Active Projects"
                value={kpis.products}
                delta={4.2}
                icon={Package}
                accent="primary"
                spark={[12, 14, 13, 16, 18, 17, 19, 21]}
              />
              <StatCard
                label="Open Engineering Changes"
                value={mockMetrics.openEcos}
                delta={-8.1}
                deltaSuffix="vs last week"
                icon={GitPullRequestArrow}
                accent="info"
                invertDelta
                spark={[40, 38, 42, 39, 35, 33, 31, 28]}
              />
              <StatCard
                label="Pending Approvals"
                value={mockMetrics.pending}
                delta={12.5}
                icon={CheckCircle2}
                accent="warning"
                invertDelta
                spark={[8, 9, 11, 10, 13, 12, 14, 15]}
              />
              <StatCard
                label="Inventory Value"
                value={formatCompactCurrency(kpis.inventoryValue)}
                delta={2.8}
                icon={CircleDollarSign}
                accent="success"
                spark={[60, 62, 61, 64, 66, 65, 68, 70]}
              />
            </div>
          </QueryBoundary>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-[15px]">Unit Cost Trend</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Actual vs. target cost across the portfolio — trailing 12 months
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" /> Actual
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-info" /> Target
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <AreaTrend
                  data={costTrend}
                  dataKey="actual"
                  secondKey="target"
                  prefix="$"
                  height={236}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px]">Manufacturing Progress</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Planned vs. actual builds by line
                </p>
              </CardHeader>
              <CardContent>
                <MultiBar
                  data={mfg}
                  keys={[
                    { key: "planned", color: "hsl(var(--muted-foreground) / 0.4)", name: "Planned" },
                    { key: "actual", color: "hsl(var(--primary))", name: "Actual" },
                  ]}
                  height={236}
                />
              </CardContent>
            </Card>
          </div>

          {/* Mid row: ECOs + Approvals + Shortages */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Open Engineering Changes */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-[15px]">Open Changes</CardTitle>
                <Link href="/changes" className="text-xs font-medium text-primary hover:underline">
                  View board
                </Link>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {openEcos.map((e) => (
                  <Link
                    key={e.id}
                    href="/changes"
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GitPullRequestArrow className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{e.title}</p>
                      <p className="text-2xs text-muted-foreground">
                        {e.number} · {e.affectedItems} items
                      </p>
                    </div>
                    <Badge variant={ECO_STATUS_VARIANT[e.status]}>{e.status}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-[15px]">Awaiting Approval</CardTitle>
                <Link href="/approvals" className="text-xs font-medium text-primary hover:underline">
                  Review all
                </Link>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {approvals.map((a) => {
                  const user = getUser(a.requestedById);
                  return (
                    <div
                      key={a.id}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback
                          style={{ background: `hsl(${user?.hue} 55% 22%)`, color: `hsl(${user?.hue} 80% 76%)` }}
                        >
                          {user?.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{a.title}</p>
                        <p className="text-2xs text-muted-foreground">
                          {a.ecoNumber} · due {timeAgo(a.dueDate).replace("ago", "")}
                        </p>
                      </div>
                      <Badge variant={PRIORITY_VARIANT[a.priority]}>{a.priority}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Inventory Shortages */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  Inventory Shortages
                  <Badge variant="destructive">{kpis.shortages}</Badge>
                </CardTitle>
                <Link href="/inventory" className="text-xs font-medium text-primary hover:underline">
                  Manage
                </Link>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {/* API-backed: /inventory/alerts */}
                <QueryBoundary
                  isLoading={alertsQuery.isLoading}
                  isError={alertsQuery.isError}
                  error={alertsQuery.error}
                  onRetry={() => alertsQuery.refetch()}
                  className="py-6"
                >
                  {shortages.map((i) => (
                    <div
                      key={i.id}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          i.available <= 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
                        )}
                      >
                        <AlertTriangle className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{i.partName}</p>
                        <p className="text-2xs text-muted-foreground">
                          {i.partNumber} · {i.warehouseCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold tabular">{i.available}</p>
                        <p className="text-2xs text-muted-foreground">avail.</p>
                      </div>
                    </div>
                  ))}
                </QueryBoundary>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row: pinned + deadlines + quick actions */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <Pin className="size-4 text-primary" /> Pinned Projects
                </CardTitle>
                <Link href="/products" className="text-xs font-medium text-primary hover:underline">
                  All products
                </Link>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 pt-0 sm:grid-cols-3">
                {/* API-backed: pinned ids resolved against /projects */}
                <div className="sm:col-span-3">
                  <QueryBoundary
                    isLoading={projectsQuery.isLoading}
                    isError={projectsQuery.isError}
                    error={projectsQuery.error}
                    onRetry={() => projectsQuery.refetch()}
                    className="py-6"
                  >
                    {pinned.length === 0 ? (
                      <p className="py-4 text-center text-[13px] text-muted-foreground">
                        No pinned projects yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {pinned.map((p) => (
                          <Link
                            key={p.id}
                            href="/products"
                            className="group rounded-xl border border-border bg-surface p-3 transition-all hover:border-border-strong hover:shadow-sm"
                          >
                            <div className="flex items-center gap-2.5">
                              <Thumbnail hue={p.thumbnailHue} size={36} icon={Package} />
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold">{p.family}</p>
                                <p className="font-mono text-2xs text-muted-foreground">{p.code}</p>
                              </div>
                            </div>
                            <div className="mt-3 space-y-1.5">
                              <div className="flex justify-between text-2xs">
                                <span className="text-muted-foreground">Health</span>
                                <span className="font-medium tabular">{p.health}%</span>
                              </div>
                              <Progress value={p.health} className="h-1.5" />
                            </div>
                            <div className="mt-2.5 flex items-center justify-between">
                              <Badge variant={LIFECYCLE_VARIANT[p.lifecycle]}>{p.lifecycle}</Badge>
                              <span className="text-2xs text-muted-foreground">{p.openEcos} open ECOs</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </QueryBoundary>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions + deadlines */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px]">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 pt-0">
                  {[
                    { label: "Create Part", icon: Boxes, href: "/parts" },
                    { label: "Open BOM", icon: Network, href: "/bom" },
                    { label: "Import CAD", icon: Upload, href: "/cad" },
                    { label: "New Report", icon: FileBarChart, href: "/reports" },
                  ].map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface p-3 text-center transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <a.icon className="size-5 text-primary" />
                      <span className="text-2xs font-medium">{a.label}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upcoming deadlines full width */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Clock className="size-4 text-warning" /> Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {deadlines.map((e) => {
                  const user = getUser(e.ownerId);
                  return (
                    <div key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <Badge variant={ECO_STATUS_VARIANT[e.status]} className="w-20 justify-center">
                        {e.status}
                      </Badge>
                      <span className="flex-1 truncate text-[13px] font-medium">{e.title}</span>
                      <span className="font-mono text-2xs text-muted-foreground">{e.number}</span>
                      <Avatar className="size-6">
                        <AvatarFallback
                          className="text-[9px]"
                          style={{ background: `hsl(${user?.hue} 55% 22%)`, color: `hsl(${user?.hue} 80% 76%)` }}
                        >
                          {user?.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="w-24 text-right text-2xs text-muted-foreground">
                        {formatDate(e.dueDate, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
