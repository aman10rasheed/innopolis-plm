"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeft, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { navForRole, SETTINGS_ITEM } from "@/constants/navigation";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { Hint } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/mock/db";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarWidth, toggleSidebar } = useUIStore();
  const role = useAuthStore((s) => s.user?.role) ?? "Administrator";
  const groups = navForRole(role);

  const openEcos = db().ecos.filter(
    (e) => e.status === "Review" || e.status === "Draft",
  ).length;
  const pendingApprovals = db().approvals.filter((a) => a.status === "Pending").length;

  const badgeFor = (badge?: string) => {
    if (badge === "count") return openEcos;
    if (badge === "alert") return pendingApprovals;
    return null;
  };

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className="flex shrink-0 flex-col border-r border-border bg-surface/60"
      style={{ width: collapsed ? 56 : sidebarWidth }}
    >
      {/* New button + collapse */}
      <div className="flex items-center gap-2 p-2.5">
        <NewMenu collapsed={collapsed} />
        {!collapsed && (
          <Hint label="Collapse sidebar" kbd="⌘B" side="right">
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              onClick={toggleSidebar}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </Hint>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-1 no-scrollbar">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1 px-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const count = badgeFor(item.badge);
                const Icon = item.icon;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={active}
                    className={cn("nav-item", collapsed && "justify-center px-0")}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {count != null && count > 0 && (
                          <Badge
                            variant={item.badge === "alert" ? "warning" : "muted"}
                            className="h-4 px-1"
                          >
                            {count}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
                return collapsed ? (
                  <Hint key={item.href} label={item.label} side="right">
                    {link}
                  </Hint>
                ) : (
                  link
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-border p-2.5">
        {collapsed && (
          <Hint label="Expand sidebar" side="right">
            <button
              onClick={toggleSidebar}
              className={cn("nav-item w-full justify-center px-0")}
            >
              <PanelLeft className="size-[18px]" />
            </button>
          </Hint>
        )}
        <Link
          href={SETTINGS_ITEM.href}
          data-active={pathname.startsWith("/settings")}
          className={cn("nav-item", collapsed && "justify-center px-0")}
        >
          <SETTINGS_ITEM.icon className="size-[18px] shrink-0" />
          {!collapsed && <span>{SETTINGS_ITEM.label}</span>}
        </Link>
        {!collapsed && <StorageMeter />}
      </div>
    </aside>
  );
}

function NewMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const setCreatePartOpen = useUIStore((s) => s.setCreatePartOpen);
  const setCreateProductOpen = useUIStore((s) => s.setCreateProductOpen);
  const setCreateBomOpen = useUIStore((s) => s.setCreateBomOpen);
  const setCreateEcoOpen = useUIStore((s) => s.setCreateEcoOpen);
  const setCreatePoOpen = useUIStore((s) => s.setCreatePoOpen);
  const setCreateVendorOpen = useUIStore((s) => s.setCreateVendorOpen);
  const setCadImportOpen = useUIStore((s) => s.setCadImportOpen);
  const createItems: [string, string, () => void][] = [
    ["Material", "Add a material to the master", () => { router.push("/parts"); setCreatePartOpen(true); }],
    ["Project", "Open a project from enquiry", () => setCreateProductOpen(true)],
    ["Draft BOM", "Start a project BOM for approval", () => setCreateBomOpen(true)],
    ["Change Request", "Raise a material change (MCR)", () => setCreateEcoOpen(true)],
    ["Purchase Order", "Draft a PO to a vendor", () => setCreatePoOpen(true)],
    ["Vendor", "Register a new vendor", () => setCreateVendorOpen(true)],
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={collapsed ? "icon-sm" : "sm"}
          className={cn("gap-1.5 shadow-sm", collapsed ? "mx-auto" : "flex-1")}
        >
          <Plus className="size-4" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Create</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Create new</DropdownMenuLabel>
        {createItems.map(([label, desc, action]) => (
          <DropdownMenuItem
            key={label}
            onClick={action}
            className="flex-col items-start gap-0"
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="text-2xs text-muted-foreground">{desc}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCadImportOpen(true)}>
          Import CAD…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StorageMeter() {
  return (
    <div className="mt-2 rounded-lg border border-border bg-surface-sunken/50 p-2.5">
      <div className="flex items-center justify-between text-2xs">
        <span className="font-medium text-foreground">Vault storage</span>
        <span className="text-muted-foreground">68%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-primary to-info" />
      </div>
      <p className="mt-1.5 text-2xs text-muted-foreground">
        1.36 TB of 2 TB used
      </p>
    </div>
  );
}
