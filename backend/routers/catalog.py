from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, col, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from database import get_session
from sql_models import Category, Brand, Product
from dependencies import get_current_user, require_admin

router = APIRouter()

def get_vn_time():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat()

# ==================== DTOs ====================

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
    created_at: str

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
    created_at: str

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
    # category_name: Optional[str] = None # Enriched later if needed or via join
    # brand_name: Optional[str] = None
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

# ==================== CATEGORY ROUTES ====================

@router.get("/admin/categories", response_model=List[CategoryResponse])
async def list_categories(session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    statement = select(Category).order_by(Category.sort_order)
    result = await session.exec(statement)
    return [CategoryResponse(**c.model_dump()) for c in result.all()]

@router.post("/admin/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    statement = select(Category).where(Category.slug == data.slug)
    result = await session.exec(statement)
    if result.first():
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category = Category(**data.model_dump())
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return CategoryResponse(**category.model_dump())

@router.put("/admin/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, data: CategoryCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in data.model_dump().items():
        setattr(category, key, value)
    
    category.updated_at = get_vn_time()
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return CategoryResponse(**category.model_dump())

@router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await session.delete(category)
    await session.commit()
    return {"message": "Category deleted"}

# ==================== BRAND ROUTES ====================

@router.get("/admin/brands", response_model=List[BrandResponse])
async def list_brands(session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    statement = select(Brand).order_by(Brand.name)
    result = await session.exec(statement)
    return [BrandResponse(**b.model_dump()) for b in result.all()]

@router.post("/admin/brands", response_model=BrandResponse)
async def create_brand(data: BrandCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    statement = select(Brand).where(Brand.slug == data.slug)
    if (await session.exec(statement)).first():
        raise HTTPException(status_code=400, detail="Brand slug already exists")
    
    brand = Brand(**data.model_dump())
    session.add(brand)
    await session.commit()
    await session.refresh(brand)
    return BrandResponse(**brand.model_dump())

@router.put("/admin/brands/{brand_id}", response_model=BrandResponse)
async def update_brand(brand_id: str, data: BrandCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    brand = await session.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    for key, value in data.model_dump().items():
        setattr(brand, key, value)
    
    brand.updated_at = get_vn_time()
    session.add(brand)
    await session.commit()
    await session.refresh(brand)
    return BrandResponse(**brand.model_dump())

@router.delete("/admin/brands/{brand_id}")
async def delete_brand(brand_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    brand = await session.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    await session.delete(brand)
    await session.commit()
    return {"message": "Brand deleted"}

# ==================== PRODUCT ROUTES ====================

@router.get("/admin/products", response_model=List[ProductResponse])
async def list_products(
    product_type: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user)
):
    query = select(Product)
    if product_type:
        query = query.where(Product.product_type == product_type)
    if category_id:
        query = query.where(Product.category_id == category_id)
    if brand_id:
        query = query.where(Product.brand_id == brand_id)
    if search:
        query = query.where(or_(
            col(Product.name).contains(search), 
            col(Product.sku).contains(search)
        ))
    
    query = query.order_by(col(Product.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(query)
    return [ProductResponse(**p.model_dump()) for p in result.all()]

@router.get("/admin/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse(**product.model_dump())

@router.post("/admin/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    # Check slug/sku
    statement = select(Product).where(or_(Product.slug == data.slug, Product.sku == data.sku))
    if (await session.exec(statement)).first():
        raise HTTPException(status_code=400, detail="Product slug or SKU already exists")
    
    track_serial = data.track_serial or data.product_type == 'robot'
    
    product = Product(**data.model_dump(), track_serial=track_serial)
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return ProductResponse(**product.model_dump())

@router.put("/admin/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductUpdate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
        
    product.updated_at = get_vn_time()
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return ProductResponse(**product.model_dump())

@router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await session.delete(product)
    await session.commit()
    return {"message": "Product deleted"}

# ==================== STORE ROUTES (PUBLIC) ====================

@router.get("/store/products", response_model=List[ProductResponse])
async def store_list_products(
    product_type: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(get_session)
):
    query = select(Product).where(Product.is_active == True)
    if product_type:
        query = query.where(Product.product_type == product_type)
    if category_id:
        query = query.where(Product.category_id == category_id)
    if brand_id:
        query = query.where(Product.brand_id == brand_id)
    if search:
        query = query.where(col(Product.name).contains(search)) # Tags search requires more complex filter in SQL
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
        
    query = query.order_by(col(Product.created_at).desc()).offset(skip).limit(limit)
    result = await session.exec(query)
    
    products = []
    for p in result.all():
        p_dict = p.model_dump()
        p_dict['cost_price'] = 0 # Hide cost
        products.append(ProductResponse(**p_dict))
    return products

@router.get("/store/products/{slug}", response_model=ProductResponse)
async def store_get_product(slug: str, session: AsyncSession = Depends(get_session)):
    statement = select(Product).where(Product.slug == slug, Product.is_active == True)
    product = (await session.exec(statement)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    p_dict = product.model_dump()
    p_dict['cost_price'] = 0
    return ProductResponse(**p_dict)

@router.get("/store/categories", response_model=List[CategoryResponse])
async def store_list_categories(session: AsyncSession = Depends(get_session)):
    statement = select(Category).where(Category.is_active == True).order_by(Category.sort_order)
    result = await session.exec(statement)
    return [CategoryResponse(**c.model_dump()) for c in result.all()]

@router.get("/store/brands", response_model=List[BrandResponse])
async def store_list_brands(session: AsyncSession = Depends(get_session)):
    statement = select(Brand).where(Brand.is_active == True).order_by(Brand.name)
    result = await session.exec(statement)
    return [BrandResponse(**b.model_dump()) for b in result.all()]
