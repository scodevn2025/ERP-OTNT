# ERP ROBOT VACUUM — MVP ROADMAP (8 WEEKS) — SIÊU CHI TIẾT + CHECKLIST
Ngày tạo: 2026-02-06

> Mục tiêu MVP 8 tuần: vận hành **kho + bán robot theo serial + phụ kiện/linh kiện + sửa chữa/bảo hành** + website catalog cơ bản.  
> Không làm (để sau): kế toán/GL, CRM, multi-tenant SaaS, tích hợp sàn TMĐT.

---

## 0) Nguyên tắc triển khai MVP (để ra nhanh nhưng không nát)
### 0.1 Definition of Done (DoD) cho mỗi module
- [x] Có DB schema + migration + seed tối thiểu
- [x] Có API endpoints + validation + permission check
- [x] Có UI CRUD (grid + form) dùng được
- [x] Có log/audit tối thiểu cho action quan trọng
- [x] Có test kịch bản E2E (ít nhất 5 case/module)
- [x] Có tài liệu vận hành ngắn (SOP 1 trang/module)

### 0.2 Quy tắc dữ liệu bắt buộc (ngành robot)
- Robot & linh kiện quan trọng: **track serial/IMEI**
- Phụ kiện/linh kiện tiêu hao: theo SKU số lượng
- Kho: chỉ cập nhật tồn khi chứng từ **POSTED**
- Sửa chữa: linh kiện sử dụng phải **xuất kho theo ticket**

### 0.3 Vai trò (roles) MVP
- Admin: full permission
- Warehouse Staff: tạo/submit chứng từ, không post
- Branch Manager: approve/post theo chi nhánh
- Technician: xử lý repair ticket, đề xuất parts/service
- Cashier/Sales: tạo sales order, allocate serial, deliver

---

## 1) Kế hoạch tổng thể theo tuần
- **Week 1:** Foundation + Auth/RBAC + Branch/Warehouse
- **Week 2:** Product Master + Catalog Storefront
- **Week 3–4:** Inventory Core (Documents + Ledger + Stock Balance + Reports basic)
- **Week 5:** Serial/IMEI + Sales POS (deliver + warranty)
- **Week 6–7:** Repair/Warranty + Issue parts + lịch sử theo serial
- **Week 8:** Stabilization + Dashboard + Go-live

---

# WEEK 1 — FOUNDATION (Auth + RBAC + Org/Branch/Warehouse)
## Deliverables
- Admin login
- RBAC + branch scope middleware
- CRUD Company/Branch/Warehouse
- Layout Admin + navigation + basic UI components
- Logging framework

## Checklist kỹ thuật
### 1.1 Repo & DevOps
- [x] Tạo repo/monorepo (admin + storefront) hoặc 1 app với route group
- [x] Thiết lập env: `.env.local`, `.env.staging`
- [x] Docker compose (postgres) hoặc hướng dẫn setup local
- [x] ESLint/Prettier + lint-staged + husky
- [x] CI pipeline (build + lint) cho staging

### 1.2 Database baseline (Prisma)
- [x] Setup Prisma + connection pooling (pgbouncer nếu cần, để sau)
- [x] Migrations flow: dev → staging
- [x] Seed: company, 2 branches, 2 warehouses, 1 admin user

### 1.3 Auth
- [x] Login (email/password) + session cookie
- [x] Middleware protect admin routes
- [x] Logout
- [x] Password hashing (bcrypt/argon2)

### 1.4 RBAC + Branch scope
- [x] Tables: roles, permissions, user_roles, user_branch_scopes
- [x] Permission keys (MVP):
  - [x] product.read/product.write
  - [x] inventory.read/inventory.write/inventory.approve/inventory.post
  - [x] serial.read/serial.write
  - [x] sales.read/sales.write/sales.deliver
  - [x] repair.read/repair.write/repair.issue_parts/repair.deliver
- [x] Helper `requirePermission(permissionKey, branchId)`
- [x] Scope rules:
  - [x] write requires write scope
  - [x] approve/post requires approve scope

### 1.5 Org/Branch/Warehouse CRUD
- [x] Company view (read-only)
- [x] Branch CRUD + code unique
- [x] Warehouse CRUD + unique (branch_id, code)

## UI (Admin) — pages
- [x] /admin/login
- [x] /admin (dashboard placeholder)
- [x] /admin/settings/branches
- [x] /admin/settings/warehouses
- [x] /admin/settings/users (basic list + assign roles/scopes)

## Acceptance tests (Week 1)
- [x] Admin login ok
- [x] User không có quyền bị chặn 403
- [x] Staff chỉ thấy branch trong scope
- [x] Tạo branch + warehouse ok

---

