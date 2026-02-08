from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import select, col, func, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from database import get_session
from sql_models import (
    Warehouse, InventoryDoc, StockBalance, StockLedger,
    Product, SerialItem, SerialMovement, User
)
from dependencies import get_current_user, require_admin

router = APIRouter()

def get_vn_time():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat()

# ==================== DTOs ====================

class WarehouseCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_id: Optional[str] = None
    is_default: bool = False

class WarehouseResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    is_default: bool = False
    is_active: bool = True
    created_at: str

DocType = Literal['receipt', 'issue', 'transfer', 'adjustment', 'return']

class InventoryLineCreate(BaseModel):
    product_id: str
    quantity: int
    unit_cost: float = 0
    note: Optional[str] = None
    serial_numbers: List[str] = []

class InventoryLineResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "generated"
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_cost: float = 0
    total_cost: float = 0
    note: Optional[str] = None
    serial_numbers: List[str] = []

class InventoryDocCreate(BaseModel):
    doc_type: DocType
    warehouse_id: str
    dest_warehouse_id: Optional[str] = None
    reference: Optional[str] = None
    note: Optional[str] = None
    lines: List[InventoryLineCreate]

class InventoryDocResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    doc_number: str
    doc_type: str
    warehouse_id: str
    warehouse_name: Optional[str] = None
    dest_warehouse_id: Optional[str] = None
    dest_warehouse_name: Optional[str] = None
    reference: Optional[str] = None
    note: Optional[str] = None
    status: str
    total_items: int = 0
    total_value: float = 0
    lines: List[InventoryLineResponse] = []
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    posted_at: Optional[str] = None
    created_at: str

class StockBalanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    product_name: str
    product_sku: str
    product_type: str
    warehouse_id: str
    warehouse_name: str
    quantity: int
    avg_cost: float = 0
    total_value: float = 0

class SerialItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    serial_number: str
    imei: Optional[str] = None
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    warehouse_id: Optional[str] = None
    warehouse_name: Optional[str] = None
    status: str
    cost_price: float = 0
    sale_order_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    warranty_start: Optional[str] = None
    warranty_end: Optional[str] = None
    note: Optional[str] = None
    created_at: str

class SerialItemCreate(BaseModel):
    serial_number: str
    imei: Optional[str] = None
    product_id: str
    warehouse_id: str
    cost_price: float = 0
    note: Optional[str] = None

class SerialMovementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    serial_id: str
    movement_type: str
    from_warehouse_id: Optional[str] = None
    from_warehouse_name: Optional[str] = None
    to_warehouse_id: Optional[str] = None
    to_warehouse_name: Optional[str] = None
    reference_number: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: str

class StockLedgerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    warehouse_id: str
    warehouse_name: Optional[str] = None
    doc_number: Optional[str] = None
    doc_type: Optional[str] = None
    quantity_change: int = 0
    unit_cost: float = 0
    quantity_after: int = 0
    created_at: str

# ==================== HELPERS ====================

async def generate_doc_number(doc_type: str, session: AsyncSession) -> str:
    prefix_map = {
        'receipt': 'PN', 'issue': 'PX',
        'transfer': 'CK', 'adjustment': 'KK', 'return': 'TH'
    }
    prefix = prefix_map.get(doc_type, 'INV')
    date_str = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime('%Y%m%d')
    start_of_day = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    query = select(func.count(InventoryDoc.id)).where(
        InventoryDoc.doc_type == doc_type,
        InventoryDoc.created_at >= start_of_day
    )
    count = (await session.exec(query)).one() or 0
    return f"{prefix}-{date_str}-{str(count + 1).zfill(3)}"

