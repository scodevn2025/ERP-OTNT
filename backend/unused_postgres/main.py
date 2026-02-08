import typing
try:
    _orig_eval_type = typing._eval_type
    def _patched_eval_type(t, globalns=None, localns=None, type_params=None, **kwargs):
        kwargs.pop('prefer_fwd_module', None)
        # Ensure recursive_guard is a set to avoid NoneType errors on membership checks
        recursive_guard = type_params if type_params is not None else set()
        return _orig_eval_type(t, globalns, localns, recursive_guard, **kwargs)
    typing._eval_type = _patched_eval_type
except AttributeError:
    pass

from fastapi import FastAPI, APIRouter

from starlette.middleware.cors import CORSMiddleware
import os
import logging
from contextlib import asynccontextmanager

from database import init_db
from routers import auth, catalog, inventory, sales, repair, accounting, admin

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Database...")
    await init_db()
    logger.info("Database initialized.")
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(
    title="OTNT ERP API (SQL)", 
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, tags=["Auth"])
api_router.include_router(catalog.router, tags=["Catalog"])
api_router.include_router(inventory.router, tags=["Inventory"])
api_router.include_router(sales.router, tags=["Sales"])
api_router.include_router(repair.router, tags=["Repair"])
api_router.include_router(accounting.router, tags=["Accounting"])
api_router.include_router(admin.router, tags=["Admin"])

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "OTNT ERP API v2.0 (PostgreSQL)", "status": "running"}
