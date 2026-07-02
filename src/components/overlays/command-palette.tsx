"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { ALL_NAV_ITEMS, SETTINGS_ITEM } from "@/constants/navigation";
import { useParts, useProjects, useVendors } from "@/lib/api";
import {
  Plus,
  Package,
  Boxes,
  Building2,
  FileText,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen, toggleAi, setCreatePartOpen, setCreateBomOpen } = useUIStore();
  const { theme, setTheme } = useTheme();

  const go = (href: string) => {
    setCommandOpen(false);
    router.push(href);
  };
  const run = (fn: () => void) => {
    setCommandOpen(false);
    fn();
  };

  const parts = (useParts().data?.items ?? []).slice(0, 6);
  const suppliers = (useVendors().data?.items ?? []).slice(0, 3);
  const products = (useProjects().data?.items ?? []).slice(0, 4);

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent
        hideClose
        className="top-[18%] max-w-[640px] translate-y-0 gap-0 overflow-hidden p-0 shadow-lg"
      >
        <Command loop>
          <CommandInput placeholder="Search parts, projects, suppliers — or run a command…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() =>
                  run(() => {
                    router.push("/parts");
                    setCreatePartOpen(true);
                  })
                }
              >
                <Plus /> Create part
                <CommandShortcut>C P</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => setCreateBomOpen(true))}>
                <Boxes /> Draft BOM
              </CommandItem>
              <CommandItem onSelect={() => run(toggleAi)}>
                <Sparkles /> Ask Innopolis AI
                <CommandShortcut>⌘ J</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => run(() => setTheme(theme === "light" ? "dark" : "light"))}
              >
                {theme === "light" ? <Moon /> : <Sun />} Toggle theme
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Go to">
              {ALL_NAV_ITEMS.concat(SETTINGS_ITEM).map((item) => (
                <CommandItem
                  key={item.href}
                  value={`nav ${item.label}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon /> {item.label}
                  <ArrowRight className="ml-auto !size-3.5 opacity-0 group-aria-selected:opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Projects">
              {products.map((p) => (
                <CommandItem key={p.id} value={`product ${p.name} ${p.code}`} onSelect={() => go("/products")}>
                  <Package />
                  <span className="flex-1">{p.name}</span>
                  <span className="font-mono text-2xs text-muted-foreground">{p.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Parts">
              {parts.map((p) => (
                <CommandItem key={p.id} value={`part ${p.name} ${p.partNumber}`} onSelect={() => go("/parts")}>
                  <Boxes />
                  <span className="flex-1">{p.name}</span>
                  <span className="font-mono text-2xs text-muted-foreground">{p.partNumber}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Suppliers">
              {suppliers.map((s) => (
                <CommandItem key={s.id} value={`supplier ${s.name}`} onSelect={() => go("/suppliers")}>
                  <Building2 />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-2xs text-muted-foreground">{s.country}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3" /> Search parts, projects & vendors
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd> navigate
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd> select
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">esc</kbd> close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
