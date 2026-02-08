import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
import uuid
from datetime import datetime, timezone

# URL from env or fallback
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "erp_otnt")

async def create_admin():
    print(f"Connecting to {MONGO_URL} / {DB_NAME}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    email = "admin@erp.ongtrumnoitro.com"
    password_plain = "Admin@123456"
    
    # Hash password
    hashed = bcrypt.hashpw(password_plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "hashed_password": hashed, # Correct field for login
        "full_name": "Admin User",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert based on email
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"Updating existing admin: {email}")
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "hashed_password": hashed,
                "role": "admin",
                "is_active": True
            }}
        )
    else:
        print(f"Creating new admin: {email}")
        await db.users.insert_one(user_doc)
        
    print("Done. Credentials:")
    print(f"Email: {email}")
    print(f"Password: {password_plain}")

if __name__ == "__main__":
    asyncio.run(create_admin())
