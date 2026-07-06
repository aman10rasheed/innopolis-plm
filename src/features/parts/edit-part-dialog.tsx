"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Check, ShieldCheck, Lock, Loader2 } from "lucide-react";
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
import { useUpdatePart, usePart, useResourceSpecs } from "@/lib/api";
import type { ApiPartInput } from "@/lib/api";
import type { Part, Supplier, Lifecycle, SourcingType, Availability, ComplianceFlag } from "@/types";
import { ChipMultiSelect } from "./create-part-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production", "Obsolete"];
const SOURCING: SourcingType[] = ["Make", "Buy", "Standard"];
const AVAILABILITIES: Availability[] = ["In Stock", "Low Stock", "Backorder", "Out of Stock"];
const REVS = ["A", "B", "C", "D", "E", "F"];
const MAKES = ["Inox", "L&T", "KSB", "Grundfos", "Endress+Hauser", "Emerson", "Siemens", "ABB", "Alfa Laval"];

const schema = z.object({
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
  availability: z.string().min(1),
  weightKg: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0),
  leadTimeDays: z.coerce.number().int().min(0),
  uom: z.string().min(1),
  stockQty: z.coerce.number().int().min(0),
  reorderPoint: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  maxStock: z.coerce.number().int().min(0),
  stockLocation: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

/**
 * Edit a Material Master record. The intelligent code (TT-SS-MM-DDDD) and category
 * are immutable identifiers in PLM — shown read-only here; everything else is editable.
 */
export function EditPartDialog({
  part,
  vendors,
  onOpenChange,
}: {
  part: Part | null;
  vendors: Supplier[];
  onOpenChange: (v: boolean) => void;
}) {
  const suppliers = vendors;
  const updatePart = useUpdatePart();
  const [compliance, setCompliance] = React.useState<ComplianceFlag[]>([]);
  // Vendor/resource-spec arrays only come on single-material reads — fetch the detail.
  const detailQ = usePart(part?.id ?? "");
  const detail = detailQ.data;
  const resourceSpecs = useResourceSpecs().data ?? [];
  const [vendorIds, setVendorIds] = React.useState<string[]>([]);
  const [resourceSpecIds, setResourceSpecIds] = React.useState<string[]>([]);
  const toggleIn = (set: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Re-seed the form whenever a different part is opened.
  React.useEffect(() => {
    if (!part) return;
    reset({
      name: part.name,
      remarks: part.remarks,
      material: part.material,
      finish: part.finish,
      make: part.make === "—" ? "" : part.make,
      model: part.model === "—" ? "" : part.model,
      drawingRef: part.drawingRef,
      revision: part.revision,
      lifecycle: part.lifecycle,
      sourcing: part.sourcing,
      availability: part.availability,
      weightKg: part.weightKg,
      unitCost: part.unitCost,
      leadTimeDays: part.leadTimeDays,
      uom: part.uom,
      stockQty: part.stockQty,
      reorderPoint: part.reorderPoint,
      minStock: part.minStock,
      maxStock: part.maxStock,
      stockLocation: part.stockLocation,
    });
    setCompliance(part.compliance);
  }, [part, reset]);

  // Seed the many-to-many selections once the detail read resolves.
  React.useEffect(() => {
    if (!detail) return;
    setVendorIds(detail.vendorIds);
    setResourceSpecIds(detail.resourceSpecIds);
  }, [detail]);

  const submit = handleSubmit(async (v) => {
    if (!part) return;
    const body: Partial<ApiPartInput> = {
      name: v.name,
      remarks: v.remarks || part.remarks,
      material: v.material,
      finish: v.finish,
      make: v.make || "—",
      model: v.model || "—",
      drawing_ref: v.drawingRef || part.drawingRef,
      revision: v.revision,
      lifecycle: v.lifecycle as Lifecycle,
      sourcing: v.sourcing as SourcingType,
      availability: v.availability as Availability,
      // Omit the arrays until the detail loaded (omit = leave unchanged on PATCH).
      ...(detail ? { vendor_ids: vendorIds, resource_spec_ids: resourceSpecIds } : {}),
      weight_kg: Number(v.weightKg),
      unit_cost: Number(v.unitCost),
      lead_time_days: Number(v.leadTimeDays),
      uom: v.uom,
      stock_qty: Number(v.stockQty),
      reorder_point: Number(v.reorderPoint),
      min_stock: Number(v.minStock),
      max_stock: Number(v.maxStock),
      stock_location: v.stockLocation || part.stockLocation,
      compliance,
    };
    try {
      await updatePart.mutateAsync({ id: part.id, body });
      toast.success("Material updated", `${part.partNumber} · ${v.name}`);
      onOpenChange(false);
    } catch (e) {
      toast.error("Could not update material", e instanceof Error ? e.message : "Please retry");
    }
  });

  const submitting = updatePart.isPending;

  return (
    <Dialog open={!!part} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5">
          <Thumbnail hue={part?.thumbnailHue ?? 200} size={44} icon={Pencil} />
          <div className="flex-1">
            <DialogTitle className="text-base">Edit Material Master Record</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 font-mono text-[13px]">
              <Lock className="size-3" /> {part?.partNumber} · {part?.category}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form>
          <div className="max-h-[62vh] space-y-6 overflow-y-auto p-5">
            {/* Basic */}
            <Section title="Basic Information">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Description / name" error={errors.name?.message as string} className="col-span-2">
                  <Input {...register("name")} />
                </Field>
                <Field label="Remarks" className="col-span-2">
                  <Textarea rows={2} placeholder="Optional specification remarks" {...register("remarks")} />
                </Field>
              </div>
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
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Manufacturer" /></SelectTrigger>
                      <SelectContent className="max-h-64">{MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Model"><Input className="font-mono" {...register("model")} /></Field>
                <Field label="Drawing reference"><Input className="font-mono" {...register("drawingRef")} /></Field>
                <Field label="Weight (kg)"><Input type="number" step="0.001" {...register("weightKg")} /></Field>
                <Field label="Revision">
                  <Controller control={control} name="revision" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{REVS.map((r) => <SelectItem key={r} value={r}>Rev {r}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
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
                  {detailQ.isLoading ? (
                    <p className="py-1 text-2xs text-muted-foreground">Loading vendors…</p>
                  ) : (
                    <ChipMultiSelect
                      options={suppliers.map((s) => ({ id: s.id, label: `${s.name} · ${s.country}` }))}
                      selected={vendorIds}
                      onToggle={toggleIn(setVendorIds)}
                      emptyText="No vendors registered yet — add them under Vendors."
                    />
                  )}
                </Field>
                <Field label="Standard cost (₹)"><Input type="number" {...register("unitCost")} /></Field>
                <Field label="Last purchase (system-maintained)">
                  <Input
                    readOnly
                    disabled
                    value={
                      detail
                        ? `${formatCurrency(detail.lastPurchasePrice)}${detail.lastPurchaseDate ? ` · ${formatDate(detail.lastPurchaseDate)}` : ""}${detail.lastPurchaseVendor ? ` · ${detail.lastPurchaseVendor.name}` : ""}`
                        : formatCurrency(part?.lastPurchasePrice ?? 0)
                    }
                  />
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
                <Field label="In stock"><Input type="number" {...register("stockQty")} /></Field>
                <Field label="Min stock"><Input type="number" {...register("minStock")} /></Field>
                <Field label="Max stock"><Input type="number" {...register("maxStock")} /></Field>
                <Field label="Reorder point"><Input type="number" {...register("reorderPoint")} /></Field>
                <Field label="Availability" className="col-span-1">
                  <Controller control={control} name="availability" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{AVAILABILITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Stock location" className="col-span-2"><Input {...register("stockLocation")} /></Field>
              </div>
            </Section>

            {/* Resource specs (predefined master, many-to-many) */}
            <Section title="Resource Specifications">
              {detailQ.isLoading ? (
                <p className="py-1 text-2xs text-muted-foreground">Loading resource specs…</p>
              ) : (
                <ChipMultiSelect
                  options={resourceSpecs.filter((r) => r.isActive).map((r) => ({ id: r.id, label: `${r.code} · ${r.name}` }))}
                  selected={resourceSpecIds}
                  onToggle={toggleIn(setResourceSpecIds)}
                  emptyText="No resource specs defined — an Administrator can add them."
                />
              )}
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

          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-sunken/40 p-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={submitting} onClick={() => submit()}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
