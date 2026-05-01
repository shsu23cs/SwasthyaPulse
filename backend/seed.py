"""
Seed Script — populates the database with the same projects and posts
that were previously in mock-data.ts, processed through the real NLP pipeline.

Run once:
  python -m backend.seed
"""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone

from backend.database import SessionLocal, create_all_tables
from backend.models import Post, Project
from backend.services.nlp import analyze


def seed():
    create_all_tables()
    db = SessionLocal()

    # Clear existing data to keep seed idempotent
    existing_projects = db.query(Project).count()
    if existing_projects > 0:
        print(f"Database already has {existing_projects} projects. Skipping seed.")
        db.close()
        return

    print("Seeding projects and posts…")

    # ── Projects ──────────────────────────────────────────────────────────────
    raw_projects = [
        {
            "id": "p-onco-1",
            "name": "Oncology Patient Voice",
            "description": "Tracking patient discussions around immunotherapy and side effects.",
            "keywords": ["immunotherapy", "pembrolizumab", "side effects", "fatigue"],
            "sources": ["Twitter/X", "Reddit", "PatientsLikeMe", "HealthUnlocked"],
            "frequency": "realtime",
            "status": "active",
            "posts_collected": 12483,
            "alerts_triggered": 7,
            "created_at": datetime(2025, 2, 14, tzinfo=timezone.utc),
        },
        {
            "id": "p-diab-2",
            "name": "Diabetes Device Sentiment",
            "description": "Continuous glucose monitor feedback across forums and social.",
            "keywords": ["CGM", "Dexcom", "Libre", "sensor failure"],
            "sources": ["Reddit", "Facebook Groups", "Twitter/X"],
            "frequency": "hourly",
            "status": "active",
            "posts_collected": 8721,
            "alerts_triggered": 3,
            "created_at": datetime(2025, 3, 2, tzinfo=timezone.utc),
        },
        {
            "id": "p-vacc-3",
            "name": "Vaccine Safety Monitoring",
            "description": "Early signal detection for adverse events post-vaccination.",
            "keywords": ["vaccine", "adverse event", "reaction", "myocarditis"],
            "sources": ["Twitter/X", "Reddit", "News"],
            "frequency": "realtime",
            "status": "active",
            "posts_collected": 21055,
            "alerts_triggered": 14,
            "created_at": datetime(2025, 1, 8, tzinfo=timezone.utc),
        },
        {
            "id": "p-mh-4",
            "name": "Mental Health Conversations",
            "description": "Sentiment around SSRIs and therapy access.",
            "keywords": ["SSRI", "therapy", "anxiety", "depression"],
            "sources": ["Reddit", "Twitter/X"],
            "frequency": "daily",
            "status": "paused",
            "posts_collected": 5402,
            "alerts_triggered": 1,
            "created_at": datetime(2025, 3, 21, tzinfo=timezone.utc),
        },
    ]

    raw_posts = [
        {
            "project_id": "p-onco-1",
            "source": "Reddit",
            "author": "Maya R.",
            "author_handle": "@maya_r",
            "content": "Started pembrolizumab three weeks ago. Fatigue is heavy but manageable. Anyone else dealing with joint pain?",
            "offset_min": 37,
        },
        {
            "project_id": "p-onco-1",
            "source": "Twitter/X",
            "author": "J. Patel",
            "author_handle": "@jpatel_md",
            "content": "Severe shortness of breath after second dose — went to ER last night. Reporting to physician today. Patient ID 123-45-6789 masked.",
            "offset_min": 74,
        },
        {
            "project_id": "p-onco-1",
            "source": "PatientsLikeMe",
            "author": "Anonymous",
            "author_handle": "@anon_user",
            "content": "Six months in and my scans look great. The team has been incredible. Side effects manageable with proper hydration.",
            "offset_min": 111,
        },
        {
            "project_id": "p-diab-2",
            "source": "Reddit",
            "author": "Care Advocate",
            "author_handle": "@care_advoc",
            "content": "CGM sensor failed on day 4 again. Third time this month. Customer service replacement is slow. Frustrating for type 1 management.",
            "offset_min": 148,
        },
        {
            "project_id": "p-onco-1",
            "source": "HealthUnlocked",
            "author": "Sam K.",
            "author_handle": "@samk_health",
            "content": "Anyone experienced chest tightness after immunotherapy? Lasted ~2 hours, resolved on its own. Doctor wants to monitor.",
            "offset_min": 185,
        },
        {
            "project_id": "p-vacc-3",
            "source": "Twitter/X",
            "author": "Dr. Lin",
            "author_handle": "@dr_lin",
            "content": "New data on adjuvant therapy looking promising. Patient adherence remains the central challenge in real-world settings.",
            "offset_min": 222,
        },
        {
            "project_id": "p-vacc-3",
            "source": "Reddit",
            "author": "VaxWatch",
            "author_handle": "@vaxwatch",
            "content": "Reported myocarditis case after mRNA vaccine in teenage male. Hospital admission confirmed. Adverse event filed with VAERS.",
            "offset_min": 259,
        },
        {
            "project_id": "p-mh-4",
            "source": "Reddit",
            "author": "TherapySeeker",
            "author_handle": "@therapy_seeker",
            "content": "Three month wait for a therapist. SSRI helping with anxiety but I feel like the system is broken. Access to mental health care is a disaster.",
            "offset_min": 296,
        },
        {
            "project_id": "p-diab-2",
            "source": "Facebook Groups",
            "author": "DiabetesParent",
            "author_handle": "@diabetes_parent",
            "content": "Dexcom G7 accuracy has been so much better than the G6 for my daughter. We can actually sleep through the night now.",
            "offset_min": 333,
        },
        {
            "project_id": "p-vacc-3",
            "source": "News",
            "author": "HealthReporter",
            "author_handle": "@healthreporter",
            "content": "New CDC report: vaccine safety monitoring shows adverse event rates within expected ranges. Serious reactions remain rare.",
            "offset_min": 370,
        },
    ]

    now = datetime.now(timezone.utc)

    # Insert projects
    for rp in raw_projects:
        p = Project(
            id=rp["id"],
            name=rp["name"],
            description=rp["description"],
            frequency=rp["frequency"],
            status=rp["status"],
            posts_collected=rp["posts_collected"],
            alerts_triggered=rp["alerts_triggered"],
            created_at=rp["created_at"],
        )
        p.keywords = rp["keywords"]
        p.sources = rp["sources"]
        db.add(p)

    db.flush()

    # Insert posts through NLP pipeline
    for i, rp in enumerate(raw_posts):
        nlp = analyze(rp["content"])
        post = Post(
            id=f"seed-post-{i + 1}",
            project_id=rp["project_id"],
            source=rp["source"],
            author=rp["author"],
            author_handle=rp["author_handle"],
            content=nlp.content,
            timestamp=now - timedelta(minutes=rp["offset_min"]),
            sentiment=nlp.sentiment,
            sentiment_score=nlp.sentiment_score,
            has_alert=nlp.has_alert,
            severity=nlp.severity,
            privacy_masked=nlp.privacy_masked,
            alert_status="open",
        )
        post.keywords = nlp.keywords
        post.entities = nlp.entities
        db.add(post)

    db.commit()
    print(f"[OK] Seeded {len(raw_projects)} projects and {len(raw_posts)} posts.")
    db.close()


if __name__ == "__main__":
    seed()
    sys.exit(0)
