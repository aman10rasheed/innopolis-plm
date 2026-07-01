"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  KeyRound,
  UserX,
  UserCheck,
  ShieldCheck,
  Loader2,
  Mail,
} from "lucide-react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
} from "@/lib/api";
import type { ApiUserFull, ApiCreateUserInput } from "@/lib/api";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Avatar,
  ROLE_VARIANT,
  TEAM_BY_ROLE,
  initialsOf,
  hueFrom,
  ResetPasswordDialog,
} from "./user-bits";

const GRID_COLS = "grid-cols-[2fr_1fr_1fr_0.8fr_0.4fr]";

export function UsersView() {
  const usersQuery = useUsers();
  const users = usersQuery.data?.items ?? [];
  const myEmail = useAuthStore((s) => s.user?.email)?.toLowerCase();

  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState<ApiUserFull | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (!query || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [users, query, roleFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
        <div className="relative w-60">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="h-8 pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-2xs text-muted-foreground tabular">{filtered.length} users</span>
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Create user
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="min-w-[760px]">
          <div className={cn("sticky top-0 z-10 grid items-center gap-2 border-b border-border bg-surface/80 px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur", GRID_COLS)}>
            <span>User</span>
            <span>Role</span>
            <span>Team</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {usersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No users match your filters.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isSelf={u.email.toLowerCase() === myEmail}
                  onReset={() => setResetTarget(u)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onReset,
}: {
  user: ApiUserFull;
  isSelf: boolean;
  onReset: () => void;
}) {
  const updateUser = useUpdateUser();

  const toggleActive = () => {
    updateUser.mutate(
      { id: user.id, body: { is_active: !user.is_active } },
      {
        onSuccess: () =>
          toast.success(user.is_active ? "User deactivated" : "User reactivated", user.name),
        onError: (e) => toast.error("Couldn't update user", e instanceof Error ? e.message : undefined),
      },
    );
  };

  return (
    <div className={cn("grid items-center gap-2 px-4 py-2.5 transition-colors hover:bg-accent/30", GRID_COLS, !user.is_active && "opacity-60")}>
      <Link href={`/user-details?u=${user.id}`} className="flex min-w-0 items-center gap-2.5 outline-none">
        <Avatar user={user} size={34} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium hover:underline">
            {user.name}
            {isSelf && <span className="ml-1.5 text-2xs font-normal text-muted-foreground">(you)</span>}
            {user.must_change_password && (
              <Badge variant="warning" className="ml-1.5 px-1.5 py-0 text-[10px]">Must reset</Badge>
            )}
          </p>
          <p className="flex items-center gap-1 truncate text-2xs text-muted-foreground">
            <Mail className="size-3" /> {user.email}
          </p>
        </div>
      </Link>
      <div>
        <Badge variant={ROLE_VARIANT[user.role]}>
          {user.role === "Administrator" && <ShieldCheck className="mr-0.5 size-3" />}
          {user.role}
        </Badge>
      </div>
      <span className="truncate text-[13px] text-muted-foreground">{user.team || "—"}</span>
      <div>
        {user.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        )}
      </div>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/user-details?u=${user.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReset}>
              <KeyRound className="size-4" /> Reset password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={toggleActive}
              disabled={isSelf || updateUser.isPending}
              className={user.is_active ? "text-destructive focus:text-destructive" : undefined}
            >
              {user.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
              {user.is_active ? "Deactivate" : "Reactivate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create user — the inner form mounts fresh per open (no reset effect)        */
/* -------------------------------------------------------------------------- */

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            The new user signs in with the password you set here. Use “Reset password” later if you need to force a change.
          </DialogDescription>
        </DialogHeader>
        {open && <CreateUserForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CreateUserForm({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("Engineering");
  const [team, setTeam] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      toast.error("Missing details", "Name, email and an 8+ character password are required.");
      return;
    }
    const body: ApiCreateUserInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      team: team.trim() || TEAM_BY_ROLE[role],
      initials: initialsOf(name),
      hue: hueFrom(email || name),
    };
    createUser.mutate(body, {
      onSuccess: (u) => {
        toast.success("User created", `${u.name} can now sign in with the password you set.`);
        onClose();
      },
      onError: (err) => toast.error("Couldn't create user", err instanceof Error ? err.message : undefined),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cu-name">Full name</Label>
        <Input id="cu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cu-email">Email</Label>
        <Input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@innopolis.bio" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-team">Team</Label>
          <Input id="cu-team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder={TEAM_BY_ROLE[role]} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cu-pass">Initial password</Label>
        <Input id="cu-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
        <p className="text-2xs text-muted-foreground">Share this securely with the new user.</p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? <Loader2 className="size-4 animate-spin" /> : <>Create user</>}
        </Button>
      </DialogFooter>
    </form>
  );
}
