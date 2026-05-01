"""
SwasthyaPulse — FastAPI Application Entry Point
================================================
Run with:
  uvicorn backend.main:app --reload --port 8001
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import create_all_tables
from backend.routers import projects, posts, alerts, stats, insights
from backend.services.scheduler import start_scheduler, stop_scheduler
from backend.auth import get_current_user

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SwasthyaPulse API",
    description="Healthcare social-listening platform — real-time signals from patient conversations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allow the Vite dev server (5173) and any local origin during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
from fastapi import Depends

app.include_router(projects.router, dependencies=[Depends(get_current_user)])
app.include_router(posts.router, dependencies=[Depends(get_current_user)])
app.include_router(alerts.router, dependencies=[Depends(get_current_user)])
app.include_router(stats.router, dependencies=[Depends(get_current_user)])
app.include_router(insights.router, dependencies=[Depends(get_current_user)])


# ─── Lifecycle ────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("Creating database tables…")
    create_all_tables()
    logger.info("Starting background scheduler…")
    start_scheduler()
    logger.info("SwasthyaPulse API ready.")


@app.on_event("shutdown")
async def on_shutdown():
    stop_scheduler()


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "SwasthyaPulse"}
