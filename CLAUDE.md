# CLAUDE.md — Innopolis BOM & Procurement

Context file for AI assistants working on this repo. Read this first, then
[`docs/PAGE_KIT.md`](docs/PAGE_KIT.md) for the exact component/util/data API.

---

## 1. What this is

A **frontend-only desktop app** implementing the *Innopolis Bio Innovations
BOM & Procurement Module* (an engineering-procurement PLM for a process/biotech
EPC company). It models the full lifecycle **customer enquiry → quotation →
project order → engineering → BOM → approval → RFQ → PO → material receipt →
inventory**. No backend — everything runs on an in-memory mock database.

The build target is a **Tauri 2 desktop app** wrapping a **Next.js static export**.

## 2. Tech stack & hard constraints

- **Tauri 2** (Rust shell, `src-tauri/`) + **Next.js 16** App Router in **static-export mode** (`output: "export"` → `./out`). **React 19**, **TypeScript** (strict).
- **Tailwind CSS v3** + custom shadcn-style primitives in `src/components/ui/`.
- **Zustand** (state, some persisted to localStorage), **Framer Motion** (animation), **TanStack Table + Virtual** (Material Master grid), **React Three Fiber / three** (CAD viewer), **Recharts** (charts), **React Hook Form + Zod** (create/edit forms), **cmdk** (command palette), **lucide-react** (icons), **next-themes** (dark/light).
- **No SSR / no server**: every page is `"use client"`. Don't use server components, server actions, route handlers, or `next/image` optimization. Avoid `useSearchParams` (needs Suspense under export) — read `window.location.search` in an effect instead (see `app/project-details/page.tsx`).
- **In-memory data**: created/edited records persist for the **session only** and reset on a full reload. This is expected for the demo.

## 3. Run / build

```bash
npm install
npm run dev            # browser dev at http://localhost:3000
npm run build          # static export -> ./out  (also the Tauri payload)
npm run tauri:dev      # native window (needs Rust toolchain)
npx tsc --noEmit       # typecheck (run this after changes)
```
After `npm run build`, serve `./out` (e.g. `npx serve out`) to test the real
static export — client navigation/RBAC behave like the shipped app there, unlike
some dev-server quirks.

## 4. Architecture / folder map

```
src/
  app/<route>/page.tsx   # one folder per screen (all "use client")
  auth/credentials.ts    # demo login accounts + roles (single auth seam)
  components/
    ui/                  # shadcn-style primitives (button, dialog, table, select, context-menu, toast, …)
    layout/              # app-shell, top-toolbar, sidebar, inspector, status-bar, theme-toggle
    overlays/            # command-palette, search-dialog, ai-assistant, notification-center
    shared/              # page-header, stat-card, thumbnail, charts, empty-state, kbd, form-fields
    auth/                # login-screen
    brand/               # logo
  features/<name>/       # feature modules (parts, bom, cad, changes, bom-approvals, procurement, products, project-details, create, …)
  stores/                # zustand: ui-store, auth-store, selection-store
  mock/                  # generate.ts (seeded data), db.ts (singleton + selectors + CRUD), pools.ts, series.ts
  types/index.ts         # the domain model (source of truth for shapes)
  constants/             # navigation.ts (+ RBAC helpers), status.ts (status→Badge variant maps)
  lib/utils.ts           # cn, formatCurrency/Number/Date, timeAgo, seededRandom, etc.
  styles/globals.css     # design tokens (light/dark) + print stylesheet
docs/PAGE_KIT.md         # canonical UI/data API — import ONLY from what it lists
src-tauri/               # Rust desktop shell + tauri.conf.json + icons
```

## 5. Domain model (`src/types/index.ts` is authoritative)

