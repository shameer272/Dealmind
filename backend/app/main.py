import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.db.seed import seed_database
from app.api.v1.endpoints import router as api_v1_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("dealmind")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DealMind Database & Hindsight Memory Layer...")
    await init_db()
    try:
        await seed_database()
    except Exception as e:
        logger.warning(f"Seed database warning: {e}")
    logger.info("DealMind Backend Ready!")
    yield
    logger.info("DealMind Backend Shutting Down...")

app = FastAPI(
    title=settings.APP_NAME,
    description="DealMind — Memory-Powered AI Sales Intelligence Agent with Hindsight",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_v1_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to DealMind API",
        "description": "Memory-Powered AI Sales Intelligence Agent using Hindsight",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
