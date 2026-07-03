"use client";

import * as React from "react";
import { Layers, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueryBoundary } from "@/components/shared/query-boundary";
import { toast } from "@/components/ui/toast";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSubtypes,
  useSaveSubtype,
  useDeleteSubtype,
  useMajorSpecs,
  useSaveMajorSpec,
  useDeleteMajorSpec,
  useGrades,
  useSaveGrade,
  useDeleteGrade,
  useUnits,
  useSaveUnit,
  useDeleteUnit,
  ApiError,
} from "@/lib/api";
import type {
  ApiCategory,
  ApiCategoryInput,
  ApiSubtype,
  ApiMajorSpec,
  ApiGrade,
  ApiUnit,
} from "@/lib/api/types";

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : fallback;

export function CategoryManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-base">Master Data</DialogTitle>
            <DialogDescription className="text-[13px]">
              Manage the reference lists that drive the material code and pickers. Administrators only.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Tabs defaultValue="categories" className="flex min-h-0 flex-col">
          <div className="border-b border-border px-4 py-2.5">
            <TabsList>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="subtypes">Subtypes</TabsTrigger>
              <TabsTrigger value="major-specs">Major Specs</TabsTrigger>
              <TabsTrigger value="grades">Grades</TabsTrigger>
              <TabsTrigger value="units">Units</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="categories" className="mt-0">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="subtypes" className="mt-0">
            <SubtypesTab />
          </TabsContent>
          <TabsContent value="major-specs" className="mt-0">
            <CodeLabelTab
              kind="major"
              title="major spec"
              titlePlural="major specs"
              codeLabel="Code (MM)"
              codePlaceholder="15"
              codeMono
              valueLabel="Label"
              valuePlaceholder="e.g. 15 NB"
            />
          </TabsContent>
          <TabsContent value="grades" className="mt-0">
            <CodeLabelTab
              kind="grade"
              title="grade"
              titlePlural="grades"
              codeLabel="Code"
              codePlaceholder="SS316"
              codeMono
              valueLabel="Label"
              valuePlaceholder="e.g. Stainless Steel 316"
            />
          </TabsContent>
          <TabsContent value="units" className="mt-0">
            <CodeLabelTab
              kind="unit"
              title="unit"
              titlePlural="units"
              codeLabel="Code"
              codePlaceholder="Nos"
              codeMono
              valueLabel="Name"
              valuePlaceholder="e.g. Numbers"
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end border-t border-border bg-surface-sunken/40 p-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Categories tab (unchanged behaviour)                                        */
/* -------------------------------------------------------------------------- */

/** Client-side mirror of the server validation rules (avoids round-trip 400s). */
function validateCategory(v: { name: string; typeCode: string; defaultUom: string }): string | null {
  if (!v.name.trim()) return "Name is required";
  if (v.name.trim().length > 80) return "Name must be at most 80 characters";
  if (!v.typeCode.trim()) return "Type code is required";
  if (v.typeCode.trim().length > 4) return "Type code must be at most 4 characters";
  if (v.defaultUom.trim().length > 16) return "Default UoM must be at most 16 characters";
  return null;
}

