"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, type ZodTypeAny } from "zod";
import {
  useSaveVendor,
  useCreateProject,
  useCreatePo,
  useCreateBom,
  useSaveWarehouse,
  useVendors,
  useProjects,
  useParts,
  useWarehouses,
} from "@/lib/api";
import {
  Package,
  ShoppingCart,
  Check,
  Loader2,
  ClipboardCheck,
  Building2,
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
import { PROJECT_FAMILIES, COUNTRIES, MATERIAL_CATEGORIES } from "@/mock/pools";
import { useUIStore } from "@/stores/ui-store";
import { BOM_STAGES } from "@/types";
import type {
  Lifecycle,
  EcoPriority,
  PoStatus,
  ProjectBom,
  PartCategory,
  Warehouse,
} from "@/types";

const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production"];
const REVS = ["A", "B", "C", "D"];
const PRIORITIES: EcoPriority[] = ["Low", "Medium", "High", "Critical"];
const PO_STATUSES: PoStatus[] = ["Draft", "Pending Approval", "Open"];
const BOM_TYPES: ProjectBom["bomType"][] = ["Engineering", "Procurement", "Final Released"];
const VENDOR_TIERS = ["1", "2", "3"];
const PAYMENT_TERMS = ["30 days net", "45 days net", "60 days net", "Advance 30% / 70% on delivery", "LC at sight"];
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
  buildAndPersist: (values: z.output<TSchema>) => string | Promise<string>; // success detail line
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

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const detail = await buildAndPersist(values as z.output<TSchema>);
      toast.success(successLine, detail);
      onOpenChange(false);
      router.push(destination);
    } catch (e) {
      toast.error("Couldn't save", e instanceof Error ? e.message : "Please try again");
    } finally {
      setSubmitting(false);
    }
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
  const createProject = useCreateProject();
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
      buildAndPersist={async (v) => {
        await createProject.mutateAsync({
          name: v.name,
          customer: v.customer,
          family: v.family,
          target_cost: v.targetCost,
        });
        return `${v.code} · ${v.name}`;
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
  const createPo = useCreatePo();
  const suppliers = useVendors().data?.items ?? [];
  const parts = useParts().data?.items ?? [];
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
      buildAndPersist={async (v) => {
        const supplier = suppliers.find((s) => s.id === v.supplierId);
        const partId = parts[0]?.id;
        const unitPrice = v.lineItems > 0 ? v.totalValue / v.lineItems : v.totalValue;
        await createPo.mutateAsync({
          supplier_id: v.supplierId,
          priority: v.priority,
          lines: partId
            ? [{ part_id: partId, quantity: v.lineItems, unit_price: unitPrice }]
            : [],
        });
        return `${supplier?.name ?? v.supplierId}`;
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
  const createBom = useCreateBom();
  const products = useProjects().data?.items ?? [];
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
      buildAndPersist={async (v) => {
        const product = products.find((p) => p.id === v.projectId);
        await createBom.mutateAsync({
          project_id: v.projectId,
          bom_type: v.bomType,
        });
        return `${product?.name ?? v.projectId}`;
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
  const saveVendor = useSaveVendor();
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
      buildAndPersist={async (v) => {
        const loc = COUNTRIES.find((c: { country: string; region: string }) => c.country === v.country);
        const code = `V-${v.name.split(" ").map((w) => w[0]).join("").slice(0, 4).toUpperCase()}`;
        await saveVendor.mutateAsync({
          body: {
            code,
            name: v.name,
            country: v.country,
            region: loc?.region ?? "Domestic",
            category: v.category,
            categories_supplied: [v.category],
            tier: Number(v.tier),
            contact: v.contact || undefined,
            email: v.email || undefined,
            payment_terms: v.paymentTerms,
            status: "Under Review",
            approved: false,
          },
        });
        return `${v.name} · ${code}`;
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
/* Work Order                                                                  */
/* -------------------------------------------------------------------------- */

const workOrderSchema = z.object({
  sourceId: z.string().min(1, "Select what to build"),
  quantity: z.coerce.number().int().min(1),
  station: z.string().min(1),
  priority: z.string().min(1),
  dueDate: z.string().min(1),
});

/* -------------------------------------------------------------------------- */
/* Report                                                                      */
/* -------------------------------------------------------------------------- */

const reportSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.string().min(1),
  schedule: z.string().min(1),
});

// no backend endpoint — mock retained
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

// scheduling only — the backend has no stock-count endpoint yet
export function CreateCountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const warehouses = useWarehouses().data ?? [];
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
        const wh = warehouses.find((w) => w.id === v.warehouseId);
        return `${v.scope} · ${wh?.code ?? "warehouse"}`;
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
  const saveWarehouse = useSaveWarehouse();
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
      buildAndPersist={async (v) => {
        await saveWarehouse.mutateAsync({
          body: {
            code: v.code,
            name: v.name,
            type: v.type,
            city: v.city,
            country: v.country,
            capacity_pct: v.capacityPct,
          },
        });
        return `${v.code} · ${v.name}`;
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
  const createPoOpen = useUIStore((s) => s.createPoOpen);
  const setCreatePoOpen = useUIStore((s) => s.setCreatePoOpen);
  const createBomOpen = useUIStore((s) => s.createBomOpen);
  const setCreateBomOpen = useUIStore((s) => s.setCreateBomOpen);
  const createVendorOpen = useUIStore((s) => s.createVendorOpen);
  const setCreateVendorOpen = useUIStore((s) => s.setCreateVendorOpen);
  const createReportOpen = useUIStore((s) => s.createReportOpen);
  const setCreateReportOpen = useUIStore((s) => s.setCreateReportOpen);
  const createCountOpen = useUIStore((s) => s.createCountOpen);
  const setCreateCountOpen = useUIStore((s) => s.setCreateCountOpen);
  const createWarehouseOpen = useUIStore((s) => s.createWarehouseOpen);
  const setCreateWarehouseOpen = useUIStore((s) => s.setCreateWarehouseOpen);
  return (
    <>
      <CreateProductDialog open={createProductOpen} onOpenChange={setCreateProductOpen} />
      <CreatePoDialog open={createPoOpen} onOpenChange={setCreatePoOpen} />
      <CreateBomDialog open={createBomOpen} onOpenChange={setCreateBomOpen} />
      <CreateVendorDialog open={createVendorOpen} onOpenChange={setCreateVendorOpen} />
      <CreateReportDialog open={createReportOpen} onOpenChange={setCreateReportOpen} />
      <CreateCountDialog open={createCountOpen} onOpenChange={setCreateCountOpen} />
      <CreateWarehouseDialog open={createWarehouseOpen} onOpenChange={setCreateWarehouseOpen} />
    </>
  );
}
