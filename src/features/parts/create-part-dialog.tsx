"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Boxes, Sparkles, Check, ShieldCheck, Tag, Loader2 } from "lucide-react";
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
import { db } from "@/mock/db";
import {
  MATERIAL_CATEGORIES,
  CATEGORY_BY_NAME,
  MAJOR_SPECS,
  GRADES,
  FINISHES,
  COMPLIANCE_POOL,
  buildMaterialCode,
} from "@/mock/pools";
import type { Part, PartCategory, Lifecycle, SourcingType } from "@/types";

const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production"];
const SOURCING: SourcingType[] = ["Make", "Buy", "Standard"];
const REVS = ["A", "B", "C", "D"];
const MAKES = ["Inox", "L&T", "KSB", "Grundfos", "Endress+Hauser", "Emerson", "Siemens", "ABB", "Alfa Laval"];

const schema = z.object({
  category: z.string().min(1, "Select a type"),
  subTypeCode: z.string().min(1, "Select a subtype"),
  majorSpec: z.string().min(1),
  detailSpec: z.string().min(1),
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
  supplierId: z.string().min(1, "Select a vendor"),
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
        <span className="font-mono text-2xs text-muted-foreground">TT-SS-MM-DDDD</span>
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
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (part: Part) => void;
}) {
  const suppliers = React.useMemo(() => db().suppliers, []);
  const [compliance, setCompliance] = React.useState<string[]>(["ASME", "3.1 Cert"]);
  const [submitting, setSubmitting] = React.useState(false);

  const defaults: FormValues = {
    category: "", subTypeCode: "", majorSpec: "15", detailSpec: "3040",
    name: "", description: "", material: "SS 304", finish: "Pickled & Passivated",
    make: "", model: "", drawingRef: "", revision: "A", lifecycle: "In Design", sourcing: "Buy",
    supplierId: "", unitCost: 0, lastPurchasePrice: 0, leadTimeDays: 14, uom: "Nos",
    reorderPoint: 50, minStock: 50, maxStock: 300, stockLocation: "",
  };

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  const category = watch("category") as PartCategory | "";
  const subTypeCode = watch("subTypeCode");
  const majorSpec = watch("majorSpec");
  const detailSpec = watch("detailSpec");
  const catDef = category ? CATEGORY_BY_NAME[category as PartCategory] : null;
  const typeCode = catDef?.type ?? "";

  // auto-derive name, material, uom from the chosen code segments
  React.useEffect(() => {
    if (catDef && subTypeCode) {
      const sub = catDef.subtypes.find((s) => s.code === subTypeCode);
      const grade = GRADES.find((g) => g.code === detailSpec);
      if (sub && grade) {
        const size = majorSpec === "00" ? "" : ` ${majorSpec} ${catDef.uom === "Mtr" ? "NB" : "mm"}`;
        setValue("name", `${grade.label} ${sub.name}${size}`.trim());
        setValue("material", grade.label);
      }
      setValue("uom", catDef.uom);
    }
  }, [catDef, subTypeCode, majorSpec, detailSpec, setValue]);

  React.useEffect(() => {
    if (open) { reset(defaults); setCompliance(["ASME", "3.1 Cert"]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hue = React.useMemo(() => (typeCode || "MB").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360, [typeCode]);

  const submit = (another: boolean) =>
    handleSubmit((v) => {
      setSubmitting(true);
      setTimeout(() => {
        const code = buildMaterialCode(typeCode, v.subTypeCode, v.majorSpec, v.detailSpec);
        const sub = catDef?.subtypes.find((s) => s.code === v.subTypeCode);
        const part: Part = {
          id: `P-new-${Date.now()}`,
          partNumber: code,
          materialType: typeCode,
          subType: sub?.name ?? "",
          subTypeCode: v.subTypeCode,
          majorSpec: v.majorSpec,
          detailSpec: v.detailSpec,
          name: v.name,
          category: v.category as PartCategory,
          description: v.description || `${v.material} ${v.name.toLowerCase()}.`,
          material: v.material,
          finish: v.finish,
          revision: v.revision,
          lifecycle: v.lifecycle as Lifecycle,
          sourcing: v.sourcing as SourcingType,
          weightKg: Math.round(Math.random() * 20 * 1000) / 1000,
          unitCost: Number(v.unitCost),
          lastPurchasePrice: Number(v.lastPurchasePrice) || Number(v.unitCost),
          leadTimeDays: Number(v.leadTimeDays),
          supplierId: v.supplierId,
          manufacturerPartNumber: v.model || `MPN-${Math.floor(10000 + Math.random() * 89999)}`,
          make: v.make || "—",
          model: v.model || "—",
          drawingRef: v.drawingRef || `DRG-${typeCode}-${Math.floor(1000 + Math.random() * 8999)}`,
          availability: "In Stock",
          stockQty: 0,
          reorderPoint: Number(v.reorderPoint),
          minStock: Number(v.minStock),
          maxStock: Number(v.maxStock),
          stockLocation: v.stockLocation || "WH-A · Rack 01",
          uom: v.uom,
          compliance: compliance as Part["compliance"],
          tags: [],
          ownerId: db().users[0]!.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          thumbnailHue: hue,
          whereUsedCount: 0,
        };
        setSubmitting(false);
        onCreate(part);
        toast.success("Material created", `${part.partNumber} · ${part.name}`);
        if (another) { reset(defaults); setCompliance(["ASME", "3.1 Cert"]); }
        else onOpenChange(false);
      }, 550);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5">
          <Thumbnail hue={hue} size={44} icon={Boxes} />
          <div className="flex-1">
            <DialogTitle className="text-base">Create Material Master Record</DialogTitle>
            <DialogDescription className="text-[13px]">
              Each material exists once. The intelligent code is generated from your selections.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form>
          <div className="max-h-[62vh] space-y-6 overflow-y-auto p-5">
            {/* Code builder */}
            <Section title="Intelligent Code">
              <div className="grid grid-cols-4 gap-3">
                <Field label="Type (TT)" error={errors.category?.message as string} className="col-span-1">
                  <Controller control={control} name="category" render={({ field }) => (
                    <Select value={field.value} onValueChange={(val) => { field.onChange(val); setValue("subTypeCode", ""); }}>
                      <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {MATERIAL_CATEGORIES.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            <span className="font-mono text-2xs text-primary">{c.type}</span> {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Subtype (SS)" error={errors.subTypeCode?.message as string}>
                  <Controller control={control} name="subTypeCode" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!catDef}>
                      <SelectTrigger><SelectValue placeholder="Subtype" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {catDef?.subtypes.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            <span className="font-mono text-2xs text-primary">{s.code}</span> {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Major (MM)">
                  <Controller control={control} name="majorSpec" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {MAJOR_SPECS.map((m) => <SelectItem key={m} value={m}>{m === "00" ? "00 (n/a)" : `${m} mm`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                <Field label="Detail (DDDD)">
                  <Controller control={control} name="detailSpec" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {GRADES.map((g) => <SelectItem key={g.code} value={g.code}><span className="font-mono text-2xs text-primary">{g.code}</span> {g.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
              </div>
              <div className="mt-3">
                <CodeBuilder type={typeCode} sub={subTypeCode} major={majorSpec} detail={detailSpec} />
              </div>
            </Section>

            {/* Basic */}
            <Section title="Basic Information">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Description / name" error={errors.name?.message as string} className="col-span-2">
                  <Input placeholder="auto-generated from code" {...register("name")} />
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
                <Field label="Standard cost (₹)">
                  <Input type="number" {...register("unitCost")} />
                </Field>
                <Field label="Last purchase price (₹)">
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
                  const on = compliance.includes(c);
                  return (
                    <button key={c} type="button"
                      onClick={() => setCompliance((p) => (on ? p.filter((x) => x !== c) : [...p, c]))}
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
