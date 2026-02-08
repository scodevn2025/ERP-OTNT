# OpenMemory — ERP OTNT (project_id: ERP OTNT)

## Overview
- Stack: FastAPI + SQLModel + PostgreSQL backend (`backend/main.py`), React 19 + Tailwind + shadcn frontend (`frontend/`).
- Auth: JWT with bearer token stored in localStorage; auth endpoints under `/api/auth`.
- Data domains: Catalog, Inventory (docs/stock/ledger), Serials, Sales Orders, Accounting (COA, Journal, Reports), Repair tickets, Storefront.

## Architecture
- Backend entry: `backend/main.py` mounts routers from `backend/routers/` (auth, catalog, inventory, sales, repair, accounting, admin).
- Database config: `backend/database.py` converts `DATABASE_URL` to asyncpg and runs lightweight migrations for added columns.
- Inventory flow: `routers/inventory.py` handles warehouses CRUD, inventory documents `/admin/inventory/documents` (auto-post on create), stock balance `/inventory/stock`, ledger `/inventory/ledger`, serials list/detail/movements.
- Sales flow: `routers/sales.py` provides customers CRUD, sales orders list/detail/create/confirm/complete/cancel/delete; completion updates stock and warranty dates.
- Accounting: `routers/accounting.py` offers accounts CRUD, journal entries list/detail/create/post/delete, reports (trial balance, inventory valuation, profit-loss).
- Admin utilities: `/admin/dashboard/stats` and `/admin/seed` in `routers/admin.py`.
- Storefront APIs in `routers/catalog.py`: products list/detail, categories, brands.
- Frontend routing: `src/App.js` uses `AdminLayout`; sidebar in `src/components/layout/AdminSidebar.jsx`. Repair route currently points to Dashboard (no page).

## Components
- Backend
  - `routers/inventory.py`: inventory docs, stock ledger/balance, serials, warehouses.
  - `routers/sales.py`: customers, sales orders, serial allocation/warranty.
  - `routers/accounting.py`: COA, journals, financial reports.
  - `routers/admin.py`: dashboard stats, seed data.
  - `routers/repair.py`: repair ticket workflow endpoints (backend complete).
- Frontend
  - Dashboard: `src/pages/admin/DashboardPage.jsx` consuming `/admin/dashboard/stats`, seed button calls `/admin/seed`.
  - Serials: `src/pages/admin/SerialsPage.jsx` covers list/create/detail/movements.
  - Sales: `src/pages/admin/SalesPage.jsx` integrates serial allocation for in-stock items.
  - Repair: missing page; `/admin/repairs` currently shows Dashboard via `src/App.js`.

## Patterns / Decisions
- Inventory documents are created as `posted` immediately; no approve step yet.
- Costing uses moving-average via `update_stock_balance` inside inventory router.
- Warranty dates set on sales order completion using product `warranty_months`.
- Seed data (`/admin/seed`) inserts warehouses, categories, brands, products, stock balances, COA.
- Reference ZIP (`ERP-OTNT-main.zip`, dated 2026-02-07) contains the same frontend assets/layout but an older Mongo backend (`server.py` only, no routers); current working backend is SQLModel/PostgreSQL.
- UI: `PRODUCT_TYPES` now holds `{label, color}` keyed by lowercase product_type (robot/goods/accessory/part/service); used across admin/store pages and dashboard progress bars. Admin layout adds “Made with Emergent” badge fixed bottom-right.

## Gaps / Next Steps
- Build frontend Repair page (`/admin/repairs`) to consume existing repair APIs.
- Add request validation middleware for FastAPI inputs; strengthen error handling.
- Add automated tests (inventory→journal, sales/serial flows); improve ESLint warnings.
- Remove legacy Mongo `backend/server.py` once no longer needed.

## User Defined Namespaces
- (none defined)
