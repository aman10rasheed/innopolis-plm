"use client";

import type { Role } from "./credentials";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/components/ui/toast";

/**
 * Role-based create permissions (FRD "Can create / edit" matrix).
 * Routes gate navigation; this gates the create actions themselves —
 * every create dialog must pass through ensureCanCreate before opening.
 */
export type CreateAction =
  | "material"
  | "project"
  | "bom"
  | "bomLine"
  | "changeRequest"
  | "revision"
  | "document"
  | "cadImport"
  | "vendor"
  | "rfq"
  | "purchaseOrder"
  | "warehouse"
  | "stockCount"
  | "workOrder"
  | "report";

export const CREATE_PERMISSIONS: Record<
  CreateAction,
  { label: string; roles: Role[] }
> = {
  material: { label: "Materials", roles: ["Administrator", "Engineering"] },
  project: { label: "Projects", roles: ["Administrator", "Engineering"] },
  bom: { label: "BOMs", roles: ["Administrator", "Engineering"] },
  bomLine: { label: "BOM lines", roles: ["Administrator", "Engineering"] },
  changeRequest: { label: "Change requests", roles: ["Administrator", "Engineering"] },
  revision: { label: "Revisions", roles: ["Administrator", "Engineering"] },
  document: { label: "Documents", roles: ["Administrator", "Engineering"] },
  cadImport: { label: "CAD imports", roles: ["Administrator", "Engineering"] },
  vendor: { label: "Vendors", roles: ["Administrator", "Purchase"] },
  rfq: { label: "RFQs", roles: ["Administrator", "Purchase"] },
  purchaseOrder: { label: "Purchase orders", roles: ["Administrator", "Purchase"] },
  warehouse: { label: "Warehouses", roles: ["Administrator", "Stores"] },
  stockCount: { label: "Stock counts", roles: ["Administrator", "Stores"] },
  workOrder: { label: "Work orders", roles: ["Administrator", "Engineering", "Stores"] },
  report: { label: "Reports", roles: ["Administrator", "Commercial", "Management", "Purchase"] },
};

export function canCreate(role: Role | undefined, action: CreateAction): boolean {
  if (!role) return false;
  if (role === "Administrator") return true;
  return CREATE_PERMISSIONS[action].roles.includes(role);
}

/**
 * Click-time gate for create buttons. Returns true when the signed-in role
 * may perform the action; otherwise shows an access toast and returns false.
 */
export function ensureCanCreate(action: CreateAction): boolean {
  const role = useAuthStore.getState().user?.role;
  if (canCreate(role, action)) return true;
  const { label, roles } = CREATE_PERMISSIONS[action];
  const owners = roles.filter((r) => r !== "Administrator");
  const ownerText =
    owners.length > 0 ? owners.join(" & ") : "Administrators";
  toast.error(
    "Access restricted",
    `${label} can only be created by ${ownerText}${role ? ` — you are signed in as ${role}` : ""}.`,
  );
  return false;
}