- **Part** = a *Material Master* record. Identified by an **intelligent code `TT-SS-MM-DDDD`** (Type-Subtype-MajorSpec-DetailSpec, e.g. `MB-VA-15-3040`). 14 fixed `PartCategory` values (Mechanical Bought-out, Piping, Field Instruments, Reagents, …). Has commercial (cost, last purchase price, lead time, vendor) + inventory (min/max stock, location) fields.
- **Product** = a **Project** (customer-enquiry driven): `projectNumber` (`INP-2026-xxxx`), `customer`, `engineerId`, `stage` (`ProjectStage`: Enquiry → … → Fulfilment → Completed), `unitCost` (estimated), `msrp` (quoted), `marginPct`.
- **BOM is project-based & flat** (no Assembly entity): `db().projectBomLines[productId]` is a list of `{refId, qty, refDes}` part edges. Build it with `buildProjectBom(productId)`; cost via `projectRolledCost(productId)`.
- **ProjectBom** = a BOM document in the approval workflow (`BomStage`: Draft → Technical Review → Commercial Review → Approved → Released for Purchase) with an `audit[]` trail.
- **Eco** = a Material Change Request (MCR) on the Change Requests Kanban (`EcoStatus`: Draft/Review/Approved/Released/Completed).
- **Supplier** = a **Vendor** (gstVat, paymentTerms, categoriesSupplied, approved, ratings).
- **Rfq / Quotation** = procurement (5 `RfqMode`s; quotation comparison).
- Also: Revision, DocItem, Warehouse, InventoryRecord, PurchaseOrder, Approval, Activity, Notification, User.
- **Mock data is intentionally small** — generators in `mock/generate.ts` emit ~3 of each entity (4 users). Bump the `range(3)` / `.slice(0,3)` counts there to scale up.

## 6. Data layer (`src/mock/db.ts`)

`db()` returns the memoized singleton DB (`db().parts`, `.products`, `.suppliers`, `.ecos`, `.projectBoms`, `.rfqs`, `.quotations`, `.purchaseOrders`, `.inventory`, `.warehouses`, `.documents`, `.revisions`, `.approvals`, `.activities`, `.notifications`, `.users`, `.projectBomLines`).

Selectors: `getUser/getSupplier/getPart/getProduct(id)`.
BOM: `buildProjectBom(id)`, `flattenBom(node, expandedSet)`, `whereUsed(refId)`, `projectRolledCost(id)`, `totalRolledCost()`, `rootProjects()`.
Mutations (these are the **backend seam** — swap for API calls):
`addProduct/addEco/addPurchaseOrder/addProjectBom/addSupplier/addRevision/addDocument/addWarehouse`,
`updateEco/deleteEco`, `updateProjectBom/deleteProjectBom`.
Boards keep local React state authoritative AND call these so changes persist across in-session navigation.

## 6.5 Backend integration layer (`src/lib/api/`)

The real backend contract is [`docs/API_GUIDE.md`](docs/API_GUIDE.md) (snake_case,
numbers-as-strings, JWT). A complete, typed client layer maps it onto the app:

- `client.ts` — `apiFetch` (injects JWT, parses `{success,data,meta}` envelope, throws `ApiError`, 401 → `logout`), `toNumber()`, `tokenStore`, and the `USE_API` / `API_BASE` config from env.
- `types.ts` — API DTOs (snake_case) for every resource.
- `endpoints.ts` — one typed fn per route under a single `api` object (`api.parts.list`, `api.boms.transition`, …).
- `mappers.ts` — snake→camel converters to the **same `@/types` shapes** the UI already uses, so screens stay shape-stable across mock/real.
- `hooks.ts` — React Query hooks (`useParts`, `useBoms`, `useTransitionBom`, `useReceivePo`, …) with mapped results + invalidation. **Screens should consume these.**
- Import via the barrel: `import { useParts, api } from "@/lib/api"`.

**Data-source toggle:** `NEXT_PUBLIC_USE_API` (`.env.example`). `false` (default) =
bundled mock db, runs offline; `true` = real backend (login hits the API, JWT
stored, 401 auto-logout). Auth is wired in `stores/auth-store.ts` (`loginRemote`)
and `components/auth/login-screen.tsx` branches on `USE_API`.

**Migrating a screen:** swap its `db()` reads for the matching hook (e.g.
`/parts` → `useParts(filters)`), and its mock mutations for the mutation hooks
(`useCreatePart`, etc.). The mappers already return the shapes components expect.
The mock `db.ts` mutation helpers and these API hooks are intentionally parallel.

## 7. Auth & RBAC

