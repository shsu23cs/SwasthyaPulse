"""Insights endpoint — trending entities, top keywords, project volume."""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Post, Project
from backend.routers.stats import _build_trend
from backend.schemas import EntityFrequency, InsightsOut, ProjectVolume

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=InsightsOut)
def get_insights(db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    drug_counter: Counter = Counter()
    symptom_counter: Counter = Counter()
    keyword_counter: Counter = Counter()

    for post in posts:
        entities = json.loads(post.entities_json or "{}")
        for d in entities.get("drugs", []):
            drug_counter[d] += 1
        for s in entities.get("symptoms", []):
            symptom_counter[s] += 1
        for k in json.loads(post.keywords_json or "[]"):
            keyword_counter[k] += 1

    top_drugs = [EntityFrequency(name=n, count=c) for n, c in drug_counter.most_common(8)]
    top_symptoms = [EntityFrequency(name=n, count=c) for n, c in symptom_counter.most_common(8)]
    top_keywords = [EntityFrequency(name=n, count=c) for n, c in keyword_counter.most_common(10)]

    projects = db.query(Project).all()
    project_volume = [
        ProjectVolume(
            name=p.name.split()[0],  # short label
            posts=p.posts_collected or 0,
            alerts=p.alerts_triggered or 0,
        )
        for p in projects
    ]

    trend = _build_trend(db, days=14)

    return InsightsOut(
        top_drugs=top_drugs,
        top_symptoms=top_symptoms,
        top_keywords=top_keywords,
        project_volume=project_volume,
        trend=trend,
    )