async def update_stock_balance(product_id: str, warehouse_id: str, quantity_delta: int, value_delta: float, session: AsyncSession):
    statement = select(StockBalance).where(StockBalance.product_id == product_id, StockBalance.warehouse_id == warehouse_id)
    balance = (await session.exec(statement)).first()

    if not balance:
        balance = StockBalance(product_id=product_id, warehouse_id=warehouse_id, quantity=0, avg_cost=0)
        session.add(balance)
        await session.flush()

    if quantity_delta > 0 and value_delta > 0:
        current_val = balance.quantity * balance.avg_cost
        new_val = current_val + value_delta
        new_qty = balance.quantity + quantity_delta
        balance.avg_cost = new_val / new_qty if new_qty > 0 else 0

    balance.quantity += quantity_delta
    balance.updated_at = get_vn_time()
    session.add(balance)

    prod = await session.get(Product, product_id)
    if prod:
        prod.stock_quantity += quantity_delta
        session.add(prod)

    return balance

async def process_serials(
    movement_type: str, serials: List[str], product_id: str,
    warehouse_id: str, user_id: str, doc_id: str, doc_number: str,
    session: AsyncSession, dest_warehouse_id: Optional[str] = None
):
    for sn in serials:
        statement = select(SerialItem).where(SerialItem.serial_number == sn, SerialItem.product_id == product_id)
        serial = (await session.exec(statement)).first()

        if movement_type == 'receipt':
            if not serial:
                serial = SerialItem(serial_number=sn, product_id=product_id, warehouse_id=warehouse_id, status='in_stock')
            else:
                serial.status = 'in_stock'
                serial.warehouse_id = warehouse_id
            session.add(serial)
            await session.flush()
        elif movement_type == 'issue' or movement_type == 'sale':
            if serial:
                serial.status = 'sold'
                session.add(serial)
                await session.flush()
        elif movement_type == 'transfer':
            if serial:
                serial.warehouse_id = dest_warehouse_id
                session.add(serial)
                await session.flush()

        if serial:
            movement = SerialMovement(
                serial_id=serial.id, movement_type=movement_type,
                from_warehouse_id=warehouse_id if movement_type != 'receipt' else None,
                to_warehouse_id=dest_warehouse_id if movement_type == 'transfer' else (warehouse_id if movement_type == 'receipt' else None),
                reference_id=doc_id, reference_number=doc_number, created_by=user_id
            )
            session.add(movement)

# ==================== WAREHOUSE ROUTES ====================