# WEEK 2 — PRODUCT MASTER + STOREFRONT CATALOG
## Deliverables
- CRUD Products/Variants/Images
- Product types: robot/goods/accessory/part/service
- Robot Models + compatibility tags
- Storefront hiển thị list/detail

## 2.1 Data model checklist
- [x] categories (nested optional)
- [x] brands
- [x] models (robot series/model)
- [x] products:
  - [x] type enum
  - [x] slug unique
  - [x] track_serial boolean
  - [x] warranty_months
  - [x] is_active
- [x] product_variants:
  - [x] sku unique
  - [x] barcode optional
  - [x] base_price
- [x] product_images
- [x] product_compatibilities (product_id ↔ model_id)

## 2.2 API checklist
### Admin APIs
- [x] GET/POST /api/admin/categories
- [x] GET/POST /api/admin/brands
- [x] GET/POST /api/admin/models
- [x] GET/POST /api/admin/products
- [x] GET/PUT /api/admin/products/:id
- [x] POST /api/admin/products/:id/images (upload)
- [x] POST /api/admin/products/:id/compatibilities (bulk set)
- [x] POST /api/admin/products/import (CSV) — optional nếu kịp

### Storefront APIs
- [x] GET /api/store/products (filter/search/page)
- [x] GET /api/store/products/:slug
- [x] GET /api/store/categories
- [x] (optional) GET /api/store/models (filter UI)

## 2.3 UI (Admin)
- [x] Products list (filter type/brand/category/is_active)
- [x] Product create/edit (tabs)
  - [x] Info (name, slug, type, warranty, track_serial)
  - [x] Variants (SKU/barcode/price)
  - [x] Images (upload, reorder)
  - [x] Compatibility (choose robot models)

## 2.4 UI (Storefront)
- [x] /products (list + filters + pagination)
- [x] /products/[slug] (detail: images, price, compatibility tags)
- [x] SEO metadata basic

## Acceptance tests (Week 2)
- [x] Create product robot with track_serial=true
- [x] Create accessory and map compatible models
- [x] Storefront filter by model shows correct accessories
- [x] Inactive product not shown on storefront

---

# WEEK 3–4 — INVENTORY CORE (Documents + Ledger + Stock Balance)
## Deliverables
- Inventory documents: purchase_in, sale_out, transfer_in/out, adjust_in/out
- Workflow: draft → submit → approve → post
- Stock ledger + stock balance cache
- Report basic: Stock balance + NXT

> Khuyến nghị costing MVP: Moving Average.

## 3.1 Data model checklist
- [x] warehouses already done
- [x] inventory_documents:
  - [x] type enum
  - [x] status enum
  - [x] code generator (branch + type + year + seq)
  - [x] created_by/approved_by/posted_at
- [x] inventory_document_lines (qty, unit_cost)
- [x] stock_ledger (in/out, qty, unit_cost, ref_doc_id)
- [x] stock_balance (on_hand/reserved/available)

## 3.2 API checklist (Inventory)
- [x] POST /api/admin/inventory/documents
- [x] GET /api/admin/inventory/documents (filter by type/status/date)
- [x] GET /api/admin/inventory/documents/:id
- [x] PUT /api/admin/inventory/documents/:id (only draft)
- [x] POST /api/admin/inventory/documents/:id/submit
- [x] POST /api/admin/inventory/documents/:id/approve
- [x] POST /api/admin/inventory/documents/:id/post
- [x] POST /api/admin/inventory/documents/:id/cancel (policy decide)

## 3.3 Business rules checklist (POST engine)
- [x] Must be approved before post
- [x] Use DB transaction
- [x] Prevent negative stock for non-adjust_out types
- [x] Update stock_ledger for each line
- [x] Update stock_balance (upsert)
- [x] Locking strategy:
  - [x] Use `SELECT ... FOR UPDATE` on stock_balance row (or equivalent)
- [x] Costing:
  - [x] purchase_in updates avg cost (store in variant_cost table OR compute from ledger)
  - [x] sale_out uses current avg cost

## 3.4 UI checklist (Inventory)
- [x] Inventory documents list
- [x] Create document form:
  - [x] choose branch + warehouse
  - [x] type
  - [x] add lines (SKU search)
  - [x] qty + unit_cost (for inbound)
- [x] Document detail view:
  - [x] status badge
  - [x] action buttons submit/approve/post (based on permission)
  - [x] audit log section

## 3.5 Reports
- [x] Stock balance page (filter branch/warehouse/search SKU)
- [x] NXT report:
  - [x] date range
  - [x] group by SKU
  - [x] opening, in, out, closing

## Acceptance tests (Week 3–4)
- [x] purchase_in posted increases on_hand
- [x] sale_out posted decreases on_hand
- [x] transfer_out decreases warehouse A, transfer_in increases warehouse B
- [x] adjust_out can make stock negative only if allowed (define policy)
- [x] report NXT matches ledger totals

