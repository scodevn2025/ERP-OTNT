# OTNT ERP - Product Requirements Document

## Original Problem Statement
Build OTNT ERP - Hệ thống ERP đa chi nhánh cho ngành robot hút bụi & gia dụng, bao gồm:
- Quản lý sản phẩm (Robot/Goods/Accessory/Part/Service) với hình ảnh và tương thích model
- Quản lý kho đa chi nhánh với Serial/IMEI tracking
- Bán hàng/POS cơ bản với kích hoạt bảo hành
- Sửa chữa/Bảo hành theo ticket
- Website hiển thị sản phẩm (Storefront)
- **Cost Accounting (Moving Average, COA, Journal Entries)**
- Tuyển dụng (basic)

## Tech Stack
- **Frontend**: React.js + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT + RBAC

## User Personas
1. **Admin/Manager**: Quản lý toàn bộ hệ thống, seed data, CRUD operations
2. **Staff**: Quản lý sản phẩm, kho, đơn hàng
3. **Technician**: Quản lý ticket sửa chữa
4. **Accountant**: Quản lý bút toán, báo cáo tài chính
5. **Customer**: Xem storefront, đặt hàng

## Core Requirements (Static)
### Week 1 - Auth + Product + Storefront ✅
- [x] JWT Authentication với RBAC
- [x] Đăng ký/Đăng nhập
- [x] Dashboard với thống kê
- [x] CRUD Categories
- [x] CRUD Brands
- [x] CRUD Products (5 types)
- [x] Public Storefront với filters
- [x] Product detail page

### Week 2 - Inventory Core ✅
- [x] Warehouses management (CRUD)
- [x] Inventory documents (nhập/xuất/chuyển kho)
- [x] Document posting workflow
- [x] Stock ledger entries
- [x] Stock balance cache

### Week 3 - Serial + Sales ✅
- [x] Serial/IMEI tracking system
- [x] Serial items CRUD with status tracking
- [x] Serial movements history
- [x] Customers management
- [x] Sales orders (create/confirm/complete/cancel)
- [x] Warranty activation on sale completion
- [x] Stock deduction on order completion
- [x] Customer stats (total orders, total spent)

### Cost Accounting Module ✅ (2026-02-06)
- [x] Moving Average Cost Engine (trong update_stock_balance)
- [x] Chart of Accounts (COA) theo chuẩn VAS
- [x] Journal Entry System (create/post/delete)
- [x] Automated Journal Posting (inventory docs, sales orders)
- [x] Financial Reports (Trial Balance, Inventory Valuation, P&L)

### Week 4 - Repair + Reports (TODO)
- [ ] Repair tickets workflow
- [ ] Parts consumption
- [ ] Repair quotes
- [ ] Advanced reports dashboard

## What's Been Implemented

### Backend APIs (95+ endpoints)
**Auth:**
- `/api/auth/register`, `/api/auth/login`, `/api/auth/me`

**Admin - Products:**
- `/api/admin/categories` - CRUD
- `/api/admin/brands` - CRUD
- `/api/admin/products` - CRUD với filters
- `/api/admin/dashboard/stats`
- `/api/admin/seed`

**Admin - Inventory:**
- `/api/admin/warehouses` - CRUD
- `/api/admin/inventory/documents` - CRUD
- `/api/admin/inventory/documents/{id}/post`
- `/api/admin/inventory/stock`
- `/api/admin/inventory/ledger`

**Admin - Serial/IMEI:**
- `/api/admin/serials` - List, Create
- `/api/admin/serials/{id}` - Get detail
- `/api/admin/serials/{id}/movements` - Movement history

**Admin - Customers:**
- `/api/admin/customers` - CRUD

**Admin - Sales:**
- `/api/admin/sales/orders` - List, Create
- `/api/admin/sales/orders/{id}` - Get detail
- `/api/admin/sales/orders/{id}/confirm`
- `/api/admin/sales/orders/{id}/complete` - Deduct stock + activate warranty + AUTO JOURNAL
- `/api/admin/sales/orders/{id}/cancel`

