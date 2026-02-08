from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, col, func, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from zoneinfo import ZoneInfo

from database import get_session
from sql_models import Customer, SalesOrder, Product, SerialItem, Warehouse, User
from dependencies import get_current_user, require_admin
from routers.inventory import update_stock_balance, process_serials

router = APIRouter()

def get_vn_time():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat()

# ==================== DTOs ====================

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    tax_code: Optional[str] = None
    note: Optional[str] = None

class CustomerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    tax_code: Optional[str] = None
    note: Optional[str] = None
    total_orders: int = 0
    total_spent: float = 0
    is_active: bool = True
    created_at: str

class SalesOrderLineCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    serial_numbers: List[str] = []
    note: Optional[str] = None

class SalesOrderLineResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "gen"
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float = 0
    serial_numbers: List[str] = []
    warranty_months: int = 0
    note: Optional[str] = None

class SalesOrderCreate(BaseModel):
    customer_id: str
    warehouse_id: str
    note: Optional[str] = None
    lines: List[SalesOrderLineCreate]

class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    warehouse_id: str
    warehouse_name: Optional[str] = None
    status: str
    total_items: int = 0
    total_amount: float = 0
    note: Optional[str] = None
    lines: List[SalesOrderLineResponse] = []
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    confirmed_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str

# ==================== CUSTOMER ROUTES ====================