---

# WEEK 5 — SERIAL/IMEI + SALES POS (Robot theo từng chiếc)
## Deliverables
- Import serial robot batch
- Allocate serial khi bán
- Deliver tạo sale_out + post
- Warranty auto activation theo serial

## 5.1 Data model checklist
- [x] serial_items (serial_no unique, status, branch_id, warehouse_id)
- [x] serial_movements (history)
- [x] sales_orders + lines
- [x] sales_serial_allocations (line ↔ serial_item)

## 5.2 Serial rules checklist
- [x] Serial status lifecycle:
  - [x] in_stock_new / in_stock_open_box / in_stock_refurb
  - [x] sold / returned / in_repair / defective / scrap
- [x] Cannot allocate serial not in stock
- [x] Cannot allocate same serial to 2 orders
- [x] When sale delivered: status → sold, set warranty_start/end, last_customer_id

## 5.3 API checklist
- [x] POST /api/admin/serial/import (CSV)
- [x] GET /api/admin/serial (search, status, branch)
- [x] GET /api/admin/serial/:id

- [x] POST /api/admin/sales/orders
- [x] GET /api/admin/sales/orders
- [x] GET /api/admin/sales/orders/:id
- [x] POST /api/admin/sales/orders/:id/confirm
- [x] POST /api/admin/sales/orders/:id/deliver
  - [x] validates serial allocations
  - [x] creates inventory_document sale_out
  - [x] posts inventory_document

## 5.4 UI checklist (Sales/POS)
- [x] Sales orders list
- [x] Create order:
  - [x] customer create/select
  - [x] add lines by SKU/barcode
  - [x] allocate serial modal for robot lines
- [x] Deliver flow + print invoice (optional)
- [x] Serial lookup from POS (search serial)

## Acceptance tests (Week 5)
- [x] Import 100 serial ok
- [x] Deliver order fails if missing serial allocation
- [x] Deliver order sets warranty dates correctly
- [x] Serial cannot be sold twice

---

# WEEK 6–7 — REPAIR/WARRANTY (Ticket + Quote + Issue Parts)
## Deliverables
- Repair ticket workflow
- Quote parts + service
- Issue parts creates inventory out doc and posts
- Repair history per serial/customer

## 6.1 Data model checklist
- [ ] repair_tickets (status machine)
- [ ] repair_diagnosis (symptoms/root cause + attachments)
- [ ] repair_parts (parts list)
- [ ] repair_services (labor)
- [ ] repair_quotes (approval)
- [ ] repair_logs (timeline)

## 6.2 Workflow checklist
- [ ] received → diagnosing
- [ ] diagnosing → waiting_approval (quote sent)
- [ ] waiting_approval → repairing (quote approved)
- [ ] repairing → ready
- [ ] ready → delivered

## 6.3 Warranty logic checklist
- [ ] Ticket reads warranty_end from serial_item
- [ ] If now <= warranty_end → suggest warranty_claim=true
- [ ] If warranty claim approved:
  - [ ] parts/labor cost internal (still track cost, but customer pays 0)
- [ ] If out of warranty:
  - [ ] quote totals must match payment

## 6.4 Issue parts checklist
- [ ] Only allowed in status repairing
- [ ] Creates inventory_document type=repair_issue_parts
- [ ] Lines = repair_parts
- [ ] Post immediately (or approve+post based on policy)
- [ ] Link doc_id to ticket log

## 6.5 APIs checklist
- [ ] POST /api/admin/repairs/tickets
- [ ] GET /api/admin/repairs/tickets (filter status)
- [ ] GET /api/admin/repairs/tickets/:id
- [ ] POST /api/admin/repairs/tickets/:id/diagnose
- [ ] POST /api/admin/repairs/tickets/:id/quote
- [ ] POST /api/admin/repairs/tickets/:id/quote/approve
- [ ] POST /api/admin/repairs/tickets/:id/issue-parts
- [ ] POST /api/admin/repairs/tickets/:id/mark-ready
- [ ] POST /api/admin/repairs/tickets/:id/deliver

## 6.6 UI checklist (Repair)
- [ ] Tickets board (Kanban) by status
- [ ] Ticket create:
  - [ ] customer info
  - [ ] serial lookup (optional)
  - [ ] symptoms + attachments
- [ ] Ticket detail:
  - [ ] status actions
  - [ ] diagnosis section
  - [ ] quote builder (parts + labor)
  - [ ] issue parts modal (select warehouse)
  - [ ] payment section (optional MVP)
  - [ ] timeline log

## Acceptance tests (Week 6–7)
- [ ] Ticket cannot move to repairing without approved quote
- [ ] Issue parts reduces stock_balance
- [ ] Ticket history shows parts issued with doc link
- [ ] Warranty claim ticket totals customer=0 (if chosen)