**Admin - Accounting (NEW):**
- `/api/admin/accounts` - CRUD Chart of Accounts
- `/api/admin/journal-entries` - CRUD Journal Entries
- `/api/admin/journal-entries/{id}/post` - Post journal entry
- `/api/admin/reports/trial-balance` - Bảng cân đối thử
- `/api/admin/reports/inventory-valuation` - Báo cáo tồn kho
- `/api/admin/reports/profit-loss` - Báo cáo lãi lỗ

**Store (Public):**
- `/api/store/products`, `/api/store/products/:slug`
- `/api/store/categories`, `/api/store/brands`

### Frontend Pages
**Admin:**
- `/admin` - Dashboard
- `/admin/products`, `/admin/categories`, `/admin/brands`
- `/admin/warehouses`, `/admin/inventory`
- `/admin/serials` - Serial/IMEI tracking
- `/admin/customers` - Customer management
- `/admin/sales` - Sales orders with warranty flow
- `/admin/accounts` - Chart of Accounts (NEW)
- `/admin/journal` - Journal Entries (NEW)
- `/admin/reports` - Financial Reports (NEW)

**Store:**
- `/`, `/products`, `/products/:slug`

### Chart of Accounts (Vietnamese Accounting Standards)
```
1 - Tài sản (Asset - Header)
  111 - Tiền mặt
  112 - Tiền gửi ngân hàng
  131 - Phải thu khách hàng
  156 - Hàng hóa (Inventory)
  157 - Hàng gửi bán

3 - Nợ phải trả (Liability - Header)
  331 - Phải trả nhà cung cấp
  333 - Thuế và phải nộp nhà nước
  334 - Phải trả người lao động

4 - Vốn chủ sở hữu (Equity - Header)
  411 - Vốn đầu tư của chủ sở hữu
  421 - Lợi nhuận chưa phân phối

5 - Doanh thu (Revenue - Header)
  511 - Doanh thu bán hàng
  512 - Doanh thu dịch vụ
  515 - Doanh thu tài chính

6 - Chi phí (Expense - Header)
  632 - Giá vốn hàng bán (COGS)
  641 - Chi phí bán hàng
  642 - Chi phí quản lý
  811 - Chi phí khác
```

### Automated Journal Posting Flow
1. **Inventory Receipt**: Post document → Create journal:
   - Debit 156 (Hàng hóa)
   - Credit 331 (Phải trả NCC)

2. **Sales Order Complete**: Complete order → Create journal:
   - Debit 111 (Tiền mặt), Credit 511 (Doanh thu) - Revenue
   - Debit 632 (GVHB), Credit 156 (Hàng hóa) - COGS

### Session Management Flow
1. App load → Check localStorage for token
2. If token exists → Call `/api/auth/me` to validate
3. If valid → Set user state, continue
4. If invalid (401) → Clear token, redirect to login
5. All API requests automatically include Bearer token

## Design System
- Dark mode "Performance Pro" theme
- Barlow Condensed headings + IBM Plex Sans body
- Electric Blue (#3b82f6) primary accent

## Prioritized Backlog

### P0 - Critical (Week 4)
- Repair tickets workflow (receive → diagnose → quote → repair → deliver)
- Parts consumption từ kho
- Repair quotes và approve

### P1 - Important
- Advanced Reports dashboard với charts
- Warranty claim tracking
- Email notifications

### P2 - Nice to Have
- Recruitment module
- QR Code scanning
- Multi-language support
- Customer Portal

## Test Credentials
- Email: testuser@example.com
- Password: password123

## Next Tasks (Week 4)
1. Repair Ticket model với workflow states
2. Ticket lines cho parts consumption
3. Repair quote generation
4. Ticket completion với parts deduction
5. Enhanced reports dashboard

## Known Issues (FIXED)
- ~~Session management unstable~~ - Fixed by adding token validation with /api/auth/me on app load
