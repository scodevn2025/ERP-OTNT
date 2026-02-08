# ERP Robot Vacuum — Level 2 Accounting + Cost Module Update

## Mục tiêu Level 2
Bổ sung kế toán chuẩn SME:
- Giá vốn hàng bán (COGS)
- Công nợ phải thu/phải trả (AR/AP)
- Journal Entries tự động từ Kho + Sales + Repair
- Báo cáo lợi nhuận cơ bản

---

## 1. Cost Engine (Moving Average)

### product_costs
- Lưu avg_cost theo branch + variant

Update khi nhập kho:
avg_cost_new = (stock_value_old + inbound_value) / new_qty

---

## 2. Chart of Accounts (COA)

accounts:
- 156 Inventory
- 632 COGS
- 511 Revenue
- 131 Accounts Receivable
- 331 Accounts Payable
- 111 Cash

---

## 3. Journal Entries System

journal_entries:
- date, ref_type, ref_id, branch_id

journal_lines:
- account_id, debit, credit

---

## 4. Auto Posting Rules

### Purchase In
Debit 156 Inventory
Credit 331 Payable

### Sales Deliver
Debit 111/131 Cash/AR
Credit 511 Revenue

Debit 632 COGS
Credit 156 Inventory

### Repair Parts Issue
Debit 642 Repair Expense
Credit 156 Inventory

### Repair Payment
Debit 111 Cash
Credit 5113 Service Revenue

---

## 5. Reports Level 2
- Inventory valuation report
- Gross profit per sales order
- Repair cost report
- AR/AP aging basic

---

## 6. Roadmap triển khai (4 tuần)
Week 1: Cost avg + COGS
Week 2: Repair cost tracking
Week 3: Journal entry auto posting
Week 4: Financial reports + AR/AP

---

# END