@router.get("/admin/warehouses", response_model=List[WarehouseResponse])
async def list_warehouses(session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    statement = select(Warehouse).order_by(Warehouse.created_at)
    warehouses = (await session.exec(statement)).all()
    result = []
    for w in warehouses:
        m_name = None
        if w.manager_id:
            mgr = await session.get(User, w.manager_id)
            if mgr: m_name = mgr.full_name
        result.append(WarehouseResponse(**w.model_dump(), manager_name=m_name))
    return result

@router.get("/admin/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    wh = await session.get(Warehouse, warehouse_id)
    if not wh: raise HTTPException(status_code=404, detail="Warehouse not found")
    m_name = None
    if wh.manager_id:
        mgr = await session.get(User, wh.manager_id)
        if mgr: m_name = mgr.full_name
    return WarehouseResponse(**wh.model_dump(), manager_name=m_name)

@router.post("/admin/warehouses", response_model=WarehouseResponse)
async def create_warehouse(data: WarehouseCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    existing = (await session.exec(select(Warehouse).where(Warehouse.code == data.code))).first()
    if existing: raise HTTPException(status_code=400, detail="Warehouse code already exists")
    if data.is_default:
        all_wh = (await session.exec(select(Warehouse).where(Warehouse.is_default == True))).all()
        for w in all_wh:
            w.is_default = False
            session.add(w)
    warehouse = Warehouse(**data.model_dump())
    session.add(warehouse)
    await session.commit()
    await session.refresh(warehouse)
    return WarehouseResponse(**warehouse.model_dump())

@router.put("/admin/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(warehouse_id: str, data: WarehouseCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    wh = await session.get(Warehouse, warehouse_id)
    if not wh: raise HTTPException(status_code=404, detail="Warehouse not found")
    if data.is_default:
        all_wh = (await session.exec(select(Warehouse).where(Warehouse.is_default == True, Warehouse.id != warehouse_id))).all()
        for w in all_wh:
            w.is_default = False
            session.add(w)
    for k, v in data.model_dump().items():
        setattr(wh, k, v)
    session.add(wh)
    await session.commit()
    await session.refresh(wh)
    return WarehouseResponse(**wh.model_dump())

@router.delete("/admin/warehouses/{warehouse_id}")
async def delete_warehouse(warehouse_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    wh = await session.get(Warehouse, warehouse_id)
    if not wh: raise HTTPException(status_code=404, detail="Warehouse not found")
    has_stock = (await session.exec(select(StockBalance).where(StockBalance.warehouse_id == warehouse_id, StockBalance.quantity > 0))).first()
    if has_stock: raise HTTPException(status_code=400, detail="Cannot delete warehouse with stock")
    await session.delete(wh)
    await session.commit()
    return {"message": "Warehouse deleted"}

# ==================== INVENTORY DOCUMENT ROUTES ====================
# Frontend expects /admin/inventory/documents (not /docs)

@router.get("/admin/inventory/documents", response_model=List[InventoryDocResponse])
async def list_inventory_docs(
    doc_type: Optional[str] = None, warehouse_id: Optional[str] = None,
    status: Optional[str] = None, skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session), user=Depends(get_current_user)
):
    query = select(InventoryDoc).order_by(InventoryDoc.created_at.desc())
    if doc_type: query = query.where(InventoryDoc.doc_type == doc_type)
    if warehouse_id: query = query.where(InventoryDoc.warehouse_id == warehouse_id)
    if status: query = query.where(InventoryDoc.status == status)
    query = query.offset(skip).limit(limit)
    docs = (await session.exec(query)).all()

    result = []
    for d in docs:
        wh = await session.get(Warehouse, d.warehouse_id)
        u = await session.get(User, d.created_by) if d.created_by else None
        result.append(InventoryDocResponse(
            **d.model_dump(),
            warehouse_name=wh.name if wh else None,
            created_by_name=u.full_name if u else None,
            lines=[InventoryLineResponse(**l) for l in d.lines]
        ))
    return result

@router.get("/admin/inventory/documents/{doc_id}", response_model=InventoryDocResponse)
async def get_inventory_doc(doc_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    doc = await session.get(InventoryDoc, doc_id)
    if not doc: raise HTTPException(status_code=404, detail="Document not found")
    wh = await session.get(Warehouse, doc.warehouse_id)
    dest_wh = await session.get(Warehouse, doc.dest_warehouse_id) if doc.dest_warehouse_id else None
    u = await session.get(User, doc.created_by) if doc.created_by else None
    return InventoryDocResponse(
        **doc.model_dump(),
        warehouse_name=wh.name if wh else None,
        dest_warehouse_name=dest_wh.name if dest_wh else None,
        created_by_name=u.full_name if u else None,
        lines=[InventoryLineResponse(**l) for l in doc.lines]
    )

@router.post("/admin/inventory/documents", response_model=InventoryDocResponse)
async def create_inventory_doc(
    data: InventoryDocCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)
):
    wh = await session.get(Warehouse, data.warehouse_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    dest_name = None
    if data.doc_type == "transfer":
        if not data.dest_warehouse_id:
            raise HTTPException(status_code=400, detail="Destination warehouse required for transfer")
        dest_wh = await session.get(Warehouse, data.dest_warehouse_id)
        if not dest_wh:
            raise HTTPException(status_code=404, detail="Dest warehouse not found")
        dest_name = dest_wh.name

    doc_number = await generate_doc_number(data.doc_type, session)
    total_val = 0
    doc_lines_data = []

    for l in data.lines:
        prod = await session.get(Product, l.product_id)
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {l.product_id} not found")
        line_val = l.quantity * l.unit_cost
        total_val += line_val
        doc_lines_data.append(
            {
                "product_id": l.product_id,
                "product_sku": prod.sku,
                "product_name": prod.name,
                "quantity": l.quantity,
                "unit_cost": l.unit_cost,
                "total_cost": line_val,
                "note": l.note,
                "serial_numbers": l.serial_numbers,
            }
        )

    doc = InventoryDoc(
        doc_number=doc_number,
        doc_type=data.doc_type,
        warehouse_id=data.warehouse_id,
        dest_warehouse_id=data.dest_warehouse_id,
        reference=data.reference,
        note=data.note,
        status="draft",
        total_value=total_val,
        lines=doc_lines_data,
        created_by=user.id,
        posted_at=None,
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)

    return InventoryDocResponse(
        **doc.model_dump(),
        warehouse_name=wh.name,
        dest_warehouse_name=dest_name,
        created_by_name=user.full_name,
        lines=[InventoryLineResponse(**l) for l in doc.lines],
    )

@router.delete("/admin/inventory/documents/{doc_id}")
async def delete_inventory_doc(doc_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    doc = await session.get(InventoryDoc, doc_id)
    if not doc: raise HTTPException(status_code=404, detail="Document not found")
    if doc.status == 'posted':
        raise HTTPException(status_code=400, detail="Cannot delete posted document")
    await session.delete(doc)
    await session.commit()
    return {"message": "Document deleted"}

@router.post("/admin/inventory/documents/{doc_id}/post")
async def post_inventory_doc(doc_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    doc = await session.get(InventoryDoc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status == "posted":
        return {"message": "Already posted"}
    if doc.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot post cancelled document")

    now = get_vn_time()

    for line in doc.lines:
        prod = await session.get(Product, line["product_id"])
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {line['product_id']} not found")

        qty = line["quantity"]
        unit_cost = line.get("unit_cost", 0)
        serials = line.get("serial_numbers", [])

        if doc.doc_type in ("receipt", "return"):
            qty_change = qty
            bal = await update_stock_balance(prod.id, doc.warehouse_id, qty_change, qty * unit_cost, session)
            if serials:
                await process_serials("receipt", serials, prod.id, doc.warehouse_id, user.id, doc.id, doc.doc_number, session)
            session.add(
                StockLedger(
                    product_id=prod.id,
                    warehouse_id=doc.warehouse_id,
                    doc_id=doc.id,
                    doc_number=doc.doc_number,
                    doc_type=doc.doc_type,
                    quantity_change=qty_change,
                    unit_cost=unit_cost,
                    quantity_after=bal.quantity,
                )
            )

        elif doc.doc_type == "issue":
            bal_check = await session.exec(
                select(StockBalance).where(StockBalance.product_id == prod.id, StockBalance.warehouse_id == doc.warehouse_id)
            )
            existing = bal_check.first()
            current_qty = existing.quantity if existing else 0
            if current_qty < qty:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {prod.name}: {current_qty} available, {qty} requested")

            qty_change = -qty
            bal = await update_stock_balance(prod.id, doc.warehouse_id, qty_change, -qty * unit_cost, session)
            if serials:
                await process_serials("issue", serials, prod.id, doc.warehouse_id, user.id, doc.id, doc.doc_number, session)
            session.add(
                StockLedger(
                    product_id=prod.id,
                    warehouse_id=doc.warehouse_id,
                    doc_id=doc.id,
                    doc_number=doc.doc_number,
                    doc_type="issue",
                    quantity_change=qty_change,
                    unit_cost=unit_cost,
                    quantity_after=bal.quantity,
                )
            )

        elif doc.doc_type == "transfer":
            if not doc.dest_warehouse_id:
                raise HTTPException(status_code=400, detail="Destination warehouse required for transfer")

            bal_check = await session.exec(
                select(StockBalance).where(StockBalance.product_id == prod.id, StockBalance.warehouse_id == doc.warehouse_id)
            )
            existing = bal_check.first()
            current_qty = existing.quantity if existing else 0
            if current_qty < qty:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {prod.name}: {current_qty} available, {qty} requested")

            bal_src = await update_stock_balance(prod.id, doc.warehouse_id, -qty, -qty * unit_cost, session)
            bal_dst = await update_stock_balance(prod.id, doc.dest_warehouse_id, qty, qty * unit_cost, session)
            if serials:
                await process_serials("transfer", serials, prod.id, doc.warehouse_id, user.id, doc.id, doc.doc_number, session, doc.dest_warehouse_id)
            session.add(
                StockLedger(
                    product_id=prod.id,
                    warehouse_id=doc.warehouse_id,
                    doc_id=doc.id,
                    doc_number=doc.doc_number,
                    doc_type="transfer_out",
                    quantity_change=-qty,
                    unit_cost=unit_cost,
                    quantity_after=bal_src.quantity,
                )
            )
            session.add(
                StockLedger(
                    product_id=prod.id,
                    warehouse_id=doc.dest_warehouse_id,
                    doc_id=doc.id,
                    doc_number=doc.doc_number,
                    doc_type="transfer_in",
                    quantity_change=qty,
                    unit_cost=unit_cost,
                    quantity_after=bal_dst.quantity,
                )
            )

        elif doc.doc_type == "adjustment":
            bal_check = await session.exec(
                select(StockBalance).where(StockBalance.product_id == prod.id, StockBalance.warehouse_id == doc.warehouse_id)
            )
            existing = bal_check.first()
            current_qty = existing.quantity if existing else 0
            qty_change = qty - current_qty
            bal = await update_stock_balance(prod.id, doc.warehouse_id, qty_change, qty * unit_cost, session)
            session.add(
                StockLedger(
                    product_id=prod.id,
                    warehouse_id=doc.warehouse_id,
                    doc_id=doc.id,
                    doc_number=doc.doc_number,
                    doc_type="adjustment",
                    quantity_change=qty_change,
                    unit_cost=unit_cost,
                    quantity_after=bal.quantity,
                )
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported document type")

    doc.status = "posted"
    doc.posted_at = now
    doc.updated_at = now
    session.add(doc)
    await session.commit()
    return {"message": "Document posted"}

# ==================== STOCK BALANCE & LEDGER ====================
# Frontend expects /admin/inventory/stock (not /active)

@router.get("/admin/inventory/stock", response_model=List[StockBalanceResponse])
async def get_stock_balance(
    warehouse_id: Optional[str] = None, low_stock: Optional[bool] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_session), user=Depends(get_current_user)
):
    query = select(StockBalance, Product, Warehouse).where(
        StockBalance.product_id == Product.id,
        StockBalance.warehouse_id == Warehouse.id
    )
    if warehouse_id: query = query.where(StockBalance.warehouse_id == warehouse_id)
    if low_stock: query = query.where(StockBalance.quantity > 0, StockBalance.quantity < 5)
    if search: query = query.where(or_(col(Product.name).contains(search), col(Product.sku).contains(search)))

    results = (await session.exec(query)).all()
    report = []
    for bal, prod, wh in results:
        report.append(StockBalanceResponse(
            product_id=bal.product_id, product_name=prod.name, product_sku=prod.sku,
            product_type=prod.product_type, warehouse_id=bal.warehouse_id,
            warehouse_name=wh.name, quantity=bal.quantity, avg_cost=bal.avg_cost,
            total_value=bal.quantity * bal.avg_cost
        ))
    return report

@router.get("/admin/inventory/ledger", response_model=List[StockLedgerResponse])
async def get_stock_ledger(
    product_id: Optional[str] = None, warehouse_id: Optional[str] = None,
    skip: int = 0, limit: int = 100,
    session: AsyncSession = Depends(get_session), user=Depends(get_current_user)
):
    query = select(StockLedger).order_by(StockLedger.created_at.desc())
    if product_id: query = query.where(StockLedger.product_id == product_id)
    if warehouse_id: query = query.where(StockLedger.warehouse_id == warehouse_id)
    query = query.offset(skip).limit(limit)
    ledgers = (await session.exec(query)).all()

    result = []
    for lg in ledgers:
        prod = await session.get(Product, lg.product_id)
        wh = await session.get(Warehouse, lg.warehouse_id)
        result.append(StockLedgerResponse(
            **lg.model_dump(),
            product_name=prod.name if prod else None,
            product_sku=prod.sku if prod else None,
            warehouse_name=wh.name if wh else None
        ))
    return result

# ==================== SERIAL / IMEI ROUTES ====================

@router.get("/admin/serials", response_model=List[SerialItemResponse])
async def list_serials(
    product_id: Optional[str] = None, warehouse_id: Optional[str] = None,
    status: Optional[str] = None, search: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    session: AsyncSession = Depends(get_session), user=Depends(get_current_user)
):
    query = select(SerialItem).order_by(SerialItem.created_at.desc())
    if product_id: query = query.where(SerialItem.product_id == product_id)
    if warehouse_id: query = query.where(SerialItem.warehouse_id == warehouse_id)
    if status: query = query.where(SerialItem.status == status)
    if search: query = query.where(or_(col(SerialItem.serial_number).contains(search), col(SerialItem.imei).contains(search)))
    query = query.offset(skip).limit(limit)
    serials = (await session.exec(query)).all()

    result = []
    for s in serials:
        prod = await session.get(Product, s.product_id)
        wh = await session.get(Warehouse, s.warehouse_id) if s.warehouse_id else None
        result.append(SerialItemResponse(
            **s.model_dump(),
            product_name=prod.name if prod else None,
            product_sku=prod.sku if prod else None,
            warehouse_name=wh.name if wh else None,
        ))
    return result

@router.get("/admin/serials/{serial_id}", response_model=SerialItemResponse)
async def get_serial(serial_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    serial = await session.get(SerialItem, serial_id)
    if not serial: raise HTTPException(status_code=404, detail="Serial not found")
    prod = await session.get(Product, serial.product_id)
    wh = await session.get(Warehouse, serial.warehouse_id) if serial.warehouse_id else None
    return SerialItemResponse(
        **serial.model_dump(),
        product_name=prod.name if prod else None,
        product_sku=prod.sku if prod else None,
        warehouse_name=wh.name if wh else None,
    )

@router.post("/admin/serials", response_model=SerialItemResponse)
async def create_serial(data: SerialItemCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    existing = (await session.exec(select(SerialItem).where(SerialItem.serial_number == data.serial_number))).first()
    if existing: raise HTTPException(status_code=400, detail="Serial number already exists")
    prod = await session.get(Product, data.product_id)
    if not prod: raise HTTPException(status_code=404, detail="Product not found")
    if not prod.track_serial: raise HTTPException(status_code=400, detail="Product does not track serial numbers")
    wh = await session.get(Warehouse, data.warehouse_id)
    if not wh: raise HTTPException(status_code=404, detail="Warehouse not found")

    serial = SerialItem(**data.model_dump(), status='in_stock')
    session.add(serial)
    await session.flush()

    movement = SerialMovement(
        serial_id=serial.id, movement_type='receipt',
        to_warehouse_id=data.warehouse_id, created_by=user.id
    )
    session.add(movement)
    await session.commit()
    await session.refresh(serial)

    return SerialItemResponse(
        **serial.model_dump(),
        product_name=prod.name, product_sku=prod.sku, warehouse_name=wh.name
    )

@router.get("/admin/serials/{serial_id}/movements", response_model=List[SerialMovementResponse])
async def get_serial_movements(serial_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    serial = await session.get(SerialItem, serial_id)
    if not serial: raise HTTPException(status_code=404, detail="Serial not found")

    query = select(SerialMovement).where(SerialMovement.serial_id == serial_id).order_by(SerialMovement.created_at.desc())
    movements = (await session.exec(query)).all()

    result = []
    for m in movements:
        from_wh = await session.get(Warehouse, m.from_warehouse_id) if m.from_warehouse_id else None
        to_wh = await session.get(Warehouse, m.to_warehouse_id) if m.to_warehouse_id else None
        u = await session.get(User, m.created_by) if m.created_by else None
        result.append(SerialMovementResponse(
            **m.model_dump(),
            from_warehouse_name=from_wh.name if from_wh else None,
            to_warehouse_name=to_wh.name if to_wh else None,
            created_by_name=u.full_name if u else None,
        ))
    return result
