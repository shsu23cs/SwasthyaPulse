"""
APScheduler-based background scheduler.

Schedules a crawl job for every active project based on its frequency:
  realtime → every 5 minutes
  hourly   → every 60 minutes
  daily    → every 24 hours
"""
from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None

FREQUENCY_MINUTES = {
    "realtime": 3,
    "hourly": 60,
    "daily": 1440,
}


def _get_db():
    from backend.database import SessionLocal
    return SessionLocal()


def _crawl_job(project_id: str):
    """Top-level function (must be picklable) for APScheduler to call."""
    from backend.models import Project
    from backend.services.crawler import crawl_project

    db = _get_db()
    try:
        project = db.get(Project, project_id)
        if project and project.status == "active":
            crawl_project(project, db)
    except Exception as exc:
        logger.exception("Scheduled crawl error for project %s: %s", project_id, exc)
    finally:
        db.close()


def start_scheduler():
    global _scheduler
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.start()
    logger.info("APScheduler started.")

    # Schedule existing active projects
    from backend.database import SessionLocal
    from backend.models import Project
    db = SessionLocal()
    try:
        projects = db.query(Project).filter_by(status="active").all()
        for p in projects:
            _schedule_project(p.id, p.frequency)
    finally:
        db.close()


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")


def _schedule_project(project_id: str, frequency: str):
    if _scheduler is None:
        return
    minutes = FREQUENCY_MINUTES.get(frequency, 1440)
    job_id = f"crawl_{project_id}"
    # Remove existing job if rescheduling
    if _scheduler.get_job(job_id):
        _scheduler.remove_job(job_id)
    _scheduler.add_job(
        _crawl_job,
        trigger=IntervalTrigger(minutes=minutes, jitter=120),
        id=job_id,
        args=[project_id],
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    logger.info("Scheduled crawl for project %s every %d min.", project_id, minutes)


def schedule_project(project_id: str, frequency: str):
    """Called after a project is created or its frequency changes."""
    _schedule_project(project_id, frequency)


def unschedule_project(project_id: str):
    if _scheduler is None:
        return
    job_id = f"crawl_{project_id}"
    if _scheduler.get_job(job_id):
        _scheduler.remove_job(job_id)
        logger.info("Unscheduled crawl for project %s.", project_id)
