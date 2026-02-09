from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import aiofiles
import shutil
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'otnt-erp-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="OTNT ERP API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Media upload directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: Literal['admin', 'manager', 'staff', 'technician'] = 'staff'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    branch_id: Optional[str] = None
    is_active: bool = True
    created_at: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[Literal['admin', 'manager', 'staff', 'technician']] = None
    is_active: Optional[bool] = None
    branch_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Category Models
class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True

# Brand Models
class BrandCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None

class BrandResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
    is_active: bool = True

# Product Models
ProductType = Literal['robot', 'goods', 'accessory', 'part', 'service']

class ProductCreate(BaseModel):
    name: str
    slug: str
    sku: str
    product_type: ProductType
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float = 0
    cost_price: float = 0
    sale_price: Optional[float] = None
    warranty_months: int = 0
    track_serial: bool = False
    images: List[str] = []
    specifications: dict = {}
    compatible_models: List[str] = []
    tags: List[str] = []

class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    sku: str
    product_type: str
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    category_name: Optional[str] = None
    brand_name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float = 0
    cost_price: float = 0
    sale_price: Optional[float] = None
    warranty_months: int = 0
    track_serial: bool = False
    images: List[str] = []
    specifications: dict = {}
    compatible_models: List[str] = []
    tags: List[str] = []
    stock_quantity: int = 0
    is_active: bool = True
    created_at: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    sku: Optional[str] = None
    product_type: Optional[ProductType] = None
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    warranty_months: Optional[int] = None
    track_serial: Optional[bool] = None
    images: Optional[List[str]] = None
    specifications: Optional[dict] = None
    compatible_models: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Dashboard Stats
class DashboardStats(BaseModel):
    total_products: int
    total_categories: int
    total_brands: int
    total_users: int
    products_by_type: dict
    low_stock_count: int
    total_warehouses: int = 0
    total_stock_value: float = 0
    total_serials: int = 0
    total_customers: int = 0
    total_orders: int = 0
    pending_orders: int = 0

# ==================== INVENTORY MODELS ====================

# Warehouse Models
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

# Inventory Document Types
DocType = Literal['receipt', 'issue', 'transfer', 'adjustment', 'return']

# Inventory Document Line
class InventoryLineCreate(BaseModel):
    product_id: str
    quantity: int
    unit_cost: float = 0
    note: Optional[str] = None
    serial_numbers: List[str] = []

class InventoryLineResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_cost: float = 0
    total_cost: float = 0
    note: Optional[str] = None
    serial_numbers: List[str] = []

# Inventory Document
class InventoryDocCreate(BaseModel):
    doc_type: DocType
    warehouse_id: str
    dest_warehouse_id: Optional[str] = None  # For transfers
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
    status: str  # draft, posted, cancelled
    total_items: int = 0
    total_value: float = 0
    lines: List[InventoryLineResponse] = []
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    posted_at: Optional[str] = None
    created_at: str

# Stock Balance
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

# Stock Ledger Entry
class StockLedgerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    product_name: Optional[str] = None
    warehouse_id: str
    warehouse_name: Optional[str] = None
    doc_id: str
    doc_number: str
    doc_type: str
    quantity_change: int
    quantity_after: int
    unit_cost: float
    created_at: str

# ==================== SERIAL/IMEI MODELS ====================

SerialStatus = Literal['in_stock', 'sold', 'warranty', 'repair', 'returned', 'scrapped']

class SerialItemCreate(BaseModel):
    serial_number: str
    imei: Optional[str] = None
    product_id: str
    warehouse_id: str
    cost_price: float = 0
    note: Optional[str] = None

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
    sale_price: Optional[float] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    warranty_start: Optional[str] = None
    warranty_end: Optional[str] = None
    sale_order_id: Optional[str] = None
    note: Optional[str] = None
    created_at: str

class SerialMovementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    serial_id: str
    movement_type: str  # receipt, sale, transfer, repair_in, repair_out, return
    from_warehouse_id: Optional[str] = None
    from_warehouse_name: Optional[str] = None
    to_warehouse_id: Optional[str] = None
    to_warehouse_name: Optional[str] = None
    reference_id: Optional[str] = None
    reference_number: Optional[str] = None
    note: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: str

# ==================== CUSTOMER MODELS ====================

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

# ==================== SALES ORDER MODELS ====================

OrderStatus = Literal['draft', 'confirmed', 'completed', 'cancelled']

class SalesOrderLineCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    serial_numbers: List[str] = []
    note: Optional[str] = None

class SalesOrderLineResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
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

# ==================== STORE CONFIG MODELS ====================

class HeroBanner(BaseModel):
    image_url: str
    title: Optional[str] = ""
    subtitle: Optional[str] = ""
    link: Optional[str] = "/"

class PromoSection(BaseModel):
    title: Optional[str] = ""
    image_url: str
    link: Optional[str] = "/"
    tag: Optional[str] = ""

class FlashSaleConfig(BaseModel):
    is_active: bool = False
    title: str = "FLASH SALE"
    end_time: Optional[str] = None
    product_ids: List[str] = []

class StoreConfig(BaseModel):
    site_name: str = "ONG TRÙM NỘI TRỢ"
    tagline: str = "Robot hút bụi chính hãng"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: str = "#dc2626"
    secondary_color: str = "#1e293b"
    contact_phone: str = "0826.123.678"
    contact_email: str = "support@ongtrumnoitro.com"
    address: str = "123 Cầu Giấy, Hà Nội"
    facebook_url: Optional[str] = "#"
    youtube_url: Optional[str] = "#"
    instagram_url: Optional[str] = "#"
    hero_banners: List[HeroBanner] = []
    promo_sections: List[PromoSection] = []
    flash_sale: FlashSaleConfig = FlashSaleConfig()
    featured_categories: List[str] = [] # List of category IDs

class StoreConfigResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    site_name: str
    tagline: str
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: str
    secondary_color: str
    contact_phone: str
    contact_email: str
    address: str
    facebook_url: Optional[str] = "#"
    youtube_url: Optional[str] = "#"
    instagram_url: Optional[str] = "#"
    hero_banners: List[HeroBanner] = []
    promo_sections: List[PromoSection] = []
    flash_sale: FlashSaleConfig = FlashSaleConfig()
    featured_categories: List[str] = []
    updated_at: str

