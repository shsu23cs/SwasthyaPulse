"""CRUD endpoints for Projects."""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Project
from backend.schemas import ProjectCreate, ProjectOut, ProjectPatch
from backend.services.crawler import crawl_project
from backend.services.scheduler import schedule_project
from backend.auth import require_admin

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.created_at.desc()).all()


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    body: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    project = Project(
        name=body.name,
        description=body.description,
        frequency=body.frequency,
        status="active",
    )
    project.keywords = body.keywords
    project.sources = body.sources if body.sources else ["Web"]
    db.add(project)
    db.commit()
    db.refresh(project)

    # Kick off an immediate crawl in the background
    background_tasks.add_task(_bg_crawl, project.id)
    # Schedule recurring crawl
    schedule_project(project.id, project.frequency)

    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    body: ProjectPatch,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if body.status:
        project.status = body.status
        if body.status == "paused":
            from backend.services.scheduler import unschedule_project
            unschedule_project(project_id)
        else:
            from backend.services.scheduler import schedule_project
            schedule_project(project_id, project.frequency)
            
    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/crawl", status_code=200)
def trigger_crawl(
    project_id: str,
    db: Session = Depends(get_db),
    _admin = Depends(require_admin),
):
    """Manually trigger a DuckDuckGo crawl for this project (synchronous)."""
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Run synchronously so the frontend can wait for new data
    new_count = crawl_project(project, db)
    return {"detail": f"Crawl complete. Found {new_count} new posts.", "project_id": project_id}


def _bg_crawl(project_id: str):
    """Run crawl in a background task (needs its own DB session)."""
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        project = db.get(Project, project_id)
        if project:
            crawl_project(project, db)
    finally:
        db.close()
