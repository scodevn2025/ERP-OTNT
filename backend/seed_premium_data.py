import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
import json

# Manual .env loader fallback
def load_env_manual():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

# Load env
load_env_manual()

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', "mongodb://localhost:27017")
DB_NAME = os.environ.get('DB_NAME', "erp_otnt")
AUD_TO_VND = 16500

async def seed_premium_data():
    print(f"Connecting to MongoDB: {MONGO_URL}")
    print(f"Target Database: {DB_NAME}")
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
            "site_name": "ONG TRÙM NỘI TRỢ",
            "tagline": "Chuyên Robot Hút Bụi & Máy Lau Sàn",
            "primary_color": "#ee2d24", # Vibrant Red matching screenshot
            "secondary_color": "#1e293b",
            "hero_banners": banners
        }},
        upsert=True
    )
    
    print("Seeding Sample Blogs...")
    blogs_raw = [
        {
            "title": "5 Lý Do Bạn Nên Sở Hữu Robot Hút Bụi Trong Năm 2026",
            "slug": "5-ly-do-nen-so-huu-robot-hut-bui-2026",
            "excerpt": "Robot hút bụi không còn là xa xỉ phẩm mà đã trở thành trợ thủ đắc lực trong mọi gia đình hiện đại.",
            "content": """
                <p>Trong kỷ nguyên công nghệ 4.0, việc dành hàng giờ mỗi ngày để quét dọn nhà cửa đã trở nên lỗi thời. Dưới đây là 5 lý do vì sao một chiếc robot hút bụi thông minh như Dreame X50 Ultra là khoản đầu tư xứng đáng nhất cho tổ ấm của bạn:</p>
                <ul>
                    <li><strong>Tiết kiệm thời gian tuyệt đối:</strong> Bạn có thêm ít nhất 30-60 phút mỗi ngày cho bản thân và gia đình.</li>
                    <li><strong>Làm sạch sâu hơn:</strong> Với lực hút lên tới 20.000Pa, robot có khả năng loại bỏ bụi mịn và vi khuẩn mà chổi thông thường không thể làm được.</li>
                    <li><strong>Vận hành tự động:</strong> Chỉ cần lập lịch, robot sẽ tự làm việc khi bạn vắng nhà và tự quay về trạm sạc.</li>
                    <li><strong>Công nghệ AI thông minh:</strong> Tránh vật cản chính xác, không còn tình trạng robot bị kẹt hay rơi cầu thang.</li>
                    <li><strong>Tích hợp lau sàn:</strong> Vừa hút vừa lau, giúp sàn nhà luôn bóng loáng mà không cần chạm tay.</li>
                </ul>
                <p>Hãy liên hệ ngay với <strong>DREAME OFFICIAL</strong> để được tư vấn mẫu robot phù hợp nhất!</p>
            """,
            "feature_image": "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&h=450&fit=crop",
            "category": "Kinh nghiệm"
        },
        {
            "title": "Hướng Dẫn Bảo Trì Robot Hút Bụi Bền Bỉ Theo Thời Gian",
            "slug": "huong-dan-bao-tri-robot-hut-bui-ben-bi",
            "excerpt": "Của bền tại người - học ngay cách chăm sóc robot hút bụi để máy luôn hoạt động như mới.",
            "content": """
                <p>Để chiếc robot hút bụi đồng hành cùng gia đình bạn trong 5-10 năm, việc bảo trì định kỳ là vô cùng quan trọng. Đừng bỏ qua các bước sau:</p>
                <h3>1. Vệ sinh chổi chính và chổi cạnh</h3>
                <p>Tóc và dây nhợ quấn vào chổi là nguyên nhân chính gây hỏng động cơ. Hãy dùng dụng cụ vệ sinh đi kèm để cắt bỏ tóc rối ít nhất 1 lần/tuần.</p>
                <h3>2. Kiểm tra bộ lọc HEPA</h3>
                <p>Bộ lọc quá bẩn sẽ làm giảm lực hút đáng kể. Hãy gõ nhẹ để bụi rơi ra hoặc thay mới mỗi 3-6 tháng tùy mức độ sử dụng.</p>
                <h3>3. Vệ sinh các cảm biến</h3>
                <p>Dùng khăn mềm khô lau sạch các mắt cảm biến chống rơi và cảm biến va chạm để robot không bị "mù" khi di chuyển.</p>
                <p>Việc chăm sóc robot không tốn quá nhiều thời gian nhưng sẽ giúp bạn tiết kiệm hàng triệu đồng chi phí sửa chữa sau này.</p>
            """,
            "feature_image": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=450&fit=crop",
            "category": "Hướng dẫn"
        },
        {
            "title": "So Sánh Dreame X50 Ultra Và Dreame X40 Ultra: Có Đáng Để Nâng Cấp?",
            "slug": "so-sanh-dreame-x50-ultra-va-x40-ultra",
            "excerpt": "Hai siêu phẩm mạnh nhất hiện nay của Dreame có gì khác biệt? Hãy cùng chúng tôi tìm hiểu.",
            "content": """
                <p>Dreame liên tục làm dậy sóng thị trường với các dòng Flagship. Nếu bạn đang phân vân giữa X50 Ultra và X40 Ultra, đây là bảng so sánh chi tiết:</p>
                <table border="1" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th>Tính năng</th>
                            <th>Dreame X40 Ultra</th>
                            <th>Dreame X50 Ultra</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Lực hút</td>
                            <td>12.000 Pa</td>
                            <td>20.000 Pa (Mạnh nhất TG)</td>
                        </tr>
                        <tr>
                            <td>Nâng giẻ lau</td>
                            <td>10.5 mm</td>
                            <td>Nâng cả giẻ và chổi chính</td>
                        </tr>
                        <tr>
                            <td>Cảm biến bụi bẩn</td>
                            <td>Omni Precision</td>
                            <td>AI AI-Vision + LiDAR Pro</td>
                        </tr>
                    </tbody>
                </table>
                <p>Kết luận: Nếu bạn ưu tiên sức mạnh tuyệt đối và sàn nhà có nhiều thảm, X50 Ultra là sự lựa chọn không thể bỏ qua.</p>
            """,
            "feature_image": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&h=450&fit=crop",
            "category": "Đánh giá"
        }
    ]

    for b in blogs_raw:
        blog_doc = {
            "id": str(uuid.uuid4()),
            "title": b["title"],
            "slug": b["slug"],
            "excerpt": b["excerpt"],
            "content": b["content"].strip(),
            "feature_image": b["feature_image"],
            "category": b["category"],
            "tags": ["robot", "dreame", "cleaning"],
            "is_published": True,
            "view_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.blogs.update_one(
            {"slug": b["slug"]},
            {"$set": blog_doc},
            upsert=True
        )

    print("Premium seeding completed successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_premium_data())
