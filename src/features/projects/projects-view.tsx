"use client";

import * as React from "react";
import {
  Package,
  Pin,
  PinOff,
  GitPullRequestArrow,
  Boxes,
  CalendarClock,
  Activity as ActivityIcon,
} from "lucide-react";
import { db, getUser } from "@/mock/db";
import type { Product } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Thumbnail } from "@/components/shared/thumbnail";
import { LIFECYCLE_VARIANT } from "@/constants/status";
import { cn, formatNumber, formatDate, timeAgo, seededRandom } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/components/ui/toast";

type Health = "On Track" | "At Risk" | "Delayed";

const HEALTH_GROUPS: { key: Health; dot: string; bar: string }[] = [
  { key: "On Track", dot: "bg-success", bar: "bg-success" },
  { key: "At Risk", dot: "bg-warning", bar: "bg-warning" },
  { key: "Delayed", dot: "bg-destructive", bar: "bg-destructive" },
];

function healthOf(p: Product): Health {
  if (p.health > 80) return "On Track";
  if (p.health >= 60) return "At Risk";
  return "Delayed";
}

function teamFor(p: Product): string[] {
  const users = db().users;
  const rng = seededRandom(p.thumbnailHue + 7);
  const ids = new Set<string>([p.ownerId]);
  while (ids.size < 3 && ids.size < users.length) {
    ids.add(users[Math.floor(rng() * users.length)]!.id);
  }
  return [...ids].slice(0, 3);
}

export function ProjectsView() {
  const products = db().products;
  const activities = db().activities.slice(0, 12);
  const pinned = useUIStore((s) => s.pinnedProjects);
  const togglePin = useUIStore((s) => s.togglePin);

  const milestones = React.useMemo(() => {
    return db()
      .ecos.filter((e) => e.status !== "Completed")
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 8);
  }, []);

  return (
    <div className="flex h-full min-h-0">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          {HEALTH_GROUPS.map((g) => {
            const items = products.filter((p) => healthOf(p) === g.key);
            if (items.length === 0) return null;
            return (
              <section key={g.key}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full", g.dot)} />
                  <h2 className="text-sm font-semibold">{g.key}</h2>
                  <Badge variant="muted">{items.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                  {items.map((p) => {
                    const owner = getUser(p.ownerId);
                    const team = teamFor(p);
                    const isPinned = pinned.includes(p.id);
                    return (
                      <Card key={p.id} interactive className="p-4" onClick={() => toast.info(p.name, p.code)}>
                        <div className="flex items-start gap-3">
                          <Thumbnail hue={p.thumbnailHue} size={44} icon={Package} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{p.name}</p>
                            <p className="font-mono text-2xs text-muted-foreground">
                              {p.family} · {p.code}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(p.id);
                              toast.success(isPinned ? "Unpinned" : "Pinned", p.name);
                            }}
                            className={cn(
                              "rounded-md p-1.5 transition-colors",
                              isPinned ? "text-primary" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {isPinned ? <Pin className="size-4 fill-current" /> : <PinOff className="size-4" />}
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <Badge variant={LIFECYCLE_VARIANT[p.lifecycle]}>{p.lifecycle}</Badge>
                          <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                            <GitPullRequestArrow className="size-3" /> {p.openEcos} open ECOs
                          </span>
                        </div>

                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-2xs">
                            <span className="text-muted-foreground">Health</span>
                            <span className="font-medium tabular">{p.health}%</span>
                          </div>
                          <Progress value={p.health} className="h-1.5" indicatorClassName={g.bar} />
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                          <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                            <Boxes className="size-3" /> {formatNumber(p.unitsBuilt)} built
                          </span>
                          <div className="flex -space-x-1.5">
                            {team.map((id) => {
                              const u = getUser(id);
                              return (
                                <Avatar key={id} className="size-6 ring-2 ring-card">
                                  <AvatarFallback
                                    className="text-[9px]"
                                    style={{ background: `hsl(${u?.hue} 55% 22%)`, color: `hsl(${u?.hue} 80% 76%)` }}
                                  >
                                    {u?.initials}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })}
                          </div>
                        </div>
                        <p className="mt-2 text-2xs text-muted-foreground">Owner · {owner?.name}</p>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </ScrollArea>

      {/* Right rail */}
      <aside className="hidden w-[320px] shrink-0 border-l border-border xl:block">
        <ScrollArea className="h-full">
          <div className="space-y-5 p-4">
            <section>
              <div className="mb-2.5 flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Upcoming milestones</h3>
              </div>
              <div className="relative space-y-0 pl-5">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
                {milestones.map((e) => {
                  const overdue = new Date(e.dueDate) < new Date();
                  return (
                    <div key={e.id} className="relative pb-4">
                      <div
                        className={cn(
                          "absolute -left-5 top-1 size-3.5 rounded-full border-2 border-surface",
                          overdue ? "bg-destructive" : "bg-primary",
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs text-muted-foreground">{e.number}</span>
                        <Badge variant="muted">{e.status}</Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[13px]">{e.title}</p>
                      <p className={cn("text-2xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                        Due {formatDate(e.dueDate)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-2.5 flex items-center gap-2">
                <ActivityIcon className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent activity</h3>
              </div>
              <div className="space-y-3">
                {activities.map((a) => {
                  const u = getUser(a.userId);
                  return (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <Avatar className="size-6 shrink-0">
                        <AvatarFallback
                          className="text-[8px]"
                          style={{ background: `hsl(${u?.hue} 55% 22%)`, color: `hsl(${u?.hue} 80% 76%)` }}
                        >
                          {u?.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xs leading-snug">
                          <span className="font-medium text-foreground">{u?.name}</span>{" "}
                          <span className="text-muted-foreground">{a.action}</span>{" "}
                          <span className="font-mono text-foreground">{a.target}</span>
                        </p>
                        <p className="text-2xs text-muted-foreground">{timeAgo(a.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}