---

# WEEK 8 — STABILIZATION + DASHBOARD + GO-LIVE
## Deliverables
- Fix bugs, harden permissions
- Minimal dashboards
- Backup/restore tested
- SOP vận hành cho kho/sales/repair
- Go-live checklist

## 8.1 Hardening checklist
- [ ] Audit all endpoints permission + branch scope
- [ ] Add request validation (Zod) everywhere
- [ ] Add global error handling + toast messages
- [ ] Add optimistic UI/Query invalidation strategy
- [ ] Performance: add indexes for SKU/slug/serial and doc filters

## 8.2 Dashboard (basic)
- [ ] Cards:
  - [ ] total stock items
  - [ ] low stock SKUs
  - [ ] open repair tickets
  - [ ] sales today (optional)
- [ ] Stock chart optional

## 8.3 Go-live checklist (kỹ thuật)
- [ ] Staging smoke test (all flows)
- [ ] Backup schedule (daily)
- [ ] Restore drill (test restore to new DB)
- [ ] Admin user rotation + password policy
- [ ] Logging retention policy

## 8.4 Go-live checklist (nghiệp vụ)
- [ ] SOP kho: nhập, xuất, chuyển kho, kiểm kho
- [ ] SOP sales: tạo đơn, allocate serial, deliver
- [ ] SOP repair: tiếp nhận, báo giá, issue parts, bàn giao
- [ ] Training 1 buổi cho staff

---

# 2) BỘ TEST CASES E2E (MVP)
## Inventory (10 cases)
- [ ] IN-01: purchase_in posted → on_hand tăng đúng
- [ ] IN-02: sale_out posted → on_hand giảm đúng
- [ ] IN-03: transfer out/in giữa 2 kho cùng branch
- [ ] IN-04: transfer giữa 2 branch (nếu có)
- [ ] IN-05: post fails khi thiếu quyền inventory.post
- [ ] IN-06: post fails khi stock âm (policy)
- [ ] IN-07: cancel (nếu cho) rollback ledger & balance
- [ ] IN-08: NXT report khớp ledger
- [ ] IN-09: concurrent post không làm lệch tồn (locking)
- [ ] IN-10: import lines 200 items vẫn chạy ổn

## Serial (8 cases)
- [ ] SR-01: import serial duplicates bị reject
- [ ] SR-02: allocate serial not in stock bị chặn
- [ ] SR-03: allocate serial already reserved bị chặn
- [ ] SR-04: deliver sets status sold + warranty dates
- [ ] SR-05: repair ticket sets status in_repair
- [ ] SR-06: cannot sell serial in_repair
- [ ] SR-07: serial movement history đúng
- [ ] SR-08: return flow (optional) chuyển status returned

## Repair (10 cases)
- [ ] RP-01: received → diagnosing ok
- [ ] RP-02: diagnosing → waiting approval tạo quote
- [ ] RP-03: approve quote → repairing ok
- [ ] RP-04: issue parts creates inventory out doc
- [ ] RP-05: issue parts fails nếu thiếu tồn kho
- [ ] RP-06: warranty claim sets customer payable=0
- [ ] RP-07: delivered closes ticket
- [ ] RP-08: history per serial shows all tickets
- [ ] RP-09: attach images ok
- [ ] RP-10: technician permission boundaries ok

## Storefront (6 cases)
- [ ] ST-01: list pagination ok
- [ ] ST-02: filter by category ok
- [ ] ST-03: filter by compatible model ok
- [ ] ST-04: product inactive hidden
- [ ] ST-05: SEO metadata generated
- [ ] ST-06: cache revalidate behaves

---

# 3) BACKLOG (SAU MVP — ưu tiên)
## Priority P1
- [ ] Stock reservation theo sales order (reserved qty)
- [ ] Purchase order / supplier module
- [ ] Return/RMA flow đầy đủ
- [ ] Repair payments + invoice
- [ ] Advanced serial statuses (open-box/refurb grading)

## Priority P2
- [ ] HR recruitment module
- [ ] Technician performance dashboard
- [ ] Customer portal xem trạng thái sửa chữa

## Priority P3
- [ ] Integrations sàn TMĐT
- [ ] Mobile app kỹ thuật
- [ ] AI recommend phụ kiện theo model

---

# 4) BẢNG PHÂN CÔNG (Gợi ý cho team nhỏ)
Nếu 1 dev fullstack:
- Week 1–2: auth+product+catalog
- Week 3–4: inventory engine
- Week 5: serial+sales
- Week 6–7: repair
- Week 8: stabilize + go-live

Nếu 2 dev:
- Dev A: inventory+serial+sales
- Dev B: product+storefront+repair UI

---

# END
