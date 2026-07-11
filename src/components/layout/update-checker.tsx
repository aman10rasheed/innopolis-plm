"use client";

import * as React from "react";
import { toast, useToastStore } from "@/components/ui/toast";

/** How often a running app re-checks GitHub Releases for a newer version. */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * Polls the Tauri updater (GitHub Releases `latest.json`) and surfaces new
 * versions as a bottom-right toast with a one-click "Restart & update" action.
 * Renders nothing; no-ops entirely in the browser build.
 */
export function UpdateChecker() {
  const notifiedRef = React.useRef<string | null>(null);
  const installingRef = React.useRef(false);

  React.useEffect(() => {
    if (!isTauri()) return;

    let disposed = false;

    const install = async (update: {
      version: string;
      downloadAndInstall: () => Promise<void>;
    }) => {
      if (installingRef.current) return;
      installingRef.current = true;
      const loadingId = toast({
        title: "Downloading update…",
        description: `Getting Innopolis v${update.version} ready. The app will restart on its own.`,
        variant: "loading",
        duration: 0,
      });
      try {
        await update.downloadAndInstall();
        useToastStore.getState().dismiss(loadingId);
        toast.success(
          "Update installed",
          "Restarting to bring you the newest Innopolis…",
        );
        const { relaunch } = await import("@tauri-apps/plugin-process");
        setTimeout(() => relaunch(), 1200);
      } catch (err) {
        installingRef.current = false;
        useToastStore.getState().dismiss(loadingId);
        toast.error(
          "Update failed",
          err instanceof Error ? err.message : "Please try again later.",
        );
      }
    };

    const checkForUpdate = async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (disposed || !update) return;
        if (notifiedRef.current === update.version) return;
        notifiedRef.current = update.version;
        toast({
          title: "A fresh update is here ✨",
          description: `Innopolis v${update.version} just landed — restart to get the latest improvements.`,
          variant: "info",
          duration: 0,
          action: { label: "Restart & update", onClick: () => install(update) },
        });
      } catch {
        // Offline or the release feed is unreachable — try again next cycle.
      }
    };

    const initial = setTimeout(checkForUpdate, 4000);
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    return () => {
      disposed = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  return null;
}
