import { db } from "@/mock/db";
import type { Part, PartCategory, Lifecycle, SourcingType, Availability } from "@/types";

const CATEGORIES: PartCategory[] = [
  "Mechanical Bought-out", "Mechanical Fabricated", "Piping", "Pipe Fittings",
  "Structural Materials", "Process Equipment", "Field Instruments", "Panel Instruments",
  "Instrument Accessories", "Electrical", "Reagents", "Packings & Fillings",
  "Elastomers", "Consumables",
];
const LIFECYCLES: Lifecycle[] = ["Concept", "In Design", "In Review", "Released", "Production", "Obsolete"];
const SOURCING: SourcingType[] = ["Make", "Buy", "Standard"];
const AVAILABILITY: Availability[] = ["In Stock", "Low Stock", "Backorder", "Out of Stock"];

/** Case-insensitive lookup across a few candidate header names. */
function field(row: Record<string, string>, ...names: string[]): string {
  const keys = Object.keys(row);
  for (const n of names) {
    const hit = keys.find((k) => k.toLowerCase() === n.toLowerCase());
    if (hit && row[hit] !== undefined) return row[hit];
  }
  return "";
}

function oneOf<T extends string>(value: string, allowed: T[], fallback: T): T {
  const hit = allowed.find((a) => a.toLowerCase() === value.trim().toLowerCase());
  return hit ?? fallback;
}

function num(value: string, fallback = 0): number {
  const n = Number(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Map parsed CSV rows → Part records and prepend them to the mock db.
 * Accepts the column set produced by the Material Master CSV export, and
 * tolerates partial rows (only a Part Number *or* Name is required).
 * Returns the number of parts imported.
 */
export function importPartsFromCsv(rows: Record<string, string>[]): number {
  const defaultSupplier = db().suppliers[0]?.id ?? "";
  let added = 0;

  for (const row of rows) {
    const partNumber = field(row, "Part Number", "PartNumber", "Code") || "";
    const name = field(row, "Name", "Description", "Material Name") || "";
    if (!partNumber && !name) continue; // skip empty/garbage rows

    const code = partNumber || `IMP-${Date.now()}-${added}`;
    const supplierName = field(row, "Vendor", "Supplier");
    const supplierId =
      db().suppliers.find((s) => s.name.toLowerCase() === supplierName.toLowerCase())?.id ?? defaultSupplier;

    const part: Part = {
      id: `P-imp-${Date.now()}-${added}`,
      partNumber: code,
      materialType: code.split("-")[0] ?? "IM",
      subType: "",
      subTypeCode: code.split("-")[1] ?? "",
      majorSpec: code.split("-")[2] ?? "",
      detailSpec: code.split("-")[3] ?? "",
      name: name || code,
      category: oneOf(field(row, "Category"), CATEGORIES, "Mechanical Bought-out"),
      description: field(row, "Description", "Notes") || `${name || code} (imported).`,
      material: field(row, "Material", "Material Grade") || "—",
      finish: field(row, "Finish") || "—",
      revision: field(row, "Revision", "Rev") || "A",
      lifecycle: oneOf(field(row, "Lifecycle"), LIFECYCLES, "In Design"),
      sourcing: oneOf(field(row, "Sourcing"), SOURCING, "Buy"),
      weightKg: num(field(row, "Weight", "Weight (kg)")),
      unitCost: num(field(row, "Unit Cost", "Cost")),
      lastPurchasePrice: num(field(row, "Last Purchase Price", "LPP")) || num(field(row, "Unit Cost", "Cost")),
      leadTimeDays: num(field(row, "Lead Time (days)", "Lead Time", "Lead"), 14),
      supplierId,
      manufacturerPartNumber: field(row, "MPN", "Manufacturer Part Number") || `MPN-${added}`,
      make: field(row, "Make", "Manufacturer") || "—",
      model: field(row, "Model") || "—",
      drawingRef: field(row, "Drawing", "Drawing Ref") || "—",
      availability: oneOf(field(row, "Availability", "Status"), AVAILABILITY, "In Stock"),
      stockQty: num(field(row, "Stock Qty", "In Stock", "Qty")),
      reorderPoint: num(field(row, "Reorder Point"), 50),
      minStock: num(field(row, "Min Stock"), 50),
      maxStock: num(field(row, "Max Stock"), 300),
      stockLocation: field(row, "Stock Location", "Location") || "WH-A · Rack 01",
      uom: field(row, "UoM", "Unit") || "Nos",
      compliance: [],
      tags: ["imported"],
      ownerId: db().users[0]?.id ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnailHue: (code.charCodeAt(0) * 7) % 360,
      whereUsedCount: 0,
    };
    db().parts.unshift(part);
    added++;
  }
  return added;
}
