# Innopolis PLM — Page Construction Kit

This is the canonical reference for building new pages. **Do not invent new
components, props, or data fields.** Use only what is listed here. Match the
look of existing pages (`src/app/products/page.tsx`,
`src/features/products/products-view.tsx`, `src/features/changes/changes-board.tsx`).

## Page conventions

Every page file is `"use client";` and follows:

```tsx
"use client";
import { SomeIcon, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export default function FooPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Foo" description="…" icon={SomeIcon}
        actions={<Button size="sm" onClick={() => toast.success("Done")}><Plus className="size-4"/> New</Button>} />
      <div className="min-h-0 flex-1 overflow-hidden">
        {/* content — wrap scrollable content in <ScrollArea className="h-full"> */}
      </div>
    </div>
  );
}
```

- Heavy/interactive content goes in a feature component under `src/features/<name>/`.
- Always make pages feel functional: real data, hover states, working buttons (wire to `toast`), filters that filter, tabs that switch.
- Use `tabular` className on numeric text. Use `formatCurrency`, `formatNumber`, `formatCompactCurrency`, `formatDate`, `timeAgo` from `@/lib/utils`.
- Use `cn` from `@/lib/utils` for conditional classes.

## Data API — `@/mock/db`

```ts
import { db, getUser, getSupplier, getPart, getAssembly, getProduct,
         buildBomTree, flattenBom, whereUsed, rootAssemblies } from "@/mock/db";

const d = db(); // singleton, memoized
d.users d.suppliers d.parts d.assemblies d.products d.ecos d.revisions
d.documents d.warehouses d.inventory d.purchaseOrders d.activities
d.notifications d.approvals
```

Series helpers from `@/mock/series`: `monthlySeries(seed,start,drift,vol)`,
`costTrendSeries()`, `manufacturingProgress()`, `supplierPerfSeries()`,
`utilizationHeatmap()`.

## Types — `@/types`

Key fields (see file for full): 
- `Part`: partNumber,name,category,material,finish,revision,lifecycle,sourcing,weightKg,unitCost,leadTimeDays,supplierId,availability,stockQty,reorderPoint,uom,compliance[],tags[],ownerId,thumbnailHue,whereUsedCount
- `Assembly`: partNumber,name,revision,lifecycle,productId,componentCount,totalPartCount,rolledCost,weightKg,ownerId,level,thumbnailHue,hasWarnings,updatedAt
- `Product`: code,name,family,category,lifecycle,revision,version,unitCost,targetCost,msrp,marginPct,unitsBuilt,openEcos,releaseDate,ownerId,thumbnailHue,health
- `Supplier`: name,code,country,region,category,tier(1|2|3),rating,onTimePct,qualityPct,partsSupplied,openPOs,annualSpend,leadTimeAvg,riskScore,status,contact,email
- `Eco`: number,title,description,status,priority,type,ownerId,affectedItems,productId,costImpact,createdAt,dueDate,progress,commentsCount,attachmentsCount,approvalsNeeded,approvalsReceived
- `Revision`: itemId,itemPartNumber,itemName,revision,status,authorId,date,changeSummary,ecoNumber,added,removed,modified,changedFields
- `DocItem`: name,type,format,sizeKb,folder,version,ownerId,updatedAt,tags[],favorite,linkedItemId,status
- `Warehouse`: code,name,city,country,type,capacityPct,skuCount,stockValue,lowStockItems,lat,lng
- `InventoryRecord`: partNumber,partName,warehouseId,warehouseCode,onHand,reserved,available,incoming,reorderPoint,unitCost,uom,status
- `PurchaseOrder`: number,supplierId,supplierName,status,lineItems,totalValue,orderedDate,expectedDate,receivedPct,ownerId,priority,onTimeRisk
- `Approval`: ecoNumber,title,type,requestedById,assignedToId,priority,requestedAt,dueDate,status,costImpact,affectedItems
- `User`: name,initials,role,team,hue,online

## Status → Badge variant maps — `@/constants/status`

`LIFECYCLE_VARIANT[lifecycle]`, `AVAILABILITY_VARIANT[availability]`,
`ECO_STATUS_VARIANT[status]`, `ECO_STATUS_COLOR[status]` (bg-* dot class),
`PRIORITY_VARIANT[priority]`, `PO_STATUS_VARIANT[status]`, `LIFECYCLE_DOT[lifecycle]`.

## UI primitives — `@/components/ui/*`

- `button` → `Button` variants: default|destructive|outline|secondary|ghost|link|glow; sizes: default|sm|xs|lg|icon|icon-sm|icon-xs
- `card` → `Card`(interactive?), CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `badge` → `Badge` variant: default|secondary|outline|success|warning|destructive|info|muted; also `StatusDot`
- `input` → `Input`; `label` → `Label`; `checkbox` → `Checkbox`; `switch` → `Switch`; `slider` → `Slider`
- `select` → Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- `tabs` → Tabs, TabsList, TabsTrigger, TabsContent
- `dropdown-menu` → DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut
- `context-menu` → ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator
- `dialog` → Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- `popover` → Popover, PopoverTrigger, PopoverContent
- `tooltip` → Tooltip, TooltipTrigger, TooltipContent, `Hint` (label,kbd?,side?)
- `progress` → `Progress` (value, indicatorClassName?)
- `avatar` → Avatar, AvatarFallback (use inline style for hue: `style={{background:'hsl('+hue+' 55% 22%)', color:'hsl('+hue+' 80% 76%)'}}`)
- `scroll-area` → `ScrollArea`
- `skeleton` → `Skeleton`
- `toast` → `toast.success/error/warning/info/message(title, description?)`

## Shared components — `@/components/shared/*`

- `page-header` → `PageHeader` (title, description?, icon?, actions?, breadcrumb?)
- `stat-card` → `StatCard` (label, value, delta?, deltaSuffix?, icon?, accent?: primary|success|warning|destructive|info, spark?: number[], invertDelta?)
- `thumbnail` → `Thumbnail` (hue, size?, icon?, className?) — generated CAD-like tile
- `empty-state` → `EmptyState` (icon, title, description?, action?)
- `kbd` → `Kbd`, `Shortcut`, `MOD`
- `charts` → `AreaTrend` (data,dataKey?,secondKey?,xKey?,prefix?,height?,showAxis?), `BarChartMini` (data,dataKey?,xKey?,prefix?,suffix?,color?), `MultiBar` (data,keys:{key,color,name}[],xKey?), `LineTrend` (data,keys,xKey?), `DonutChart` (data:{name,value,color}[],height?)
  - chart colors: use `hsl(var(--primary))`, `hsl(var(--info))`, `hsl(var(--success))`, `hsl(var(--warning))`, `hsl(var(--destructive))`, `hsl(var(--muted-foreground))`

## Slide-over drawer pattern (framer-motion)

See `src/features/products/products-view.tsx` `ProductDrawer`. Use AnimatePresence +
motion.div overlay (z-[140]) + motion.aside (z-[141], `fixed right-0 top-0 h-full w-[480px] border-l bg-surface-overlay`).

## Color tokens (Tailwind)

bg/text/border use: background, foreground, surface(.raised/.sunken/.overlay), card,
primary, secondary, muted(.foreground), accent, border(.strong), success, warning,
destructive, info. e.g. `bg-surface`, `text-muted-foreground`, `border-border`,
`text-primary`, `bg-primary/10`. Radius via rounded-lg/xl. Use `text-2xs` for tiny labels.
