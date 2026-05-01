"""Alerts endpoints — list flagged posts and update their review status."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Post
from backend.schemas import AlertPatch, PostOut

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[PostOut])
def list_alerts(db: Session = Depends(get_db)):
    return (
        db.query(Post)
        .filter(Post.has_alert == True)  # noqa: E712
        .order_by(Post.timestamp.desc())
        .all()
    )


@router.patch("/{alert_id}", response_model=PostOut)
def update_alert(alert_id: str, body: AlertPatch, db: Session = Depends(get_db)):
    post = db.get(Post, alert_id)
    if not post or not post.has_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    post.alert_status = body.alert_status
    db.commit()
    db.refresh(post)
    return post
