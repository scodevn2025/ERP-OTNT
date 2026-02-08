from __future__ import annotations
from typing import List, Optional, Dict, Literal

from sqlmodel import Field, SQLModel, Relationship, Column, JSON
from datetime import datetime, timezone
import uuid
from pydantic import ConfigDict

from zoneinfo import ZoneInfo

def get_vn_time():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat()

# ==================== AUTH MODELS ====================

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    phone: Optional[str] = None
    role: str = Field(default="staff") # admin, manager, staff, technician
    branch_id: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

# ==================== CATALOG MODELS ====================

class Category(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

class Brand(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    logo_url: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

class Product(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    sku: str = Field(unique=True, index=True)
    product_type: str # robot, goods, accessory, part, service
    
    category_id: Optional[str] = Field(default=None, foreign_key="category.id")
    brand_id: Optional[str] = Field(default=None, foreign_key="brand.id")
    
    description: Optional[str] = None
    short_description: Optional[str] = None
    
    price: float = Field(default=0)
    cost_price: float = Field(default=0)
    sale_price: Optional[float] = None
    
    warranty_months: int = Field(default=0)
    track_serial: bool = Field(default=False)
    
    # JSON Fields
    images: List[str] = Field(sa_column=Column(JSON), default=[])
    specifications: Dict = Field(sa_column=Column(JSON), default={})
    compatible_models: List[str] = Field(sa_column=Column(JSON), default=[])
    tags: List[str] = Field(sa_column=Column(JSON), default=[])
    
    stock_quantity: int = Field(default=0) # Derived or Cached
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

# ==================== INVENTORY MODELS ====================

class Warehouse(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    code: str = Field(unique=True)
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_id: Optional[str] = None
    is_default: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=get_vn_time)

class StockBalance(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    product_id: str = Field(index=True)
    warehouse_id: str = Field(index=True)
    quantity: int = Field(default=0)
    avg_cost: float = Field(default=0)
    updated_at: str = Field(default_factory=get_vn_time)

class InventoryDoc(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    doc_number: str = Field(unique=True, index=True)
    doc_type: str # receipt, issue, transfer, adjustment
    warehouse_id: str
    dest_warehouse_id: Optional[str] = None
    reference: Optional[str] = None
    note: Optional[str] = None
    status: str = Field(default="draft") # draft, posted, cancelled
    total_value: float = Field(default=0)

    # JSON Lines - Simplifying for Speed, ideally should be separate table
    lines: List[Dict] = Field(sa_column=Column(JSON), default=[])
    
    created_by: str
    posted_at: Optional[str] = None
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

# ==================== SERIAL & SALES MODELS ====================

class SerialItem(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    serial_number: str = Field(unique=True, index=True)
    imei: Optional[str] = None
    product_id: str = Field(index=True)
    warehouse_id: str = Field(index=True)
    status: str # in_stock, sold, repair, etc.
    cost_price: float = Field(default=0)
    
    # Sale Info
    sale_order_id: Optional[str] = None
    customer_id: Optional[str] = None
    warranty_start: Optional[str] = None
    warranty_end: Optional[str] = None
    
    note: Optional[str] = None
    created_at: str = Field(default_factory=get_vn_time)

class Customer(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    phone: str = Field(index=True)
    email: Optional[str] = None
    address: Optional[str] = None
    tax_code: Optional[str] = None
    note: Optional[str] = None
    total_orders: int = Field(default=0)
    total_spent: float = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

class SalesOrder(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    order_number: str = Field(unique=True, index=True)
    customer_id: str = Field(index=True)
    warehouse_id: str
    status: str = Field(default="draft") # draft, confirmed, completed
    total_items: int = Field(default=0)
    total_amount: float = Field(default=0)
    note: Optional[str] = None
    
    # JSON Lines
    lines: List[Dict] = Field(sa_column=Column(JSON), default=[])
    
    created_by: str
    confirmed_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

# ==================== REPAIR MODELS ====================

class RepairTicket(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    ticket_number: str = Field(unique=True, index=True)
    customer_id: str = Field(index=True)
    product_name: str
    product_id: Optional[str] = None
    serial_number: Optional[str] = None
    
    status: str = Field(default="received")
    priority: str = Field(default="normal")
    symptoms: str
    
    # JSON Fields for flexibility
    diagnosis: Optional[Dict] = Field(sa_column=Column(JSON), default=None)
    quote_parts: List[Dict] = Field(sa_column=Column(JSON), default=[])
    quote_services: List[Dict] = Field(sa_column=Column(JSON), default=[])
    total_estimate: float = Field(default=0)
    quote_approved: bool = Field(default=False)
    parts_issued: bool = Field(default=False)
    
    technician_id: Optional[str] = None
    created_by: str
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

# ==================== ACCOUNTING MODELS ====================

class Account(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    code: str = Field(unique=True, index=True)
    name: str
    account_type: str # asset, liability, equity, revenue, expense
    is_header: bool = Field(default=False)
    description: Optional[str] = None
    parent_id: Optional[str] = None
    balance: float = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: str = Field(default_factory=get_vn_time)

class JournalEntry(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    entry_number: str = Field(unique=True, index=True)
    journal_type: str # general, sales, purchase, inventory
    reference: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    description: Optional[str] = None
    status: str = Field(default="draft")
    
    total_debit: float = Field(default=0)
    total_credit: float = Field(default=0)
    
    # JSON Lines: [{account_id, debit, credit, description}]
    lines: List[Dict] = Field(sa_column=Column(JSON), default=[])
    
    created_by: str
    posted_at: Optional[str] = None
    created_at: str = Field(default_factory=get_vn_time)
    updated_at: str = Field(default_factory=get_vn_time)

class StockLedger(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    product_id: str = Field(index=True)
    warehouse_id: str = Field(index=True)
    doc_id: Optional[str] = None
    doc_number: Optional[str] = None
    doc_type: Optional[str] = None
    quantity_change: int = Field(default=0)
    unit_cost: float = Field(default=0)
    quantity_after: int = Field(default=0)
    created_at: str = Field(default_factory=get_vn_time)

class SerialMovement(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    serial_id: str = Field(index=True)
    movement_type: str # receipt, issue, transfer, sale, return
    from_warehouse_id: Optional[str] = None
    to_warehouse_id: Optional[str] = None
    reference_number: Optional[str] = None
    reference_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=get_vn_time)

