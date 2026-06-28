import type {
  Lifecycle,
  Availability,
  EcoStatus,
  EcoPriority,
  PoStatus,
  BomStage,
  RfqStatus,
  QuotationStatus,
  ProjectStage,
} from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

type Variant = BadgeProps["variant"];

export const LIFECYCLE_VARIANT: Record<Lifecycle, Variant> = {
  Concept: "muted",
  "In Design": "info",
  "In Review": "warning",
  Released: "success",
  Production: "success",
  Obsolete: "destructive",
};

export const LIFECYCLE_DOT: Record<Lifecycle, string> = {
  Concept: "bg-muted-foreground",
  "In Design": "bg-info",
  "In Review": "bg-warning",
  Released: "bg-success",
  Production: "bg-success",
  Obsolete: "bg-destructive",
};

export const AVAILABILITY_VARIANT: Record<Availability, Variant> = {
  "In Stock": "success",
  "Low Stock": "warning",
  Backorder: "warning",
  "Out of Stock": "destructive",
};

export const ECO_STATUS_VARIANT: Record<EcoStatus, Variant> = {
  Draft: "muted",
  Review: "warning",
  Approved: "info",
  Released: "default",
  Completed: "success",
};

export const ECO_STATUS_COLOR: Record<EcoStatus, string> = {
  Draft: "bg-muted-foreground",
  Review: "bg-warning",
  Approved: "bg-info",
  Released: "bg-primary",
  Completed: "bg-success",
};

export const PRIORITY_VARIANT: Record<EcoPriority, Variant> = {
  Low: "muted",
  Medium: "info",
  High: "warning",
  Critical: "destructive",
};

export const PO_STATUS_VARIANT: Record<PoStatus, Variant> = {
  Draft: "muted",
  "Pending Approval": "warning",
  Open: "info",
  "Partially Received": "warning",
  Received: "success",
  Closed: "muted",
  Cancelled: "destructive",
};

export const BOM_STAGE_VARIANT: Record<BomStage, Variant> = {
  Draft: "muted",
  "Technical Review": "info",
  "Commercial Review": "warning",
  Approved: "default",
  "Released for Purchase": "success",
};

export const BOM_STAGE_COLOR: Record<BomStage, string> = {
  Draft: "bg-muted-foreground",
  "Technical Review": "bg-info",
  "Commercial Review": "bg-warning",
  Approved: "bg-primary",
  "Released for Purchase": "bg-success",
};

export const RFQ_STATUS_VARIANT: Record<RfqStatus, Variant> = {
  Draft: "muted",
  Sent: "info",
  "Quotes In": "warning",
  Comparison: "warning",
  Awarded: "success",
  Closed: "muted",
};

export const QUOTATION_STATUS_VARIANT: Record<QuotationStatus, Variant> = {
  Pending: "muted",
  Received: "info",
  "Under Review": "warning",
  Awarded: "success",
  Rejected: "destructive",
};

/** Project lifecycle stage → tone for the pipeline view. */
export const PROJECT_STAGE_VARIANT: Record<ProjectStage, Variant> = {
  Enquiry: "muted",
  "Technical Evaluation": "info",
  Quotation: "info",
  "Project Order": "default",
  "Detailed Engineering": "warning",
  "Final BOM": "warning",
  "Purchase Release": "default",
  Procurement: "info",
  Fulfilment: "success",
  Completed: "success",
};

/** Deterministic HSL color for category chips / avatars. */
export function hueColor(hue: number, sat = 65, light = 55) {
  return `hsl(${hue} ${sat}% ${light}%)`;
}
