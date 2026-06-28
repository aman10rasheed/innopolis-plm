"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  User as UserIcon,
  Building2,
  Palette,
  Bell,
  Plug,
  Users as UsersIcon,
  ShieldCheck,
  CreditCard,
  Sun,
  Moon,
  Monitor,
  Check,
  Laptop,
  Smartphone,
  LogOut,
} from "lucide-react";
import { db, getUser } from "@/mock/db";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn, formatNumber } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

type Section =
  | "Profile"
  | "Workspace"
  | "Appearance"
  | "Notifications"
  | "Integrations"
  | "Members"
  | "Security"
  | "Billing";

const NAV: { key: Section; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "Profile", icon: UserIcon },
  { key: "Workspace", icon: Building2 },
  { key: "Appearance", icon: Palette },
  { key: "Notifications", icon: Bell },
  { key: "Integrations", icon: Plug },
  { key: "Members", icon: UsersIcon },
  { key: "Security", icon: ShieldCheck },
  { key: "Billing", icon: CreditCard },
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
          {section === "Workspace" && <WorkspaceSection />}
          {section === "Appearance" && <AppearanceSection />}
          {section === "Notifications" && <NotificationsSection />}
          {section === "Integrations" && <IntegrationsSection />}
          {section === "Members" && <MembersSection />}
          {section === "Security" && <SecuritySection />}
          {section === "Billing" && <BillingSection />}
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
  const me = db().users[0]!;
  const [name, setName] = React.useState(me.name);
  const [role, setRole] = React.useState(me.role);
  const [email, setEmail] = React.useState("amankukku1000@gmail.com");

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Manage your personal information." />
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
            <Button size="sm" variant="outline" onClick={() => toast.success("Avatar updated")}>
              Change avatar
            </Button>
            <p className="mt-1.5 text-2xs text-muted-foreground">JPG, GIF or PNG. 2MB max.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => toast.message("Changes discarded")}>
          Cancel
        </Button>
        <Button onClick={() => toast.success("Profile saved", `${name} · ${role}`)}>Save changes</Button>
      </div>
    </div>
  );
}

