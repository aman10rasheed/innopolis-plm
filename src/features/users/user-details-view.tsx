"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  UserX,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Save,
  Calendar,
  Hash,
  Users as UsersIcon,
} from "lucide-react";
import { useUser, useUpdateUser } from "@/lib/api";
import type { ApiUserFull } from "@/lib/api";
import { ROLES, type Role } from "@/auth/credentials";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";
import { Avatar, ROLE_VARIANT, ResetPasswordDialog } from "./user-bits";

export function UserDetailsView({ userId }: { userId: string }) {
  const { data: user, isLoading, isError } = useUser(userId);

  if (!userId) {
    return <Empty msg="No user selected." />;
  }
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading user…
      </div>
    );
  }
  if (isError || !user) {
    return <Empty msg="User not found." />;
  }
  return <Loaded user={user} />;
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      <Button asChild size="sm" variant="outline">
        <Link href="/users"><ArrowLeft className="size-4" /> Back to users</Link>
      </Button>
    </div>
  );
}

function Loaded({ user }: { user: ApiUserFull }) {
  const myEmail = useAuthStore((s) => s.user?.email)?.toLowerCase();
  const isSelf = user.email.toLowerCase() === myEmail;
  const updateUser = useUpdateUser();
  const [resetOpen, setResetOpen] = React.useState(false);

  // Editable role + team.
  const [role, setRole] = React.useState<Role>(user.role);
  const [team, setTeam] = React.useState(user.team ?? "");
  React.useEffect(() => {
    setRole(user.role);
    setTeam(user.team ?? "");
  }, [user.id, user.role, user.team]);

  const dirty = role !== user.role || (team ?? "") !== (user.team ?? "");

  const save = () => {
    updateUser.mutate(
      { id: user.id, body: { role, team } },
      {
        onSuccess: () => toast.success("Profile updated", user.name),
        onError: (e) => toast.error("Couldn't update profile", e instanceof Error ? e.message : undefined),
      },
    );
  };

  const toggleActive = () => {
    updateUser.mutate(
      { id: user.id, body: { is_active: !user.is_active } },
      {
        onSuccess: () => toast.success(user.is_active ? "User deactivated" : "User reactivated", user.name),
        onError: (e) => toast.error("Couldn't update user", e instanceof Error ? e.message : undefined),
      },
    );
  };

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto max-w-3xl space-y-5 p-6">
        {/* Identity header */}
        <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
          <Avatar user={user} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              {isSelf && <span className="text-2xs text-muted-foreground">(you)</span>}
              <Badge variant={ROLE_VARIANT[user.role]}>
                {user.role === "Administrator" && <ShieldCheck className="mr-0.5 size-3" />}
                {user.role}
              </Badge>
              {user.is_active ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="muted">Inactive</Badge>
              )}
              {user.must_change_password && (
                <Badge variant="warning"><ShieldAlert className="mr-0.5 size-3" /> Must reset password</Badge>
              )}
            </div>
            <a href={`mailto:${user.email}`} className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <Mail className="size-3.5" /> {user.email}
            </a>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <Meta icon={UsersIcon} label="Team" value={user.team || "—"} />
          <Meta icon={Hash} label="Initials" value={user.initials || "—"} />
          <Meta icon={Calendar} label="Created" value={user.created_at ? formatDate(user.created_at) : "—"} />
          <Meta icon={Calendar} label="Last updated" value={user.updated_at ? formatDate(user.updated_at) : "—"} />
        </div>

        {/* Edit role & team */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isSelf}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              {isSelf && <p className="text-2xs text-muted-foreground">You can't change your own role.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ud-team">Team</Label>
              <Input id="ud-team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Team / department" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={save} disabled={!dirty || updateUser.isPending}>
              {updateUser.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Save className="size-4" /> Save changes</>}
            </Button>
          </div>
        </div>

        {/* Security / account actions */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Account actions</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setResetOpen(true)}>
              <KeyRound className="size-4" /> Reset password
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleActive}
              disabled={isSelf || updateUser.isPending}
              className={cn(user.is_active && "text-destructive hover:text-destructive")}
            >
              {user.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
              {user.is_active ? "Deactivate user" : "Reactivate user"}
            </Button>
          </div>
          {isSelf && (
            <p className="mt-2 text-2xs text-muted-foreground">
              You can't deactivate your own account.
            </p>
          )}
        </div>
      </div>

      <ResetPasswordDialog user={resetOpen ? user : null} onClose={() => setResetOpen(false)} />
    </ScrollArea>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="bg-surface p-3">
      <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium" title={value}>{value}</p>
    </div>
  );
}
