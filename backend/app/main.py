"""
LocalBiz AI — FastAPI Application Entry Point
Multi-Agent AI System for Evidence-Based Local Business Location Analysis

Security: Azure credentials are NEVER exposed to the React frontend.
All Azure Maps and Foundry calls are server-side only.
"""
from __future__ import annotations

import logging
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.azure_maps.client import close_client
from app.config import get_settings
from app.routes import analysis, candidates, debate, location

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="LocalBiz AI API",
    description=(
        "Multi-Agent AI System for Evidence-Based Local Business Location Analysis. "
        "Uses Azure Maps for verified geographic data and Azure AI Foundry for agent reasoning."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routes ──
app.include_router(location.router)
app.include_router(candidates.router)
app.include_router(debate.router)
app.include_router(analysis.router)


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "azure_maps_configured": settings.maps_configured,
        "foundry_configured": settings.foundry_configured,
        "demo_mode": settings.demo_mode,
        "model_deployment": settings.foundry_model_deployment,
    }


@app.get("/health")
async def health_alias():
    """Alias for /api/health."""
    return await health()


@app.on_event("startup")
async def on_startup():
    logger.info("LocalBiz AI backend starting...")
    if not settings.maps_configured:
        logger.warning("⚠️  AZURE_MAPS_KEY not set — Azure Maps calls will fail")
    if not settings.foundry_configured:
        logger.warning("⚠️  FOUNDRY_PROJECT_ENDPOINT not set — AI agent calls will fail")
    if settings.demo_mode:
        logger.info("ℹ️  DEMO MODE enabled — static demo data will be labelled DEMO DATA - NOT REAL")
    logger.info("✅ LocalBiz AI backend ready")


@app.on_event("shutdown")
async def on_shutdown():
    await close_client()
    logger.info("LocalBiz AI backend shut down")
