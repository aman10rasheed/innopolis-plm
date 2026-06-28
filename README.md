# Innopolis — Next-Generation PLM & BOM Platform

A premium, frontend-only desktop application for **Bill of Materials** and
**Product Lifecycle Management** — built to feel like Linear, Raycast, Notion,
Figma and modern CAD software combined. Everything runs on rich, realistic
mock data (no backend), ready for future API integration.

![Innopolis](public/brand/logo-full.png)

## Stack

- **Tauri 2** — native desktop shell (Rust)
- **Next.js 14** (App Router, **static export** — no SSR/server needed)
- **React 18 + TypeScript** (strict)
- **Tailwind CSS** + custom **shadcn/ui**-style primitives
- **TanStack Table** + **TanStack Virtual** — 1,000-row virtualized grids
- **React Three Fiber / Three.js** — interactive CAD viewer
- **Zustand** — UI / selection state (persisted layouts)
- **React Query**, **React Hook Form**, **Framer Motion**, **Recharts**, **Lucide**

## Getting started

```bash
npm install

# Web dev (browser at http://localhost:3000)
npm run dev

# Desktop app (Tauri window) — requires Rust toolchain
npm run tauri:dev

# Production static export -> ./out  (bundled by Tauri)
npm run build

# Build native desktop binaries (.app/.dmg/.exe)
npm run tauri:build
```

## What's inside

**20 fully-built, interconnected screens** powered by a deterministic mock engine
(1,000 parts · 250 assemblies · 40 products · 80 suppliers · 25 warehouses ·
300 POs · 200 engineering changes · thousands of BOM rows · multi-level revisions).

| Area | Highlights |
|------|-----------|
| **Dashboard** | Executive KPIs, cost trend, manufacturing progress, open changes, approvals, shortages, pinned projects, deadlines |
| **Parts Library** | Virtualized TanStack grid · faceted filters · grouping · column chooser · density · inline context menus · bulk actions · detail drawer (where-used / revisions / docs) |
| **BOM Explorer** | Multi-level tree · live cost rollup · duplicate detection · where-used · color-coded levels · cost-by-category donut · mass edit |
| **CAD Viewer** | R3F 3D model · **bidirectional BOM⇄3D selection** · exploded view · section · wireframe · transparency · isolate/hide · orientation cube |
| **Engineering Changes** | Drag-and-drop Kanban (Draft→Completed) with cost impact, approvals, progress |
| **Products** | Card/list views · product detail drawer (overview, assemblies, suppliers, timeline) |
| **Suppliers** | Directory + scorecards · risk scoring · performance trends · drawer |
| **Inventory** | Warehouse overview · stock table · low-stock alerts · in/out chart |
| **Procurement** | Purchase suggestions · supplier comparison · PO tracking |
| **Cost / Analytics / Reports** | Interactive charts · machine-utilization heatmap · PDF-style report previews |
| **+ more** | Assemblies, Documents (3-pane), Revisions (compare/restore), Approvals, Manufacturing, Projects, Settings |

**Global UX:** Command palette (⌘K), instant global search (⌘/), docked AI
assistant (⌘J, grounded in BOM data), notification center, toasts, context
menus, resizable/collapsible panels, persisted layout, full **dark + light** themes,
and Linear-style chord navigation (`G` then `D/P/L/B/C/E/S/I/A`).

## Architecture

```
src/
  app/            # Next.js routes (one folder per screen)
  components/
    ui/           # shadcn-style primitives (button, table, dialog, …)
    layout/       # app shell: toolbar, sidebar, inspector, status bar
    overlays/     # command palette, search, AI assistant, notifications
    shared/       # PageHeader, StatCard, Thumbnail, charts, EmptyState
    brand/        # logo
  features/       # feature modules (parts, bom, cad, changes, products, …)
  stores/         # Zustand stores (ui layout, selection)
  mock/           # deterministic data engine + selectors + series
  types/          # domain model
  constants/      # navigation, status→variant maps
  lib/ · hooks/ · providers/ · styles/
docs/PAGE_KIT.md  # canonical component/data API reference
src-tauri/        # Rust desktop shell
```

All data is generated client-side from a seeded RNG, so it's stable across
reloads and ready to be swapped for real API calls behind the `mock/db` selectors.
# innopolis-plm
