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
    
    if project.workflow_id:
        workflow = db.query(Workflow).filter(Workflow.id == project.workflow_id).first()
        if workflow and workflow.stages:
            from app.services.activity_service import evaluate_workflow_edges
            start_stage = next((s for s in workflow.stages if s.node_type == 'start'), None)
            target_stage_ids = set()
            if start_stage:
                target_stage_ids = set(evaluate_workflow_edges(db, start_stage.id, "approve", project.id))
            
            for stage in workflow.stages:
                if stage.node_type in ['start', 'decision', 'notification']:
                    continue
                status = ActivityStatus.PENDING if stage.id in target_stage_ids else ActivityStatus.BLOCKED
                activity = Activity(
                    project_id=project.id,
                    current_stage_id=stage.id,
                    title=stage.name,
                    description=stage.description or "",
                    created_by_id=current_user_id,
                    activity_type=ActivityType.OTHER,
                    status=status,
                    priority=Priority.MEDIUM,
                )
                db.add(activity)
            db.commit()
            
    return get_by_id(db, project.id)


def update(db: Session, project_id: int, data: ProjectUpdate, current_user_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
    old_workflow_id = project.workflow_id
    
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(project, key, val)
    db.commit()
    
    if project.workflow_id and project.workflow_id != old_workflow_id:
        # Only instantiate if workflow changed and there are no activities linked to this project yet?
        # For simplicity, we just create them if workflow_id changed.
        workflow = db.query(Workflow).filter(Workflow.id == project.workflow_id).first()
        if workflow and workflow.stages:
            from app.services.activity_service import evaluate_workflow_edges
            start_stage = next((s for s in workflow.stages if s.node_type == 'start'), None)
            target_stage_ids = set()
            if start_stage:
                target_stage_ids = set(evaluate_workflow_edges(db, start_stage.id, "approve", project.id))
                
            for stage in workflow.stages:
                if stage.node_type in ['start', 'decision', 'notification']:
                    continue
                status = ActivityStatus.PENDING if stage.id in target_stage_ids else ActivityStatus.BLOCKED
                activity = Activity(
                    project_id=project.id,
                    current_stage_id=stage.id,
                    title=stage.name,
                    description=stage.description or "",
                    created_by_id=current_user_id,
                    activity_type=ActivityType.OTHER,
                    status=status,
                    priority=Priority.MEDIUM,
                )
                db.add(activity)
            db.commit()

    return get_by_id(db, project_id)


def delete(db: Session, project_id: int) -> None:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    db.delete(project)
    db.commit()
