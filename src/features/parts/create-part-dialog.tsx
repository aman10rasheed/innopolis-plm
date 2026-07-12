"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Boxes, Sparkles, Check, ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { FINISHES, COMPLIANCE_POOL } from "@/mock/pools";
import { useMaterialMasters, useSubtypes, useCreatePart, useResourceSpecs } from "@/lib/api";
import type { ApiPartInput } from "@/lib/api";
import type { Supplier, Lifecycle, SourcingType, ComplianceFlag } from "@/types";

/** Chip-toggle multi-select (same idiom as the compliance flags). */
export function ChipMultiSelect({
  options,
  selected,
  onToggle,
  emptyText,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyText: string;
}) {
  if (options.length === 0) {
    return <p className="py-1 text-2xs text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
              on ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {on && <Check className="size-3" />} {o.label}
          </button>
        );
      })}
    </div>
  );
}

const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production"];
const SOURCING: SourcingType[] = ["Make", "Buy", "Standard"];
const MAKES = ["Inox", "L&T", "KSB", "Grundfos", "Endress+Hauser", "Emerson", "Siemens", "ABB", "Alfa Laval"];

const schema = z.object({
  categoryId: z.string().min(1, "Select a type"),
  subtypeId: z.string().min(1, "Select a subtype"),
  majorSpecId: z.string().min(1),
  gradeId: z.string().min(1),
  name: z.string().min(2, "Description is required"),
  remarks: z.string().optional(),
  material: z.string().min(1),
  finish: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  drawingRef: z.string().optional(),
  revision: z.string().min(1),
  lifecycle: z.string().min(1),
  sourcing: z.string().min(1),
  unitCost: z.coerce.number().min(0),
  lastPurchasePrice: z.coerce.number().min(0),
  leadTimeDays: z.coerce.number().int().min(0),
  uom: z.string().min(1),
  reorderPoint: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  maxStock: z.coerce.number().int().min(0),
  stockLocation: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

/** The signature live code-builder display. */
function CodeBuilder({ type, sub, major, detail }: { type: string; sub: string; major: string; detail: string }) {
  const segs = [
    { v: type || "TT", label: "Type" },
    { v: sub || "SS", label: "Subtype" },
    { v: major || "MM", label: "Major Spec" },
    { v: detail || "DDDD", label: "Detail Spec" },
  ];
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-wider text-primary">Material Code</span>
        <span className="font-mono text-2xs text-muted-foreground">TT-SS-MM-DDDD · server-generated</span>
      </div>
      <div className="flex items-center gap-1.5">
        {segs.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="font-mono text-lg text-muted-foreground/50">-</span>}
            <div className="flex flex-1 flex-col items-center">
              <span className={cn("w-full rounded-md border px-2 py-1.5 text-center font-mono text-base font-semibold tabular", s.v.length > 2 || /[A-Z]{2}/.test(s.v) ? "border-primary/40 bg-surface text-foreground" : "border-dashed border-border text-muted-foreground")}>
                {s.v}
              </span>
              <span className="mt-1 text-2xs text-muted-foreground">{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function CreatePartDialog({
  open,
  onOpenChange,
  vendors,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendors: Supplier[];
  onCreated?: () => void;
}) {
  const mastersQuery = useMaterialMasters();
  const createPart = useCreatePart();
  const resourceSpecsQuery = useResourceSpecs();
  const resourceSpecs = resourceSpecsQuery.data ?? [];

  const categories = mastersQuery.data?.categories ?? [];
  const majorSpecs = mastersQuery.data?.majorSpecs ?? [];
  const grades = mastersQuery.data?.grades ?? [];

  const [compliance, setCompliance] = React.useState<ComplianceFlag[]>(["ASME", "3.1 Cert"] as ComplianceFlag[]);
  // Many-to-many selections (chips): preferred vendors + resource specs.
  const [vendorIds, setVendorIds] = React.useState<string[]>([]);
  const [resourceSpecIds, setResourceSpecIds] = React.useState<string[]>([]);
  const toggleIn = (set: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const defaults: FormValues = {
    categoryId: "", subtypeId: "", majorSpecId: "", gradeId: "",
    name: "", remarks: "", material: "SS 304", finish: "Pickled & Passivated",
    make: "", model: "", drawingRef: "", revision: "A", lifecycle: "In Design", sourcing: "Buy",
    unitCost: 0, lastPurchasePrice: 0, leadTimeDays: 14, uom: "Nos",
    reorderPoint: 50, minStock: 50, maxStock: 300, stockLocation: "",
  };

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const categoryId = watch("categoryId");
  const subtypeId = watch("subtypeId");
  const majorSpecId = watch("majorSpecId");
  const gradeId = watch("gradeId");

  const subtypesQuery = useSubtypes(categoryId || undefined);
  const subtypes = subtypesQuery.data ?? [];

  const category = categories.find((c) => c.id === categoryId);
  const subtype = subtypes.find((s) => s.id === subtypeId);
  const majorSpec = majorSpecs.find((m) => m.id === majorSpecId);
  const grade = grades.find((g) => g.id === gradeId);

  const typeCode = category?.type_code ?? "";

  // auto-derive name, material, uom from the chosen master selections
  React.useEffect(() => {
    if (subtype && grade) {
      const size = majorSpec && majorSpec.code !== "00" ? ` ${majorSpec.label}` : "";
      setValue("name", `${grade.label} ${subtype.name}${size}`.trim());
      setValue("material", grade.label);
    }
    if (category?.default_uom) setValue("uom", category.default_uom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtypeId, majorSpecId, gradeId, categoryId]);

  React.useEffect(() => {
    if (open) {
      reset(defaults);
      setCompliance(["ASME", "3.1 Cert"] as ComplianceFlag[]);
      setVendorIds([]);
      setResourceSpecIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hue = React.useMemo(() => (typeCode || "MB").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360, [typeCode]);

  const submit = (another: boolean) =>
    handleSubmit(async (v) => {
      const body: ApiPartInput = {
        category_id: v.categoryId,
        subtype_id: v.subtypeId,
        major_spec_id: v.majorSpecId || undefined,
        grade_id: v.gradeId || undefined,
        name: v.name,
        remarks: v.remarks || `${v.material} ${v.name.toLowerCase()}.`,
        material: v.material,
        finish: v.finish,
        revision: v.revision,
        lifecycle: v.lifecycle as Lifecycle,
        sourcing: v.sourcing as SourcingType,
        unit_cost: Number(v.unitCost),
        last_purchase_price: Number(v.lastPurchasePrice) || Number(v.unitCost),
        lead_time_days: Number(v.leadTimeDays),
        vendor_ids: vendorIds,
        resource_spec_ids: resourceSpecIds,
        make: v.make || undefined,
        model: v.model || undefined,
        drawing_ref: v.drawingRef || undefined,
        reorder_point: Number(v.reorderPoint),
        min_stock: Number(v.minStock),
        max_stock: Number(v.maxStock),
        stock_location: v.stockLocation || undefined,
        uom: v.uom,
        compliance,
        tags: [],
        thumbnail_hue: hue,
      };
      try {
        const created = await createPart.mutateAsync(body);
        toast.success("Material created", `${created.part_number} · ${created.name}`);
        onCreated?.();
        if (another) { reset(defaults); setCompliance(["ASME", "3.1 Cert"] as ComplianceFlag[]); }
        else onOpenChange(false);
      } catch (e) {
        toast.error("Could not create material", e instanceof Error ? e.message : "Check the fields and try again");
      }
    });

  const submitting = createPart.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5">
          <Thumbnail hue={hue} size={44} icon={Boxes} />
          <div className="flex-1">
            <DialogTitle className="text-base">Create Material Master Record</DialogTitle>
            <DialogDescription className="text-[13px]">
              Each material exists once. The intelligent code is generated by the server from your selections.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form>
          <div className="max-h-[62vh] space-y-6 overflow-y-auto p-5">
            {/* Code builder */}
            <Section title="Intelligent Code">
              <div className="grid grid-cols-4 gap-3">
                <Field label="Type (TT)" error={errors.categoryId?.message as string} className="col-span-1">
                  <Controller control={control} name="categoryId" render={({ field }) => (
                    <Select value={field.value} onValueChange={(val) => { field.onChange(val); setValue("subtypeId", ""); }} disabled={mastersQuery.isLoading}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="font-mono text-2xs text-primary">{c.type_code}</span> {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Subtype (SS)" error={errors.subtypeId?.message as string}>
                  <Controller control={control} name="subtypeId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!categoryId || subtypesQuery.isLoading}>
                      <SelectTrigger><SelectValue placeholder="Subtype" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {subtypes.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-mono text-2xs text-primary">{s.code}</span> {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Major (MM)" error={errors.majorSpecId?.message as string}>
                  <Controller control={control} name="majorSpecId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={mastersQuery.isLoading}>
                      <SelectTrigger><SelectValue placeholder="Spec" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {majorSpecs.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="font-mono text-2xs text-primary">{m.code}</span> {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Detail (DDDD)" error={errors.gradeId?.message as string}>
                  <Controller control={control} name="gradeId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={mastersQuery.isLoading}>
                      <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {grades.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            <span className="font-mono text-2xs text-primary">{g.code}</span> {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
              </div>
              <div className="mt-3">
                <CodeBuilder type={typeCode} sub={subtype?.code ?? ""} major={majorSpec?.code ?? ""} detail={grade?.code ?? ""} />
              </div>
            </Section>

            {/* Basic */}
            <Section title="Basic Information">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Material name" error={errors.name?.message as string} className="col-span-2">
                  <Input placeholder="auto-generated from code" {...register("name")} />
                </Field>
                <Field label="Remarks" className="col-span-2">
                  <Textarea rows={2} placeholder="Optional specification remarks" {...register("remarks")} />
                </Field>
              </div>
            </Section>

            {/* Resource specs (predefined master, many-to-many) */}
            <Section title="Resource Specifications">
              <ChipMultiSelect
                options={resourceSpecs.filter((r) => r.isActive).map((r) => ({ id: r.id, label: `${r.code} · ${r.name}` }))}
                selected={resourceSpecIds}
                onToggle={toggleIn(setResourceSpecIds)}
                emptyText={resourceSpecsQuery.isLoading ? "Loading resource specs…" : "No resource specs defined — an Administrator can add them."}
              />
            </Section>

            {/* Technical */}
            <Section title="Technical Information">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Material grade"><Input {...register("material")} /></Field>
                <Field label="Finish">
                  <Controller control={control} name="finish" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-64">{FINISHES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Make">
                  <Controller control={control} name="make" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Manufacturer" /></SelectTrigger>
                      <SelectContent className="max-h-64">{MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Model"><Input className="font-mono" {...register("model")} /></Field>
                <Field label="Drawing reference"><Input className="font-mono" placeholder="auto" {...register("drawingRef")} /></Field>
                <Field label="Lifecycle">
                  <Controller control={control} name="lifecycle" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LIFECYCLES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
              </div>
            </Section>

            {/* Commercial */}
            <Section title="Commercial Information">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Preferred vendors (multiple allowed)" className="col-span-2">
                  <ChipMultiSelect
                    options={vendors.map((s) => ({ id: s.id, label: `${s.name} · ${s.country}` }))}
                    selected={vendorIds}
                    onToggle={toggleIn(setVendorIds)}
                    emptyText="No vendors registered yet — add them under Vendors."
                  />
                </Field>
                <Field label="Standard cost (₹)">
                  <Input type="number" {...register("unitCost")} />
                </Field>
                <Field label="Opening purchase price (₹) — auto-updates on receipts">
                  <Input type="number" {...register("lastPurchasePrice")} />
                </Field>
                <Field label="Lead time (days)"><Input type="number" {...register("leadTimeDays")} /></Field>
                <Field label="Sourcing">
                  <Controller control={control} name="sourcing" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SOURCING.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
              </div>
            </Section>

            {/* Inventory */}
            <Section title="Inventory Information">
              <div className="grid grid-cols-4 gap-4">
                <Field label="UoM"><Input {...register("uom")} /></Field>
                <Field label="Min stock"><Input type="number" {...register("minStock")} /></Field>
                <Field label="Max stock"><Input type="number" {...register("maxStock")} /></Field>
                <Field label="Reorder point"><Input type="number" {...register("reorderPoint")} /></Field>
                <Field label="Stock location" className="col-span-4"><Input placeholder="e.g. WH-A · Rack 01" {...register("stockLocation")} /></Field>
              </div>
            </Section>

            {/* Compliance */}
            <Section title="Compliance & Certification">
              <Label className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Certification flags
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {COMPLIANCE_POOL.map((c) => {
                  const on = compliance.includes(c as ComplianceFlag);
                  return (
                    <button key={c} type="button"
                      onClick={() => setCompliance((p) => (on ? p.filter((x) => x !== c) : [...p, c as ComplianceFlag]))}
                      className={cn("flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                        on ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground hover:bg-accent")}>
                      {on && <Check className="size-3" />} {c}
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-sunken/40 p-4">
            <span className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Code & description auto-generate
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => submit(true)()}>Create & add another</Button>
              <Button type="button" disabled={submitting} onClick={() => submit(false)()}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Create material
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
