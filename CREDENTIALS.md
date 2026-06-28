# Demo Login Credentials

Frontend-only demo accounts for the Innopolis BOM & Procurement app.
Each role sees a tailored sidebar and lands on its own home page.
The canonical source is [`src/auth/credentials.ts`](src/auth/credentials.ts).

> On the login screen you can also click any **role chip** to sign in instantly —
> no typing required.

| Role | Email | Password | Lands on | Sees |
|------|-------|----------|----------|------|
| **Administrator** | `admin@innopolis.bio` | `admin123` | Dashboard | Everything |
| **Engineering** | `engineer@innopolis.bio` | `engineer123` | Material Master | Material Master, BOM Packages/Explorer, CAD, Projects, Change Requests, Revisions, Documents |
| **Commercial** | `commercial@innopolis.bio` | `commercial123` | Approvals | Approvals, Projects, BOM Approvals, Quotation Comparison, Cost Analysis, Reports, Analytics |
| **Purchase** | `purchase@innopolis.bio` | `purchase123` | Procurement | Procurement (RFQ/PO), Vendors, BOM Approvals, Material Master (view), Inventory, Reports |
| **Stores** | `stores@innopolis.bio` | `stores123` | Inventory | Inventory, Manufacturing/Receipts, Vendors |
| **Management** | `management@innopolis.bio` | `management123` | Analytics | Dashboard, Analytics, Reports, Projects, Cost Analysis |

## Replacing with a real backend

`authenticate(email, password)` in `src/auth/credentials.ts` is the only auth
entry point. Point it at your API (return the user + role) and everything else —
the role-filtered sidebar, route guards, and per-role home — keeps working.
