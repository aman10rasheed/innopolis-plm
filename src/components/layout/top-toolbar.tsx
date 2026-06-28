"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Sparkles,
  Bell,
  PanelRight,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "@/components/brand/logo";
import { Kbd, MOD } from "@/components/shared/kbd";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusDot } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { ALL_NAV_ITEMS } from "@/constants/navigation";
import { db } from "@/mock/db";

function usePageTitle() {
  const pathname = usePathname();
  const match = ALL_NAV_ITEMS.find(
    (i) => i.href === pathname || (i.href !== "/" && pathname.startsWith(i.href)),
  );
  return match?.label ?? "Workspace";
}

export function TopToolbar() {
  const { setCommandOpen, setSearchOpen, toggleAi, toggleInspector, setNotificationsOpen } =
    useUIStore();
  const title = usePageTitle();
  const unread = db().notifications.filter((n) => !n.read).length;
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const me = {
    name: authUser?.name ?? "Guest",
    initials: authUser?.initials ?? "GU",
    role: authUser?.role ?? "Guest",
    hue: authUser?.hue ?? 200,
  };

  return (
    <header className="drag-region relative z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-3 pl-20 backdrop-blur-xl">
      {/* Brand + workspace switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="no-drag flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-accent">
            <Logo />
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuItem>
            <div className="flex size-6 items-center justify-center rounded bg-primary/15 text-2xs font-bold text-primary">
              IB
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Innopolis Bio Innovations</span>
              <span className="text-2xs text-muted-foreground">Enterprise · 248 seats</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <div className="flex size-6 items-center justify-center rounded bg-info/15 text-2xs font-bold text-info">
              EN
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Engineering Division</span>
              <span className="text-2xs text-muted-foreground">Team · 32 seats</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Plus /> Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-5 w-px bg-border" />
      <span className="text-[13px] font-medium text-muted-foreground">{title}</span>

      {/* Center search */}
      <div className="no-drag mx-auto w-full max-w-md">
        <button
          onClick={() => setCommandOpen(true)}
          className="group flex h-8 w-full items-center gap-2.5 rounded-lg border border-border bg-surface-sunken/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-sunken"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search or run a command…</span>
          <span className="flex items-center gap-1">
            <Kbd>{MOD}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      {/* Right actions */}
      <div className="no-drag flex items-center gap-0.5">
        <Hint label="Quick search" kbd={`${MOD}/`}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
          </Button>
        </Hint>
        <Hint label="AI Assistant" kbd={`${MOD}J`}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-primary"
            onClick={toggleAi}
          >
            <Sparkles className="size-4" />
          </Button>
        </Hint>
        <Hint label="Notifications" kbd="N">
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative text-muted-foreground"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex size-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </Hint>
        <ThemeToggle />
        <Hint label="Toggle inspector" kbd={`${MOD}I`}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={toggleInspector}
          >
            <PanelRight className="size-4" />
          </Button>
        </Hint>

        <div className="mx-1 h-5 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-accent">
              <div className="relative">
                <Avatar className="size-7">
                  <AvatarFallback
                    style={{ background: `hsl(${me.hue} 60% 22%)`, color: `hsl(${me.hue} 80% 75%)` }}
                  >
                    {me.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface">
                  <StatusDot className="bg-success" />
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-2.5 p-2">
              <Avatar className="size-9">
                <AvatarFallback
                  style={{ background: `hsl(${me.hue} 60% 22%)`, color: `hsl(${me.hue} 80% 75%)` }}
                >
                  {me.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{me.name}</p>
                <p className="truncate text-2xs text-muted-foreground">{me.role}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Profile & preferences
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Notifications</DropdownMenuItem>
            <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => logout()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
