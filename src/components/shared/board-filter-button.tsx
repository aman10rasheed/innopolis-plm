"use client";

import * as React from "react";
import { Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

/**
 * A real, reactive quick-filter button for the kanban boards.
 * Selections are stored in `ui-store.boardFilters[boardKey]` and read by the
 * board component, which filters its cards accordingly. "" means All.
 */
export function BoardFilterButton({
  boardKey,
  label = "Filter",
  options,
}: {
  boardKey: string;
  label?: string;
  options: { value: string; label: string }[];
}) {
  const active = useUIStore((s) => s.boardFilters[boardKey] ?? "");
  const setBoardFilter = useUIStore((s) => s.setBoardFilter);
  const activeLabel = options.find((o) => o.value === active)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={active ? "default" : "outline"} size="sm">
          <Filter className="size-4" /> {active ? activeLabel : label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setBoardFilter(boardKey, "")}>
          <span className={cn("w-4", active === "" ? "opacity-100" : "opacity-0")}>
            <Check className="size-3.5" />
          </span>
          All
        </DropdownMenuItem>
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => setBoardFilter(boardKey, o.value)}>
            <span className={cn("w-4", active === o.value ? "opacity-100" : "opacity-0")}>
              <Check className="size-3.5" />
            </span>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