# Blog Models
class BlogCreate(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    feature_image: Optional[str] = None
    category: Optional[str] = "news"
    tags: List[str] = []
    is_published: bool = True

class BlogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    feature_image: Optional[str] = None
    category: Optional[str] = "news"
    tags: List[str] = []
    is_published: bool = True
    view_count: int = 0
    created_at: str
    updated_at: str

# ==================== AUTH HELPERS ====================

# ==================== REPAIR & WARRANTY MODELS ====================

RepairStatus = Literal['received', 'diagnosing', 'waiting_approval', 'repairing', 'ready', 'delivered', 'cancelled']

class RepairPartCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float = 0
    note: Optional[str] = None

class RepairServiceCreate(BaseModel):
    name: str # e.g., "Thay mainboard", "Ve sinh may"
    cost: float = 0
    note: Optional[str] = None

class RepairDiagnosis(BaseModel):
    symptoms: str
    root_cause: Optional[str] = None
    technician_note: Optional[str] = None
    attachments: List[str] = [] # URLs

class RepairQuoteCreate(BaseModel):
    parts: List[RepairPartCreate] = []
    services: List[RepairServiceCreate] = []
    note: Optional[str] = None

class RepairTicketCreate(BaseModel):
    customer_id: str
    product_id: Optional[str] = None # Or just enter name manually if not in system
    product_name: str
    serial_number: Optional[str] = None
    symptoms: str
    note: Optional[str] = None
    priority: Literal['low', 'normal', 'high', 'urgent'] = 'normal'

class RepairTicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    ticket_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    product_id: Optional[str] = None
    product_name: str
    serial_number: Optional[str] = None
    
    status: RepairStatus
    priority: str
    
    symptoms: str
    diagnosis: Optional[RepairDiagnosis] = None
    
    quote_parts: List[dict] = []
    quote_services: List[dict] = []
    total_estimate: float = 0
    quote_approved: bool = False
    
    parts_issued: bool = False # Inventory consumed?
    
    created_by: Optional[str] = None
    technician_id: Optional[str] = None
    technician_name: Optional[str] = None
    
    created_at: str
    updated_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get('role') not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "full_name": data.full_name,
        "phone": data.phone,
        "role": data.role,
        "branch_id": None,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, data.email, data.role)
    user_response = UserResponse(
        id=user_id, email=data.email, full_name=data.full_name,
        phone=data.phone, role=data.role, is_active=True, created_at=now
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user.get('hashed_password', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    token = create_token(user['id'], user['email'], user['role'])
    user_response = UserResponse(
        id=user['id'], email=user['email'], full_name=user['full_name'],
        phone=user.get('phone'), role=user['role'], branch_id=user.get('branch_id'),
        is_active=user.get('is_active', True), created_at=user['created_at']
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== CATEGORY ROUTES ====================

@api_router.get("/admin/categories", response_model=List[CategoryResponse])
async def list_categories(user: dict = Depends(get_current_user)):
    categories = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    return [CategoryResponse(**c) for c in categories]

@api_router.post("/admin/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, user: dict = Depends(require_admin)):
    existing = await db.categories.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category_id = str(uuid.uuid4())
    doc = {
        "id": category_id,
        **data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(doc)
    return CategoryResponse(**{k: v for k, v in doc.items() if k != '_id'})

# ==================== STORE CONFIG ROUTES ====================

@api_router.get("/store/config", response_model=StoreConfigResponse)
async def get_store_config():
    config = await db.store_config.find_one({"type": "general"}, {"_id": 0})
    if not config:
        now = datetime.now(timezone.utc).isoformat()
        return StoreConfigResponse(
            site_name="ONG TRÙM NỘI TRỢ",
            tagline="Robot hút bụi chính hãng",
            primary_color="#dc2626",
            secondary_color="#1e293b",
            contact_phone="0826.123.678",
            contact_email="support@ongtrumnoitro.com",
            address="123 Cầu Giấy, Hà Nội",
            updated_at=now
        )
    return StoreConfigResponse(**config)

@api_router.get("/admin/config", response_model=StoreConfigResponse)
async def get_admin_config(user: dict = Depends(require_admin)):
    config = await db.store_config.find_one({"type": "general"}, {"_id": 0})
    if not config:
        now = datetime.now(timezone.utc).isoformat()
        config = StoreConfig().model_dump()
        config["type"] = "general"
        config["updated_at"] = now
        await db.store_config.insert_one(config)
        del config["_id"]
    return StoreConfigResponse(**config)

@api_router.post("/admin/config", response_model=StoreConfigResponse)
async def update_store_config(data: StoreConfig, user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc).isoformat()
    update_data = data.model_dump()
    update_data["updated_at"] = now
    
    await db.store_config.update_one(
        {"type": "general"},
        {"$set": update_data},
        upsert=True
    )
    
    config = await db.store_config.find_one({"type": "general"}, {"_id": 0})
    return StoreConfigResponse(**config)

# ==================== BLOG ROUTES ====================

@api_router.get("/store/blogs", response_model=List[BlogResponse])
async def list_blogs_public(category: Optional[str] = None, limit: int = 10):
    query = {"is_published": True}
    if category:
        query["category"] = category
    blogs = await db.blogs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [BlogResponse(**b) for b in blogs]

@api_router.get("/store/blogs/{slug}", response_model=BlogResponse)
async def get_blog_public(slug: str):
    blog = await db.blogs.find_one({"slug": slug, "is_published": True}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
    # Increment view count (fire and forget)
    await db.blogs.update_one({"slug": slug}, {"$inc": {"view_count": 1}})
    return BlogResponse(**blog)

@api_router.get("/admin/blogs", response_model=List[BlogResponse])
async def list_blogs_admin(user: dict = Depends(require_admin)):
    blogs = await db.blogs.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [BlogResponse(**b) for b in blogs]

@api_router.post("/admin/blogs", response_model=BlogResponse)
async def create_blog(data: BlogCreate, user: dict = Depends(require_admin)):
    existing = await db.blogs.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Blog slug already exists")
    
    blog_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": blog_id,
        **data.model_dump(),
        "view_count": 0,
        "created_at": now,
        "updated_at": now
    }
    await db.blogs.insert_one(doc)
    return BlogResponse(**{k: v for k, v in doc.items() if k != '_id'})

@api_router.put("/admin/blogs/{blog_id}", response_model=BlogResponse)
async def update_blog(blog_id: str, data: BlogCreate, user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc).isoformat()
    result = await db.blogs.find_one_and_update(
        {"id": blog_id},
        {"$set": {**data.model_dump(), "updated_at": now}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return BlogResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/blogs/{blog_id}")
async def delete_blog(blog_id: str, user: dict = Depends(require_admin)):
    result = await db.blogs.delete_one({"id": blog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted"}

@api_router.put("/admin/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, data: CategoryCreate, user: dict = Depends(require_admin)):
    result = await db.categories.find_one_and_update(
        {"id": category_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(require_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ==================== BRAND ROUTES ====================

@api_router.get("/admin/brands", response_model=List[BrandResponse])
async def list_brands(user: dict = Depends(get_current_user)):
    brands = await db.brands.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [BrandResponse(**b) for b in brands]

@api_router.post("/admin/brands", response_model=BrandResponse)
async def create_brand(data: BrandCreate, user: dict = Depends(require_admin)):
    existing = await db.brands.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Brand slug already exists")
    
    brand_id = str(uuid.uuid4())
    doc = {
        "id": brand_id,
        **data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.brands.insert_one(doc)
    return BrandResponse(**{k: v for k, v in doc.items() if k != '_id'})

@api_router.put("/admin/brands/{brand_id}", response_model=BrandResponse)
async def update_brand(brand_id: str, data: BrandCreate, user: dict = Depends(require_admin)):
    result = await db.brands.find_one_and_update(
        {"id": brand_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Brand not found")
    return BrandResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/brands/{brand_id}")
async def delete_brand(brand_id: str, user: dict = Depends(require_admin)):
    result = await db.brands.delete_one({"id": brand_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"message": "Brand deleted"}

# ==================== PRODUCT ROUTES (ADMIN) ====================

@api_router.get("/admin/products", response_model=List[ProductResponse])
async def list_products(
    user: dict = Depends(get_current_user),
    product_type: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if product_type:
        query['product_type'] = product_type
    if category_id:
        query['category_id'] = category_id
    if brand_id:
        query['brand_id'] = brand_id
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'sku': {'$regex': search, '$options': 'i'}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with category/brand names
    categories = {c['id']: c['name'] for c in await db.categories.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)}
    brands = {b['id']: b['name'] for b in await db.brands.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)}
    
    result = []
    for p in products:
        p['category_name'] = categories.get(p.get('category_id'))
        p['brand_name'] = brands.get(p.get('brand_id'))
        result.append(ProductResponse(**p))
    
    return result

@api_router.get("/admin/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.get('category_id'):
        cat = await db.categories.find_one({"id": product['category_id']}, {"_id": 0, "name": 1})
        product['category_name'] = cat['name'] if cat else None
    if product.get('brand_id'):
        brand = await db.brands.find_one({"id": product['brand_id']}, {"_id": 0, "name": 1})
        product['brand_name'] = brand['name'] if brand else None
    
    return ProductResponse(**product)

@api_router.post("/admin/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, user: dict = Depends(require_admin)):
    existing = await db.products.find_one({"$or": [{"slug": data.slug}, {"sku": data.sku}]})
    if existing:
        raise HTTPException(status_code=400, detail="Product slug or SKU already exists")
    
    # Auto-enable serial tracking for robots
    track_serial = data.track_serial or data.product_type == 'robot'
    
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": product_id,
        **data.model_dump(),
        "track_serial": track_serial,
        "stock_quantity": 0,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    await db.products.insert_one(doc)
    
    result = {k: v for k, v in doc.items() if k != '_id'}
    return ProductResponse(**result)

@api_router.put("/admin/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductUpdate, user: dict = Depends(require_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products.find_one_and_update(
        {"id": product_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return ProductResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== STORE ROUTES (PUBLIC) ====================

@api_router.get("/store/products", response_model=List[ProductResponse])
async def store_list_products(
    product_type: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {"is_active": True}
    if product_type:
        query['product_type'] = product_type
    if category_id:
        query['category_id'] = category_id
    if brand_id:
        query['brand_id'] = brand_id
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'tags': {'$in': [search]}}
        ]
    if min_price is not None:
        query['price'] = {'$gte': min_price}
    if max_price is not None:
        query.setdefault('price', {})['$lte'] = max_price
    
    products = await db.products.find(query, {"_id": 0, "cost_price": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    categories = {c['id']: c['name'] for c in await db.categories.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)}
    brands = {b['id']: b['name'] for b in await db.brands.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)}
    
    result = []
    for p in products:
        p['category_name'] = categories.get(p.get('category_id'))
        p['brand_name'] = brands.get(p.get('brand_id'))
        p['cost_price'] = 0  # Hide from public
        result.append(ProductResponse(**p))
    
    return result

@api_router.get("/store/products/{slug}", response_model=ProductResponse)
async def store_get_product(slug: str):
    product = await db.products.find_one({"slug": slug, "is_active": True}, {"_id": 0, "cost_price": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.get('category_id'):
        cat = await db.categories.find_one({"id": product['category_id']}, {"_id": 0, "name": 1})
        product['category_name'] = cat['name'] if cat else None
    if product.get('brand_id'):
        brand = await db.brands.find_one({"id": product['brand_id']}, {"_id": 0, "name": 1})
        product['brand_name'] = brand['name'] if brand else None
    
    product['cost_price'] = 0
    return ProductResponse(**product)

@api_router.get("/store/categories", response_model=List[CategoryResponse])
async def store_list_categories():
    categories = await db.categories.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    return [CategoryResponse(**c) for c in categories]

@api_router.get("/store/brands", response_model=List[BrandResponse])
async def store_list_brands():
    brands = await db.brands.find({"is_active": True}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [BrandResponse(**b) for b in brands]

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/admin/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    total_products = await db.products.count_documents({})
    total_categories = await db.categories.count_documents({})
    total_brands = await db.brands.count_documents({})
    total_users = await db.users.count_documents({})
    total_warehouses = await db.warehouses.count_documents({})
    total_serials = await db.serial_items.count_documents({})
    total_customers = await db.customers.count_documents({})
    total_orders = await db.sales_orders.count_documents({})
    pending_orders = await db.sales_orders.count_documents({"status": {"$in": ["draft", "confirmed"]}})
    
    # Products by type
    pipeline = [
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}}}
    ]
    type_counts = await db.products.aggregate(pipeline).to_list(10)
    products_by_type = {t['_id']: t['count'] for t in type_counts if t['_id']}
    
    # Low stock count (less than 5)
    low_stock_count = await db.products.count_documents({"stock_quantity": {"$lt": 5}, "product_type": {"$ne": "service"}})
    
    # Total stock value
    stock_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": {"$multiply": ["$quantity", "$avg_cost"]}}}}
    ]
    stock_value_result = await db.stock_balance.aggregate(stock_pipeline).to_list(1)
    total_stock_value = stock_value_result[0]['total'] if stock_value_result else 0
    
    return DashboardStats(
        total_products=total_products,
        total_categories=total_categories,
        total_brands=total_brands,
        total_users=total_users,
        products_by_type=products_by_type,
        low_stock_count=low_stock_count,
        total_warehouses=total_warehouses,
        total_stock_value=total_stock_value,
        total_serials=total_serials,
        total_customers=total_customers,
        total_orders=total_orders,
        pending_orders=pending_orders
    )

# ==================== WAREHOUSE ROUTES ====================

@api_router.get("/admin/warehouses", response_model=List[WarehouseResponse])
async def list_warehouses(user: dict = Depends(get_current_user)):
    warehouses = await db.warehouses.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    users = {u['id']: u['full_name'] for u in await db.users.find({}, {"_id": 0, "id": 1, "full_name": 1}).to_list(1000)}
    
    result = []
    for w in warehouses:
        w['manager_name'] = users.get(w.get('manager_id'))
        result.append(WarehouseResponse(**w))
    return result

@api_router.get("/admin/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: str, user: dict = Depends(get_current_user)):
    warehouse = await db.warehouses.find_one({"id": warehouse_id}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    if warehouse.get('manager_id'):
        manager = await db.users.find_one({"id": warehouse['manager_id']}, {"_id": 0, "full_name": 1})
        warehouse['manager_name'] = manager['full_name'] if manager else None
    
    return WarehouseResponse(**warehouse)

@api_router.post("/admin/warehouses", response_model=WarehouseResponse)
async def create_warehouse(data: WarehouseCreate, user: dict = Depends(require_admin)):
    existing = await db.warehouses.find_one({"code": data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse code already exists")
    
    # If this is default, unset others
    if data.is_default:
        await db.warehouses.update_many({}, {"$set": {"is_default": False}})
    
    warehouse_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": warehouse_id,
        **data.model_dump(),
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    await db.warehouses.insert_one(doc)
    return WarehouseResponse(**{k: v for k, v in doc.items() if k != '_id'})

@api_router.put("/admin/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(warehouse_id: str, data: WarehouseCreate, user: dict = Depends(require_admin)):
    # If this is default, unset others
    if data.is_default:
        await db.warehouses.update_many({"id": {"$ne": warehouse_id}}, {"$set": {"is_default": False}})
    
    result = await db.warehouses.find_one_and_update(
        {"id": warehouse_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return WarehouseResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/warehouses/{warehouse_id}")
async def delete_warehouse(warehouse_id: str, user: dict = Depends(require_admin)):
    # Check if warehouse has stock
    has_stock = await db.stock_balance.find_one({"warehouse_id": warehouse_id, "quantity": {"$gt": 0}})
    if has_stock:
        raise HTTPException(status_code=400, detail="Cannot delete warehouse with existing stock")
    
    result = await db.warehouses.delete_one({"id": warehouse_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"message": "Warehouse deleted"}

# ==================== INVENTORY DOCUMENT ROUTES ====================

async def generate_doc_number(doc_type: str) -> str:
    """Generate document number like PN-20240206-001"""
    prefix_map = {
        'receipt': 'PN',  # Phiếu nhập
        'issue': 'PX',    # Phiếu xuất
        'transfer': 'PC', # Phiếu chuyển
        'adjustment': 'PD', # Phiếu điều chỉnh
        'return': 'PT'    # Phiếu trả
    }
    prefix = prefix_map.get(doc_type, 'PK')
    date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
    
    # Count today's documents
    start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = await db.inventory_docs.count_documents({
        "doc_type": doc_type,
        "created_at": {"$gte": start_of_day.isoformat()}
    })
    
    return f"{prefix}-{date_str}-{str(count + 1).zfill(3)}"

@api_router.get("/admin/inventory/documents", response_model=List[InventoryDocResponse])
async def list_inventory_docs(
    user: dict = Depends(get_current_user),
    doc_type: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if doc_type:
        query['doc_type'] = doc_type
    if warehouse_id:
        query['$or'] = [{'warehouse_id': warehouse_id}, {'dest_warehouse_id': warehouse_id}]
    if status:
        query['status'] = status
    
    docs = await db.inventory_docs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with names
    warehouses = {w['id']: w['name'] for w in await db.warehouses.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    users = {u['id']: u['full_name'] for u in await db.users.find({}, {"_id": 0, "id": 1, "full_name": 1}).to_list(1000)}
    
    result = []
    for d in docs:
        d['warehouse_name'] = warehouses.get(d.get('warehouse_id'))
        d['dest_warehouse_name'] = warehouses.get(d.get('dest_warehouse_id'))
        d['created_by_name'] = users.get(d.get('created_by'))
        result.append(InventoryDocResponse(**d))
    
    return result

@api_router.get("/admin/inventory/documents/{doc_id}", response_model=InventoryDocResponse)
async def get_inventory_doc(doc_id: str, user: dict = Depends(get_current_user)):
    doc = await db.inventory_docs.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Enrich with names
    if doc.get('warehouse_id'):
        wh = await db.warehouses.find_one({"id": doc['warehouse_id']}, {"_id": 0, "name": 1})
        doc['warehouse_name'] = wh['name'] if wh else None
    if doc.get('dest_warehouse_id'):
        dwh = await db.warehouses.find_one({"id": doc['dest_warehouse_id']}, {"_id": 0, "name": 1})
        doc['dest_warehouse_name'] = dwh['name'] if dwh else None
    if doc.get('created_by'):
        user_info = await db.users.find_one({"id": doc['created_by']}, {"_id": 0, "full_name": 1})
        doc['created_by_name'] = user_info['full_name'] if user_info else None
    
    # Enrich lines with product info
    products = {p['id']: p for p in await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "sku": 1}).to_list(1000)}
    for line in doc.get('lines', []):
        product = products.get(line.get('product_id'), {})
        line['product_name'] = product.get('name')
        line['product_sku'] = product.get('sku')
    
    return InventoryDocResponse(**doc)

@api_router.post("/admin/inventory/documents", response_model=InventoryDocResponse)
async def create_inventory_doc(data: InventoryDocCreate, user: dict = Depends(get_current_user)):
    # Validate warehouse exists
    warehouse = await db.warehouses.find_one({"id": data.warehouse_id}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=400, detail="Warehouse not found")
    
    # For transfers, validate destination warehouse
    if data.doc_type == 'transfer':
        if not data.dest_warehouse_id:
            raise HTTPException(status_code=400, detail="Destination warehouse required for transfer")
        dest_wh = await db.warehouses.find_one({"id": data.dest_warehouse_id}, {"_id": 0})
        if not dest_wh:
            raise HTTPException(status_code=400, detail="Destination warehouse not found")
    
    doc_id = str(uuid.uuid4())
    doc_number = await generate_doc_number(data.doc_type)
    now = datetime.now(timezone.utc).isoformat()
    
    # Process lines
    lines = []
    total_items = 0
    total_value = 0
    
    for line_data in data.lines:
        product = await db.products.find_one({"id": line_data.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {line_data.product_id} not found")
        
        line_id = str(uuid.uuid4())
        line_total = line_data.quantity * line_data.unit_cost
        
        lines.append({
            "id": line_id,
            "product_id": line_data.product_id,
            "quantity": line_data.quantity,
            "unit_cost": line_data.unit_cost,
            "total_cost": line_total,
            "note": line_data.note,
            "serial_numbers": line_data.serial_numbers
        })
        
        total_items += line_data.quantity
        total_value += line_total
    
    doc = {
        "id": doc_id,
        "doc_number": doc_number,
        "doc_type": data.doc_type,
        "warehouse_id": data.warehouse_id,
        "dest_warehouse_id": data.dest_warehouse_id,
        "reference": data.reference,
        "note": data.note,
        "status": "draft",
        "lines": lines,
        "total_items": total_items,
        "total_value": total_value,
        "created_by": user['id'],
        "posted_at": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.inventory_docs.insert_one(doc)
    
    # Enrich response
    doc['warehouse_name'] = warehouse['name']
    doc['created_by_name'] = user['full_name']
    
    return InventoryDocResponse(**{k: v for k, v in doc.items() if k != '_id'})

@api_router.post("/admin/inventory/documents/{doc_id}/post")
async def post_inventory_doc(doc_id: str, user: dict = Depends(get_current_user)):
    """Post/confirm the inventory document - updates stock"""
    doc = await db.inventory_docs.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc['status'] != 'draft':
        raise HTTPException(status_code=400, detail="Document already posted or cancelled")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Process each line
    for line in doc['lines']:
        product_id = line['product_id']
        quantity = line['quantity']
        unit_cost = line['unit_cost']
        warehouse_id = doc['warehouse_id']
        
        # Determine quantity change based on doc type
        if doc['doc_type'] in ['receipt', 'return']:
            qty_change = quantity  # Increase stock
        elif doc['doc_type'] in ['issue']:
            qty_change = -quantity  # Decrease stock
            # Check available stock
            balance = await db.stock_balance.find_one({"product_id": product_id, "warehouse_id": warehouse_id}, {"_id": 0})
            current_qty = balance['quantity'] if balance else 0
            if current_qty < quantity:
                product = await db.products.find_one({"id": product_id}, {"_id": 0, "name": 1})
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}: available {current_qty}, requested {quantity}")
        elif doc['doc_type'] == 'transfer':
            # For transfers, decrease from source
            qty_change = -quantity
            balance = await db.stock_balance.find_one({"product_id": product_id, "warehouse_id": warehouse_id}, {"_id": 0})
            current_qty = balance['quantity'] if balance else 0
            if current_qty < quantity:
                product = await db.products.find_one({"id": product_id}, {"_id": 0, "name": 1})
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}: available {current_qty}, requested {quantity}")
        elif doc['doc_type'] == 'adjustment':
            # Adjustment can be positive or negative
            balance = await db.stock_balance.find_one({"product_id": product_id, "warehouse_id": warehouse_id}, {"_id": 0})
            current_qty = balance['quantity'] if balance else 0
            qty_change = quantity - current_qty  # Set to exact quantity
        else:
            qty_change = quantity
        
        # Update stock balance for source warehouse
        await update_stock_balance(product_id, warehouse_id, qty_change, unit_cost)
        
        # Create ledger entry
        ledger_entry = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "doc_id": doc_id,
            "doc_number": doc['doc_number'],
            "doc_type": doc['doc_type'],
            "quantity_change": qty_change,
            "unit_cost": unit_cost,
            "created_at": now
        }
        
        # Get new balance for ledger
        new_balance = await db.stock_balance.find_one({"product_id": product_id, "warehouse_id": warehouse_id}, {"_id": 0})
        ledger_entry['quantity_after'] = new_balance['quantity'] if new_balance else 0
        
        await db.stock_ledger.insert_one(ledger_entry)
        
        # For transfers, also update destination warehouse
        if doc['doc_type'] == 'transfer' and doc.get('dest_warehouse_id'):
            dest_warehouse_id = doc['dest_warehouse_id']
            await update_stock_balance(product_id, dest_warehouse_id, quantity, unit_cost)
            
            # Create ledger entry for destination
            dest_ledger = {
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "warehouse_id": dest_warehouse_id,
                "doc_id": doc_id,
                "doc_number": doc['doc_number'],
                "doc_type": doc['doc_type'],
                "quantity_change": quantity,
                "unit_cost": unit_cost,
                "created_at": now
            }
            dest_balance = await db.stock_balance.find_one({"product_id": product_id, "warehouse_id": dest_warehouse_id}, {"_id": 0})
            dest_ledger['quantity_after'] = dest_balance['quantity'] if dest_balance else 0
            await db.stock_ledger.insert_one(dest_ledger)
    
    # Update document status
    await db.inventory_docs.update_one(
        {"id": doc_id},
        {"$set": {"status": "posted", "posted_at": now, "updated_at": now}}
    )
    
    # Update product stock quantities
    await sync_product_stock()
    
    # Create automated journal entry for inventory transaction
    try:
        await create_inventory_journal(
            doc_id=doc_id,
            doc_number=doc['doc_number'],
            doc_type=doc['doc_type'],
            lines=doc['lines'],
            user_id=user['id'],
            description=f"Tự động ghi nhận kho - {doc['doc_number']}"
        )
    except Exception as e:
        logger.warning(f"Failed to create inventory journal: {e}")
    
    return {"message": "Document posted successfully", "doc_number": doc['doc_number']}

async def update_stock_balance(product_id: str, warehouse_id: str, qty_change: int, unit_cost: float):
    """Update or create stock balance"""
    existing = await db.stock_balance.find_one(
        {"product_id": product_id, "warehouse_id": warehouse_id},
        {"_id": 0}
    )
    
    if existing:
        new_qty = existing['quantity'] + qty_change
        # Calculate new average cost (weighted average)
        if qty_change > 0 and unit_cost > 0:
            old_value = existing['quantity'] * existing.get('avg_cost', 0)
            new_value = qty_change * unit_cost
            new_avg_cost = (old_value + new_value) / new_qty if new_qty > 0 else 0
        else:
            new_avg_cost = existing.get('avg_cost', 0)
        
        await db.stock_balance.update_one(
            {"product_id": product_id, "warehouse_id": warehouse_id},
            {"$set": {
                "quantity": new_qty,
                "avg_cost": new_avg_cost,
                "total_value": new_qty * new_avg_cost,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Create new balance
        await db.stock_balance.insert_one({
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "quantity": qty_change,
            "avg_cost": unit_cost,
            "total_value": qty_change * unit_cost,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

async def sync_product_stock():
    """Sync total stock quantities to products collection"""
    pipeline = [
        {"$group": {"_id": "$product_id", "total_qty": {"$sum": "$quantity"}}}
    ]
    stock_totals = await db.stock_balance.aggregate(pipeline).to_list(10000)
    
    for item in stock_totals:
        await db.products.update_one(
            {"id": item['_id']},
            {"$set": {"stock_quantity": item['total_qty']}}
        )

@api_router.delete("/admin/inventory/documents/{doc_id}")
async def delete_inventory_doc(doc_id: str, user: dict = Depends(require_admin)):
    doc = await db.inventory_docs.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc['status'] == 'posted':
        raise HTTPException(status_code=400, detail="Cannot delete posted document")
    
    await db.inventory_docs.delete_one({"id": doc_id})
    return {"message": "Document deleted"}

# ==================== STOCK BALANCE ROUTES ====================

@api_router.get("/admin/inventory/stock", response_model=List[StockBalanceResponse])
async def list_stock_balance(
    user: dict = Depends(get_current_user),
    warehouse_id: Optional[str] = None,
    product_id: Optional[str] = None,
    low_stock: bool = False
):
    query = {"quantity": {"$gt": 0}} if not low_stock else {"quantity": {"$lt": 5, "$gt": 0}}
    if warehouse_id:
        query['warehouse_id'] = warehouse_id
    if product_id:
        query['product_id'] = product_id
    
    balances = await db.stock_balance.find(query, {"_id": 0}).to_list(10000)
    
    # Enrich with names
    products = {p['id']: p for p in await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "sku": 1, "product_type": 1}).to_list(10000)}
    warehouses = {w['id']: w['name'] for w in await db.warehouses.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    
    result = []
    for b in balances:
        product = products.get(b['product_id'], {})
        result.append(StockBalanceResponse(
            product_id=b['product_id'],
            product_name=product.get('name', ''),
            product_sku=product.get('sku', ''),
            product_type=product.get('product_type', ''),
            warehouse_id=b['warehouse_id'],
            warehouse_name=warehouses.get(b['warehouse_id'], ''),
            quantity=b['quantity'],
            avg_cost=b.get('avg_cost', 0),
            total_value=b.get('total_value', 0)
        ))
    
    return result

@api_router.get("/admin/inventory/ledger", response_model=List[StockLedgerResponse])
async def list_stock_ledger(
    user: dict = Depends(get_current_user),
    product_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if product_id:
        query['product_id'] = product_id
    if warehouse_id:
        query['warehouse_id'] = warehouse_id
    
    entries = await db.stock_ledger.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with names
    products = {p['id']: p['name'] for p in await db.products.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(10000)}
    warehouses = {w['id']: w['name'] for w in await db.warehouses.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    
    result = []
    for e in entries:
        e['product_name'] = products.get(e['product_id'])
        e['warehouse_name'] = warehouses.get(e['warehouse_id'])
        result.append(StockLedgerResponse(**e))
    
    return result

# ==================== SERIAL/IMEI ROUTES ====================

@api_router.get("/admin/serials", response_model=List[SerialItemResponse])
async def list_serial_items(
    user: dict = Depends(get_current_user),
    product_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if product_id:
        query['product_id'] = product_id
    if warehouse_id:
        query['warehouse_id'] = warehouse_id
    if status:
        query['status'] = status
    if search:
        query['$or'] = [
            {'serial_number': {'$regex': search, '$options': 'i'}},
            {'imei': {'$regex': search, '$options': 'i'}}
        ]
    
    serials = await db.serial_items.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with names
    products = {p['id']: p for p in await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "sku": 1}).to_list(10000)}
    warehouses = {w['id']: w['name'] for w in await db.warehouses.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    customers = {c['id']: c['name'] for c in await db.customers.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(10000)}
    
    result = []
    for s in serials:
        product = products.get(s.get('product_id'), {})
        s['product_name'] = product.get('name')
        s['product_sku'] = product.get('sku')
        s['warehouse_name'] = warehouses.get(s.get('warehouse_id'))
        s['customer_name'] = customers.get(s.get('customer_id'))
        result.append(SerialItemResponse(**s))
    
    return result

@api_router.get("/admin/serials/{serial_id}", response_model=SerialItemResponse)
async def get_serial_item(serial_id: str, user: dict = Depends(get_current_user)):
    serial = await db.serial_items.find_one({"id": serial_id}, {"_id": 0})
    if not serial:
        raise HTTPException(status_code=404, detail="Serial item not found")
    
    # Enrich
    if serial.get('product_id'):
        product = await db.products.find_one({"id": serial['product_id']}, {"_id": 0, "name": 1, "sku": 1})
        serial['product_name'] = product['name'] if product else None
        serial['product_sku'] = product['sku'] if product else None
    if serial.get('warehouse_id'):
        wh = await db.warehouses.find_one({"id": serial['warehouse_id']}, {"_id": 0, "name": 1})
        serial['warehouse_name'] = wh['name'] if wh else None
    if serial.get('customer_id'):
        customer = await db.customers.find_one({"id": serial['customer_id']}, {"_id": 0, "name": 1})
        serial['customer_name'] = customer['name'] if customer else None
    
    return SerialItemResponse(**serial)

@api_router.post("/admin/serials", response_model=SerialItemResponse)
async def create_serial_item(data: SerialItemCreate, user: dict = Depends(get_current_user)):
    # Check product exists and tracks serial
    product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=400, detail="Product not found")
    if not product.get('track_serial'):
        raise HTTPException(status_code=400, detail="Product does not track serial numbers")
    
    # Check serial number unique
    existing = await db.serial_items.find_one({"serial_number": data.serial_number})
    if existing:
        raise HTTPException(status_code=400, detail="Serial number already exists")
    
    # Check warehouse exists
    warehouse = await db.warehouses.find_one({"id": data.warehouse_id}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=400, detail="Warehouse not found")
    
    serial_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": serial_id,
        "serial_number": data.serial_number,
        "imei": data.imei,
        "product_id": data.product_id,
        "warehouse_id": data.warehouse_id,
        "status": "in_stock",
        "cost_price": data.cost_price,
        "note": data.note,
        "created_at": now,
        "updated_at": now
    }
    
    await db.serial_items.insert_one(doc)
    
    # Create movement record
    await create_serial_movement(serial_id, "receipt", None, data.warehouse_id, None, None, user['id'], "Nhập kho ban đầu")
    
    doc['product_name'] = product['name']
    doc['product_sku'] = product['sku']
    doc['warehouse_name'] = warehouse['name']
    
    return SerialItemResponse(**{k: v for k, v in doc.items() if k != '_id'})

async def create_serial_movement(
    serial_id: str,
    movement_type: str,
    from_warehouse_id: Optional[str],
    to_warehouse_id: Optional[str],
    reference_id: Optional[str],
    reference_number: Optional[str],
    created_by: str,
    note: Optional[str] = None
):
    """Create serial movement record"""
    movement = {
        "id": str(uuid.uuid4()),
        "serial_id": serial_id,
        "movement_type": movement_type,
        "from_warehouse_id": from_warehouse_id,
        "to_warehouse_id": to_warehouse_id,
        "reference_id": reference_id,
        "reference_number": reference_number,
        "note": note,
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.serial_movements.insert_one(movement)

@api_router.get("/admin/serials/{serial_id}/movements", response_model=List[SerialMovementResponse])
async def get_serial_movements(serial_id: str, user: dict = Depends(get_current_user)):
    movements = await db.serial_movements.find({"serial_id": serial_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with names
    warehouses = {w['id']: w['name'] for w in await db.warehouses.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    users = {u['id']: u['full_name'] for u in await db.users.find({}, {"_id": 0, "id": 1, "full_name": 1}).to_list(1000)}
    
    result = []
    for m in movements:
        m['from_warehouse_name'] = warehouses.get(m.get('from_warehouse_id'))
        m['to_warehouse_name'] = warehouses.get(m.get('to_warehouse_id'))
        m['created_by_name'] = users.get(m.get('created_by'))
        result.append(SerialMovementResponse(**m))
    
    return result

# ==================== CUSTOMER ROUTES ====================

@api_router.get("/admin/customers", response_model=List[CustomerResponse])
async def list_customers(
    user: dict = Depends(get_current_user),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'phone': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}}
        ]
    
    customers = await db.customers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [CustomerResponse(**c) for c in customers]

@api_router.get("/admin/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse(**customer)

@api_router.post("/admin/customers", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, user: dict = Depends(get_current_user)):
    # Check phone unique
    existing = await db.customers.find_one({"phone": data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    customer_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": customer_id,
        **data.model_dump(),
        "total_orders": 0,
        "total_spent": 0,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.customers.insert_one(doc)
    return CustomerResponse(**{k: v for k, v in doc.items() if k != '_id'})

@api_router.put("/admin/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerCreate, user: dict = Depends(get_current_user)):
    result = await db.customers.find_one_and_update(
        {"id": customer_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/customers/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(require_admin)):
    # Check if customer has orders
    has_orders = await db.sales_orders.find_one({"customer_id": customer_id})
    if has_orders:
        raise HTTPException(status_code=400, detail="Cannot delete customer with existing orders")
    
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}

# ==================== SALES ORDER ROUTES ====================

async def generate_order_number() -> str:
    """Generate order number like SO-20240206-001"""
    date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
    start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = await db.sales_orders.count_documents({
        "created_at": {"$gte": start_of_day.isoformat()}
    })
    return f"SO-{date_str}-{str(count + 1).zfill(3)}"

@api_router.get("/admin/sales/orders", response_model=List[SalesOrderResponse])
async def list_sales_orders(
    user: dict = Depends(get_current_user),
    customer_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if customer_id:
        query['customer_id'] = customer_id
    if warehouse_id:
        query['warehouse_id'] = warehouse_id
    if status:
        query['status'] = status
    
    orders = await db.sales_orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with names
    customers = {c['id']: c for c in await db.customers.find({}, {"_id": 0, "id": 1, "name": 1, "phone": 1}).to_list(10000)}
    warehouses = {w['id']: w['name'] for w in await db.warehouses.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    users = {u['id']: u['full_name'] for u in await db.users.find({}, {"_id": 0, "id": 1, "full_name": 1}).to_list(1000)}
    
    result = []
    for o in orders:
        customer = customers.get(o.get('customer_id'), {})
        o['customer_name'] = customer.get('name')
        o['customer_phone'] = customer.get('phone')
        o['warehouse_name'] = warehouses.get(o.get('warehouse_id'))
        o['created_by_name'] = users.get(o.get('created_by'))
        result.append(SalesOrderResponse(**o))
    
    return result

@api_router.get("/admin/sales/orders/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.sales_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Enrich with names
    if order.get('customer_id'):
        customer = await db.customers.find_one({"id": order['customer_id']}, {"_id": 0, "name": 1, "phone": 1})
        order['customer_name'] = customer['name'] if customer else None
        order['customer_phone'] = customer['phone'] if customer else None
    if order.get('warehouse_id'):
        wh = await db.warehouses.find_one({"id": order['warehouse_id']}, {"_id": 0, "name": 1})
        order['warehouse_name'] = wh['name'] if wh else None
    if order.get('created_by'):
        user_info = await db.users.find_one({"id": order['created_by']}, {"_id": 0, "full_name": 1})
        order['created_by_name'] = user_info['full_name'] if user_info else None
    
    # Enrich lines with product info
    products = {p['id']: p for p in await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "sku": 1, "warranty_months": 1}).to_list(1000)}
    for line in order.get('lines', []):
        product = products.get(line.get('product_id'), {})
        line['product_name'] = product.get('name')
        line['product_sku'] = product.get('sku')
        line['warranty_months'] = product.get('warranty_months', 0)
    
    return SalesOrderResponse(**order)

@api_router.post("/admin/sales/orders", response_model=SalesOrderResponse)
async def create_sales_order(data: SalesOrderCreate, user: dict = Depends(get_current_user)):
    # Validate customer
    customer = await db.customers.find_one({"id": data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")
    
    # Validate warehouse
    warehouse = await db.warehouses.find_one({"id": data.warehouse_id}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=400, detail="Warehouse not found")
    
    order_id = str(uuid.uuid4())
    order_number = await generate_order_number()
    now = datetime.now(timezone.utc).isoformat()
    
    # Process lines
    lines = []
    total_items = 0
    total_amount = 0
    
    for line_data in data.lines:
        product = await db.products.find_one({"id": line_data.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {line_data.product_id} not found")
        
        # Validate serial numbers if product tracks serial
        if product.get('track_serial') and line_data.serial_numbers:
            for sn in line_data.serial_numbers:
                serial = await db.serial_items.find_one({
                    "serial_number": sn,
                    "product_id": line_data.product_id,
                    "warehouse_id": data.warehouse_id,
                    "status": "in_stock"
                }, {"_id": 0})
                if not serial:
                    raise HTTPException(status_code=400, detail=f"Serial {sn} not available in warehouse")
        
        line_id = str(uuid.uuid4())
        line_total = line_data.quantity * line_data.unit_price
        
        lines.append({
            "id": line_id,
            "product_id": line_data.product_id,
            "quantity": line_data.quantity,
            "unit_price": line_data.unit_price,
            "total_price": line_total,
            "serial_numbers": line_data.serial_numbers,
            "note": line_data.note
        })
        
        total_items += line_data.quantity
        total_amount += line_total
    
    order = {
        "id": order_id,
        "order_number": order_number,
        "customer_id": data.customer_id,
        "warehouse_id": data.warehouse_id,
        "status": "draft",
        "lines": lines,
        "total_items": total_items,
        "total_amount": total_amount,
        "note": data.note,
        "created_by": user['id'],
        "confirmed_at": None,
        "completed_at": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.sales_orders.insert_one(order)
    
    order['customer_name'] = customer['name']
    order['customer_phone'] = customer['phone']
    order['warehouse_name'] = warehouse['name']
    order['created_by_name'] = user['full_name']
    
    return SalesOrderResponse(**{k: v for k, v in order.items() if k != '_id'})

@api_router.post("/admin/sales/orders/{order_id}/confirm")
async def confirm_sales_order(order_id: str, user: dict = Depends(get_current_user)):
    """Confirm order - reserves stock but doesn't complete"""
    order = await db.sales_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] != 'draft':
        raise HTTPException(status_code=400, detail="Order is not in draft status")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.sales_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "confirmed", "confirmed_at": now, "updated_at": now}}
    )
    
    return {"message": "Order confirmed", "order_number": order['order_number']}

@api_router.post("/admin/sales/orders/{order_id}/complete")
async def complete_sales_order(order_id: str, user: dict = Depends(get_current_user)):
    """Complete order - deducts stock and activates warranty"""
    order = await db.sales_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] not in ['draft', 'confirmed']:
        raise HTTPException(status_code=400, detail="Order cannot be completed")
    
    now = datetime.now(timezone.utc).isoformat()
    customer = await db.customers.find_one({"id": order['customer_id']}, {"_id": 0})
    
    # Calculate total cost of goods for journal entry
    total_cost_of_goods = 0
    
    # Process each line
    for line in order['lines']:
        product_id = line['product_id']
        quantity = line['quantity']
        warehouse_id = order['warehouse_id']
        
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        warranty_months = product.get('warranty_months', 0) if product else 0
        
        # Get current avg_cost for COGS calculation
        stock_balance = await db.stock_balance.find_one(
            {"product_id": product_id, "warehouse_id": warehouse_id}, 
            {"_id": 0, "avg_cost": 1}
        )
        avg_cost = stock_balance.get('avg_cost', 0) if stock_balance else 0
        total_cost_of_goods += quantity * avg_cost
        
        # Process serial numbers
        if line.get('serial_numbers'):
            for sn in line['serial_numbers']:
                serial = await db.serial_items.find_one({"serial_number": sn}, {"_id": 0})
                if serial:
                    # Calculate warranty dates
                    warranty_start = now
                    warranty_end = None
                    if warranty_months > 0:
                        warranty_end_date = datetime.now(timezone.utc) + timedelta(days=warranty_months * 30)
                        warranty_end = warranty_end_date.isoformat()
                    
                    # Update serial status
                    await db.serial_items.update_one(
                        {"serial_number": sn},
                        {"$set": {
                            "status": "sold",
                            "warehouse_id": None,
                            "sale_price": line['unit_price'],
                            "customer_id": order['customer_id'],
                            "sale_order_id": order_id,
                            "warranty_start": warranty_start,
                            "warranty_end": warranty_end,
                            "updated_at": now
                        }}
                    )
                    
                    # Create movement
                    await create_serial_movement(
                        serial['id'], "sale", warehouse_id, None,
                        order_id, order['order_number'], user['id'],
                        f"Bán cho {customer['name'] if customer else 'N/A'}"
                    )
        
        # Update stock balance
        await update_stock_balance(product_id, warehouse_id, -quantity, 0)
    
    # Update order status
    await db.sales_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "completed", "completed_at": now, "updated_at": now}}
    )
    
    # Update customer stats
    if customer:
        await db.customers.update_one(
            {"id": order['customer_id']},
            {"$inc": {"total_orders": 1, "total_spent": order['total_amount']}}
        )
    
    # Sync product stock
    await sync_product_stock()
    
    # Create automated sales journal entry
    try:
        await create_sales_journal(
            order_id=order_id,
            order_number=order['order_number'],
            total_amount=order['total_amount'],
            cost_of_goods=total_cost_of_goods,
            user_id=user['id']
        )
    except Exception as e:
        logger.warning(f"Failed to create sales journal: {e}")
    
    return {"message": "Order completed, warranty activated", "order_number": order['order_number']}

@api_router.post("/admin/sales/orders/{order_id}/cancel")
async def cancel_sales_order(order_id: str, user: dict = Depends(require_admin)):
    """Cancel order"""
    order = await db.sales_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] == 'completed':
        raise HTTPException(status_code=400, detail="Cannot cancel completed order")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.sales_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "cancelled", "updated_at": now}}
    )
    
    return {"message": "Order cancelled"}

@api_router.delete("/admin/sales/orders/{order_id}")
async def delete_sales_order(order_id: str, user: dict = Depends(require_admin)):
    order = await db.sales_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] == 'completed':
        raise HTTPException(status_code=400, detail="Cannot delete completed order")
    
    await db.sales_orders.delete_one({"id": order_id})
    return {"message": "Order deleted"}

# ==================== COST ACCOUNTING MODELS ====================

# Account Types for Chart of Accounts
AccountType = Literal['asset', 'liability', 'equity', 'revenue', 'expense']

class AccountCreate(BaseModel):
    code: str
    name: str
    account_type: AccountType
    parent_id: Optional[str] = None
    description: Optional[str] = None
    is_header: bool = False  # True for parent accounts, False for postable accounts

class AccountResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    code: str
    name: str
    account_type: str
    parent_id: Optional[str] = None
    parent_name: Optional[str] = None
    description: Optional[str] = None
    is_header: bool = False
    balance: float = 0
    is_active: bool = True
    created_at: str

# Journal Entry Models
JournalType = Literal['general', 'inventory', 'sales', 'purchase', 'adjustment']

class JournalLineCreate(BaseModel):
    account_id: str
    description: Optional[str] = None
    debit: float = 0
    credit: float = 0

class JournalLineResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    account_id: str
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    description: Optional[str] = None
    debit: float = 0
    credit: float = 0

class JournalEntryCreate(BaseModel):
    journal_type: JournalType = 'general'
    reference: Optional[str] = None
    description: Optional[str] = None
    lines: List[JournalLineCreate]

class JournalEntryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    entry_number: str
    journal_type: str
    reference: Optional[str] = None
    reference_type: Optional[str] = None  # inventory_doc, sales_order, etc.
    reference_id: Optional[str] = None
    description: Optional[str] = None
    status: str  # draft, posted, reversed
    total_debit: float = 0
    total_credit: float = 0
    lines: List[JournalLineResponse] = []
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    posted_at: Optional[str] = None
    created_at: str

# ==================== CHART OF ACCOUNTS ROUTES ====================

@api_router.get("/admin/accounts", response_model=List[AccountResponse])
async def list_accounts(
    user: dict = Depends(get_current_user),
    account_type: Optional[str] = None,
    include_balances: bool = False
):
    query = {}
    if account_type:
        query['account_type'] = account_type
    
    accounts = await db.accounts.find(query, {"_id": 0}).sort("code", 1).to_list(1000)
    
    # Get parent names
    account_map = {a['id']: a for a in accounts}
    
    # Calculate balances if requested
    balances = {}
    if include_balances:
        # Get latest balances from journal lines
        pipeline = [
            {"$match": {"status": "posted"}},
            {"$unwind": "$lines"},
            {"$group": {
                "_id": "$lines.account_id",
                "total_debit": {"$sum": "$lines.debit"},
                "total_credit": {"$sum": "$lines.credit"}
            }}
        ]
        balance_results = await db.journal_entries.aggregate(pipeline).to_list(1000)
        for b in balance_results:
            # For asset/expense: balance = debit - credit
            # For liability/equity/revenue: balance = credit - debit
            account = account_map.get(b['_id'])
            if account:
                if account['account_type'] in ['asset', 'expense']:
                    balances[b['_id']] = b['total_debit'] - b['total_credit']
                else:
                    balances[b['_id']] = b['total_credit'] - b['total_debit']
    
    result = []
    for a in accounts:
        a['parent_name'] = account_map.get(a.get('parent_id'), {}).get('name')
        a['balance'] = balances.get(a['id'], 0)
        result.append(AccountResponse(**a))
    
    return result

@api_router.get("/admin/accounts/{account_id}", response_model=AccountResponse)
async def get_account(account_id: str, user: dict = Depends(get_current_user)):
    account = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account.get('parent_id'):
        parent = await db.accounts.find_one({"id": account['parent_id']}, {"_id": 0, "name": 1})
        account['parent_name'] = parent['name'] if parent else None
    
    return AccountResponse(**account)

@api_router.post("/admin/accounts", response_model=AccountResponse)
async def create_account(data: AccountCreate, user: dict = Depends(require_admin)):
    # Check code unique
    existing = await db.accounts.find_one({"code": data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Account code already exists")
    
    # Validate parent if provided
    if data.parent_id:
        parent = await db.accounts.find_one({"id": data.parent_id}, {"_id": 0})
        if not parent:
            raise HTTPException(status_code=400, detail="Parent account not found")
        if not parent.get('is_header'):
            raise HTTPException(status_code=400, detail="Parent account must be a header account")
    
    account_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": account_id,
        **data.model_dump(),
        "balance": 0,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.accounts.insert_one(doc)
    return AccountResponse(**{k: v for k, v in doc.items() if k != '_id'})

@api_router.put("/admin/accounts/{account_id}", response_model=AccountResponse)
async def update_account(account_id: str, data: AccountCreate, user: dict = Depends(require_admin)):
    # Check if account has journal entries
    has_entries = await db.journal_entries.find_one({"lines.account_id": account_id, "status": "posted"})
    if has_entries and data.account_type:
        existing = await db.accounts.find_one({"id": account_id}, {"_id": 0, "account_type": 1})
        if existing and existing['account_type'] != data.account_type:
            raise HTTPException(status_code=400, detail="Cannot change account type for account with posted entries")
    
    result = await db.accounts.find_one_and_update(
        {"id": account_id},
        {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Account not found")
    return AccountResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/accounts/{account_id}")
async def delete_account(account_id: str, user: dict = Depends(require_admin)):
    # Check for journal entries
    has_entries = await db.journal_entries.find_one({"lines.account_id": account_id})
    if has_entries:
        raise HTTPException(status_code=400, detail="Cannot delete account with journal entries")
    
    # Check for child accounts
    has_children = await db.accounts.find_one({"parent_id": account_id})
    if has_children:
        raise HTTPException(status_code=400, detail="Cannot delete account with child accounts")
    
    result = await db.accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted"}

# ==================== JOURNAL ENTRY ROUTES ====================

async def generate_journal_number(journal_type: str) -> str:
    """Generate journal entry number like JV-20240206-001"""
    prefix_map = {
        'general': 'JV',    # Journal Voucher
        'inventory': 'INV', # Inventory Journal
        'sales': 'SL',      # Sales Journal
        'purchase': 'PU',   # Purchase Journal
        'adjustment': 'ADJ' # Adjustment Journal
    }
    prefix = prefix_map.get(journal_type, 'JV')
    date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
    
    start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = await db.journal_entries.count_documents({
        "journal_type": journal_type,
        "created_at": {"$gte": start_of_day.isoformat()}
    })
    
    return f"{prefix}-{date_str}-{str(count + 1).zfill(3)}"

@api_router.get("/admin/journal-entries", response_model=List[JournalEntryResponse])
async def list_journal_entries(
    user: dict = Depends(get_current_user),
    journal_type: Optional[str] = None,
    status: Optional[str] = None,
    reference_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if journal_type:
        query['journal_type'] = journal_type
    if status:
        query['status'] = status
    if reference_type:
        query['reference_type'] = reference_type
    
    entries = await db.journal_entries.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with names
    users = {u['id']: u['full_name'] for u in await db.users.find({}, {"_id": 0, "id": 1, "full_name": 1}).to_list(1000)}
    accounts = {a['id']: a for a in await db.accounts.find({}, {"_id": 0, "id": 1, "code": 1, "name": 1}).to_list(1000)}
    
    result = []
    for e in entries:
        e['created_by_name'] = users.get(e.get('created_by'))
        for line in e.get('lines', []):
            account = accounts.get(line.get('account_id'), {})
            line['account_code'] = account.get('code')
            line['account_name'] = account.get('name')
        result.append(JournalEntryResponse(**e))
    
    return result

@api_router.get("/admin/journal-entries/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(entry_id: str, user: dict = Depends(get_current_user)):
    entry = await db.journal_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Enrich with names
    if entry.get('created_by'):
        user_info = await db.users.find_one({"id": entry['created_by']}, {"_id": 0, "full_name": 1})
        entry['created_by_name'] = user_info['full_name'] if user_info else None
    
    accounts = {a['id']: a for a in await db.accounts.find({}, {"_id": 0, "id": 1, "code": 1, "name": 1}).to_list(1000)}
    for line in entry.get('lines', []):
        account = accounts.get(line.get('account_id'), {})
        line['account_code'] = account.get('code')
        line['account_name'] = account.get('name')
    
    return JournalEntryResponse(**entry)

@api_router.post("/admin/journal-entries", response_model=JournalEntryResponse)
async def create_journal_entry(data: JournalEntryCreate, user: dict = Depends(get_current_user)):
    # Validate accounts and calculate totals
    total_debit = 0
    total_credit = 0
    lines = []
    
    for line_data in data.lines:
        account = await db.accounts.find_one({"id": line_data.account_id}, {"_id": 0})
        if not account:
            raise HTTPException(status_code=400, detail=f"Account {line_data.account_id} not found")
        if account.get('is_header'):
            raise HTTPException(status_code=400, detail=f"Cannot post to header account {account['code']}")
        
        line_id = str(uuid.uuid4())
        lines.append({
            "id": line_id,
            "account_id": line_data.account_id,
            "description": line_data.description,
            "debit": line_data.debit,
            "credit": line_data.credit
        })
        
        total_debit += line_data.debit
        total_credit += line_data.credit
    
    # Validate debit = credit
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail=f"Debit ({total_debit}) must equal Credit ({total_credit})")
    
    entry_id = str(uuid.uuid4())
    entry_number = await generate_journal_number(data.journal_type)
    now = datetime.now(timezone.utc).isoformat()
    
    entry = {
        "id": entry_id,
        "entry_number": entry_number,
        "journal_type": data.journal_type,
        "reference": data.reference,
        "reference_type": None,
        "reference_id": None,
        "description": data.description,
        "status": "draft",
        "total_debit": total_debit,
        "total_credit": total_credit,
        "lines": lines,
        "created_by": user['id'],
        "posted_at": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.journal_entries.insert_one(entry)
    
    entry['created_by_name'] = user['full_name']
    return JournalEntryResponse(**{k: v for k, v in entry.items() if k != '_id'})

@api_router.post("/admin/journal-entries/{entry_id}/post")
async def post_journal_entry(entry_id: str, user: dict = Depends(get_current_user)):
    """Post journal entry - makes it permanent"""
    entry = await db.journal_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    if entry['status'] != 'draft':
        raise HTTPException(status_code=400, detail="Journal entry is not in draft status")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.journal_entries.update_one(
        {"id": entry_id},
        {"$set": {"status": "posted", "posted_at": now, "updated_at": now}}
    )
    
    return {"message": "Journal entry posted", "entry_number": entry['entry_number']}

@api_router.delete("/admin/journal-entries/{entry_id}")
async def delete_journal_entry(entry_id: str, user: dict = Depends(require_admin)):
    entry = await db.journal_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    if entry['status'] == 'posted':
        raise HTTPException(status_code=400, detail="Cannot delete posted journal entry")
    
    await db.journal_entries.delete_one({"id": entry_id})
    return {"message": "Journal entry deleted"}

# ==================== AUTOMATED JOURNAL POSTING ====================

async def create_inventory_journal(
    doc_id: str,
    doc_number: str,
    doc_type: str,
    lines: List[dict],
    user_id: str,
    description: str = None
):
    """Create automated journal entry for inventory transactions"""
    
    # Get default accounts
    # Inventory Asset (Hàng tồn kho): 156
    # COGS (Giá vốn hàng bán): 632
    # Inventory Adjustment (Điều chỉnh tồn kho): 811
    
    inventory_account = await db.accounts.find_one({"code": "156"}, {"_id": 0, "id": 1})
    cogs_account = await db.accounts.find_one({"code": "632"}, {"_id": 0, "id": 1})
    adjustment_account = await db.accounts.find_one({"code": "811"}, {"_id": 0, "id": 1})
    
    if not inventory_account:
        logger.warning("Inventory account 156 not found, skipping journal entry")
        return None
    
    journal_lines = []
    total_value = sum(line.get('total_cost', 0) for line in lines)
    
    if doc_type == 'receipt':
        # Debit Inventory, Credit Payable/Cash
        journal_lines.append({
            "id": str(uuid.uuid4()),
            "account_id": inventory_account['id'],
            "description": f"Nhập kho - {doc_number}",
            "debit": total_value,
            "credit": 0
        })
        # Credit: Accounts Payable or Cash (331 or 111)
        payable_account = await db.accounts.find_one({"code": "331"}, {"_id": 0, "id": 1})
        if payable_account:
            journal_lines.append({
                "id": str(uuid.uuid4()),
                "account_id": payable_account['id'],
                "description": f"Nhập kho - {doc_number}",
                "debit": 0,
                "credit": total_value
            })
    
    elif doc_type == 'issue' and cogs_account:
        # Debit COGS, Credit Inventory
        journal_lines.append({
            "id": str(uuid.uuid4()),
            "account_id": cogs_account['id'],
            "description": f"Xuất kho - {doc_number}",
            "debit": total_value,
            "credit": 0
        })
        journal_lines.append({
            "id": str(uuid.uuid4()),
            "account_id": inventory_account['id'],
            "description": f"Xuất kho - {doc_number}",
            "debit": 0,
            "credit": total_value
        })
    
    elif doc_type == 'adjustment' and adjustment_account:
        # Adjustment: Debit/Credit based on positive/negative
        if total_value >= 0:
            journal_lines.append({
                "id": str(uuid.uuid4()),
                "account_id": inventory_account['id'],
                "description": f"Điều chỉnh tăng - {doc_number}",
                "debit": abs(total_value),
                "credit": 0
            })
            journal_lines.append({
                "id": str(uuid.uuid4()),
                "account_id": adjustment_account['id'],
                "description": f"Điều chỉnh tăng - {doc_number}",
                "debit": 0,
                "credit": abs(total_value)
            })
        else:
            journal_lines.append({
                "id": str(uuid.uuid4()),
                "account_id": adjustment_account['id'],
                "description": f"Điều chỉnh giảm - {doc_number}",
                "debit": abs(total_value),
                "credit": 0
            })
            journal_lines.append({
                "id": str(uuid.uuid4()),
                "account_id": inventory_account['id'],
                "description": f"Điều chỉnh giảm - {doc_number}",
                "debit": 0,
                "credit": abs(total_value)
            })
    
    if not journal_lines or len(journal_lines) < 2:
        return None
    
    entry_id = str(uuid.uuid4())
    entry_number = await generate_journal_number('inventory')
    now = datetime.now(timezone.utc).isoformat()
    
    total_debit = sum(l['debit'] for l in journal_lines)
    total_credit = sum(l['credit'] for l in journal_lines)
    
    entry = {
        "id": entry_id,
        "entry_number": entry_number,
        "journal_type": "inventory",
        "reference": doc_number,
        "reference_type": "inventory_doc",
        "reference_id": doc_id,
        "description": description or f"Tự động ghi nhận - {doc_number}",
        "status": "posted",
        "total_debit": total_debit,
        "total_credit": total_credit,
        "lines": journal_lines,
        "created_by": user_id,
        "posted_at": now,
        "created_at": now,
        "updated_at": now
    }
    
    await db.journal_entries.insert_one(entry)
    logger.info(f"Created inventory journal entry {entry_number} for {doc_number}")
    return entry_id

async def create_sales_journal(
    order_id: str,
    order_number: str,
    total_amount: float,
    cost_of_goods: float,
    user_id: str
):
    """Create automated journal entry for sales transactions"""
    
    # Accounts:
    # Cash/Receivable (111/131): Debit
    # Revenue (511): Credit
    # COGS (632): Debit
    # Inventory (156): Credit
    
    cash_account = await db.accounts.find_one({"code": "111"}, {"_id": 0, "id": 1})
    revenue_account = await db.accounts.find_one({"code": "511"}, {"_id": 0, "id": 1})
    cogs_account = await db.accounts.find_one({"code": "632"}, {"_id": 0, "id": 1})
    inventory_account = await db.accounts.find_one({"code": "156"}, {"_id": 0, "id": 1})
    
    if not all([cash_account, revenue_account]):
        logger.warning("Required accounts not found for sales journal")
        return None
    
    journal_lines = []
    now = datetime.now(timezone.utc).isoformat()
    
    # Revenue entry: Debit Cash, Credit Revenue
    journal_lines.append({
        "id": str(uuid.uuid4()),
        "account_id": cash_account['id'],
        "description": f"Doanh thu - {order_number}",
        "debit": total_amount,
        "credit": 0
    })
    journal_lines.append({
        "id": str(uuid.uuid4()),
        "account_id": revenue_account['id'],
        "description": f"Doanh thu - {order_number}",
        "debit": 0,
        "credit": total_amount
    })
    
    # COGS entry: Debit COGS, Credit Inventory
    if cost_of_goods > 0 and cogs_account and inventory_account:
        journal_lines.append({
            "id": str(uuid.uuid4()),
            "account_id": cogs_account['id'],
            "description": f"Giá vốn - {order_number}",
            "debit": cost_of_goods,
            "credit": 0
        })
        journal_lines.append({
            "id": str(uuid.uuid4()),
            "account_id": inventory_account['id'],
            "description": f"Giá vốn - {order_number}",
            "debit": 0,
            "credit": cost_of_goods
        })
    
    entry_id = str(uuid.uuid4())
    entry_number = await generate_journal_number('sales')
    
    total_debit = sum(l['debit'] for l in journal_lines)
    total_credit = sum(l['credit'] for l in journal_lines)
    
    entry = {
        "id": entry_id,
        "entry_number": entry_number,
        "journal_type": "sales",
        "reference": order_number,
        "reference_type": "sales_order",
        "reference_id": order_id,
        "description": f"Tự động ghi nhận bán hàng - {order_number}",
        "status": "posted",
        "total_debit": total_debit,
        "total_credit": total_credit,
        "lines": journal_lines,
        "created_by": user_id,
        "posted_at": now,
        "created_at": now,
        "updated_at": now
    }
    
    await db.journal_entries.insert_one(entry)
    logger.info(f"Created sales journal entry {entry_number} for {order_number}")
    return entry_id

# ==================== FINANCIAL REPORTS ====================

@api_router.get("/admin/reports/trial-balance")
async def get_trial_balance(user: dict = Depends(get_current_user)):
    """Get trial balance report - all accounts with their balances"""
    
    # Get all posted journal entries
    pipeline = [
        {"$match": {"status": "posted"}},
        {"$unwind": "$lines"},
        {"$group": {
            "_id": "$lines.account_id",
            "total_debit": {"$sum": "$lines.debit"},
            "total_credit": {"$sum": "$lines.credit"}
        }}
    ]
    
    balances = await db.journal_entries.aggregate(pipeline).to_list(1000)
    balance_map = {b['_id']: b for b in balances}
    
    # Get all accounts
    accounts = await db.accounts.find({"is_header": False}, {"_id": 0}).sort("code", 1).to_list(1000)
    
    result = []
    total_debit = 0
    total_credit = 0
    
    for account in accounts:
        balance = balance_map.get(account['id'], {'total_debit': 0, 'total_credit': 0})
        debit = balance['total_debit']
        credit = balance['total_credit']
        
        # Calculate ending balance based on account type
        if account['account_type'] in ['asset', 'expense']:
            ending_balance = debit - credit
            debit_balance = ending_balance if ending_balance > 0 else 0
            credit_balance = abs(ending_balance) if ending_balance < 0 else 0
        else:
            ending_balance = credit - debit
            credit_balance = ending_balance if ending_balance > 0 else 0
            debit_balance = abs(ending_balance) if ending_balance < 0 else 0
        
        if debit > 0 or credit > 0:  # Only show accounts with activity
            result.append({
                "account_id": account['id'],
                "account_code": account['code'],
                "account_name": account['name'],
                "account_type": account['account_type'],
                "debit": debit_balance,
                "credit": credit_balance
            })
            total_debit += debit_balance
            total_credit += credit_balance
    
    return {
        "accounts": result,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "is_balanced": abs(total_debit - total_credit) < 0.01
    }

@api_router.get("/admin/reports/inventory-valuation")
async def get_inventory_valuation(
    user: dict = Depends(get_current_user),
    warehouse_id: Optional[str] = None
):
    """Get inventory valuation report - stock value by product/warehouse"""
    
    query = {"quantity": {"$gt": 0}}
    if warehouse_id:
        query['warehouse_id'] = warehouse_id
    
    balances = await db.stock_balance.find(query, {"_id": 0}).to_list(10000)
    
    # Enrich with names
    products = {p['id']: p for p in await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "sku": 1, "product_type": 1}).to_list(10000)}
    warehouses = {w['id']: w['name'] for w in await db.warehouses.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    
    result = []
    total_value = 0
    
    for b in balances:
        product = products.get(b['product_id'], {})
        value = b['quantity'] * b.get('avg_cost', 0)
        
        result.append({
            "product_id": b['product_id'],
            "product_name": product.get('name', ''),
            "product_sku": product.get('sku', ''),
            "product_type": product.get('product_type', ''),
            "warehouse_id": b['warehouse_id'],
            "warehouse_name": warehouses.get(b['warehouse_id'], ''),
            "quantity": b['quantity'],
            "avg_cost": b.get('avg_cost', 0),
            "total_value": value
        })
        total_value += value
    
    return {
        "items": result,
        "total_value": total_value,
        "item_count": len(result)
    }

@api_router.get("/admin/reports/profit-loss")
async def get_profit_loss_report(user: dict = Depends(get_current_user)):
    """Get simplified profit & loss report"""
    
    # Get revenue and expense accounts
    revenue_accounts = await db.accounts.find({"account_type": "revenue", "is_header": False}, {"_id": 0, "id": 1, "code": 1, "name": 1}).to_list(100)
    expense_accounts = await db.accounts.find({"account_type": "expense", "is_header": False}, {"_id": 0, "id": 1, "code": 1, "name": 1}).to_list(100)
    
    revenue_ids = [a['id'] for a in revenue_accounts]
    expense_ids = [a['id'] for a in expense_accounts]
    
    # Get totals from journal entries
    pipeline = [
        {"$match": {"status": "posted"}},
        {"$unwind": "$lines"},
        {"$match": {"$or": [
            {"lines.account_id": {"$in": revenue_ids}},
            {"lines.account_id": {"$in": expense_ids}}
        ]}},
        {"$group": {
            "_id": "$lines.account_id",
            "total_debit": {"$sum": "$lines.debit"},
            "total_credit": {"$sum": "$lines.credit"}
        }}
    ]
    
    results = await db.journal_entries.aggregate(pipeline).to_list(200)
    balance_map = {r['_id']: r for r in results}
    
    # Calculate revenue (credit - debit for revenue accounts)
    revenue_items = []
    total_revenue = 0
    for acc in revenue_accounts:
        bal = balance_map.get(acc['id'], {'total_debit': 0, 'total_credit': 0})
        amount = bal['total_credit'] - bal['total_debit']
        if amount != 0:
            revenue_items.append({
                "account_code": acc['code'],
                "account_name": acc['name'],
                "amount": amount
            })
            total_revenue += amount
    
    # Calculate expenses (debit - credit for expense accounts)
    expense_items = []
    total_expense = 0
    for acc in expense_accounts:
        bal = balance_map.get(acc['id'], {'total_debit': 0, 'total_credit': 0})
        amount = bal['total_debit'] - bal['total_credit']
        if amount != 0:
            expense_items.append({
                "account_code": acc['code'],
                "account_name": acc['name'],
                "amount": amount
            })
            total_expense += amount
    
    return {
        "revenue": {
            "items": revenue_items,
            "total": total_revenue
        },
        "expenses": {
            "items": expense_items,
            "total": total_expense
        },
        "net_profit": total_revenue - total_expense
    }

# ==================== REPAIR ROUTES ====================

async def generate_ticket_number() -> str:
    """Generate repair ticket number like REP-20240206-001"""
    date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
    start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = await db.repair_tickets.count_documents({
        "created_at": {"$gte": start_of_day.isoformat()}
    })
    return f"REP-{date_str}-{str(count + 1).zfill(3)}"

@api_router.get("/admin/repairs/tickets", response_model=List[RepairTicketResponse])
async def list_repair_tickets(
    user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    technician_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if status:
        query['status'] = status
    if customer_id:
        query['customer_id'] = customer_id
    if technician_id:
        query['technician_id'] = technician_id
    if search:
        query['$or'] = [
            {'ticket_number': {'$regex': search, '$options': 'i'}},
            {'product_name': {'$regex': search, '$options': 'i'}},
            {'serial_number': {'$regex': search, '$options': 'i'}}
        ]

    tickets = await db.repair_tickets.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich data
    customers = {c['id']: c for c in await db.customers.find({}, {"_id": 0, "id": 1, "name": 1, "phone": 1}).to_list(1000)}
    users = {u['id']: u['full_name'] for u in await db.users.find({}, {"_id": 0, "id": 1, "full_name": 1}).to_list(100)}
    
    result = []
    for t in tickets:
        cust = customers.get(t.get('customer_id'), {})
        t['customer_name'] = cust.get('name')
        t['customer_phone'] = cust.get('phone')
        t['technician_name'] = users.get(t.get('technician_id'))
        result.append(RepairTicketResponse(**t))
        
    return result

@api_router.post("/admin/repairs/tickets", response_model=RepairTicketResponse)
async def create_repair_ticket(data: RepairTicketCreate, user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    ticket_id = str(uuid.uuid4())
    ticket_number = await generate_ticket_number()
    now = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": ticket_id,
        "ticket_number": ticket_number,
        **data.model_dump(),
        "status": "received",
        "created_by": user['id'],
        "created_at": now,
        "updated_at": now
    }
    
    await db.repair_tickets.insert_one(doc)
    
    doc['customer_name'] = customer.get('name')
    doc['customer_phone'] = customer.get('phone')
    return RepairTicketResponse(**{k: v for k, v in doc.items() if k != '_id'})

@api_router.get("/admin/repairs/tickets/{ticket_id}", response_model=RepairTicketResponse)
async def get_repair_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    ticket = await db.repair_tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    customer = await db.customers.find_one({"id": ticket['customer_id']}, {"_id": 0, "name": 1, "phone": 1})
    if customer:
        ticket['customer_name'] = customer.get('name')
        ticket['customer_phone'] = customer.get('phone')
        
    if ticket.get('technician_id'):
        tech = await db.users.find_one({"id": ticket['technician_id']}, {"_id": 0, "full_name": 1})
        ticket['technician_name'] = tech.get('full_name')
        
    return RepairTicketResponse(**ticket)

@api_router.post("/admin/repairs/tickets/{ticket_id}/diagnose")
async def diagnose_ticket(
    ticket_id: str, 
    diagnosis: RepairDiagnosis, 
    user: dict = Depends(get_current_user)
):
    ticket = await db.repair_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Assign technician if not set
    update_fields = {
        "diagnosis": diagnosis.model_dump(),
        "status": "diagnosing",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if not ticket.get('technician_id'):
        update_fields['technician_id'] = user['id']
        
    await db.repair_tickets.update_one(
        {"id": ticket_id},
        {"$set": update_fields}
    )
    
    return {"message": "Diagnosis updated"}

@api_router.post("/admin/repairs/tickets/{ticket_id}/quote")
async def update_repair_quote(
    ticket_id: str,
    quote: RepairQuoteCreate,
    user: dict = Depends(get_current_user)
):
    ticket = await db.repair_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    parts_total = sum(p.quantity * p.unit_price for p in quote.parts)
    services_total = sum(s.cost for s in quote.services)
    
    await db.repair_tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "quote_parts": [p.model_dump() for p in quote.parts],
            "quote_services": [s.model_dump() for s in quote.services],
            "total_estimate": parts_total + services_total,
            "status": "waiting_approval",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Quote updated"}

@api_router.post("/admin/repairs/tickets/{ticket_id}/approve")
async def approve_repair_quote(ticket_id: str, user: dict = Depends(get_current_user)):
    ticket = await db.repair_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    await db.repair_tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "quote_approved": True,
            "status": "repairing",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Quote approved, repair started"}

@api_router.post("/admin/repairs/tickets/{ticket_id}/issue-parts")
async def issue_repair_parts(ticket_id: str, warehouse_id: str, user: dict = Depends(get_current_user)):
    """Issue parts from inventory for this repair"""
    ticket = await db.repair_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.get('parts_issued'):
        raise HTTPException(status_code=400, detail="Parts already issued")
        
    if not ticket.get('quote_parts'):
        raise HTTPException(status_code=400, detail="No parts in quote")
        
    # Create inventory issue document
    lines = []
    for part in ticket['quote_parts']:
        lines.append({
            "product_id": part['product_id'],
            "quantity": part['quantity'],
            "unit_cost": 0, # Should fetch from system, but for now 0
            "note": f"Repair {ticket['ticket_number']}"
        })
        
    # TODO: Refactor inventory creation logic to be reusable
    # For now, we assume simple logic: just mark as issued in ticket and deducted in next step or use existing APIs
    
    # Check bounds
    # ...
    
    await db.repair_tickets.update_one(
        {"id": ticket_id}, 
        {"$set": {"parts_issued": True}}
    )
    
    # Ideally: Call create_inventory_doc internally
    
    return {"message": "Parts issued (Simulated)"}

@api_router.post("/admin/repairs/tickets/{ticket_id}/complete")
async def complete_repair(ticket_id: str, user: dict = Depends(get_current_user)):
    await db.repair_tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "status": "ready",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Repair completed, ready for pickup"}

@api_router.post("/admin/repairs/tickets/{ticket_id}/deliver")
async def deliver_repair(ticket_id: str, user: dict = Depends(get_current_user)):
    await db.repair_tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "status": "delivered",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Ideally: Create Journal Entry here (Dr Cash / Cr Service Revenue)
    
    return {"message": "Device delivered to customer"}

# ==================== USER MANAGEMENT ====================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def list_users(user: dict = Depends(require_admin)):
    """List all users for admin management."""
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("full_name", 1).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.post("/admin/users", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    admin: dict = Depends(require_admin)
):
    """Admin creates a new user."""
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "full_name": data.full_name,
        "phone": data.phone,
        "role": data.role,
        "branch_id": None,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        id=user_id, email=data.email, full_name=data.full_name,
        phone=data.phone, role=data.role, is_active=True, created_at=now
    )

@api_router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    admin: dict = Depends(require_admin)
):
    """Update a user's role, status, or details."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Guard: Prevent deactivating self
    if user['id'] == admin['id'] and data.is_active is False:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return UserResponse(**updated_user)

@api_router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_admin)
):
    """Delete a user account."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user['id'] == admin['id']:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
        
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted successfully"}

# ==================== SEED DATA ====================

@api_router.post("/admin/reset-admin")
async def reset_admin_password():
    """Reset or create admin account"""
    admin_email = "admin@otnt.vn"
    admin_password = "Admin@123"
    
    hashed_pw = hash_password(admin_password)
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if admin exists
    existing = await db.users.find_one({"email": admin_email})
    
    if existing:
        # Update password
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"hashed_password": hashed_pw, "updated_at": now}}
        )
        return {
            "message": "Admin password reset successfully",
            "email": admin_email,
            "password": admin_password
        }
    else:
        # Create new admin
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": admin_email,
            "hashed_password": hashed_pw,
            "full_name": "OTNT Admin",
            "role": "admin",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        await db.users.insert_one(user_doc)
        return {
            "message": "Admin account created successfully",
            "email": admin_email,
            "password": admin_password
        }

@api_router.post("/admin/seed")
async def seed_data(user: dict = Depends(require_admin)):
    """Seed initial data for testing"""
    
    # Seed warehouses
    warehouses_data = [
        {"id": str(uuid.uuid4()), "name": "Kho Hà Nội", "code": "WH-HN", "address": "123 Cầu Giấy, Hà Nội", "phone": "024-1234-5678", "is_default": True, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Kho TP.HCM", "code": "WH-HCM", "address": "456 Quận 1, TP.HCM", "phone": "028-8765-4321", "is_default": False, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Kho Đà Nẵng", "code": "WH-DN", "address": "789 Hải Châu, Đà Nẵng", "phone": "0236-111-2222", "is_default": False, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    for wh in warehouses_data:
        await db.warehouses.update_one({"code": wh['code']}, {"$setOnInsert": wh}, upsert=True)
    
    # Seed categories
    categories_data = [
        {"id": str(uuid.uuid4()), "name": "Robot hút bụi", "slug": "robot-hut-bui", "description": "Robot hút bụi thông minh", "sort_order": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Gia dụng", "slug": "gia-dung", "description": "Thiết bị gia dụng", "sort_order": 2, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Phụ kiện", "slug": "phu-kien", "description": "Phụ kiện thay thế", "sort_order": 3, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Linh kiện", "slug": "linh-kien", "description": "Linh kiện sửa chữa", "sort_order": 4, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    for cat in categories_data:
        await db.categories.update_one({"slug": cat['slug']}, {"$setOnInsert": cat}, upsert=True)
    
    # Seed brands
    brands_data = [
        {"id": str(uuid.uuid4()), "name": "Ecovacs", "slug": "ecovacs", "country": "Trung Quốc", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Roborock", "slug": "roborock", "country": "Trung Quốc", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Xiaomi", "slug": "xiaomi", "country": "Trung Quốc", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "iRobot", "slug": "irobot", "country": "Mỹ", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Dreame", "slug": "dreame", "country": "Trung Quốc", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    for brand in brands_data:
        await db.brands.update_one({"slug": brand['slug']}, {"$setOnInsert": brand}, upsert=True)
    
    # Get category and brand IDs
    robot_cat = await db.categories.find_one({"slug": "robot-hut-bui"}, {"_id": 0, "id": 1})
    accessory_cat = await db.categories.find_one({"slug": "phu-kien"}, {"_id": 0, "id": 1})
    ecovacs = await db.brands.find_one({"slug": "ecovacs"}, {"_id": 0, "id": 1})
    roborock = await db.brands.find_one({"slug": "roborock"}, {"_id": 0, "id": 1})
    
    # Seed products
    products_data = [
        {
            "id": str(uuid.uuid4()), "name": "Ecovacs Deebot X2 Omni", "slug": "ecovacs-deebot-x2-omni",
            "sku": "ECO-X2-OMNI", "product_type": "robot", "category_id": robot_cat['id'] if robot_cat else None,
            "brand_id": ecovacs['id'] if ecovacs else None, "price": 28990000, "cost_price": 22000000,
            "warranty_months": 24, "track_serial": True, "stock_quantity": 15,
            "description": "Robot hút bụi lau nhà cao cấp với công nghệ AI tiên tiến",
            "short_description": "Robot hút bụi lau nhà Ecovacs X2 Omni",
            "images": ["https://images.unsplash.com/photo-1762500824321-de3c2f316156?w=800"],
            "specifications": {"suction": "8000Pa", "battery": "5200mAh", "noise": "45dB"},
            "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()), "name": "Roborock S8 Pro Ultra", "slug": "roborock-s8-pro-ultra",
            "sku": "RBR-S8-PRO", "product_type": "robot", "category_id": robot_cat['id'] if robot_cat else None,
            "brand_id": roborock['id'] if roborock else None, "price": 32990000, "cost_price": 26000000,
            "warranty_months": 24, "track_serial": True, "stock_quantity": 8,
            "description": "Robot hút bụi cao cấp với dock tự động giặt khăn",
            "short_description": "Robot hút bụi Roborock S8 Pro Ultra",
            "images": ["https://images.unsplash.com/photo-1762859731349-c9ff2808b672?w=800"],
            "specifications": {"suction": "6000Pa", "battery": "5200mAh", "noise": "50dB"},
            "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()), "name": "Chổi chính Ecovacs X2", "slug": "choi-chinh-ecovacs-x2",
            "sku": "ECO-X2-BRUSH", "product_type": "accessory", "category_id": accessory_cat['id'] if accessory_cat else None,
            "brand_id": ecovacs['id'] if ecovacs else None, "price": 350000, "cost_price": 200000,
            "warranty_months": 3, "track_serial": False, "stock_quantity": 50,
            "description": "Chổi chính thay thế cho Ecovacs X2",
            "compatible_models": ["Ecovacs X2 Omni", "Ecovacs X2 Combo"],
            "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    
    for product in products_data:
        await db.products.update_one({"sku": product['sku']}, {"$setOnInsert": product}, upsert=True)
    
    # Seed Chart of Accounts (Vietnamese Accounting Standards)
    accounts_data = [
        # Assets (1xx)
        {"id": str(uuid.uuid4()), "code": "1", "name": "Tài sản", "account_type": "asset", "is_header": True, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "111", "name": "Tiền mặt", "account_type": "asset", "is_header": False, "description": "Tiền mặt VND", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "112", "name": "Tiền gửi ngân hàng", "account_type": "asset", "is_header": False, "description": "Tiền gửi tại ngân hàng", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "131", "name": "Phải thu khách hàng", "account_type": "asset", "is_header": False, "description": "Công nợ khách hàng", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "156", "name": "Hàng hóa", "account_type": "asset", "is_header": False, "description": "Hàng tồn kho", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "157", "name": "Hàng gửi bán", "account_type": "asset", "is_header": False, "description": "Hàng gửi đi bán", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Liabilities (3xx)
        {"id": str(uuid.uuid4()), "code": "3", "name": "Nợ phải trả", "account_type": "liability", "is_header": True, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "331", "name": "Phải trả nhà cung cấp", "account_type": "liability", "is_header": False, "description": "Công nợ nhà cung cấp", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "333", "name": "Thuế và phải nộp nhà nước", "account_type": "liability", "is_header": False, "description": "Thuế GTGT, TNDN", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "334", "name": "Phải trả người lao động", "account_type": "liability", "is_header": False, "description": "Lương, thưởng nhân viên", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Equity (4xx)
        {"id": str(uuid.uuid4()), "code": "4", "name": "Vốn chủ sở hữu", "account_type": "equity", "is_header": True, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "411", "name": "Vốn đầu tư của chủ sở hữu", "account_type": "equity", "is_header": False, "description": "Vốn góp ban đầu", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "421", "name": "Lợi nhuận chưa phân phối", "account_type": "equity", "is_header": False, "description": "Lợi nhuận giữ lại", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Revenue (5xx)
        {"id": str(uuid.uuid4()), "code": "5", "name": "Doanh thu", "account_type": "revenue", "is_header": True, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "511", "name": "Doanh thu bán hàng", "account_type": "revenue", "is_header": False, "description": "Doanh thu từ bán hàng hóa", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "512", "name": "Doanh thu dịch vụ", "account_type": "revenue", "is_header": False, "description": "Doanh thu sửa chữa, bảo hành", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "515", "name": "Doanh thu tài chính", "account_type": "revenue", "is_header": False, "description": "Lãi tiền gửi", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Expenses (6xx, 8xx)
        {"id": str(uuid.uuid4()), "code": "6", "name": "Chi phí", "account_type": "expense", "is_header": True, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "632", "name": "Giá vốn hàng bán", "account_type": "expense", "is_header": False, "description": "Giá vốn hàng đã bán", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "641", "name": "Chi phí bán hàng", "account_type": "expense", "is_header": False, "description": "Chi phí vận chuyển, marketing", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "642", "name": "Chi phí quản lý", "account_type": "expense", "is_header": False, "description": "Chi phí văn phòng, lương quản lý", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "code": "811", "name": "Chi phí khác", "account_type": "expense", "is_header": False, "description": "Chi phí điều chỉnh, thiệt hại", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    for account in accounts_data:
        await db.accounts.update_one({"code": account['code']}, {"$setOnInsert": account}, upsert=True)
    
    return {"message": "Seed data created successfully"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "OTNT ERP API v1.0", "status": "running"}

# ==================== MEDIA MANAGEMENT ====================

class MediaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    filename: str
    original_name: str
    content_type: str
    size: int
    url: str
    created_at: str
    uploaded_by: Optional[str] = None

@api_router.post("/admin/media/upload")
async def upload_media(
    files: List[UploadFile] = File(...),
    admin: dict = Depends(require_admin)
):
    """Upload one or more media files."""
    uploaded = []
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    max_size = 10 * 1024 * 1024  # 10MB
    
    for file in files:
        # Validate content type
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file.content_type} not allowed. Allowed: {', '.join(allowed_types)}"
            )
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        if file_size > max_size:
            raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 10MB limit")
        
        # Generate unique filename
        file_ext = Path(file.filename).suffix.lower()
        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOADS_DIR / unique_name
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Store in MongoDB
        media_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        media_doc = {
            "id": media_id,
            "filename": unique_name,
            "original_name": file.filename,
            "content_type": file.content_type,
            "size": file_size,
            "url": f"/uploads/{unique_name}",
            "created_at": now,
            "uploaded_by": admin.get('id')
        }
        
        await db.media.insert_one(media_doc)
        uploaded.append(MediaResponse(**media_doc))
    
    return {"uploaded": uploaded, "count": len(uploaded)}

@api_router.get("/admin/media", response_model=List[MediaResponse])
async def list_media(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    admin: dict = Depends(require_admin)
):
    """List all uploaded media files."""
    cursor = db.media.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    return [MediaResponse(**item) for item in items]

@api_router.get("/admin/media/count")
async def count_media(admin: dict = Depends(require_admin)):
    """Get total media count."""
    count = await db.media.count_documents({})
    return {"count": count}

@api_router.delete("/admin/media/{media_id}")
async def delete_media(
    media_id: str,
    admin: dict = Depends(require_admin)
):
    """Delete a media file."""
    media = await db.media.find_one({"id": media_id})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete file from disk
    file_path = UPLOADS_DIR / media['filename']
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await db.media.delete_one({"id": media_id})
    
    return {"message": "Media deleted successfully"}

# Include router and middleware
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
