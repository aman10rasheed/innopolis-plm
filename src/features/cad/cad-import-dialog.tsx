"use client";

import * as React from "react";
import { UploadCloud, FileBox, X, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Thumbnail } from "@/components/shared/thumbnail";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "@/components/ui/toast";

const ACCEPT = ".step,.stp,.iges,.igs,.brep,.glb,.gltf,.stl,.obj,.3mf,.fbx";
const EXT_LABEL: Record<string, string> = {
  step: "STEP", stp: "STEP", iges: "IGES", igs: "IGES", brep: "BREP",
  glb: "GLB", gltf: "glTF", stl: "STL", obj: "OBJ", "3mf": "3MF", fbx: "FBX",
};

function formatOf(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LABEL[ext] ?? (ext ? ext.toUpperCase() : "CAD");
}
function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CadImportDialog() {
  const open = useUIStore((s) => s.cadImportOpen);
  const setOpen = useUIStore((s) => s.setCadImportOpen);
  const setCadModel = useUIStore((s) => s.setCadModel);

  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setDragging(false);
      setImporting(false);
    }
  }, [open]);

  const onPick = (f: File | undefined | null) => {
    if (f) setFile(f);
  };

  const onImport = () => {
    if (!file) return;
    setImporting(true);
    const name = file.name.replace(/\.[^.]+$/, "");
    const format = formatOf(file.name);
    // Simulate parse/upload of the CAD file.
    setTimeout(() => {
      setCadModel({ name, format });
      setImporting(false);
      setOpen(false);
      toast.success("Model imported", `${file.name} · ${humanSize(file.size)}`);
    }, 700);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5">
          <Thumbnail hue={206} size={44} icon={FileBox} />
          <div className="flex-1">
            <DialogTitle className="text-base">Import CAD Model</DialogTitle>
            <DialogDescription className="text-[13px]">
              STEP, IGES, GLB/glTF, STL, OBJ and more.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-5">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onPick(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                dragging
                  ? "border-primary bg-primary/[0.06]"
                  : "border-border hover:border-border-strong hover:bg-surface-sunken/40",
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Drop a CAD file here, or <span className="text-primary">browse</span>
                </p>
                <p className="mt-1 text-2xs text-muted-foreground">
                  Supports STEP · IGES · GLB · glTF · STL · OBJ · 3MF · FBX
                </p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <Thumbnail hue={206} size={40} icon={FileBox} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{file.name}</p>
                <p className="text-2xs text-muted-foreground">
                  {formatOf(file.name)} · {humanSize(file.size)}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setFile(null)}>
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-sunken/40 p-4">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!file || importing} onClick={onImport}>
            {importing ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Import model
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
