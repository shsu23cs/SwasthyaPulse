"""Overview stats endpoint — dashboard KPIs and 14-day trend."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Post, Project
from backend.schemas import StatsOut, TrendPoint

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    total_projects = db.query(func.count(Project.id)).scalar() or 0
    active_projects = db.query(func.count(Project.id)).filter_by(status="active").scalar() or 0

    posts_today = (
        db.query(func.count(Post.id))
        .filter(Post.timestamp >= today_start)
        .scalar() or 0
    )
    posts_yesterday = (
        db.query(func.count(Post.id))
        .filter(Post.timestamp >= yesterday_start, Post.timestamp < today_start)
        .scalar() or 0
    )
    posts_trend = (
        round(((posts_today - posts_yesterday) / max(posts_yesterday, 1)) * 100, 1)
        if posts_yesterday
        else 0.0
    )

    alerts_active = (
        db.query(func.count(Post.id))
        .filter(Post.has_alert == True, Post.alert_status == "open")  # noqa: E712
        .scalar() or 0
    )

    avg_sentiment_row = db.query(func.avg(Post.sentiment_score)).scalar()
    avg_sentiment = round(float(avg_sentiment_row or 0.0), 4)

    trend = _build_trend(db, days=14)

    return StatsOut(
        total_projects=total_projects,
        active_projects=active_projects,
        posts_today=posts_today,
        posts_trend=posts_trend,
        alerts_active=alerts_active,
        avg_sentiment=avg_sentiment,
        trend=trend,
    )


def _build_trend(db: Session, days: int = 14) -> list[TrendPoint]:
    now = datetime.utcnow()
    cutoff = now - timedelta(days=days)
    posts = db.query(Post).filter(Post.timestamp >= cutoff).all()

    # Group counts by day
    day_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})
    for p in posts:
        ts = p.timestamp
        label = f"{ts.day} {ts.strftime('%b')}"
        day_counts[label][p.sentiment] += 1

    # Build ordered 14-day list (fill gaps with zeros)
    result: list[TrendPoint] = []
    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        label = f"{day.day} {day.strftime('%b')}"
        counts = day_counts.get(label, {"positive": 0, "negative": 0, "neutral": 0})
        result.append(TrendPoint(date=label, **counts))

    return result
