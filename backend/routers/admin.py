from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, col, func
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime
from zoneinfo import ZoneInfo
import bcrypt

from database import get_session, engine
from sql_models import (
    User, Category, Brand, Product, Warehouse, StockBalance,
    SerialItem, Customer, SalesOrder, Account, JournalEntry
)
from dependencies import get_current_user, require_admin
from sqlalchemy import text

router = APIRouter()

def get_vn_time():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat()

# ==================== DB MIGRATION ====================

@router.post("/admin/migrate")
async def run_migration(session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    """Add missing columns to existing tables (safe to run multiple times)."""
    migrations = [
        ("account", "balance", "ALTER TABLE account ADD COLUMN balance FLOAT DEFAULT 0"),
        ("customer", "total_orders", "ALTER TABLE customer ADD COLUMN total_orders INTEGER DEFAULT 0"),
        ("customer", "total_spent", "ALTER TABLE customer ADD COLUMN total_spent FLOAT DEFAULT 0"),
        ("salesorder", "total_items", "ALTER TABLE salesorder ADD COLUMN total_items INTEGER DEFAULT 0"),
        ("inventorydoc", "total_value", "ALTER TABLE inventorydoc ADD COLUMN total_value FLOAT DEFAULT 0"),
    ]
    results = []
    for table, column, sql in migrations:
        try:
            check = await session.exec(
                text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'")
            )
            if check.first():
                results.append(f"{table}.{column}: already exists")
            else:
                await session.exec(text(sql))
                await session.commit()
                results.append(f"{table}.{column}: ADDED")
        except Exception as e:
            results.append(f"{table}.{column}: ERROR - {str(e)}")
    return {"migrations": results}

# ==================== DASHBOARD ====================

@router.get("/admin/dashboard/stats")
async def get_dashboard_stats(session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    total_products = (await session.exec(select(func.count(Product.id)))).one() or 0
    total_categories = (await session.exec(select(func.count(Category.id)))).one() or 0
    total_brands = (await session.exec(select(func.count(Brand.id)))).one() or 0
    total_warehouses = (await session.exec(select(func.count(Warehouse.id)))).one() or 0
    total_users = (await session.exec(select(func.count(User.id)))).one() or 0
    total_serials = (await session.exec(select(func.count(SerialItem.id)))).one() or 0
    total_customers = (await session.exec(select(func.count(Customer.id)))).one() or 0
    total_orders = (await session.exec(select(func.count(SalesOrder.id)))).one() or 0

    # Products by type
    type_query = select(Product.product_type, func.count(Product.id)).group_by(Product.product_type)
    type_results = (await session.exec(type_query)).all()
    products_by_type = {t: c for t, c in type_results}

    # Low stock count (products with stock < 5 and stock > 0)
    low_stock_query = select(func.count(Product.id)).where(Product.stock_quantity > 0, Product.stock_quantity < 5)
    low_stock_count = (await session.exec(low_stock_query)).one() or 0

    # Total stock value from stock_balance
    value_query = select(func.sum(StockBalance.quantity * StockBalance.avg_cost))
    total_stock_value = (await session.exec(value_query)).one() or 0

    return {
        "total_products": total_products,
        "total_categories": total_categories,
        "total_brands": total_brands,
        "total_warehouses": total_warehouses,
        "total_users": total_users,
        "total_serials": total_serials,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "products_by_type": products_by_type,
        "low_stock_count": low_stock_count,
        "total_stock_value": round(total_stock_value, 0),
    }

# ==================== SEED DATA ====================

def _upsert_by(session, model, unique_filter, **fields):
    """Helper for idempotent seed."""
    existing = session.exec(unique_filter).first()
    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        session.add(existing)
        return existing
    obj = model(**fields)
    session.add(obj)
    return obj

@router.post("/admin/seed")
async def seed_data(session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    """Idempotent seed: creates sample data if missing, updates if exists."""
    # Warehouses
    wh_data = [
        dict(name="Kho Hà Nội", code="WH-HN", address="Hà Nội", is_default=True),
        dict(name="Kho TP.HCM", code="WH-HCM", address="TP. Hồ Chí Minh"),
        dict(name="Kho Đà Nẵng", code="WH-DN", address="Đà Nẵng"),
    ]
    warehouses = []
    for w in wh_data:
        wh = (await session.exec(select(Warehouse).where(Warehouse.code == w["code"]))).first()
        if wh:
            for k, v in w.items():
                setattr(wh, k, v)
        else:
            wh = Warehouse(**w)
        session.add(wh)
        warehouses.append(wh)
    await session.flush()

    # Categories
    cat_data = [
        dict(name="Robot", slug="robot", description="Robot hút bụi", sort_order=1),
        dict(name="Gia dụng", slug="gia-dung", description="Thiết bị gia dụng", sort_order=2),
        dict(name="Phụ kiện", slug="phu-kien", description="Phụ kiện thay thế", sort_order=3),
        dict(name="Linh kiện", slug="linh-kien", description="Linh kiện sửa chữa", sort_order=4),
        dict(name="Dịch vụ", slug="dich-vu", description="Dịch vụ bảo hành, sửa chữa", sort_order=5),
    ]
    categories = []
    for c in cat_data:
        cat = (await session.exec(select(Category).where(Category.slug == c["slug"]))).first()
        if cat:
            for k, v in c.items():
                setattr(cat, k, v)
        else:
            cat = Category(**c)
        session.add(cat)
        categories.append(cat)
    await session.flush()

    # Brands
    brand_data = [
        dict(name="Ecovacs", slug="ecovacs", country="Trung Quốc"),
        dict(name="Roborock", slug="roborock", country="Trung Quốc"),
        dict(name="Xiaomi", slug="xiaomi", country="Trung Quốc"),
        dict(name="iRobot", slug="irobot", country="Mỹ"),
        dict(name="Dreame", slug="dreame", country="Trung Quốc"),
    ]
    brands = []
    for b in brand_data:
        brand = (await session.exec(select(Brand).where(Brand.slug == b["slug"]))).first()
        if brand:
            for k, v in b.items():
                setattr(brand, k, v)
        else:
            brand = Brand(**b)
        session.add(brand)
        brands.append(brand)
    await session.flush()

    # Products (lookup helpers)
    slug_map = {c.slug: c for c in categories}
    brand_map = {b.slug: b for b in brands}

    product_data = [
        dict(
            name="Ecovacs Deebot X2 Omni", slug="ecovacs-x2-omni", sku="ECO-X2-001",
            product_type="robot", category_id=slug_map["robot"].id, brand_id=brand_map["ecovacs"].id,
            price=18500000, cost_price=16250000, warranty_months=24, track_serial=True,
            description="Robot hút bụi lau nhà cao cấp"
        ),
        dict(
            name="Roborock S8 MaxV Ultra", slug="roborock-s8-maxv", sku="RBR-S8-001",
            product_type="robot", category_id=slug_map["robot"].id, brand_id=brand_map["roborock"].id,
            price=22000000, cost_price=19000000, warranty_months=24, track_serial=True,
            description="Robot hút bụi thông minh AI"
        ),
        dict(
            name="Dreame L20 Ultra", slug="dreame-l20-ultra", sku="DRM-L20-001",
            product_type="robot", category_id=slug_map["robot"].id, brand_id=brand_map["dreame"].id,
            price=15000000, cost_price=12500000, warranty_months=18, track_serial=True,
            description="Robot hút bụi lau nhà tự động"
        ),
        dict(
            name="Chổi quét phụ Ecovacs", slug="choi-quet-ecovacs", sku="ECO-ACC-001",
            product_type="accessory", category_id=slug_map["phu-kien"].id, brand_id=brand_map["ecovacs"].id,
            price=250000, cost_price=120000, warranty_months=0, track_serial=False,
            description="Chổi quét thay thế cho Ecovacs"
        ),
    ]
    products = []
    for p in product_data:
        prod = (await session.exec(select(Product).where(Product.sku == p["sku"]))).first()
        if prod:
            for k, v in p.items():
                setattr(prod, k, v)
        else:
            prod = Product(**p)
        session.add(prod)
        products.append(prod)
    await session.flush()

    # Stock balances (idempotent upsert by product+warehouse)
    sb_map = {
        (products[0].id, warehouses[0].id): dict(quantity=5, avg_cost=16250000),
        (products[1].id, warehouses[0].id): dict(quantity=3, avg_cost=19000000),
        (products[2].id, warehouses[1].id): dict(quantity=2, avg_cost=12500000),
        (products[3].id, warehouses[0].id): dict(quantity=20, avg_cost=120000),
    }
    for (pid, wid), vals in sb_map.items():
        sb = (await session.exec(
            select(StockBalance).where(StockBalance.product_id == pid, StockBalance.warehouse_id == wid)
        )).first()
        if sb:
            sb.quantity = vals["quantity"]
            sb.avg_cost = vals["avg_cost"]
        else:
            sb = StockBalance(product_id=pid, warehouse_id=wid, **vals)
        session.add(sb)

    # Update product stock_quantity to match balances
    for prod in products:
        total_qty = (await session.exec(
            select(func.sum(StockBalance.quantity)).where(StockBalance.product_id == prod.id)
        )).one() or 0
        prod.stock_quantity = total_qty
        session.add(prod)

    # Chart of Accounts (VAS)
    accounts_data = [
        ("111", "Tiền mặt", "asset"), ("112", "Tiền gửi ngân hàng", "asset"),
        ("131", "Phải thu khách hàng", "asset"), ("156", "Hàng hóa", "asset"),
        ("157", "Hàng gửi bán", "asset"),
        ("331", "Phải trả người bán", "liability"), ("333", "Thuế và các khoản phải nộp", "liability"),
        ("334", "Phải trả người lao động", "liability"),
        ("411", "Vốn đầu tư của chủ sở hữu", "equity"), ("421", "Lợi nhuận chưa phân phối", "equity"),
        ("511", "Doanh thu bán hàng", "revenue"), ("512", "Doanh thu dịch vụ", "revenue"),
        ("515", "Doanh thu tài chính", "revenue"),
        ("632", "Giá vốn hàng bán", "expense"), ("641", "Chi phí bán hàng", "expense"),
        ("642", "Chi phí quản lý", "expense"), ("811", "Chi phí khác", "expense"),
    ]
    for code, name, atype in accounts_data:
        acc = (await session.exec(select(Account).where(Account.code == code))).first()
        if acc:
            acc.name = name
            acc.account_type = atype
            session.add(acc)
        else:
            session.add(Account(code=code, name=name, account_type=atype))

    await session.commit()
    return {"message": "Dữ liệu mẫu đã được tạo/đồng bộ thành công!"}

# ==================== RESET ADMIN ====================

@router.post("/admin/reset-admin")
async def reset_admin(session: AsyncSession = Depends(get_session)):
    stmt = select(User).where(User.email == "admin@otnt.vn")
    existing = (await session.exec(stmt)).first()

    hashed = bcrypt.hashpw("Admin@123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    if existing:
        existing.hashed_password = hashed
        existing.role = "admin"
        existing.is_active = True
        session.add(existing)
    else:
        user = User(
            email="admin@otnt.vn", hashed_password=hashed,
            full_name="Administrator", phone="0909000000", role="admin"
        )
        session.add(user)

    await session.commit()
    return {"message": "Admin account reset. Email: admin@otnt.vn, Password: Admin@123"}
