# ERP — Đối tác/Đại lý mô hình A (Wholesale / Ownership Transfer)
Ngày tạo: 2026-02-06

> Mục tiêu: Đối tác **nhập hàng của bạn** (mua đứt/ chuyển quyền sở hữu). Bạn **chỉ cần chuyển kho/bán sỉ** cho đối tác.  
> Khách đặt hàng trên “store” của đối tác (hoặc kênh đối tác), **bạn vẫn nắm được đơn** (central order), và đối tác **tự xuất/ship** từ kho của họ.

Tài liệu này là **bản update** để bổ sung vào roadmap MVP 8 tuần và module kế toán Level 2.  
- Roadmap MVP 8 tuần: fileciteturn1file0L24-L33  
- Kế toán Level 2 (COGS, AR/AP, Journal): fileciteturn1file1L5-L28  

---

## 1) Khái niệm & phạm vi

### 1.1 Wholesale (mô hình A) — định nghĩa
- Khi bạn “cấp hàng” cho đối tác = **bán sỉ / chuyển quyền sở hữu**
- Hàng sau khi chuyển đi: **tồn thuộc đối tác**
- Đối tác tự:
  - quản lý tồn kho của họ
  - tự xuất kho giao khách
  - tự quản lý giá bán lẻ (nếu bạn cho phép)
- Bạn vẫn nắm được:
  - doanh số/đơn hàng theo đối tác (central order)
  - lịch sử serial (nếu robot)
  - công nợ đối tác (AR)

### 1.2 MVP cho mô hình A
Bắt buộc:
- Partner/Dealer entity + user portal
- Kho của đối tác + stock balance theo owner=partner
- Chứng từ **Sell-to-Partner** (bán sỉ) + cost/COGS
- Đơn hàng gắn `partner_id` + đối tác fulfillment
- Báo cáo công nợ & đối soát cơ bản

---

## 2) Kiến trúc luồng nghiệp vụ (End-to-End)

### 2.1 Bán sỉ / Chuyển quyền sở hữu cho đối tác
1) Bạn tạo chứng từ **SELL_TO_PARTNER**
2) Hệ thống:
   - trừ kho công ty
   - tăng kho đối tác
   - ghi **AR đối tác**
   - ghi **COGS** (giá vốn xuất khỏi kho công ty)
   - ghi **Revenue** (doanh thu bán sỉ)
3) Nếu robot có serial: serial chuyển sang **owner=partner**

### 2.2 Khách đặt hàng trên “store của đối tác”
Khuyến nghị MVP: 1 website chung, URL theo partner:
- `/d/{partnerSlug}/products`
- `/d/{partnerSlug}/products/{slug}`
- `/d/{partnerSlug}/checkout`

Luồng:
1) Khách chọn đối tác → thấy catalog/giá/tồn của partner  
2) Khách đặt đơn → Order tạo trong hệ thống trung tâm với `partner_id`  
3) Partner portal nhận đơn → xác nhận → đóng gói → ship  
4) Khi ship: tạo chứng từ **PARTNER_SALE_OUT** trừ tồn partner  

### 2.3 “Bạn nắm đơn” nghĩa là gì?
- Central order database: bạn xem toàn bộ đơn theo partner
- Có dashboard & export dữ liệu
- Có thể khóa/mở catalog partner, giới hạn SKU

---

## 3) Data Model (DB) — bổ sung cho mô hình A

### 3.1 Partners/Dealers
**partners**
- id, company_id
- code (unique), name, slug (unique)
- status: active|inactive
- default_price_policy: use_partner_price|use_company_price
- created_at

**partner_users**
- partner_id, user_id, role: owner|staff

**partner_warehouses**
- partner_id, code, name, address

### 3.2 Stock ownership: tồn thuộc ai?
Khuyến nghị: thêm owner vào stock tables.

