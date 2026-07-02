"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { ALL_NAV_ITEMS } from "@/constants/navigation";

/**
 * Global keyboard shortcuts.
 *  - Cmd/Ctrl+K : command palette
 *  - Cmd/Ctrl+/ : global search
 *  - Cmd/Ctrl+J : AI assistant
 *  - Cmd/Ctrl+B : toggle sidebar
 *  - Cmd/Ctrl+I : toggle inspector
 *  - G then <key> : navigate (Linear-style chords)
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const {
    setCommandOpen,
    setSearchOpen,
    toggleAi,
    toggleSidebar,
    toggleInspector,
    setNotificationsOpen,
  } = useUIStore();

  useEffect(() => {
    let chordTimer: ReturnType<typeof setTimeout> | null = null;
    let awaitingChord = false;

    const navByChord: Record<string, string> = {
      d: "/",
      p: "/products",
      l: "/parts",
      b: "/bom",
      s: "/suppliers",
      i: "/inventory",
      a: "/analytics",
    };

    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggleAi();
        return;
      }
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      if (mod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        toggleInspector();
        return;
      }
      if (typing) return;

      // chord navigation: press "g" then a letter
      if (awaitingChord) {
        const dest = navByChord[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        awaitingChord = false;
        if (chordTimer) clearTimeout(chordTimer);
        return;
      }
      if (e.key.toLowerCase() === "g") {
        awaitingChord = true;
        chordTimer = setTimeout(() => (awaitingChord = false), 1200);
        return;
      }
      if (e.key.toLowerCase() === "n" && !mod) {
        setNotificationsOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (chordTimer) clearTimeout(chordTimer);
    };
  }, [router, setCommandOpen, setSearchOpen, toggleAi, toggleSidebar, toggleInspector, setNotificationsOpen]);
}

export const _navItems = ALL_NAV_ITEMS; // re-export anchor to keep tree-shaking honest
