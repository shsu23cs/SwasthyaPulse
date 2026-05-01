"""Posts listing endpoint with filtering support."""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Post
from backend.schemas import PostOut

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=list[PostOut])
def list_posts(
    project: Optional[str] = Query(None, description="Filter by project ID"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment (positive|negative|neutral)"),
    alerts_only: bool = Query(False, alias="alertsOnly"),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    q = db.query(Post)
    if project:
        q = q.filter(Post.project_id == project)
    if sentiment and sentiment != "all":
        q = q.filter(Post.sentiment == sentiment)
    if alerts_only:
        q = q.filter(Post.has_alert == True)  # noqa: E712
    q = q.order_by(Post.timestamp.desc()).offset(offset).limit(limit)
    return q.all()