@router.get("/admin/customers", response_model=List[CustomerResponse])
async def list_customers(search: Optional[str] = None, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    query = select(Customer)
    if search:
        query = query.where(or_(col(Customer.name).contains(search), col(Customer.phone).contains(search)))
    query = query.order_by(Customer.created_at.desc())
    return [CustomerResponse(**c.model_dump()) for c in (await session.exec(query)).all()]

@router.get("/admin/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    cust = await session.get(Customer, customer_id)
    if not cust: raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse(**cust.model_dump())

@router.post("/admin/customers", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    cust = Customer(**data.model_dump())
    session.add(cust)
    await session.commit()
    await session.refresh(cust)
    return CustomerResponse(**cust.model_dump())

@router.put("/admin/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerCreate, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    cust = await session.get(Customer, customer_id)
    if not cust: raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in data.model_dump().items():
        setattr(cust, k, v)
    cust.updated_at = get_vn_time()
    session.add(cust)
    await session.commit()
    await session.refresh(cust)
    return CustomerResponse(**cust.model_dump())

@router.delete("/admin/customers/{customer_id}")
async def delete_customer(customer_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    cust = await session.get(Customer, customer_id)
    if not cust: raise HTTPException(status_code=404, detail="Customer not found")
    has_orders = (await session.exec(select(SalesOrder).where(SalesOrder.customer_id == customer_id))).first()
    if has_orders: raise HTTPException(status_code=400, detail="Cannot delete customer with orders")
    await session.delete(cust)
    await session.commit()
    return {"message": "Customer deleted"}

# ==================== SALES ORDER ROUTES ====================

async def generate_order_number(session: AsyncSession) -> str:
    date_str = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime('%Y%m%d')
    start_of_day = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).replace(hour=0, minute=0, second=0).isoformat()
    query = select(func.count(SalesOrder.id)).where(SalesOrder.created_at >= start_of_day)
    count = (await session.exec(query)).one() or 0
    return f"SO-{date_str}-{str(count + 1).zfill(3)}"

async def enrich_order(order: SalesOrder, session: AsyncSession) -> SalesOrderResponse:
    cust = await session.get(Customer, order.customer_id)
    wh = await session.get(Warehouse, order.warehouse_id)
    u = await session.get(User, order.created_by) if order.created_by else None
    return SalesOrderResponse(
        **order.model_dump(),
        customer_name=cust.name if cust else None,
        customer_phone=cust.phone if cust else None,
        warehouse_name=wh.name if wh else None,
        created_by_name=u.full_name if u else None,
        lines=[SalesOrderLineResponse(**l) for l in order.lines]
    )

@router.get("/admin/sales/orders", response_model=List[SalesOrderResponse])
async def list_sales_orders(
    customer_id: Optional[str] = None, warehouse_id: Optional[str] = None,
    status: Optional[str] = None, skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session), user=Depends(get_current_user)
):
    query = select(SalesOrder).order_by(SalesOrder.created_at.desc())
    if customer_id: query = query.where(SalesOrder.customer_id == customer_id)
    if warehouse_id: query = query.where(SalesOrder.warehouse_id == warehouse_id)
    if status: query = query.where(SalesOrder.status == status)
    query = query.offset(skip).limit(limit)
    orders = (await session.exec(query)).all()
    return [await enrich_order(o, session) for o in orders]

@router.get("/admin/sales/orders/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    order = await session.get(SalesOrder, order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    return await enrich_order(order, session)

@router.post("/admin/sales/orders", response_model=SalesOrderResponse)
async def create_sales_order(data: SalesOrderCreate, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    cust = await session.get(Customer, data.customer_id)
    if not cust: raise HTTPException(status_code=404, detail="Customer not found")
    wh = await session.get(Warehouse, data.warehouse_id)
    if not wh: raise HTTPException(status_code=404, detail="Warehouse not found")

    order_number = await generate_order_number(session)
    total_val = 0
    total_items = 0
    lines_data = []

    for l in data.lines:
        prod = await session.get(Product, l.product_id)
        val = l.quantity * l.unit_price
        total_val += val
        total_items += l.quantity
        lines_data.append({
            "product_id": l.product_id,
            "product_sku": prod.sku if prod else "",
            "product_name": prod.name if prod else "",
            "quantity": l.quantity, "unit_price": l.unit_price,
            "total_price": val, "serial_numbers": l.serial_numbers,
            "warranty_months": prod.warranty_months if prod else 0
        })

    order = SalesOrder(
        order_number=order_number, customer_id=data.customer_id,
        warehouse_id=data.warehouse_id, note=data.note,
        status="draft", total_items=total_items, total_amount=total_val,
        lines=lines_data, created_by=user.id
    )
    session.add(order)
    await session.commit()
    await session.refresh(order)
    return await enrich_order(order, session)

@router.post("/admin/sales/orders/{order_id}/confirm")
async def confirm_sales_order(order_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    order = await session.get(SalesOrder, order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in ('draft', 'pending'):
        raise HTTPException(status_code=400, detail="Order cannot be confirmed from current status")
    order.status = 'confirmed'
    order.confirmed_at = get_vn_time()
    session.add(order)
    await session.commit()
    return {"message": "Order confirmed"}

@router.post("/admin/sales/orders/{order_id}/complete")
async def complete_sales_order(order_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    order = await session.get(SalesOrder, order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status == 'completed': return {"message": "Already completed"}

    for line in order.lines:
        prod_id = line['product_id']
        qty = line['quantity']
        await update_stock_balance(prod_id, order.warehouse_id, -qty, 0, session)

        serials = line.get('serial_numbers', [])
        if serials:
            stmt = select(SerialItem).where(col(SerialItem.serial_number).in_(serials), SerialItem.product_id == prod_id)
            serial_items = (await session.exec(stmt)).all()
            for s in serial_items:
                s.status = 'sold'
                s.customer_id = order.customer_id
                s.sale_order_id = order.id
                s.warranty_start = get_vn_time()
                wm = line.get('warranty_months', 0)
                if wm > 0:
                    from dateutil.relativedelta import relativedelta
                    start_dt = datetime.fromisoformat(s.warranty_start)
                    s.warranty_end = (start_dt + relativedelta(months=wm)).isoformat()
                session.add(s)
            await process_serials('sale', serials, prod_id, order.warehouse_id, user.id, order.id, order.order_number, session)

    order.status = 'completed'
    order.completed_at = get_vn_time()

    cust = await session.get(Customer, order.customer_id)
    if cust:
        cust.total_orders += 1
        cust.total_spent += order.total_amount
        session.add(cust)

    session.add(order)
    await session.commit()
    return {"message": "Order completed"}

@router.post("/admin/sales/orders/{order_id}/cancel")
async def cancel_sales_order(order_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    order = await session.get(SalesOrder, order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status == 'completed':
        raise HTTPException(status_code=400, detail="Cannot cancel completed order")
    order.status = 'cancelled'
    order.updated_at = get_vn_time()
    session.add(order)
    await session.commit()
    return {"message": "Order cancelled"}

@router.delete("/admin/sales/orders/{order_id}")
async def delete_sales_order(order_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    order = await session.get(SalesOrder, order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status == 'completed':
        raise HTTPException(status_code=400, detail="Cannot delete completed order")
    await session.delete(order)
    await session.commit()
    return {"message": "Order deleted"}
