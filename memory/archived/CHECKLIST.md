# OTNT ERP - Implementation Checklist

## ✅ PHASE 1: Foundation (Week 1) - HOÀN THÀNH
- [x] JWT Authentication + RBAC
- [x] User registration/login
- [x] Admin Dashboard với KPIs
- [x] Product Management (5 types: Robot/Goods/Accessory/Part/Service)
- [x] Categories CRUD
- [x] Brands CRUD
- [x] Public Storefront với filters
- [x] Product detail page

## ✅ PHASE 2: Inventory Core (Week 2) - HOÀN THÀNH
- [x] Warehouses management (multi-branch)
- [x] Inventory documents (nhập/xuất/chuyển kho/điều chỉnh)
- [x] Document posting workflow (draft → posted)
- [x] Stock ledger entries
- [x] Stock balance cache per warehouse
- [x] Product stock sync

## ✅ PHASE 3: Serial + Sales (Week 3) - HOÀN THÀNH
- [x] Serial/IMEI tracking system
- [x] Serial items CRUD với status (available/reserved/sold/defective)
- [x] Serial movements history
- [x] Customers management
- [x] Sales orders workflow (draft → confirmed → completed/cancelled)
- [x] Warranty activation on sale completion
- [x] Stock deduction on order completion
- [x] Customer stats tracking

## ✅ PHASE 4: Cost Accounting - HOÀN THÀNH
- [x] Moving Average Cost Engine
- [x] Chart of Accounts (COA) theo chuẩn VAS
- [x] Journal Entry System (create/post/delete)
- [x] Automated Journal Posting cho inventory docs
- [x] Automated Journal Posting cho sales orders
- [x] Trial Balance Report
- [x] Inventory Valuation Report
- [x] Profit & Loss Report
- [x] **Auto-suggest templates cho bút toán** ⭐ NEW

## 🔄 PHASE 5: Repair & Service (Week 4) - IN PROGRESS
- [ ] Repair Ticket model với workflow states:
  - [ ] received → diagnosing → quoted → approved → repairing → completed → delivered
- [ ] Ticket lines cho parts/services
- [ ] Parts consumption từ kho (auto inventory issue)
- [ ] Repair quotes generation
- [ ] Customer approval workflow
- [ ] Ticket completion với parts deduction
- [ ] Repair cost tracking
- [ ] Warranty claim handling

## 📊 PHASE 6: Advanced Reports - PENDING
- [ ] Sales Reports (daily/weekly/monthly)
- [ ] Inventory Movement Report
- [ ] Warranty Status Report
- [ ] Repair Performance Report
- [ ] Customer Analytics
- [ ] Charts/Graphs dashboard

## 🔮 FUTURE PHASES (Backlog)
- [ ] Customer Portal (self-service)
- [ ] Public Warranty Check page
- [ ] Purchase Order module
- [ ] Supplier Management
- [ ] Email Notifications
- [ ] SMS Integration
- [ ] Multi-language support
- [ ] Mobile App (React Native)
- [ ] HRM Module (recruitment, attendance)
- [ ] QR Code scanning

---

## 📝 Technical Debt / Refactoring
- [ ] Split server.py into modules (auth, inventory, sales, accounting)
- [ ] Add API rate limiting
- [ ] Add request validation middleware
- [ ] Optimize MongoDB indexes
- [ ] Add caching layer (Redis)
- [ ] Add logging and monitoring
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] API documentation (Swagger/OpenAPI)

---

## 🔐 Admin Credentials
```
Email: admin@otnt.vn
Password: Admin@123
```

## 🧪 Test Credentials
```
Email: testuser@example.com
Password: password123
```

---

## Auto-Suggest Templates (Bút toán)

### Phiếu bán hàng (sales)
| TK | Mô tả | Nợ | Có |
|---|---|---|---|
| 111 | Thu tiền bán hàng | ✓ | |
| 511 | Doanh thu bán hàng | | ✓ |
| 632 | Giá vốn hàng bán | ✓ | |
| 156 | Xuất kho hàng hóa | | ✓ |

### Phiếu mua hàng (purchase)
| TK | Mô tả | Nợ | Có |
|---|---|---|---|
| 156 | Nhập kho hàng hóa | ✓ | |
| 331 | Phải trả nhà cung cấp | | ✓ |

### Phiếu kho (inventory)
| TK | Mô tả | Nợ | Có |
|---|---|---|---|
| 156 | Nhập kho hàng hóa | ✓ | |
| 331 | Phải trả NCC | | ✓ |

### Điều chỉnh (adjustment)
| TK | Mô tả | Nợ | Có |
|---|---|---|---|
| 156 | Điều chỉnh hàng tồn kho | ✓ | |
| 811 | Chi phí điều chỉnh | | ✓ |