function CategoriesTab() {
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = categoriesQuery.data ?? [];

  const [name, setName] = React.useState("");
  const [typeCode, setTypeCode] = React.useState("");
  const [defaultUom, setDefaultUom] = React.useState("Nos");

  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCode, setEditCode] = React.useState("");
  const [editUom, setEditUom] = React.useState("");

  const resetAddForm = () => {
    setName("");
    setTypeCode("");
    setDefaultUom("Nos");
  };

  const add = () => {
    const err = validateCategory({ name, typeCode, defaultUom });
    if (err) return toast.error("Invalid category", err);
    const body: ApiCategoryInput = {
      name: name.trim(),
      type_code: typeCode.trim().toUpperCase(),
      default_uom: defaultUom.trim() || "Nos",
      is_active: true,
    };
    createCategory.mutate(body, {
      onSuccess: (c) => {
        toast.success("Category created", `${c.name} · ${c.type_code}`);
        resetAddForm();
      },
      onError: (e) => toast.error("Could not create category", errText(e, "Try a different name or code")),
    });
  };

  const startEdit = (c: ApiCategory) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditCode(c.type_code);
    setEditUom(c.default_uom);
  };

  const saveEdit = () => {
    if (!editId) return;
    const err = validateCategory({ name: editName, typeCode: editCode, defaultUom: editUom });
    if (err) return toast.error("Invalid category", err);
    updateCategory.mutate(
      {
        id: editId,
        body: { name: editName.trim(), type_code: editCode.trim().toUpperCase(), default_uom: editUom.trim() || "Nos" },
      },
      {
        onSuccess: () => {
          toast.success("Category updated", editName.trim());
          setEditId(null);
        },
        onError: (e) => toast.error("Could not update category", errText(e, "Name or code may already exist")),
      },
    );
  };

  const toggleActive = (c: ApiCategory) => {
    updateCategory.mutate(
      { id: c.id, body: { is_active: !c.is_active } },
      {
        onSuccess: () => toast.success(c.is_active ? "Category hidden" : "Category activated", c.name),
        onError: (e) => toast.error("Could not update category", errText(e, "Please retry")),
      },
    );
  };

  const remove = (c: ApiCategory) => {
    if (!window.confirm(`Delete category "${c.name}"? Existing materials keep their category; it just stops appearing in pickers.`)) return;
    deleteCategory.mutate(c.id, {
      onSuccess: () => toast.success("Category deleted", c.name),
      onError: (e) => toast.error("Could not delete category", errText(e, "Please retry")),
    });
  };

  return (
    <>
      {/* Add form */}
      <div className="grid grid-cols-[1fr_120px_120px_auto] items-end gap-3 border-b border-border bg-surface-sunken/40 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name" className="text-2xs">Category name</Label>
          <Input id="cat-name" placeholder="e.g. Fasteners" value={name} maxLength={80}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-code" className="text-2xs">Code (TT)</Label>
          <Input id="cat-code" placeholder="FS" value={typeCode} maxLength={4} className="font-mono uppercase"
            onChange={(e) => setTypeCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-uom" className="text-2xs">Default UoM</Label>
          <Input id="cat-uom" placeholder="Nos" value={defaultUom} maxLength={16}
            onChange={(e) => setDefaultUom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <Button onClick={add} disabled={createCategory.isPending}>
          {createCategory.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
        </Button>
      </div>

      <div className="max-h-[42vh] overflow-y-auto">
        <div className="p-2">
          <QueryBoundary
            isLoading={categoriesQuery.isLoading}
            isError={categoriesQuery.isError}
            error={categoriesQuery.error}
            onRetry={categoriesQuery.refetch}
          >
            {categories.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No categories yet — add your first above.</div>
            ) : (
              <div className="divide-y divide-border">
                {categories.map((c) =>
                  editId === c.id ? (
                    <div key={c.id} className="grid grid-cols-[1fr_120px_120px_auto] items-center gap-3 px-2 py-2">
                      <Input value={editName} maxLength={80} onChange={(e) => setEditName(e.target.value)} />
                      <Input value={editCode} maxLength={4} className="font-mono uppercase" onChange={(e) => setEditCode(e.target.value.toUpperCase())} />
                      <Input value={editUom} maxLength={16} onChange={(e) => setEditUom(e.target.value)} />
                      <div className="flex gap-1">
                        <Button size="icon-sm" onClick={saveEdit} disabled={updateCategory.isPending}>
                          {updateCategory.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditId(null)}><X className="size-4" /></Button>
                      </div>
                    </div>
                  ) : (
                    <div key={c.id} className="flex items-center gap-3 px-2 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className={cnActive(c.is_active)}>{c.name}</p>
                        <p className="font-mono text-2xs text-muted-foreground">{c.default_uom}</p>
                      </div>
                      <Badge variant="outline" className="font-mono">{c.type_code}</Badge>
                      {!c.is_active && <Badge variant="muted">Inactive</Badge>}
                      <div className="flex items-center gap-1.5" title={c.is_active ? "Active — shown in pickers" : "Inactive — hidden from pickers"}>
                        <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                      </div>
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(c)}><Pencil className="size-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(c)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ),
                )}
              </div>
            )}
          </QueryBoundary>
        </div>
      </div>

      <div className="border-t border-border bg-surface-sunken/40 px-4 py-2.5">
        <span className="text-2xs text-muted-foreground">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"} · {categories.filter((c) => c.is_active).length} active
        </span>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Subtypes tab (category-scoped)                                              */
/* -------------------------------------------------------------------------- */

function SubtypesTab() {
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];

  const [categoryId, setCategoryId] = React.useState<string>("");
  // Default the selector to the first category once loaded.
  React.useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id);
  }, [categoryId, categories]);

  const subtypesQuery = useSubtypes(categoryId || undefined);
  const saveSubtype = useSaveSubtype();
  const deleteSubtype = useDeleteSubtype();

  const subtypes = subtypesQuery.data ?? [];

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");

  const [editId, setEditId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editCode, setEditCode] = React.useState("");

  const add = async () => {
    if (!categoryId) return toast.error("No category selected", "Pick a category first.");
    if (!name.trim()) return toast.error("Invalid subtype", "Name is required");
    if (!code.trim()) return toast.error("Invalid subtype", "Code is required");
    try {
      await saveSubtype.mutateAsync({
        body: { category_id: categoryId, name: name.trim(), code: code.trim().toUpperCase() },
      });
      toast.success("Subtype created", `${name.trim()} · ${code.trim().toUpperCase()}`);
      setName("");
      setCode("");
    } catch (e) {
      toast.error("Could not create subtype", errText(e, "Try a different name or code"));
    }
  };

  const startEdit = (s: ApiSubtype) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditCode(s.code);
  };

  const saveEdit = async () => {
    if (!editId) return;
    if (!editName.trim()) return toast.error("Invalid subtype", "Name is required");
    if (!editCode.trim()) return toast.error("Invalid subtype", "Code is required");
    try {
      await saveSubtype.mutateAsync({
        id: editId,
        body: { category_id: categoryId, name: editName.trim(), code: editCode.trim().toUpperCase() },
      });
      toast.success("Subtype updated", editName.trim());
      setEditId(null);
    } catch (e) {
      toast.error("Could not update subtype", errText(e, "Name or code may already exist"));
    }
  };

  const remove = async (s: ApiSubtype) => {
    if (!window.confirm(`Delete subtype "${s.name}"?`)) return;
    try {
      await deleteSubtype.mutateAsync(s.id);
      toast.success("Subtype deleted", s.name);
    } catch (e) {
      toast.error("Could not delete subtype", errText(e, "Please retry"));
    }
  };

  return (
    <>
      {/* Category selector + add form */}
      <div className="space-y-3 border-b border-border bg-surface-sunken/40 p-4">
        <div className="space-y-1.5">
          <Label className="text-2xs">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={categories.length === 0}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} <span className="font-mono text-2xs text-muted-foreground">({c.type_code})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-[1fr_140px_auto] items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sub-name" className="text-2xs">Subtype name</Label>
            <Input id="sub-name" placeholder="e.g. Valves" value={name} maxLength={80} disabled={!categoryId}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-code" className="text-2xs">Code (SS)</Label>
            <Input id="sub-code" placeholder="VA" value={code} maxLength={4} className="font-mono uppercase" disabled={!categoryId}
              onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && add()} />
          </div>
          <Button onClick={add} disabled={saveSubtype.isPending || !categoryId}>
            {saveSubtype.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
          </Button>
        </div>
      </div>

      <div className="max-h-[42vh] overflow-y-auto">
        <div className="p-2">
          {!categoryId ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {categoriesQuery.isLoading ? "Loading categories…" : "Select a category to manage its subtypes."}
            </div>
          ) : (
            <QueryBoundary
              isLoading={subtypesQuery.isLoading}
              isError={subtypesQuery.isError}
              error={subtypesQuery.error}
              onRetry={subtypesQuery.refetch}
            >
              {subtypes.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No subtypes for this category yet — add your first above.</div>
              ) : (
                <div className="divide-y divide-border">
                  {subtypes.map((s) =>
                    editId === s.id ? (
                      <div key={s.id} className="grid grid-cols-[1fr_140px_auto] items-center gap-3 px-2 py-2">
                        <Input value={editName} maxLength={80} onChange={(e) => setEditName(e.target.value)} />
                        <Input value={editCode} maxLength={4} className="font-mono uppercase" onChange={(e) => setEditCode(e.target.value.toUpperCase())} />
                        <div className="flex gap-1">
                          <Button size="icon-sm" onClick={saveEdit} disabled={saveSubtype.isPending}>
                            {saveSubtype.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditId(null)}><X className="size-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <div key={s.id} className="flex items-center gap-3 px-2 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className={cnActive(s.is_active)}>{s.name}</p>
                        </div>
                        <Badge variant="outline" className="font-mono">{s.code}</Badge>
                        {!s.is_active && <Badge variant="muted">Inactive</Badge>}
                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(s)}><Pencil className="size-3.5" /></Button>
                        <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(s)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </QueryBoundary>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface-sunken/40 px-4 py-2.5">
        <span className="text-2xs text-muted-foreground">
          {categoryId ? `${subtypes.length} subtype${subtypes.length === 1 ? "" : "s"} in this category` : "No category selected"}
        </span>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Generic code+value tab — Major Specs / Grades / Units                       */
/* -------------------------------------------------------------------------- */

type CodeValueRow = ApiMajorSpec | ApiGrade | ApiUnit;

/** Read the "value" field (label for specs/grades, name for units). */
function valueOf(row: CodeValueRow): string {
  return "label" in row ? row.label : row.name;
}

function useCodeLabel(kind: "major" | "grade" | "unit") {
  const majorSpecs = useMajorSpecs();
  const grades = useGrades();
  const units = useUnits();
  const saveMajor = useSaveMajorSpec();
  const saveGrade = useSaveGrade();
  const saveUnit = useSaveUnit();
  const delMajor = useDeleteMajorSpec();
  const delGrade = useDeleteGrade();
  const delUnit = useDeleteUnit();

  if (kind === "major") {
    return {
      query: majorSpecs,
      save: saveMajor,
      del: delMajor,
      toBody: (code: string, value: string) => ({ code, label: value }),
    } as const;
  }
  if (kind === "grade") {
    return {
      query: grades,
      save: saveGrade,
      del: delGrade,
      toBody: (code: string, value: string) => ({ code, label: value }),
    } as const;
  }
  return {
    query: units,
    save: saveUnit,
    del: delUnit,
    toBody: (code: string, value: string) => ({ code, name: value }),
  } as const;
}

function CodeLabelTab({
  kind,
  title,
  titlePlural,
  codeLabel,
  codePlaceholder,
  codeMono,
  valueLabel,
  valuePlaceholder,
}: {
  kind: "major" | "grade" | "unit";
  title: string;
  titlePlural: string;
  codeLabel: string;
  codePlaceholder: string;
  codeMono?: boolean;
  valueLabel: string;
  valuePlaceholder: string;
}) {
  const { query, save, del, toBody } = useCodeLabel(kind);
  const rows = (query.data ?? []) as CodeValueRow[];

  const [code, setCode] = React.useState("");
  const [value, setValue] = React.useState("");

  const [editId, setEditId] = React.useState<string | null>(null);
  const [editCode, setEditCode] = React.useState("");
  const [editValue, setEditValue] = React.useState("");

  const codeCls = codeMono ? "font-mono uppercase" : undefined;
  const normCode = (v: string) => (codeMono ? v.toUpperCase() : v);

  const add = async () => {
    if (!code.trim()) return toast.error(`Invalid ${title}`, `${codeLabel} is required`);
    if (!value.trim()) return toast.error(`Invalid ${title}`, `${valueLabel} is required`);
    try {
      await save.mutateAsync({ body: toBody(normCode(code.trim()), value.trim()) });
      toast.success(`${cap(title)} created`, `${normCode(code.trim())} · ${value.trim()}`);
      setCode("");
      setValue("");
    } catch (e) {
      toast.error(`Could not create ${title}`, errText(e, "Try a different code"));
    }
  };

  const startEdit = (r: CodeValueRow) => {
    setEditId(r.id);
    setEditCode(r.code);
    setEditValue(valueOf(r));
  };

  const saveEdit = async () => {
    if (!editId) return;
    if (!editCode.trim()) return toast.error(`Invalid ${title}`, `${codeLabel} is required`);
    if (!editValue.trim()) return toast.error(`Invalid ${title}`, `${valueLabel} is required`);
    try {
      await save.mutateAsync({ id: editId, body: toBody(normCode(editCode.trim()), editValue.trim()) });
      toast.success(`${cap(title)} updated`, editValue.trim());
      setEditId(null);
    } catch (e) {
      toast.error(`Could not update ${title}`, errText(e, "Code may already exist"));
    }
  };

  const remove = async (r: CodeValueRow) => {
    if (!window.confirm(`Delete ${title} "${valueOf(r)}"?`)) return;
    try {
      await del.mutateAsync(r.id);
      toast.success(`${cap(title)} deleted`, valueOf(r));
    } catch (e) {
      toast.error(`Could not delete ${title}`, errText(e, "Please retry"));
    }
  };

  return (
    <>
      {/* Add form */}
      <div className="grid grid-cols-[140px_1fr_auto] items-end gap-3 border-b border-border bg-surface-sunken/40 p-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-code`} className="text-2xs">{codeLabel}</Label>
          <Input id={`${kind}-code`} placeholder={codePlaceholder} value={code} maxLength={16} className={codeCls}
            onChange={(e) => setCode(normCode(e.target.value))} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-value`} className="text-2xs">{valueLabel}</Label>
          <Input id={`${kind}-value`} placeholder={valuePlaceholder} value={value} maxLength={80}
            onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        </div>
        <Button onClick={add} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
        </Button>
      </div>

      <div className="max-h-[42vh] overflow-y-auto">
        <div className="p-2">
          <QueryBoundary
            isLoading={query.isLoading}
            isError={query.isError}
            error={query.error}
            onRetry={query.refetch}
          >
            {rows.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No {titlePlural} yet — add your first above.</div>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((r) =>
                  editId === r.id ? (
                    <div key={r.id} className="grid grid-cols-[140px_1fr_auto] items-center gap-3 px-2 py-2">
                      <Input value={editCode} maxLength={16} className={codeCls} onChange={(e) => setEditCode(normCode(e.target.value))} />
                      <Input value={editValue} maxLength={80} onChange={(e) => setEditValue(e.target.value)} />
                      <div className="flex gap-1">
                        <Button size="icon-sm" onClick={saveEdit} disabled={save.isPending}>
                          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => setEditId(null)}><X className="size-4" /></Button>
                      </div>
                    </div>
                  ) : (
                    <div key={r.id} className="flex items-center gap-3 px-2 py-2.5">
                      <Badge variant="outline" className="font-mono">{r.code}</Badge>
                      <p className={cnActive(r.is_active) + " flex-1"}>{valueOf(r)}</p>
                      {!r.is_active && <Badge variant="muted">Inactive</Badge>}
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(r)}><Pencil className="size-3.5" /></Button>
                      <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(r)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ),
                )}
              </div>
            )}
          </QueryBoundary>
        </div>
      </div>

      <div className="border-t border-border bg-surface-sunken/40 px-4 py-2.5">
        <span className="text-2xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? title : titlePlural} · {rows.filter((r) => r.is_active).length} active
        </span>
      </div>
    </>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cnActive(active: boolean) {
  return active ? "truncate text-[13px] font-medium" : "truncate text-[13px] font-medium text-muted-foreground line-through";
}
