from typing import List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin, get_current_user
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse, ActivityStatusUpdate
from app.schemas.history import HistoryResponse
from app.models.activity_history import ActivityHistory
import app.services.activity_service as activity_svc

router = APIRouter(prefix="/api/activities", tags=["Actividades"])


@router.get("", response_model=List[ActivityResponse])
def list_activities(
    company_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    assigned_user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    activity_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.models.project import Project
    from app.models.workflow import WorkflowStage
    for_client = None
    if current_user.role.value == "cliente":
        company_id = current_user.company_id
        for_client = True
        if project_id:
            proj = db.query(Project).filter(Project.id == project_id).first()
            if not proj or proj.company_id != current_user.company_id:
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="No tienes permiso para ver las actividades de este proyecto")
    elif current_user.role.value == "administrador" and status == "en_revision":
        for_client = False
        
    return activity_svc.get_all(
        db, company_id=company_id, project_id=project_id, assigned_user_id=assigned_user_id,
        status=status, priority=priority, activity_type=activity_type, search=search, 
        skip=skip, limit=limit, for_client=for_client
    )


@router.get("/my", response_model=List[ActivityResponse])
def my_activities(
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return activity_svc.get_my_activities(db, current_user.id, status=status, skip=skip, limit=limit)


@router.post("", response_model=ActivityResponse, status_code=201)
def create_activity(data: ActivityCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return activity_svc.create(db, data, current_user.id)


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(activity_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    activity = activity_svc.get_by_id(db, activity_id)
    if current_user.role.value == "cliente" and activity.project.company_id != current_user.company_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta actividad")
    return activity



@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int, data: ActivityUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)
):
    return activity_svc.update(db, activity_id, data, current_user.id)


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    activity_svc.delete(db, activity_id)


# ─── Transiciones de estado ────────────────────────────────────────────────────

@router.patch("/{activity_id}/start", response_model=ActivityResponse)
async def start(activity_id: int, bg: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return await activity_svc.start_activity(db, activity_id, current_user, bg)


@router.patch("/{activity_id}/send-review", response_model=ActivityResponse)
async def send_review(activity_id: int, bg: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return await activity_svc.send_to_review(db, activity_id, current_user, bg)


@router.patch("/{activity_id}/approve", response_model=ActivityResponse)
async def approve(activity_id: int, bg: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return await activity_svc.approve_activity(db, activity_id, current_user, bg)


@router.patch("/{activity_id}/observe", response_model=ActivityResponse)
async def observe(activity_id: int, data: ActivityStatusUpdate, bg: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return await activity_svc.observe_activity(db, activity_id, current_user, data, bg)


@router.patch("/{activity_id}/cancel", response_model=ActivityResponse)
async def cancel(activity_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return await activity_svc.cancel_activity(db, activity_id, current_user)


# ─── Time Tracking ─────────────────────────────────────────────────────────────

@router.patch("/{activity_id}/timer/start", response_model=ActivityResponse)
def start_timer(activity_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return activity_svc.start_timer(db, activity_id, current_user)

@router.patch("/{activity_id}/timer/stop", response_model=ActivityResponse)
def stop_timer(activity_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return activity_svc.stop_timer(db, activity_id, current_user)


@router.get("/{activity_id}/history", response_model=List[HistoryResponse])
def get_history(activity_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    activity = activity_svc.get_by_id(db, activity_id)
    if current_user.role.value == "cliente" and activity.project.company_id != current_user.company_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No tienes permiso para ver el historial de esta actividad")
    return (
        db.query(ActivityHistory)
        .filter(ActivityHistory.activity_id == activity_id)
        .order_by(ActivityHistory.created_at.desc())
        .all()
    )

