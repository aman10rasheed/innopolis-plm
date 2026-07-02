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
import { useUpdatePart } from "@/lib/api";
import type { ApiPartInput } from "@/lib/api";
import type { Part, Supplier, Lifecycle, SourcingType, Availability, ComplianceFlag } from "@/types";

const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production", "Obsolete"];
const SOURCING: SourcingType[] = ["Make", "Buy", "Standard"];
const AVAILABILITIES: Availability[] = ["In Stock", "Low Stock", "Backorder", "Out of Stock"];
const REVS = ["A", "B", "C", "D", "E", "F"];
const MAKES = ["Inox", "L&T", "KSB", "Grundfos", "Endress+Hauser", "Emerson", "Siemens", "ABB", "Alfa Laval"];

const schema = z.object({
  name: z.string().min(2, "Description is required"),
  description: z.string().optional(),
  material: z.string().min(1),
  finish: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  drawingRef: z.string().optional(),
  revision: z.string().min(1),
  lifecycle: z.string().min(1),
  sourcing: z.string().min(1),
  availability: z.string().min(1),
  supplierId: z.string().min(1, "Select a vendor"),
  weightKg: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0),
  lastPurchasePrice: z.coerce.number().min(0),
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

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Re-seed the form whenever a different part is opened.
  React.useEffect(() => {
    if (!part) return;
    reset({
      name: part.name,
      description: part.description,
      material: part.material,
      finish: part.finish,
      make: part.make === "—" ? "" : part.make,
      model: part.model === "—" ? "" : part.model,
      drawingRef: part.drawingRef,
      revision: part.revision,
      lifecycle: part.lifecycle,
      sourcing: part.sourcing,
      availability: part.availability,
      supplierId: part.supplierId,
      weightKg: part.weightKg,
      unitCost: part.unitCost,
      lastPurchasePrice: part.lastPurchasePrice,
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

  const submit = handleSubmit(async (v) => {
    if (!part) return;
    const body: Partial<ApiPartInput> = {
      name: v.name,
      description: v.description || part.description,
      material: v.material,
      finish: v.finish,
      make: v.make || "—",
      model: v.model || "—",
      drawing_ref: v.drawingRef || part.drawingRef,
      revision: v.revision,
      lifecycle: v.lifecycle as Lifecycle,
      sourcing: v.sourcing as SourcingType,
      availability: v.availability as Availability,
      supplier_id: v.supplierId,
      weight_kg: Number(v.weightKg),
      unit_cost: Number(v.unitCost),
      last_purchase_price: Number(v.lastPurchasePrice),
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
                <Field label="Notes" className="col-span-2">
                  <Textarea rows={2} placeholder="Optional specification notes" {...register("description")} />
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
                <Field label="Preferred vendor" error={errors.supplierId?.message as string} className="col-span-2">
                  <Controller control={control} name="supplierId" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.country}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Standard cost (₹)"><Input type="number" {...register("unitCost")} /></Field>
                <Field label="Last purchase price (₹)"><Input type="number" {...register("lastPurchasePrice")} /></Field>
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
