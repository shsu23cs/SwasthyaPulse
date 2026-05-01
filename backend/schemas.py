"""Pydantic v2 schemas for request/response serialization."""
from __future__ import annotations
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


# ─── Shared ──────────────────────────────────────────────────────────────────

class EntitiesSchema(BaseModel):
    drugs: list[str] = []
    symptoms: list[str] = []
    conditions: list[str] = []


# ─── Project ─────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    keywords: list[str] = []
    sources: list[str] = []
    frequency: Literal["realtime", "hourly", "daily"] = "daily"

class ProjectPatch(BaseModel):
    status: Optional[Literal["active", "paused"]] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    keywords: list[str]
    sources: list[str]
    frequency: str
    status: str
    posts_collected: int
    alerts_triggered: int
    created_at: datetime


# ─── Post ─────────────────────────────────────────────────────────────────────

class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    source: str
    author: str
    author_handle: str
    url: Optional[str] = None
    content: str
    timestamp: datetime
    sentiment: str
    sentiment_score: float
    keywords: list[str]
    entities: EntitiesSchema
    has_alert: bool
    severity: Optional[str]
    privacy_masked: bool
    alert_status: str


# ─── Alert (subset of PostOut with status mutation) ───────────────────────────

class AlertPatch(BaseModel):
    alert_status: Literal["open", "reviewed", "escalated", "dismissed"]


# ─── Stats ────────────────────────────────────────────────────────────────────

class TrendPoint(BaseModel):
    date: str
    positive: int
    negative: int
    neutral: int


class StatsOut(BaseModel):
    total_projects: int
    active_projects: int
    posts_today: int
    posts_trend: float        # % change vs yesterday
    alerts_active: int
    avg_sentiment: float
    trend: list[TrendPoint]


# ─── Insights ─────────────────────────────────────────────────────────────────

class EntityFrequency(BaseModel):
    name: str
    count: int


class ProjectVolume(BaseModel):
    name: str
    posts: int
    alerts: int


class InsightsOut(BaseModel):
    top_drugs: list[EntityFrequency]
    top_symptoms: list[EntityFrequency]
    top_keywords: list[EntityFrequency]
    project_volume: list[ProjectVolume]
    trend: list[TrendPoint]
