import {
  LayoutDashboard,
  FolderKanban,
  Library,
  Network,
  Box,
  FileText,
  GitPullRequestArrow,
  ClipboardCheck,
  History,
  Factory,
  Warehouse,
  ShoppingCart,
  CircleDollarSign,
  CheckCircle2,
  FileBarChart,
  BarChart3,
  Settings,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/auth/credentials";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "count" | "alert";
  shortcut?: string;
  /** Roles allowed to see/visit this item. Omit = everyone. */
  roles?: Role[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ENG: Role[] = ["Administrator", "Engineering"];
const ALL_EXCEPT_NONE = undefined; // visible to everyone

/** Navigation mapped to the Innopolis FRD modules & project lifecycle. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard, shortcut: "G D" },
      { label: "Projects", href: "/products", icon: FolderKanban, shortcut: "G P", roles: ["Administrator", "Engineering", "Commercial", "Management"] },
      { label: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "G A", roles: ["Administrator", "Management", "Commercial"] },
    ],
  },
  {
    label: "Engineering",
    items: [
      { label: "Material Master", href: "/parts", icon: Library, shortcut: "G L", roles: ["Administrator", "Engineering", "Purchase"] },
      { label: "BOM Explorer", href: "/bom", icon: Network, shortcut: "G B", roles: ["Administrator", "Engineering", "Commercial", "Purchase"] },
      { label: "CAD Viewer", href: "/cad", icon: Box, roles: ENG },
      { label: "Documents", href: "/documents", icon: FileText, roles: ALL_EXCEPT_NONE },
    ],
  },
  {
    label: "Change Control",
    items: [
      { label: "BOM Approvals", href: "/bom-approvals", icon: ClipboardCheck, badge: "count", roles: ["Administrator", "Engineering", "Commercial", "Purchase"] },
      { label: "Change Requests", href: "/changes", icon: GitPullRequestArrow, badge: "count", roles: ["Administrator", "Engineering", "Commercial"] },
      { label: "Revisions", href: "/revisions", icon: History, roles: ["Administrator", "Engineering", "Commercial"] },
      { label: "Approvals", href: "/approvals", icon: CheckCircle2, badge: "alert", roles: ["Administrator", "Commercial", "Management"] },
    ],
  },
  {
    label: "Procurement & Supply",
    items: [
      { label: "Vendors", href: "/suppliers", icon: Building2, roles: ["Administrator", "Purchase", "Stores", "Commercial"] },
      { label: "Procurement", href: "/procurement", icon: ShoppingCart, roles: ["Administrator", "Purchase", "Commercial"] },
      { label: "Manufacturing", href: "/manufacturing", icon: Factory, roles: ["Administrator", "Stores", "Engineering", "Management"] },
      { label: "Inventory", href: "/inventory", icon: Warehouse, badge: "alert", roles: ["Administrator", "Stores", "Purchase", "Management"] },
      { label: "Cost Analysis", href: "/cost", icon: CircleDollarSign, roles: ["Administrator", "Commercial", "Management"] },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports", href: "/reports", icon: FileBarChart, roles: ["Administrator", "Commercial", "Management", "Purchase"] }],
  },
  {
    label: "Administration",
    items: [{ label: "User Management", href: "/users", icon: Users, roles: ["Administrator"] }],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};

/** Detail/sub-routes that aren't sidebar items but still need role gating. */
const EXTRA_ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/user-details", roles: ["Administrator"] },
];

/** Whether a role may visit a path (Administrator sees all). */
export function canAccess(role: Role, pathname: string): boolean {
  if (role === "Administrator") return true;
  const extra = EXTRA_ROUTE_ROLES.find((e) => pathname.startsWith(e.prefix));
  if (extra) return extra.roles.includes(role);
  const item = ALL_NAV_ITEMS.find((i) =>
    i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
  );
  if (!item || !item.roles) return true; // unknown / public routes (e.g. settings)
  return item.roles.includes(role);
}

/** Nav groups filtered to a role, dropping empty groups. */
export function navForRole(role: Role): NavGroup[] {
  if (role === "Administrator") return NAV_GROUPS;
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}
