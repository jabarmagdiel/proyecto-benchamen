from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.project import Project
from app.models.activity import Activity
from app.models.workflow import Workflow
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.utils.enums import ActivityStatus, ActivityType, Priority


def _with_progress(db: Session, project: Project) -> Project:
    total = db.query(func.count(Activity.id)).filter(Activity.project_id == project.id).scalar() or 0
    approved = db.query(func.count(Activity.id)).filter(
        Activity.project_id == project.id, Activity.status == ActivityStatus.APPROVED
    ).scalar() or 0
    project.activity_count = total
    project.progress = round((approved / total * 100) if total > 0 else 0.0, 1)
    return project


def get_all(
    db: Session,
    company_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Project]:
    q = db.query(Project).options(joinedload(Project.company), joinedload(Project.main_responsible))
    if company_id:
        q = q.filter(Project.company_id == company_id)
    if status:
        q = q.filter(Project.status == status)
    if search:
        q = q.filter(Project.name.ilike(f"%{search}%"))
    projects = q.offset(skip).limit(limit).all()
    return [_with_progress(db, p) for p in projects]


def get_by_id(db: Session, project_id: int) -> Project:
    project = (
        db.query(Project)
        .options(joinedload(Project.company), joinedload(Project.main_responsible))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return _with_progress(db, project)


def create(db: Session, data: ProjectCreate, current_user_id: int) -> Project:
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
            
    return get_by_id(db, project.id)


def update(db: Session, project_id: int, data: ProjectUpdate, current_user_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(project, key, val)
    db.commit()

    return get_by_id(db, project_id)


def delete(db: Session, project_id: int) -> None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    db.delete(project)
    db.commit()
