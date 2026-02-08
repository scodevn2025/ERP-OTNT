# ERP ROBOT VACUUM — PROJECT MASTER PLAN (UPDATED)
Data last updated: 2026-02-06 (code + route audit)

> **Project Goal**: ERP system for Robot Vacuum business (Inventory, Serial Tracking, Sales, Repair, Cost Accounting)
> **Current Status**: Backend SQLModel/PostgreSQL API set is **largely complete** (dashboard, inventory, serial, sales, accounting, store). Frontend is usable for most modules; main gap is the missing Repair UI page and lack of validation/tests. Legacy Mongo `server.py` still exists.

---

## PHASE 1: FOUNDATION (COMPLETED)
- [x] **Tech Stack**: FastAPI, PostgreSQL (SQLModel + AsyncPG), React 19/Tailwind/Shadcn
- [x] **Architecture**: Modular Router Pattern (`backend/routers/`)
- [x] **Auth**: JWT, RBAC (Admin, Staff, Manager, Technician) — Login/Register/Profile all working
- [x] **Frontend `.env`**: `REACT_APP_BACKEND_URL=http://localhost:8000` (was missing, fixed)

## PHASE 2: CATALOG (COMPLETED)
- [x] Categories CRUD: GET/POST/PUT/DELETE `/admin/categories`
- [x] Brands CRUD: GET/POST/PUT/DELETE `/admin/brands`
- [x] Products CRUD: GET/POST/PUT/DELETE `/admin/products`
- [x] Store product list: GET `/store/products`

## PHASE 3: INVENTORY (COMPLETED - backend)
- [x] Warehouses: GET list + POST create + GET/PUT/DELETE `/admin/warehouses/{id}`
- [x] Inventory Docs: POST create + GET list/detail `/admin/inventory/documents`
- [x] Stock Balance: GET `/admin/inventory/stock`
- [x] Stock Ledger: GET `/admin/inventory/ledger`
- Notes: inventory docs are auto-posted on create (no approve step); serial movements handled in inventory router.

## PHASE 4: SERIAL TRACKING (COMPLETED - backend & UI)
- [x] GET/POST `/admin/serials`
- [x] GET `/admin/serials/{id}`
- [x] GET `/admin/serials/{id}/movements`
- Frontend Serial page `/admin/serials` works with these endpoints.

## PHASE 5: SALES (COMPLETED - backend)
- [x] Customers: GET/POST/PUT/DELETE
- [x] Sales Orders: GET list + GET detail + POST create + confirm + complete + cancel + DELETE
- Warranty activation + stock deduction occurs on complete.

## PHASE 6: COST ACCOUNTING (COMPLETED - backend)
- [x] Accounts: GET/POST/PUT/DELETE + GET/{id}
- [x] Journal Entries: GET list/detail + POST create + POST /post + DELETE
- [x] Reports: Trial Balance, Inventory Valuation, Profit & Loss

## PHASE 7: REPAIR & WARRANTY (Backend done, frontend missing)
- [x] Backend: Full lifecycle API (8 endpoints in `routers/repair.py`)
- [ ] Frontend `RepairPage.jsx` — `/admin/repairs` currently routes to DashboardPage

## PHASE 8: DASHBOARD & SYSTEM (COMPLETED - backend)
- [x] GET `/admin/dashboard/stats`
- [x] POST `/admin/seed`
- [x] Storefront: `/store/categories`, `/store/brands`, `/store/products/{slug}`

---

## BACKEND ROUTE AUDIT (current)

### Auth — OK
`/api/auth/register`, `/login`, `/me`

### Catalog & Store — OK
- Admin: `/api/admin/categories`, `/api/admin/brands`, `/api/admin/products` (CRUD + GET/{id})
- Storefront: `/api/store/products`, `/api/store/products/{slug}`, `/api/store/categories`, `/api/store/brands`

### Inventory & Serial — OK
- Warehouses: list/create + GET/PUT/DELETE `/api/admin/warehouses/{id}`
- Inventory docs: list/create/detail/delete `/api/admin/inventory/documents`, POST `/.../{id}/post`
- Stock: `/api/admin/inventory/stock`; Ledger: `/api/admin/inventory/ledger`
- Serials: list/create `/api/admin/serials`, detail `/admin/serials/{id}`, movements `/admin/serials/{id}/movements`

### Sales — OK
- Customers: CRUD `/api/admin/customers`
- Sales Orders: list/detail/create + confirm/complete/cancel/delete `/api/admin/sales/orders`

### Accounting — OK
- Accounts: CRUD `/api/admin/accounts`
- Journal Entries: list/detail/create/delete + `/post`
- Reports: `/api/admin/reports/trial-balance`, `/inventory-valuation`, `/profit-loss`

### Repair — OK (backend)
- Tickets CRUD + actions diagnose/quote/approve/complete/deliver `/api/admin/repairs/tickets`

### Admin utilities — OK
- `/api/admin/dashboard/stats`
- `/api/admin/seed`

---

## PRIORITY FIX LIST (ordered by impact)

### P0 — Frontend coverage gap
1. Build `RepairPage.jsx` for `/admin/repairs` (backend ready)

### P1 — Quality/Validation
2. Add request validation middleware for FastAPI (pydantic schemas on inputs)
3. Add unit/integration tests (inventory → journal; sales/serial flows)

### P2 — Cleanup/UX
4. Remove legacy `backend/server.py` (MongoDB) references
5. Dashboard/UI polish to match design preview; ensure seed button wired in UI
6. Add optimistic/error handling to frontend API calls

### P3 — Backlog (from archived checklists)
7. Partner/Dealer model (wholesale, stock ownership) — see `ERP_Partner_ModelA_Wholesale_Update.md`
8. Advanced reports & go-live hardening (Week 8 checklist in MVP doc)

---

## TECHNICAL DEBT
- [ ] Remove legacy `backend/server.py` (MongoDB version)
- [ ] Add unit tests for complex flows (Inventory -> Journal)
- [ ] Add request validation middleware
- [ ] Fix ESLint warnings (useEffect dependencies in 7 pages)