**stock_balance**
- company_id
- owner_type: company|partner
- owner_id
- location_type: company_warehouse|partner_warehouse
- location_id
- product_variant_id
- on_hand, reserved, available

**stock_ledger**
- company_id
- owner_type, owner_id
- location_type, location_id
- product_variant_id
- ref_doc_type, ref_doc_id
- movement_type in|out
- qty_in, qty_out
- unit_cost

### 3.3 Serial ownership (robot)
**serial_items** bổ sung:
- owner_type, owner_id
- location_type, location_id

### 3.4 Partner catalog/giá (tuỳ chọn)
**partner_products**
- partner_id, product_id, is_enabled

**partner_prices**
- partner_id, product_variant_id, retail_price

---

## 4) Inventory Documents — bổ sung loại chứng từ

### 4.1 Doc types mới
- `sell_to_partner_out` (company OUT)
- `sell_to_partner_in` (partner IN)
- `partner_sale_out` (partner xuất giao khách)

> Tip: có thể dùng 1 action tạo 2 postings (company OUT + partner IN) trong 1 transaction.

### 4.2 Rule
- sell_to_partner phải có partner_id + partner_warehouse_id
- nếu track serial: bắt buộc allocate serial

---

## 5) Orders — central order, partner fulfillment

**orders**
- partner_id
- status: pending|confirmed|packing|shipped|cancelled
- customer info + totals

**order_fulfillments**
- fulfill_by=partner
- carrier + tracking

Reserve (khuyến nghị):
- confirm → tăng reserved (owner=partner)
- ship → giảm reserved + giảm on_hand

---

## 6) API Spec (MVP)

### Storefront
- GET `/api/store/partners`
- GET `/api/store/d/{partnerSlug}/products`
- GET `/api/store/d/{partnerSlug}/products/{slug}`
- POST `/api/store/d/{partnerSlug}/orders`

### Partner Portal
- GET `/api/partner/orders`
- POST `/api/partner/orders/{id}/confirm`
- POST `/api/partner/orders/{id}/ship` (tạo partner_sale_out + post)
- GET `/api/partner/stock-balance`
- (optional) PUT `/api/partner/prices/bulk`

### Admin
- CRUD `/api/admin/partners`
- POST `/api/admin/inventory/sell-to-partner` (company out + partner in + accounting)
- GET `/api/admin/orders?partnerId=`
- GET `/api/admin/ar/partners` (aging)

---

## 7) Kế toán Level 2 cho mô hình A (Wholesale)

Áp dụng module Level 2: fileciteturn1file1L16-L41

### 7.1 Sell-to-Partner (ghi nhận ngay doanh thu + AR + COGS)
Giả sử: wholesale=9,000,000; cost=8,000,000

- Dr 131 — AR (Partner)  9,000,000
- Cr 511 — Revenue        9,000,000

- Dr 632 — COGS           8,000,000
- Cr 156 — Inventory      8,000,000

### 7.2 Partner ship cho khách
- Sổ cái công ty bạn: **không ghi revenue nữa** (đã ghi ở bước bán sỉ)
- Bạn vẫn lưu retail orders để BI/đánh giá partner.

---

## 8) Checklist để merge vào MVP 8 tuần

### Week 2
- [ ] Partner list + partner storefront (/d/{partnerSlug})
- [ ] API catalog theo partnerSlug
- [ ] Create order gắn partner_id

### Week 3–4
- [ ] Stock ownership fields (owner_type/owner_id)
- [ ] Stock balance/ledger theo owner
- [ ] Sell-to-partner action (company OUT + partner IN)

### Week 5
- [ ] Serial ownership chuyển sang partner khi sell_to_partner
- [ ] Partner stock view (serial + non-serial)

### Week 6
- [ ] Partner ship tạo partner_sale_out trừ tồn partner
- [ ] Reserve logic khi confirm

### Level 2 Accounting
- [ ] AR partner aging
- [ ] Journal entries cho sell_to_partner

---

# END
