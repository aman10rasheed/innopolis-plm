"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, type ZodTypeAny } from "zod";
import {
  Package,
  GitPullRequestArrow,
  ShoppingCart,
  Check,
  Loader2,
  ClipboardCheck,
  Building2,
  History,
  FileText,
  Factory,
  FileBarChart,
  Boxes,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Thumbnail } from "@/components/shared/thumbnail";
import { Section, Field } from "@/components/shared/form-fields";
import { toast } from "@/components/ui/toast";
import {
  db,
  addProduct,
  addEco,
  addPurchaseOrder,
  addProjectBom,
  addSupplier,
  addRevision,
  addDocument,
  addWarehouse,
} from "@/mock/db";
import { PROJECT_FAMILIES, COUNTRIES, MATERIAL_CATEGORIES } from "@/mock/pools";
import { useUIStore } from "@/stores/ui-store";
import { BOM_STAGES } from "@/types";
import type {
  Product,
  Eco,
  PurchaseOrder,
  Lifecycle,
  EcoType,
  EcoPriority,
  PoStatus,
  ProjectBom,
  Supplier,
  Revision,
  DocItem,
  DocType,
  PartCategory,
  Warehouse,
} from "@/types";

const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production"];
const REVS = ["A", "B", "C", "D"];
const ECO_TYPES: EcoType[] = ["Design Change", "Cost Reduction", "Supplier Change", "Quality", "Compliance", "Documentation"];
const PRIORITIES: EcoPriority[] = ["Low", "Medium", "High", "Critical"];
const PO_STATUSES: PoStatus[] = ["Draft", "Pending Approval", "Open"];
const BOM_TYPES: ProjectBom["bomType"][] = ["Engineering", "Procurement", "Final Released"];
const DOC_TYPES: DocType[] = ["Drawing", "Specification", "Datasheet", "CAD Model", "Test Report", "Certificate", "Work Instruction", "Image", "Contract"];
const VENDOR_TIERS = ["1", "2", "3"];
const PAYMENT_TERMS = ["30 days net", "45 days net", "60 days net", "Advance 30% / 70% on delivery", "LC at sight"];
const WO_STATIONS = ["Line A · CNC", "Line A · Mill", "Line B · Assembly", "Line B · Weld", "Line C · Paint", "Line C · Test"];
const REPORT_TYPES = ["Cost", "Quality", "Supply", "Inventory", "Compliance"];
const REPORT_SCHEDULES = ["On-demand", "Daily", "Weekly", "Monthly", "Quarterly"];
const COUNT_SCOPES = ["Full physical count", "Cycle count", "Spot check", "ABC count"];
const WAREHOUSE_TYPES: Warehouse["type"][] = ["Distribution", "Manufacturing", "Buffer", "Transit"];
const CATEGORY_NAMES = MATERIAL_CATEGORIES.map((c) => c.name);
const COUNTRY_NAMES = Array.from(new Set(COUNTRIES.map((c: { country: string }) => c.country)));

const rnd = (n: number) => Math.floor(Math.random() * n);
const todayISO = () => new Date().toISOString();
const dateInput = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
const hueFrom = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

/* -------------------------------------------------------------------------- */
/* Shared shell                                                               */
/* -------------------------------------------------------------------------- */

