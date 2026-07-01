"use client";

import { Users, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { UsersView } from "@/features/users/users-view";
import { useUsers } from "@/lib/api";

export default function UsersPage() {
  const users = useUsers().data?.items ?? [];
  const active = users.filter((u) => u.is_active).length;
  const admins = users.filter((u) => u.role === "Administrator").length;
  const mustReset = users.filter((u) => u.must_change_password).length;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="User Management"
        description={`${users.length} users · ${active} active`}
        icon={Users}
      />
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4 lg:grid-cols-4">
        <StatCard label="Total users" value={users.length} icon={Users} accent="primary" />
        <StatCard label="Active" value={active} icon={UserCheck} accent="success" />
        <StatCard label="Administrators" value={admins} icon={ShieldCheck} accent="info" />
        <StatCard label="Pending reset" value={mustReset} icon={KeyRound} accent="warning" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <UsersView />
      </div>
    </div>
  );
}