- **Login gate** lives in `components/layout/app-shell.tsx`: if `useAuthStore().user` is null → render `<LoginScreen>`; otherwise render the shell. A route guard (`canAccess`) shows a "Restricted area" panel for disallowed paths.
- **Accounts** are in `src/auth/credentials.ts` (also documented in `CREDENTIALS.md`). 6 roles: **Administrator, Engineering, Commercial, Purchase, Stores, Management**. `authenticate(email,password)` is the single auth entry point — point it at a real API later.
- Login screen has email/password **and** one-click role chips; each role lands on `ROLE_META[role].home`.
- **Sidebar is role-filtered** via `navForRole(role)`; nav items carry a `roles?: Role[]` (see `constants/navigation.ts`).

## 8. Routes (all under `src/app/`, all client)

`/` dashboard (role-aware banner) · `/products` Projects (lifecycle pipeline + drawer) · `/project-details` **Proforma invoice / project details** (printable, `?p=<id>`) · `/parts` Material Master (TanStack grid + code-builder create dialog) · `/bom` BOM Explorer · `/cad` CAD Viewer (R3F, dynamic `ssr:false`) · `/documents` · `/bom-approvals` BOM Approval Kanban (drag + full CRUD) · `/changes` Change Requests Kanban (drag + full CRUD) · `/revisions` · `/approvals` · `/suppliers` Vendors · `/procurement` (RFQ / Quotation Comparison / PO tabs) · `/manufacturing` · `/inventory` · `/cost` · `/analytics` · `/reports` · `/settings`.

## 9. UI conventions (see `docs/PAGE_KIT.md` for the full API)

- Page = `"use client"`, starts with `<PageHeader title icon actions/>`, content in `min-h-0 flex-1`, scroll regions use `<ScrollArea>`. Numbers get `className="tabular"`.
- Import **only** from the modules listed in PAGE_KIT.md. Status→`<Badge>` variant maps live in `constants/status.ts` (`LIFECYCLE_VARIANT`, `BOM_STAGE_VARIANT`, `RFQ_STATUS_VARIANT`, `PROJECT_STAGE_VARIANT`, `PRIORITY_VARIANT`, `PO_STATUS_VARIANT`, …).
- Avatars: `AvatarFallback` with `style={{background:'hsl('+hue+' 55% 22%)', color:'hsl('+hue+' 80% 76%)'}}`.
- **Create dialogs** are centralized in `features/create/create-dialogs.tsx` (mounted once via `CreateDialogsHost` in the app shell), opened through `ui-store` flags (`setCreateBomOpen`, `setCreateProductOpen`, `setCreateEcoOpen`, `setCreatePoOpen`, `setCreateVendorOpen`, …). The **Material** create dialog (with the live `TT-SS-MM-DDDD` code builder) is separate in `features/parts/create-part-dialog.tsx`. The sidebar "Create" menu + ⌘K surface these.
- **Toasts**: `toast.success/error/warning/info(title, desc?)` or `toast({title, description, variant, action})`.
- **Print**: `globals.css` has an `@media print` block that hides app chrome and prints only `.print-sheet` (used by the proforma invoice). Trigger with `window.print()`.

## 10. Gotchas

- Don't reintroduce an **Assembly** entity — BOM is deliberately flat (project → parts).
- Currency: the app generally uses `formatCurrency` (USD `$`); the proforma invoice (`features/project-details/project-invoice.tsx`) intentionally uses **₹ INR** with an Indian crore/lakh words helper. Keep new finance UI consistent with its page.
- R3F `<Canvas>` must stay behind a `dynamic(() => …, { ssr:false })` import (see `features/cad/cad-viewer.tsx`) — it breaks static prerender otherwise.
- `Math.random()`/`Date.now()` are fine in app code, but mock **generation** uses a seeded RNG (`seededRandom`) for stable data — keep generators deterministic.
- After any change: `npx tsc --noEmit` then `npm run build`. The codebase is currently clean on both.

## 11. Known loose ends / good next tasks

- Created records reset on full reload (no persistence) — wire the `mock/db.ts` mutation helpers to a real API.
- FRD items not yet built: material-creation **request/approval** (vs. direct create), goods-receipt **batch/inspection** capture, and **enforced** role permissions on create actions (roles gate nav + routes, not yet every button).
- A stray `src/features/projects/` folder exists alongside the canonical `src/features/products/` (the Projects page uses `products/products-view.tsx`).
