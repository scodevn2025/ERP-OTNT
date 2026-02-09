import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
import json

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
DB_NAME = os.environ.get('DB_NAME', "erp_v2")
AUD_TO_VND = 16500

async def seed_premium_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Dreame AU data snippet (Transcribed from previous read_url_content)
    products_raw = [
        {
            "title": "Dreame X50 Ultra",
            "type": "robot",
            "handle": "dreame-x50-ultra",
            "price": 2999,
            "image": "https://cdn.shopify.com/s/files/1/0565/2401/3739/files/1-X50U.jpg?v=1740127026",
            "desc": "Hệ thống ProLeap™ đầu tiên trong ngành, lực hút 20.000Pa cực mạnh."
        },
        {
            "title": "Dreame X40 Ultra",
            "type": "robot",
            "handle": "dreame-x40-ultra",
            "price": 2799,
            "image": "https://cdn.shopify.com/s/files/1/0565/2401/3739/files/x40-product-img1.webp?v=1716199586",
            "desc": "Công nghệ RoboSwing MopExtend™, lực hút 12.000Pa."
        },
        {
            "title": "Dreame H16 Pro Steam",
            "type": "goods",
            "handle": "dreame-h16-pro-steam",
            "price": 1499,
            "image": "https://cdn.shopify.com/s/files/1/0565/2401/3739/files/Deame-H16-Pro-Steam-Wide-Angle-Main-Image--2.png?v=1769773320",
            "desc": "Lau sàn bằng hơi nước 200°C, lực hút 28.000Pa."
        },
        {
            "title": "Dreame Z30 Station",
            "type": "goods",
            "handle": "dreame-z30-station",
            "price": 999,
            "image": "https://cdn.shopify.com/s/files/1/0565/2401/3739/files/Z30mainimage.png?v=1751430509",
            "desc": "Máy hút bụi cầm tay với trạm đổ rác tự động, lực hút 310AW."
        },
        {
            "title": "Dreame AirPursue PM20",
            "type": "air",
            "handle": "dreame-air-purifier-pm20",
            "price": 1599,
            "image": "https://cdn.shopify.com/s/files/1/0565/2401/3739/files/pm10-pc-frame_26.png?v=1755744489",
            "desc": "Lọc sạch 175m2 trong 15 phút, cảm biến AI thông minh."
        },
        {
            "title": "Dreame Pocket Uni",
            "type": "accessory",
            "handle": "dreame-pocket-uni",
            "price": 399,
            "image": "https://cdn.shopify.com/s/files/1/0565/2401/3739/files/space_grey_pocket_uni.png?v=1750060008",
            "desc": "Máy sấy tóc cầm tay siêu nhẹ 330g, 300 triệu ion âm."
        }
    ]

    print("Seeding premium products...")
    for p in products_raw:
        product_id = str(uuid.uuid4())
        price_vnd = int(p["price"] * AUD_TO_VND)
        
        product_doc = {
            "id": product_id,
            "name": p["title"],
            "slug": p["handle"],
            "sku": f"DRE-{p['handle'].upper()[:10]}",
            "product_type": p["type"],
            "category_id": None, # Will manual update if needed
            "brand_id": None,
            "price": price_vnd,
            "cost_price": int(price_vnd * 0.7),
            "stock_quantity": 50,
            "description": p["desc"],
            "short_description": p["desc"],
            "images": [p["image"]],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.products.update_one(
            {"slug": p["handle"]},
            {"$set": product_doc},
            upsert=True
        )
    
    print("Updating Store Configuration with Premium Banners...")
    # These paths are what we will upload to the server's public folder
    banners = [
        {
            "image_url": "/banners/banner_x50_ultra.png",
            "title": "Dreame X50 Ultra - Đỉnh Cao Công Nghệ Robot",
            "link": "/products/dreame-x50-ultra"
        },
        {
            "image_url": "/banners/banner_h16_pro_steam.png",
            "title": "Hơi Nước 200°C - Sạch Sâu Tuyệt Đối",
            "link": "/products/dreame-h16-pro-steam"
        },
        {
            "image_url": "/banners/banner_smart_home_lifestyle.png",
            "title": "Hệ Sinh Thái Thông Minh Dreame",
            "link": "/products"
        }
    ]
    
    await db.store_config.update_one(
        {}, # Single global config
        {"$set": {
            "site_name": "DREAME OFFICIAL",
            "tagline": "Dẫn Đầu Công Nghệ Làm Sạch Thông Minh",
            "primary_color": "#111827", # Deep Professional Slate/Black
            "hero_banners": banners
        }},
        upsert=True
    )
    
    print("Premium seeding completed successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_premium_data())