function WorkspaceSection() {
  const [wsName, setWsName] = React.useState("Innopolis Robotics");
  const [region, setRegion] = React.useState("us-east");
  return (
    <div className="space-y-6">
      <SectionHeader title="Workspace" description="Configure your organization workspace." />
      <Card className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="ws">Workspace name</Label>
          <Input id="ws" value={wsName} onChange={(e) => setWsName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Data region</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us-east">US East (Virginia)</SelectItem>
              <SelectItem value="eu-central">EU Central (Frankfurt)</SelectItem>
              <SelectItem value="ap-south">AP South (Mumbai)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Default currency</Label>
          <Select defaultValue="usd">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD ($)</SelectItem>
              <SelectItem value="eur">EUR (€)</SelectItem>
              <SelectItem value="gbp">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <div className="flex justify-end">
        <Button onClick={() => toast.success("Workspace saved", wsName)}>Save changes</Button>
      </div>
    </div>
  );
}

const ACCENTS = [
  { name: "Indigo", token: "hsl(var(--primary))" },
  { name: "Emerald", token: "hsl(var(--success))" },
  { name: "Amber", token: "hsl(var(--warning))" },
  { name: "Sky", token: "hsl(var(--info))" },
  { name: "Rose", token: "hsl(var(--destructive))" },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = React.useState("comfortable");
  const [accent, setAccent] = React.useState("Indigo");

  const themes = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Appearance" description="Customize how Innopolis looks for you." />
      <Card className="space-y-5 p-5">
        <div>
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
        </div>

        <div className="border-t border-border pt-5">
          <Label>Density</Label>
          <div className="mt-2 flex items-center gap-2">
            {["compact", "comfortable"].map((d) => (
              <Button
                key={d}
                variant={density === d ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setDensity(d);
                  toast.message("Density", d);
                }}
                className="capitalize"
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <Label>Accent color</Label>
          <div className="mt-2 flex items-center gap-2.5">
            {ACCENTS.map((a) => (
              <button
                key={a.name}
                onClick={() => {
                  setAccent(a.name);
                  toast.success("Accent", a.name);
                }}
                title={a.name}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-all",
                  accent === a.name ? "ring-foreground" : "ring-transparent hover:ring-border",
                )}
                style={{ background: a.token }}
              >
                {accent === a.name && <Check className="size-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

const NOTIF_ROWS: { key: string; title: string; desc: string; def: boolean }[] = [
  { key: "mention", title: "Mentions", desc: "When someone @mentions you", def: true },
  { key: "approval", title: "Approval requests", desc: "When an ECO needs your sign-off", def: true },
  { key: "inventory", title: "Inventory alerts", desc: "Low stock and reorder warnings", def: true },
  { key: "eco", title: "ECO updates", desc: "Status changes on changes you follow", def: false },
  { key: "system", title: "System notices", desc: "Cost rollups and maintenance", def: false },
  { key: "email", title: "Email digest", desc: "Daily summary to your inbox", def: true },
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

const INTEGRATIONS = [
  { name: "SolidWorks PDM", desc: "Sync CAD vaults and revisions", connected: true },
  { name: "Autodesk Vault", desc: "Mirror part and assembly data", connected: false },
  { name: "Jira", desc: "Link ECOs to engineering tickets", connected: true },
  { name: "Slack", desc: "Approval and inventory alerts", connected: true },
  { name: "SAP", desc: "Push BOMs to ERP procurement", connected: false },
  { name: "Onshape", desc: "Cloud CAD model references", connected: false },
];

function IntegrationsSection() {
  const [conn, setConn] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(INTEGRATIONS.map((i) => [i.name, i.connected])),
  );
  return (
    <div className="space-y-6">
      <SectionHeader title="Integrations" description="Connect Innopolis to your engineering stack." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {INTEGRATIONS.map((i) => {
          const isConn = conn[i.name];
          return (
            <Card key={i.name} className="flex items-start gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Plug className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold">{i.name}</p>
                  {isConn && <Badge variant="success">Connected</Badge>}
                </div>
                <p className="mt-0.5 text-2xs text-muted-foreground">{i.desc}</p>
                <Button
                  size="xs"
                  variant={isConn ? "outline" : "default"}
                  className="mt-2.5"
                  onClick={() => {
                    setConn((c) => ({ ...c, [i.name]: !isConn }));
                    toast[isConn ? "message" : "success"](
                      i.name,
                      isConn ? "Disconnected" : "Connected",
                    );
                  }}
                >
                  {isConn ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const ROLES = ["Admin", "Engineer", "Reviewer", "Viewer"];

function MembersSection() {
  const users = db().users;
  const [roles, setRoles] = React.useState<Record<string, string>>(
    () => Object.fromEntries(users.map((u, i) => [u.id, ROLES[i % ROLES.length]!])),
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Members" description={`${users.length} people in this workspace.`} />
        <Button size="sm" onClick={() => toast.success("Invite sent")}>
          Invite member
        </Button>
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface/40 text-left text-2xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 font-medium">Member</th>
              <th className="px-4 py-2 font-medium">Team</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-accent/30">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback
                        className="text-[9px]"
                        style={{ background: `hsl(${u.hue} 55% 22%)`, color: `hsl(${u.hue} 80% 76%)` }}
                      >
                        {u.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-2xs text-muted-foreground">{u.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{u.team}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <StatusDot className={u.online ? "bg-success" : "bg-muted-foreground"} pulse={u.online} />
                    {u.online ? "Online" : "Offline"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Select
                    value={roles[u.id]}
                    onValueChange={(v) => {
                      setRoles((r) => ({ ...r, [u.id]: v }));
                      toast.success("Role updated", `${u.name} → ${v}`);
                    }}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const SESSIONS = [
  { device: "MacBook Pro · Chrome", location: "San Jose, US", current: true, icon: Laptop },
  { device: "iPhone 15 · Safari", location: "San Jose, US", current: false, icon: Smartphone },
  { device: "Windows · Edge", location: "Austin, US", current: false, icon: Monitor },
];

function SecuritySection() {
  const [twoFa, setTwoFa] = React.useState(true);
  return (
    <div className="space-y-6">
      <SectionHeader title="Security" description="Protect your account and review active sessions." />
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Two-factor authentication</p>
            <p className="text-2xs text-muted-foreground">Require a code at sign-in</p>
          </div>
          <Switch
            checked={twoFa}
            onCheckedChange={(v) => {
              setTwoFa(v);
              toast[v ? "success" : "warning"]("Two-factor", v ? "Enabled" : "Disabled");
            }}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-[13px] font-medium">Password</p>
            <p className="text-2xs text-muted-foreground">Last changed 3 months ago</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast.message("Password reset link sent")}>
            Change
          </Button>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-[13px] font-semibold">Active sessions</p>
        <Card className="divide-y divide-border p-0">
          {SESSIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.device} className="flex items-center gap-3 p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="flex items-center gap-2 text-[13px] font-medium">
                    {s.device}
                    {s.current && <Badge variant="success">This device</Badge>}
                  </p>
                  <p className="text-2xs text-muted-foreground">{s.location}</p>
                </div>
                {!s.current && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => toast.message("Session revoked", s.device)}
                  >
                    <LogOut className="size-3.5" /> Revoke
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function BillingSection() {
  const seatsUsed = db().users.length;
  const seatsTotal = 25;
  const pct = Math.round((seatsUsed / seatsTotal) * 100);
  return (
    <div className="space-y-6">
      <SectionHeader title="Billing" description="Manage your plan and usage." />
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold">Enterprise</p>
              <Badge variant="default">Current plan</Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Billed annually · renews Mar 1, 2027</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular">$4,800</p>
            <p className="text-2xs text-muted-foreground">per month</p>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-2xs">
            <span className="text-muted-foreground">Seats used</span>
            <span className="font-medium tabular">
              {seatsUsed} / {seatsTotal}
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
          {[
            ["Parts tracked", formatNumber(db().parts.length)],
            ["Storage", "182 GB"],
            ["API calls", "1.2M"],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-3 text-center">
              <p className="text-2xs text-muted-foreground">{k}</p>
              <p className="mt-1 text-sm font-semibold tabular">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={() => toast.message("Opening invoices")}>
            View invoices
          </Button>
          <Button onClick={() => toast.success("Plan", "Upgrade requested")}>Manage plan</Button>
        </div>
      </Card>
    </div>
  );
}