function CreateShell<TSchema extends ZodTypeAny>({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  hue,
  schema,
  defaultValues,
  destination,
  buildAndPersist,
  successLine,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  hue: number;
  schema: TSchema;
  defaultValues: DefaultValues<z.input<TSchema>>;
  destination: string;
  buildAndPersist: (values: z.output<TSchema>) => string; // returns success detail line
  successLine: string;
  children: (form: ReturnType<typeof useForm<z.input<TSchema>>>) => React.ReactNode;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<z.input<TSchema>>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  React.useEffect(() => {
    if (open) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit((values) => {
    setSubmitting(true);
    setTimeout(() => {
      const detail = buildAndPersist(values as z.output<TSchema>);
      setSubmitting(false);
      toast.success(successLine, detail);
      onOpenChange(false);
      router.push(destination);
    }, 550);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5">
          <Thumbnail hue={hue} size={44} icon={Icon} />
          <div className="flex-1">
            <DialogTitle className="text-base">{title}</DialogTitle>
            <DialogDescription className="text-[13px]">{description}</DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="max-h-[60vh] space-y-6 overflow-y-auto p-5">{children(form)}</div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-sunken/40 p-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {title.replace("Create New ", "Create ")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Sel({
  control,
  name,
  placeholder,
  options,
}: {
  control: any;
  name: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent className="max-h-64">
            {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Product                                                                     */
/* -------------------------------------------------------------------------- */

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  family: z.string().min(1, "Select a package type"),
  code: z.string().min(2),
  customer: z.string().min(2, "Customer is required"),
  lifecycle: z.string().min(1),
  version: z.string().min(1),
  revision: z.string().min(1),
  unitCost: z.coerce.number().min(0),
  targetCost: z.coerce.number().min(0),
  msrp: z.coerce.number().min(0),
  description: z.string().optional(),
});

export function CreateProductDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Project"
      description="Open a project from a customer enquiry. It starts at the Enquiry stage."
      icon={Package}
      hue={210}
      destination="/products"
      successLine="Project created"
      schema={productSchema}
      defaultValues={{
        name: "",
        family: "",
        code: `INP-2026-${1100 + rnd(899)}`,
        customer: "",
        lifecycle: "In Design",
        version: "1.0",
        revision: "A",
        unitCost: 1200000,
        targetCost: 1000000,
        msrp: 1800000,
        description: "",
      }}
      buildAndPersist={(v) => {
        const fam = PROJECT_FAMILIES.find((f: { family: string }) => f.family === v.family);
        const margin = v.msrp > 0 ? ((v.msrp - v.unitCost) / v.msrp) * 100 : 0;
        const p: Product = {
          id: `PR-new-${Date.now()}`,
          code: v.code,
          projectNumber: v.code,
          name: v.name,
          family: v.family,
          customer: v.customer,
          engineerId: db().users[0]!.id,
          stage: "Enquiry",
          category: fam?.category ?? "Bioprocess",
          description: v.description || `New ${v.family} project package.`,
          lifecycle: v.lifecycle as Lifecycle,
          revision: v.revision,
          version: v.version,
          unitCost: v.unitCost,
          targetCost: v.targetCost,
          msrp: v.msrp,
          marginPct: Math.round(margin * 10) / 10,
          unitsBuilt: 0,
          openEcos: 0,
          releaseDate: todayISO(),
          ownerId: db().users[0]!.id,
          thumbnailHue: hueFrom(v.name),
          health: 90,
        };
        addProduct(p);
        return `${p.code} · ${p.name}`;
      }}
    >
      {({ register, control, setValue, formState: { errors } }) => (
        <>
          <Section title="Project">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Project name" error={errors.name?.message as string} className="col-span-2">
                <Input placeholder="e.g. Fermentation Skid — Serum Institute" {...register("name")} />
              </Field>
              <Field label="Customer" error={errors.customer?.message as string}>
                <Input placeholder="e.g. Biocon Biologics" {...register("customer")} />
              </Field>
              <Field label="Package type" error={errors.family?.message as string}>
                <Controller control={control} name="family" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_FAMILIES.map((f: { family: string; category: string }) => <SelectItem key={f.family} value={f.family}>{f.family} · {f.category}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </Field>
              <Field label="Project number">
                <Input className="font-mono" {...register("code")} />
              </Field>
              <Field label="Lifecycle">
                <Sel control={control} name="lifecycle" options={LIFECYCLES.map((l) => ({ value: l, label: l }))} />
              </Field>
              <Field label="Version">
                <Input {...register("version")} />
              </Field>
              <Field label="Revision" className="col-span-2">
                <Sel control={control} name="revision" options={REVS.map((r) => ({ value: r, label: `Rev ${r}` }))} />
              </Field>
            </div>
          </Section>
          <Section title="Cost targets">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Unit cost" error={errors.unitCost?.message as string}>
                <Input type="number" {...register("unitCost")} />
              </Field>
              <Field label="Target cost">
                <Input type="number" {...register("targetCost")} />
              </Field>
              <Field label="MSRP">
                <Input type="number" {...register("msrp")} />
              </Field>
            </div>
          </Section>
          <Section title="Description">
            <Textarea rows={2} placeholder="Optional product summary" {...register("description")} />
          </Section>
        </>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Engineering Change                                                          */
/* -------------------------------------------------------------------------- */

const ecoSchema = z.object({
  title: z.string().min(4, "Title is required"),
  type: z.string().min(1),
  priority: z.string().min(1),
  productId: z.string().min(1, "Select a product"),
  affectedItems: z.coerce.number().int().min(1),
  costImpact: z.coerce.number(),
  dueDate: z.string().min(1),
  description: z.string().optional(),
});

export function CreateEcoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const products = React.useMemo(() => db().products, []);
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Change"
      description="Open an engineering change order. It starts in Draft."
      icon={GitPullRequestArrow}
      hue={150}
      destination="/changes"
      successLine="Engineering change opened"
      schema={ecoSchema}
      defaultValues={{
        title: "",
        type: "Design Change",
        priority: "Medium",
        productId: "",
        affectedItems: 1,
        costImpact: 0,
        dueDate: dateInput(30),
        description: "",
      }}
      buildAndPersist={(v) => {
        const e: Eco = {
          id: `E-new-${Date.now()}`,
          number: `ECO-${9000 + rnd(999)}`,
          title: v.title,
          description: v.description || "New engineering change pending review.",
          status: "Draft",
          priority: v.priority as EcoPriority,
          type: v.type as EcoType,
          ownerId: db().users[0]!.id,
          reviewerIds: [db().users[1]!.id, db().users[2]!.id],
          affectedItems: v.affectedItems,
          productId: v.productId,
          costImpact: v.costImpact,
          createdAt: todayISO(),
          dueDate: new Date(v.dueDate).toISOString(),
          progress: 0,
          commentsCount: 0,
          attachmentsCount: 0,
          approvalsNeeded: 2,
          approvalsReceived: 0,
        };
        addEco(e);
        return `${e.number} · ${e.title}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Change details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" error={errors.title?.message as string} className="col-span-2">
              <Input placeholder="e.g. Switch to dual-source bearing supplier" {...register("title")} />
            </Field>
            <Field label="Type">
              <Sel control={control} name="type" options={ECO_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Priority">
              <Sel control={control} name="priority" options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
            </Field>
            <Field label="Affected product" error={errors.productId?.message as string}>
              <Sel control={control} name="productId" placeholder="Select product"
                options={products.map((p) => ({ value: p.id, label: `${p.code} · ${p.family}` }))} />
            </Field>
            <Field label="Affected items">
              <Input type="number" min={1} {...register("affectedItems")} />
            </Field>
            <Field label="Cost impact (USD)" hint="negative = savings">
              <Input type="number" {...register("costImpact")} />
            </Field>
            <Field label="Due date">
              <Input type="date" {...register("dueDate")} />
            </Field>
            <Field label="Description" className="col-span-2">
              <Textarea rows={2} placeholder="Rationale and implementation plan" {...register("description")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Purchase Order                                                              */
/* -------------------------------------------------------------------------- */

const poSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  lineItems: z.coerce.number().int().min(1),
  totalValue: z.coerce.number().min(0),
  expectedDate: z.string().min(1),
  priority: z.string().min(1),
  status: z.string().min(1),
});

export function CreatePoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const suppliers = React.useMemo(() => db().suppliers, []);
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="Create New PO"
      description="Draft a purchase order to a supplier."
      icon={ShoppingCart}
      hue={38}
      destination="/procurement"
      successLine="Purchase order drafted"
      schema={poSchema}
      defaultValues={{
        supplierId: "",
        lineItems: 1,
        totalValue: 5000,
        expectedDate: dateInput(21),
        priority: "Medium",
        status: "Draft",
      }}
      buildAndPersist={(v) => {
        const supplier = db().suppliers.find((s) => s.id === v.supplierId)!;
        const po: PurchaseOrder = {
          id: `PO-new-${Date.now()}`,
          number: `PO-${90000 + rnd(9999)}`,
          supplierId: v.supplierId,
          supplierName: supplier.name,
          status: v.status as PoStatus,
          lineItems: v.lineItems,
          totalValue: v.totalValue,
          orderedDate: todayISO(),
          expectedDate: new Date(v.expectedDate).toISOString(),
          receivedPct: 0,
          ownerId: db().users[0]!.id,
          priority: v.priority as EcoPriority,
          onTimeRisk: "Low",
        };
        addPurchaseOrder(po);
        return `${po.number} · ${supplier.name}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Order details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Supplier" error={errors.supplierId?.message as string} className="col-span-2">
              <Sel control={control} name="supplierId" placeholder="Select supplier"
                options={suppliers.map((s) => ({ value: s.id, label: `${s.name} · ${s.country}` }))} />
            </Field>
            <Field label="Line items">
              <Input type="number" min={1} {...register("lineItems")} />
            </Field>
            <Field label="Total value (USD)">
              <Input type="number" {...register("totalValue")} />
            </Field>
            <Field label="Priority">
              <Sel control={control} name="priority" options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
            </Field>
            <Field label="Status">
              <Sel control={control} name="status" options={PO_STATUSES.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Expected delivery" className="col-span-2">
              <Input type="date" {...register("expectedDate")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* BOM (Draft BOM)                                                             */
/* -------------------------------------------------------------------------- */

const bomSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  bomType: z.string().min(1),
  revision: z.string().min(1),
  lineItems: z.coerce.number().int().min(1),
});

export function CreateBomDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const products = React.useMemo(() => db().products, []);
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="Draft BOM"
      description="Start a project BOM and route it through the approval workflow. It opens in Draft."
      icon={ClipboardCheck}
      hue={150}
      destination="/bom-approvals"
      successLine="BOM drafted"
      schema={bomSchema}
      defaultValues={{ projectId: "", bomType: "Engineering", revision: "A", lineItems: 40 }}
      buildAndPersist={(v) => {
        const product = db().products.find((p) => p.id === v.projectId)!;
        const me = db().users[0]!;
        const b: ProjectBom = {
          id: `PB-new-${Date.now()}`,
          number: `BOM-${7000 + rnd(999)}`,
          projectId: product.id,
          projectNumber: product.projectNumber,
          projectName: product.name,
          customer: product.customer,
          revision: v.revision,
          stage: "Draft",
          bomType: v.bomType as ProjectBom["bomType"],
          lineItems: v.lineItems,
          uniqueMaterials: Math.round(v.lineItems * 0.7),
          totalValue: product.unitCost,
          criticalItems: 0,
          longLeadItems: 0,
          ownerId: me.id,
          createdAt: todayISO(),
          updatedAt: todayISO(),
          audit: [{ stage: "Draft", userId: me.id, date: todayISO(), comment: "Draft prepared from project." }],
        };
        addProjectBom(b);
        return `${b.number} · ${product.name}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="BOM details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project" error={errors.projectId?.message as string} className="col-span-2">
              <Sel control={control} name="projectId" placeholder="Select project"
                options={products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }))} />
            </Field>
            <Field label="BOM type">
              <Sel control={control} name="bomType" options={BOM_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Revision">
              <Sel control={control} name="revision" options={REVS.map((r) => ({ value: r, label: `Rev ${r}` }))} />
            </Field>
            <Field label="Estimated line items" className="col-span-2">
              <Input type="number" min={1} {...register("lineItems")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Vendor                                                                      */
/* -------------------------------------------------------------------------- */

const vendorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  country: z.string().min(1),
  category: z.string().min(1, "Select a category"),
  tier: z.string().min(1),
  paymentTerms: z.string().min(1),
  contact: z.string().optional(),
  email: z.string().optional(),
});

export function CreateVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Vendor"
      description="Register a vendor in the master. New vendors start Under Review."
      icon={Building2}
      hue={262}
      destination="/suppliers"
      successLine="Vendor added"
      schema={vendorSchema}
      defaultValues={{ name: "", country: "India", category: CATEGORY_NAMES[0] ?? "", tier: "2", paymentTerms: PAYMENT_TERMS[0]!, contact: "", email: "" }}
      buildAndPersist={(v) => {
        const loc = COUNTRIES.find((c: { country: string; region: string }) => c.country === v.country);
        const code = v.name.split(" ").map((w) => w[0]).join("").slice(0, 4).toUpperCase();
        const s: Supplier = {
          id: `SUP-new-${Date.now()}`,
          name: v.name,
          code,
          country: v.country,
          region: loc?.region ?? "Domestic",
          category: v.category,
          tier: Number(v.tier) as 1 | 2 | 3,
          rating: 3.5,
          onTimePct: 85,
          qualityPct: 90,
          partsSupplied: 0,
          openPOs: 0,
          annualSpend: 0,
          leadTimeAvg: 30,
          riskScore: 30,
          status: "Under Review",
          contact: v.contact || db().users[0]!.name,
          email: v.email || `sales@${v.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.com`,
          gstVat: `VAT-${10000000 + rnd(89999999)}`,
          paymentTerms: v.paymentTerms,
          categoriesSupplied: [v.category],
          approved: false,
        };
        addSupplier(s);
        return `${s.name} · ${s.code}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Vendor details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vendor name" error={errors.name?.message as string} className="col-span-2">
              <Input placeholder="e.g. Alfa Process Systems" {...register("name")} />
            </Field>
            <Field label="Country">
              <Sel control={control} name="country" options={COUNTRY_NAMES.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Primary category" error={errors.category?.message as string}>
              <Sel control={control} name="category" placeholder="Select category"
                options={CATEGORY_NAMES.map((c: PartCategory) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Tier">
              <Sel control={control} name="tier" options={VENDOR_TIERS.map((t) => ({ value: t, label: `Tier ${t}` }))} />
            </Field>
            <Field label="Payment terms">
              <Sel control={control} name="paymentTerms" options={PAYMENT_TERMS.map((p) => ({ value: p, label: p }))} />
            </Field>
            <Field label="Contact name">
              <Input placeholder="Optional" {...register("contact")} />
            </Field>
            <Field label="Contact email">
              <Input placeholder="Optional" {...register("email")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Revision                                                                    */
/* -------------------------------------------------------------------------- */

const revisionSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  revision: z.string().min(1),
  status: z.string().min(1),
  changeSummary: z.string().min(3, "Describe the change"),
});

export function CreateRevisionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = React.useMemo(() => db().parts.slice(0, 200), []);
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="New Revision"
      description="Open a working revision against a material or item."
      icon={History}
      hue={200}
      destination="/revisions"
      successLine="Revision created"
      schema={revisionSchema}
      defaultValues={{ itemId: "", revision: "B", status: "Working", changeSummary: "" }}
      buildAndPersist={(v) => {
        const part = db().parts.find((p) => p.id === v.itemId)!;
        const r: Revision = {
          id: `REV-new-${Date.now()}`,
          itemId: part.id,
          itemPartNumber: part.partNumber,
          itemName: part.name,
          revision: v.revision,
          status: v.status as Revision["status"],
          authorId: db().users[0]!.id,
          date: todayISO(),
          changeSummary: v.changeSummary,
          changedFields: 1,
          added: 0,
          removed: 0,
          modified: 1,
        };
        addRevision(r);
        return `${r.itemPartNumber} · Rev ${r.revision}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Revision details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Item" error={errors.itemId?.message as string} className="col-span-2">
              <Sel control={control} name="itemId" placeholder="Select material"
                options={items.map((p) => ({ value: p.id, label: `${p.partNumber} · ${p.name}` }))} />
            </Field>
            <Field label="New revision">
              <Sel control={control} name="revision" options={["A", "B", "C", "D", "E", "F"].map((r) => ({ value: r, label: `Rev ${r}` }))} />
            </Field>
            <Field label="Status">
              <Sel control={control} name="status" options={["Working", "In Review", "Released"].map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Change summary" error={errors.changeSummary?.message as string} className="col-span-2">
              <Textarea rows={2} placeholder="What changed and why" {...register("changeSummary")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Document                                                                    */
/* -------------------------------------------------------------------------- */

const DOC_FORMAT: Record<DocType, string> = {
  Drawing: "PDF", Specification: "DOCX", Datasheet: "PDF", "CAD Model": "DWG", "Test Report": "PDF",
  Certificate: "PDF", "Work Instruction": "PDF", Image: "PNG", Contract: "PDF",
};

const documentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.string().min(1),
  folder: z.string().min(1),
  version: z.string().min(1),
  status: z.string().min(1),
});

export function CreateDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const folders = React.useMemo(
    () => Array.from(new Set(db().documents.map((d) => d.folder))),
    [],
  );
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Document"
      description="Add a document to the vault and link it to the right folder."
      icon={FileText}
      hue={28}
      destination="/documents"
      successLine="Document uploaded"
      schema={documentSchema}
      defaultValues={{ name: "", type: "Drawing", folder: folders[0] ?? "Engineering / Drawings", version: "1.0", status: "Draft" }}
      buildAndPersist={(v) => {
        const type = v.type as DocType;
        const doc: DocItem = {
          id: `D-new-${Date.now()}`,
          name: v.name,
          type,
          format: DOC_FORMAT[type],
          sizeKb: 200 + rnd(8000),
          folder: v.folder,
          version: v.version,
          ownerId: db().users[0]!.id,
          updatedAt: todayISO(),
          tags: [],
          favorite: false,
          status: v.status as DocItem["status"],
        };
        addDocument(doc);
        return `${doc.name}.${doc.format.toLowerCase()}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Document details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Document name" error={errors.name?.message as string} className="col-span-2">
              <Input placeholder="e.g. P-101 GA Drawing Rev B" {...register("name")} />
            </Field>
            <Field label="Type">
              <Sel control={control} name="type" options={DOC_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Version">
              <Input {...register("version")} />
            </Field>
            <Field label="Folder" className="col-span-2">
              <Sel control={control} name="folder" options={folders.map((f) => ({ value: f, label: f }))} />
            </Field>
            <Field label="Status" className="col-span-2">
              <Sel control={control} name="status" options={["Draft", "In Review", "Approved"].map((s) => ({ value: s, label: s }))} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Work Order                                                                  */
/* -------------------------------------------------------------------------- */

const workOrderSchema = z.object({
  sourceId: z.string().min(1, "Select what to build"),
  quantity: z.coerce.number().int().min(1),
  station: z.string().min(1),
  priority: z.string().min(1),
  dueDate: z.string().min(1),
});

export function CreateWorkOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const products = React.useMemo(() => db().products, []);
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="New Work Order"
      description="Release a build to the shop floor."
      icon={Factory}
      hue={12}
      destination="/manufacturing"
      successLine="Work order released"
      schema={workOrderSchema}
      defaultValues={{ sourceId: "", quantity: 10, station: WO_STATIONS[0]!, priority: "Medium", dueDate: dateInput(14) }}
      buildAndPersist={(v) => {
        const product = db().products.find((p) => p.id === v.sourceId)!;
        return `${v.quantity} × ${product.name} → ${v.station}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Work order">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Build" error={errors.sourceId?.message as string} className="col-span-2">
              <Sel control={control} name="sourceId" placeholder="Select project"
                options={products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }))} />
            </Field>
            <Field label="Quantity">
              <Input type="number" min={1} {...register("quantity")} />
            </Field>
            <Field label="Station">
              <Sel control={control} name="station" options={WO_STATIONS.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Priority">
              <Sel control={control} name="priority" options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
            </Field>
            <Field label="Due date">
              <Input type="date" {...register("dueDate")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Report                                                                      */
/* -------------------------------------------------------------------------- */

const reportSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.string().min(1),
  schedule: z.string().min(1),
});

export function CreateReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="New Report"
      description="Build a report from a template and optionally schedule it."
      icon={FileBarChart}
      hue={320}
      destination="/reports"
      successLine="Report created"
      schema={reportSchema}
      defaultValues={{ name: "", type: "Cost", schedule: "On-demand" }}
      buildAndPersist={(v) => `${v.name} · ${v.type} · ${v.schedule}`}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Report setup">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Report name" error={errors.name?.message as string} className="col-span-2">
              <Input placeholder="e.g. Q3 Cost Variance by Family" {...register("name")} />
            </Field>
            <Field label="Type">
              <Sel control={control} name="type" options={REPORT_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Schedule">
              <Sel control={control} name="schedule" options={REPORT_SCHEDULES.map((s) => ({ value: s, label: s }))} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Inventory count                                                            */
/* -------------------------------------------------------------------------- */

const countSchema = z.object({
  warehouseId: z.string().min(1, "Select a warehouse"),
  scope: z.string().min(1),
  scheduledDate: z.string().min(1),
});

export function CreateCountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const warehouses = React.useMemo(() => db().warehouses, []);
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="New Count"
      description="Schedule a stock count for reconciliation."
      icon={Boxes}
      hue={172}
      destination="/inventory"
      successLine="Count scheduled"
      schema={countSchema}
      defaultValues={{ warehouseId: "", scope: COUNT_SCOPES[1]!, scheduledDate: dateInput(2) }}
      buildAndPersist={(v) => {
        const wh = db().warehouses.find((w) => w.id === v.warehouseId)!;
        return `${v.scope} · ${wh.code}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Count details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Warehouse" error={errors.warehouseId?.message as string} className="col-span-2">
              <Sel control={control} name="warehouseId" placeholder="Select warehouse"
                options={warehouses.map((w) => ({ value: w.id, label: `${w.code} · ${w.name}` }))} />
            </Field>
            <Field label="Scope">
              <Sel control={control} name="scope" options={COUNT_SCOPES.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Scheduled date">
              <Input type="date" {...register("scheduledDate")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Warehouse                                                                   */
/* -------------------------------------------------------------------------- */

const warehouseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(1),
  type: z.string().min(1),
  capacityPct: z.coerce.number().int().min(0).max(100),
});

export function CreateWarehouseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <CreateShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Warehouse"
      description="Register a stocking location in the network."
      icon={WarehouseIcon}
      hue={142}
      destination="/inventory"
      successLine="Warehouse added"
      schema={warehouseSchema}
      defaultValues={{ name: "", code: `WH-${100 + rnd(899)}`, city: "", country: "India", type: "Distribution", capacityPct: 50 }}
      buildAndPersist={(v) => {
        const w: Warehouse = {
          id: `WH-new-${Date.now()}`,
          code: v.code,
          name: v.name,
          city: v.city,
          country: v.country,
          type: v.type as Warehouse["type"],
          capacityPct: v.capacityPct,
          skuCount: 0,
          stockValue: 0,
          lowStockItems: 0,
          lat: 0,
          lng: 0,
        };
        addWarehouse(w);
        return `${w.code} · ${w.name}`;
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Section title="Warehouse details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Warehouse name" error={errors.name?.message as string} className="col-span-2">
              <Input placeholder="e.g. Pune Distribution Hub" {...register("name")} />
            </Field>
            <Field label="Code" error={errors.code?.message as string}>
              <Input className="font-mono" {...register("code")} />
            </Field>
            <Field label="Type">
              <Sel control={control} name="type" options={WAREHOUSE_TYPES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="City" error={errors.city?.message as string}>
              <Input placeholder="e.g. Pune" {...register("city")} />
            </Field>
            <Field label="Country">
              <Sel control={control} name="country" options={COUNTRY_NAMES.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Initial capacity %" className="col-span-2">
              <Input type="number" min={0} max={100} {...register("capacityPct")} />
            </Field>
          </div>
        </Section>
      )}
    </CreateShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Mount-all host                                                              */
/* -------------------------------------------------------------------------- */

export function CreateDialogsHost() {
  const createProductOpen = useUIStore((s) => s.createProductOpen);
  const setCreateProductOpen = useUIStore((s) => s.setCreateProductOpen);
  const createEcoOpen = useUIStore((s) => s.createEcoOpen);
  const setCreateEcoOpen = useUIStore((s) => s.setCreateEcoOpen);
  const createPoOpen = useUIStore((s) => s.createPoOpen);
  const setCreatePoOpen = useUIStore((s) => s.setCreatePoOpen);
  const createBomOpen = useUIStore((s) => s.createBomOpen);
  const setCreateBomOpen = useUIStore((s) => s.setCreateBomOpen);
  const createVendorOpen = useUIStore((s) => s.createVendorOpen);
  const setCreateVendorOpen = useUIStore((s) => s.setCreateVendorOpen);
  const createRevisionOpen = useUIStore((s) => s.createRevisionOpen);
  const setCreateRevisionOpen = useUIStore((s) => s.setCreateRevisionOpen);
  const createDocumentOpen = useUIStore((s) => s.createDocumentOpen);
  const setCreateDocumentOpen = useUIStore((s) => s.setCreateDocumentOpen);
  const createWorkOrderOpen = useUIStore((s) => s.createWorkOrderOpen);
  const setCreateWorkOrderOpen = useUIStore((s) => s.setCreateWorkOrderOpen);
  const createReportOpen = useUIStore((s) => s.createReportOpen);
  const setCreateReportOpen = useUIStore((s) => s.setCreateReportOpen);
  const createCountOpen = useUIStore((s) => s.createCountOpen);
  const setCreateCountOpen = useUIStore((s) => s.setCreateCountOpen);
  const createWarehouseOpen = useUIStore((s) => s.createWarehouseOpen);
  const setCreateWarehouseOpen = useUIStore((s) => s.setCreateWarehouseOpen);
  return (
    <>
      <CreateProductDialog open={createProductOpen} onOpenChange={setCreateProductOpen} />
      <CreateEcoDialog open={createEcoOpen} onOpenChange={setCreateEcoOpen} />
      <CreatePoDialog open={createPoOpen} onOpenChange={setCreatePoOpen} />
      <CreateBomDialog open={createBomOpen} onOpenChange={setCreateBomOpen} />
      <CreateVendorDialog open={createVendorOpen} onOpenChange={setCreateVendorOpen} />
      <CreateRevisionDialog open={createRevisionOpen} onOpenChange={setCreateRevisionOpen} />
      <CreateDocumentDialog open={createDocumentOpen} onOpenChange={setCreateDocumentOpen} />
      <CreateWorkOrderDialog open={createWorkOrderOpen} onOpenChange={setCreateWorkOrderOpen} />
      <CreateReportDialog open={createReportOpen} onOpenChange={setCreateReportOpen} />
      <CreateCountDialog open={createCountOpen} onOpenChange={setCreateCountOpen} />
      <CreateWarehouseDialog open={createWarehouseOpen} onOpenChange={setCreateWarehouseOpen} />
    </>
  );
}
