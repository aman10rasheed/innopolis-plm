"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import { canAccess } from "@/constants/navigation";
import { ROLE_META } from "@/auth/credentials";
import { TopToolbar } from "./top-toolbar";
import { Sidebar } from "./sidebar";
import { Inspector } from "./inspector";
import { StatusBar } from "./status-bar";
import { ResizeHandle } from "./resize-handle";
import { Toaster } from "@/components/ui/toast";
import { CommandPalette } from "@/components/overlays/command-palette";
import { SearchDialog } from "@/components/overlays/search-dialog";
import { AiAssistant } from "@/components/overlays/ai-assistant";
import { NotificationCenter } from "@/components/overlays/notification-center";
import { CreateDialogsHost } from "@/features/create/create-dialogs";
import { LoginScreen } from "@/components/auth/login-screen";
import { SetPasswordScreen } from "@/components/auth/set-password-screen";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  useGlobalShortcuts();
  const pathname = usePathname();
  const {
    sidebarWidth,
    inspectorWidth,
    inspectorOpen,
    setSidebarWidth,
    setInspectorWidth,
  } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Avoid a hydration flash before the persisted auth state loads.
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LogoMark size={40} className="animate-pulse-soft" />
      </div>
    );
  }

  // Gate: not signed in → login screen.
  if (!user) return <LoginScreen />;

  // Gate: signed in but the backend requires a password change → set-password screen.
  if (mustChangePassword) return <SetPasswordScreen />;

  const allowed = canAccess(user.role, pathname);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TopToolbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <ResizeHandle onResize={(d) => setSidebarWidth(sidebarWidth + d)} />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-sunken/40">
          {allowed ? children : <RestrictedAccess />}
        </main>

        {inspectorOpen && (
          <>
            <ResizeHandle side="left" onResize={(d) => setInspectorWidth(inspectorWidth - d)} />
            <Inspector />
          </>
        )}
      </div>
      <StatusBar />

      {/* Global overlays */}
      <Toaster />
      <CommandPalette />
      <SearchDialog />
      <AiAssistant />
      <NotificationCenter />
      <CreateDialogsHost />
    </div>
  );
}

function RestrictedAccess() {
  const user = useAuthStore((s) => s.user)!;
  const home = ROLE_META[user.role].home;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-surface-sunken text-muted-foreground">
        <Lock className="size-6" />
      </div>
      <div className="max-w-sm space-y-1">
        <h2 className="text-base font-semibold">Restricted area</h2>
        <p className="text-sm text-muted-foreground">
          Your <span className="font-medium text-foreground">{user.role}</span> role doesn't have access to this module.
          Contact an administrator if you need it.
        </p>
      </div>
      <Button asChild size="sm">
        <a href={home}>Go to your workspace</a>
      </Button>
    </div>
  );
}
