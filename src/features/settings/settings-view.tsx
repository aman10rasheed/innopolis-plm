"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import {
  User as UserIcon,
  Palette,
  Bell,
  Sun,
  Moon,
  Monitor,
  Check,
  RefreshCw,
  Info,
  Download,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

type Section = "Profile" | "Appearance" | "Notifications" | "About & Updates";

const NAV: { key: Section; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "Profile", icon: UserIcon },
  { key: "Appearance", icon: Palette },
  { key: "Notifications", icon: Bell },
  { key: "About & Updates", icon: Info },
];

export function SettingsView() {
  const [section, setSection] = React.useState<Section>("Profile");

  return (
    <div className="flex h-full min-h-0">
      <nav className="hidden w-56 shrink-0 border-r border-border p-3 md:block">
        <div className="space-y-0.5">
          {NAV.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                section === key ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {key}
            </button>
          ))}
        </div>
      </nav>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {section === "Profile" && <ProfileSection />}
          {section === "Appearance" && <AppearanceSection />}
          {section === "Notifications" && <NotificationsSection />}
          {section === "About & Updates" && <AboutSection />}
        </div>
      </ScrollArea>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-[13px] text-muted-foreground">{description}</p>
    </div>
  );
}

function ProfileSection() {
  // Backend-only: "me" is the authenticated user, not a mock db row.
  const authUser = useAuthStore((s) => s.user);
  const me = authUser ?? { name: "—", role: "—", initials: "—", hue: 210, email: "" };

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Your account details." />
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback
              className="text-xl"
              style={{ background: `hsl(${me.hue} 55% 22%)`, color: `hsl(${me.hue} 80% 76%)` }}
            >
              {me.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-semibold">{me.name}</p>
            <p className="text-[13px] text-muted-foreground">{me.role}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={me.name} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={me.role} readOnly />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={authUser?.email ?? ""} readOnly />
          </div>
        </div>
        <p className="mt-3 text-2xs text-muted-foreground">
          Profile details are managed by your administrator.
        </p>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Appearance" description="Customize how Innopolis looks for you." />
      <Card className="p-5">
        <Label>Theme</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const activeTheme = theme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTheme(t.key);
                  toast.success("Theme updated", t.label);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                  activeTheme ? "border-primary bg-primary/[0.06]" : "border-border hover:bg-accent/40",
                )}
              >
                <Icon className={cn("size-5", activeTheme ? "text-primary" : "text-muted-foreground")} />
                <span className="text-[13px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

const NOTIF_ROWS: { key: string; title: string; desc: string; def: boolean }[] = [
  { key: "approval", title: "Approval requests", desc: "When a BOM or MCR needs your sign-off", def: true },
  { key: "inventory", title: "Inventory alerts", desc: "Low stock and reorder warnings", def: true },
  { key: "eco", title: "Change request updates", desc: "Status changes on requests you follow", def: false },
  { key: "inapp", title: "In-app notifications", desc: "Toasts and the notification center", def: true },
];

function NotificationsSection() {
  const [state, setState] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(NOTIF_ROWS.map((r) => [r.key, r.def])),
  );
  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" description="Choose what you want to be notified about." />
      <Card className="divide-y divide-border p-0">
        {NOTIF_ROWS.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-[13px] font-medium">{r.title}</p>
              <p className="text-2xs text-muted-foreground">{r.desc}</p>
            </div>
            <Switch
              checked={state[r.key]}
              onCheckedChange={(v) => {
                setState((s) => ({ ...s, [r.key]: v }));
                toast.message(r.title, v ? "Enabled" : "Disabled");
              }}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ── About & Updates ──────────────────────────────────────────────────── */

interface PendingUpdate {
  version: string;
  downloadAndInstall: () => Promise<void>;
}

type UpdateState = "idle" | "checking" | "latest" | "available" | "installing";

function AboutSection() {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  const [version, setVersion] = React.useState("");
  const [state, setState] = React.useState<UpdateState>("idle");
  const [latestVersion, setLatestVersion] = React.useState("");
  const updateRef = React.useRef<PendingUpdate | null>(null);

  React.useEffect(() => {
    if (!isTauri) return;
    import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then(setVersion)
      .catch(() => {});
  }, [isTauri]);

  const onCheck = async () => {
    setState("checking");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        updateRef.current = update;
        setLatestVersion(update.version);
        setState("available");
      } else {
        setState("latest");
        toast.success("You're up to date", `Innopolis v${version} is the latest version.`);
      }
    } catch (err) {
      setState("idle");
      toast.error(
        "Update check failed",
        err instanceof Error ? err.message : "Check your connection and try again.",
      );
    }
  };

  const onInstall = async () => {
    const update = updateRef.current;
    if (!update) return;
    setState("installing");
    try {
      await update.downloadAndInstall();
      toast.success("Update installed", "Restarting to bring you the newest Innopolis…");
      const { relaunch } = await import("@tauri-apps/plugin-process");
      setTimeout(() => relaunch(), 1000);
    } catch (err) {
      setState("available");
      toast.error("Update failed", err instanceof Error ? err.message : "Please try again later.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="About & Updates" description="App version and software updates." />
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Innopolis PLM</p>
            <p className="text-2xs text-muted-foreground">
              {isTauri
                ? version
                  ? `Version ${version}`
                  : "Reading version…"
                : "Running in the browser — updates apply to the desktop app."}
            </p>
          </div>
          {state === "latest" && <Badge variant="success">Up to date</Badge>}
          {state === "available" && <Badge variant="warning">v{latestVersion} available</Badge>}
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={!isTauri || state === "checking" || state === "installing"}
            onClick={onCheck}
          >
            {state === "checking" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {state === "checking" ? "Checking…" : "Check for updates"}
          </Button>

          {state === "available" && (
            <Button size="sm" disabled={false} onClick={onInstall}>
              <Download className="size-3.5" />
              Install v{latestVersion} & restart
            </Button>
          )}
          {state === "installing" && (
            <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Downloading and installing… the app will restart itself.
            </span>
          )}
        </div>

        <p className="mt-3 text-2xs text-muted-foreground">
          Updates are downloaded from the official Innopolis release channel and verified
          before installing. The app also checks automatically every 30 minutes.
        </p>
      </Card>
    </div>
  );
}
