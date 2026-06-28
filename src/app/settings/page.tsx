"use client";

import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsView } from "@/features/settings/settings-view";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Settings" description="Workspace and account preferences" icon={Settings} />
      <div className="min-h-0 flex-1">
        <SettingsView />
      </div>
    </div>
  );
}
