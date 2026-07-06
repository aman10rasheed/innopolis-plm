/* ============================================================================
 * DEMO CREDENTIALS — role-based login for the Innopolis BOM & Procurement app
 * ----------------------------------------------------------------------------
 * Frontend-only demo. These accounts gate which modules each role can see.
 * Swap this file for a real auth API later — keep the `Role` union + the
 * `authenticate()` signature and the rest of the app keeps working.
 * ==========================================================================*/

export type Role =
  | "Administrator"
  | "Engineering"
  | "Commercial"
  | "Purchase"
  | "Stores"
  | "Management"
  | "Project Manager";

export interface DemoCredential {
  email: string;
  password: string;
  role: Role;
  name: string;
  initials: string;
  hue: number;
}

/** Demo login accounts (one per role). */
export const CREDENTIALS: DemoCredential[] = [
  { email: "admin@innopolis.bio", password: "admin123", role: "Administrator", name: "Priya Nair", initials: "PN", hue: 280 },
  { email: "engineer@innopolis.bio", password: "engineer123", role: "Engineering", name: "Elena Vasquez", initials: "EV", hue: 172 },
  { email: "commercial@innopolis.bio", password: "commercial123", role: "Commercial", name: "Omar Haddad", initials: "OH", hue: 38 },
  { email: "purchase@innopolis.bio", password: "purchase123", role: "Purchase", name: "James Park", initials: "JP", hue: 210 },
  { email: "stores@innopolis.bio", password: "stores123", role: "Stores", name: "Raj Patel", initials: "RP", hue: 152 },
  { email: "management@innopolis.bio", password: "management123", role: "Management", name: "Hannah Berg", initials: "HB", hue: 320 },
  { email: "pm@innopolis.bio", password: "pm123456", role: "Project Manager", name: "Arjun Mehta", initials: "AM", hue: 100 },
];

export interface RoleMeta {
  label: Role;
  blurb: string;
  /** What this role can do (FRD §17). */
  capabilities: string[];
  /** Where the user lands after sign-in. */
  home: string;
  color: string; // tailwind text/bg accent token
}

export const ROLE_META: Record<Role, RoleMeta> = {
  Administrator: {
    label: "Administrator",
    blurb: "Manage masters, users & configuration",
    capabilities: ["Manage masters", "Manage users", "Configure codes", "Full access"],
    home: "/",
    color: "primary",
  },
  Engineering: {
    label: "Engineering",
    blurb: "Create materials & BOMs, submit for review",
    capabilities: ["Create materials", "Build project BOMs", "Edit drafts", "Submit for review"],
    home: "/parts",
    color: "info",
  },
  Commercial: {
    label: "Commercial",
    blurb: "Review pricing & approve commercial stages",
    capabilities: ["Review pricing", "Commercial approval", "Quotation comparison", "Cost analysis"],
    home: "/bom-approvals",
    color: "warning",
  },
  Purchase: {
    label: "Purchase",
    blurb: "Generate RFQs, raise POs, manage vendors",
    capabilities: ["Generate RFQs", "Create POs", "Vendor master", "Track receipts"],
    home: "/procurement",
    color: "info",
  },
  Stores: {
    label: "Stores",
    blurb: "Receive goods & update inventory",
    capabilities: ["Receive goods", "Update inventory", "Batch & inspection", "Stock transfers"],
    home: "/inventory",
    color: "success",
  },
  Management: {
    label: "Management",
    blurb: "Dashboards, reports & analytics",
    capabilities: ["Executive dashboard", "Reports", "Analytics", "Cost trends"],
    home: "/analytics",
    color: "primary",
  },
  "Project Manager": {
    label: "Project Manager",
    blurb: "Coordinate assigned projects — stages, dates & purchase release",
    capabilities: ["Own-project visibility", "Release BOM for purchase", "Set line required-by dates", "Update project stage"],
    home: "/products",
    color: "success",
  },
};

export const ROLES: Role[] = ["Administrator", "Engineering", "Commercial", "Purchase", "Stores", "Management", "Project Manager"];

/** Validate a login. Returns the matched account or null. */
export function authenticate(email: string, password: string): DemoCredential | null {
  const e = email.trim().toLowerCase();
  return (
    CREDENTIALS.find((c) => c.email.toLowerCase() === e && c.password === password) ?? null
  );
}

export function credentialForRole(role: Role): DemoCredential {
  return CREDENTIALS.find((c) => c.role === role)!;
}
