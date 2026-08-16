from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.activity import Activity
from app.models.activity_history import ActivityHistory
from app.models.evidence import Evidence
from app.models.comment import Comment
from app.models.project import Project
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityStatusUpdate
from app.utils.enums import ActivityStatus, HistoryAction, UserRole
from app.utils import email as email_utils
from app.services import notification_service as notification_svc
from app.services import automation_service as auto_svc


def _enrich(db: Session, activity: Activity) -> Activity:
    """Agrega conteos de evidencias y comentarios a una sola actividad."""
    activity.evidence_count = db.query(func.count(Evidence.id)).filter(Evidence.activity_id == activity.id).scalar() or 0
    activity.comment_count = db.query(func.count(Comment.id)).filter(Comment.activity_id == activity.id).scalar() or 0
    if activity.project:
        activity.project_name = activity.project.name
        if activity.project.company:
            activity.company_name = activity.project.company.name
        else:
            activity.company_name = "Sin Empresa / Cliente Externo"
    else:
        activity.project_name = "Trabajo Independiente"
        activity.company_name = "Sin Empresa / Cliente Externo"
            
    if activity.current_stage and activity.current_stage.node_type == 'end':
        latest_evidence = db.query(Evidence).join(Activity).filter(
            Activity.project_id == activity.project_id
        ).order_by(Evidence.created_at.desc()).first()
        
        if latest_evidence:
            activity.latest_evidence_url = latest_evidence.drive_url or latest_evidence.file_url
            activity.latest_evidence_name = latest_evidence.file_name or latest_evidence.drive_url or "Evidencia Final"
            
    return activity


def _enrich_batch(db: Session, activities: List[Activity]) -> List[Activity]:
    """Enriquece una lista de actividades eficientemente agrupando conteos en lote (evita N+1)."""
    if not activities:
        return []
    act_ids = [a.id for a in activities]
    
    evidence_counts = dict(
        db.query(Evidence.activity_id, func.count(Evidence.id))
        .filter(Evidence.activity_id.in_(act_ids))
        .group_by(Evidence.activity_id)
        .all()
    )
    
    comment_counts = dict(
        db.query(Comment.activity_id, func.count(Comment.id))
        .filter(Comment.activity_id.in_(act_ids))
        .group_by(Comment.activity_id)
        .all()
    )
    
    for a in activities:
        a.evidence_count = evidence_counts.get(a.id, 0)
        a.comment_count = comment_counts.get(a.id, 0)
        if a.project:
            a.project_name = a.project.name
            if a.project.company:
                a.company_name = a.project.company.name
            else:
                a.company_name = "Sin Empresa / Cliente Externo"
        else:
            a.project_name = "Trabajo Independiente"
            a.company_name = "Sin Empresa / Cliente Externo"
                
        if a.current_stage and a.current_stage.node_type == 'end':
            latest_evidence = db.query(Evidence).join(Activity).filter(
                Activity.project_id == a.project_id
            ).order_by(Evidence.created_at.desc()).first()
            
            if latest_evidence:
                a.latest_evidence_url = latest_evidence.drive_url or latest_evidence.file_url
                a.latest_evidence_name = latest_evidence.file_name or latest_evidence.drive_url or "Evidencia Final"
                
    return activities


def _add_history(
    db: Session,
    activity_id: int,
    user_id: int,
    action: HistoryAction,
    description: str,
    prev_status: Optional[str] = None,
    new_status: Optional[str] = None,
):
    entry = ActivityHistory(
        activity_id=activity_id,
        user_id=user_id,
        action=action,
        previous_status=prev_status,
        new_status=new_status,
        description=description,
    )
    db.add(entry)


def _load_options():
    return [
        joinedload(Activity.project).joinedload(Project.company),
        joinedload(Activity.assigned_user),
        joinedload(Activity.created_by),
        joinedload(Activity.approved_by),
        joinedload(Activity.current_stage),
    ]


def get_all(
    db: Session,
    company_id: Optional[int] = None,
    project_id: Optional[int] = None,
    assigned_user_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    activity_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    for_client: Optional[bool] = None,
) -> List[Activity]:
    from app.models.workflow import WorkflowStage
    q = db.query(Activity).options(*_load_options())
    if project_id:
        q = q.filter(Activity.project_id == project_id)
    if assigned_user_id:
        q = q.filter(Activity.assigned_user_id == assigned_user_id)
    if status:
        q = q.filter(Activity.status == status)
    if priority:
        q = q.filter(Activity.priority == priority)
    if activity_type:
        q = q.filter(Activity.activity_type == activity_type)
    if search:
        q = q.filter(Activity.title.ilike(f"%{search}%"))
    if company_id:
        q = q.join(Project).filter(Project.company_id == company_id)
    if for_client is not None:
        if for_client:
            q = q.outerjoin(WorkflowStage).filter(
                (Activity.current_stage_id == None) | (WorkflowStage.node_type == 'end')
            )
        else:
            q = q.outerjoin(WorkflowStage).filter(
                (Activity.current_stage_id == None) | (WorkflowStage.node_type != 'end')
            )
    activities = q.order_by(Activity.deadline.asc().nullslast(), Activity.created_at.desc()).offset(skip).limit(limit).all()
    return _enrich_batch(db, activities)


def get_my_activities(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Activity]:
    q = db.query(Activity).options(*_load_options()).filter(Activity.assigned_user_id == user_id)
    if status:
        q = q.filter(Activity.status == status)
    activities = q.order_by(Activity.deadline.asc().nullslast()).offset(skip).limit(limit).all()
    return _enrich_batch(db, activities)


def get_by_id(db: Session, activity_id: int) -> Activity:
    activity = (
        db.query(Activity)
        .options(*_load_options())
        .filter(Activity.id == activity_id)
        .first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return _enrich(db, activity)


def create(db: Session, data: ActivityCreate, creator_id: int) -> Activity:
    activity_data = data.model_dump()
    
    current_stage_id = None
    if data.workflow_id:
        from app.models.workflow import Workflow
        workflow = db.query(Workflow).filter(Workflow.id == data.workflow_id).first()
        if workflow and workflow.stages:
            start_stage = next((s for s in workflow.stages if s.node_type == 'start'), None)
            if start_stage:
                from app.services.activity_service import evaluate_workflow_edges
                target_stage_ids = evaluate_workflow_edges(db, start_stage.id, "approve", data.project_id)
                if target_stage_ids:
                    current_stage_id = target_stage_ids[0]
            
            if not current_stage_id:
                # Fallback to first non-start stage
                for stage in workflow.stages:
                    if stage.node_type not in ['start', 'end']:
                        current_stage_id = stage.id
                        break
                        
    activity = Activity(
        **activity_data,
        created_by_id=creator_id,
        status=ActivityStatus.PENDING if not data.assigned_user_id else ActivityStatus.ASSIGNED,
        current_stage_id=current_stage_id
    )
    db.add(activity)
    db.flush()
    _add_history(db, activity.id, creator_id, HistoryAction.CREATED, "Actividad creada")
    if data.assigned_user_id:
        _add_history(db, activity.id, creator_id, HistoryAction.ASSIGNED, f"Actividad asignada al usuario {data.assigned_user_id}")
    db.commit()
    if activity.assigned_user_id:
        try:
            notification_svc.create_notification(
                db,
                user_id=activity.assigned_user_id,
                title="Nueva actividad asignada",
                message=f"Se te ha asignado la actividad '{activity.title}' en el proyecto '{activity.project.name if activity.project else ''}'.",
                link=f"/actividades/{activity.id}"
            )
        except Exception:
            pass
    _emit_activity_update(activity.id)
    return get_by_id(db, activity.id)


def _emit_activity_update(activity_id: int):
    try:
        from app.core.websocket import notify_realtime
        notify_realtime(entity="activities", action="update", data={"id": activity_id})
    except Exception:
        pass


def update(db: Session, activity_id: int, data: ActivityUpdate, editor_id: int) -> Activity:
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    prev_stage = activity.current_stage_id
    prev_assigned = activity.assigned_user_id

    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(activity, key, val)
        
    # Si se reasignó el usuario
    if data.assigned_user_id and data.assigned_user_id != prev_assigned:
        if activity.status == ActivityStatus.PENDING:
            activity.status = ActivityStatus.ASSIGNED
        _add_history(db, activity_id, editor_id, HistoryAction.ASSIGNED, f"Reasignada al usuario {data.assigned_user_id}")
        
    # Procesar automatizaciones si cambió la etapa
    if hasattr(data, 'current_stage_id') and data.current_stage_id and data.current_stage_id != prev_stage:
        if prev_stage:
            auto_svc.process_stage_automations(db, activity, prev_stage, "on_exit", editor_id)
        auto_svc.process_stage_automations(db, activity, data.current_stage_id, "on_enter", editor_id)

    _add_history(db, activity_id, editor_id, HistoryAction.EDITED, "Actividad editada")
    db.commit()
    if data.assigned_user_id and data.assigned_user_id != prev_assigned:
        try:
            notification_svc.create_notification(
                db,
                user_id=data.assigned_user_id,
                title="Nueva actividad asignada",
                message=f"Se te ha asignado la actividad '{activity.title}' en el proyecto '{activity.project.name if activity.project else ''}'.",
                link=f"/actividades/{activity.id}"
            )
        except Exception:
            pass
    _emit_activity_update(activity_id)
    return get_by_id(db, activity_id)


# ─── Transiciones de estado ────────────────────────────────────────────────────

def evaluate_workflow_edges(db: Session, stage_id: int, act: str, project_id: int, visited=None) -> list[int]:
    from app.models.workflow import WorkflowEdge, WorkflowStage
    if visited is None:
        visited = set()
    if stage_id in visited:
        return []
    visited.add(stage_id)
    
    edges = db.query(WorkflowEdge).filter(WorkflowEdge.source_stage_id == stage_id).all()
    results = []
    
    for edge in edges:
        target = db.query(WorkflowStage).filter(WorkflowStage.id == edge.target_stage_id).first()
        if not target: continue
        
        if target.node_type == 'decision':
            d_edges = db.query(WorkflowEdge).filter(WorkflowEdge.source_stage_id == target.id).all()
            for d_edge in d_edges:
                label = (d_edge.label or "").strip().lower()
                is_rejection = "rechaza" in label or "observa" in label or "no" in label
                
                if (act == "approve" and not is_rejection) or (act == "observe" and is_rejection):
                    d_target = db.query(WorkflowStage).filter(WorkflowStage.id == d_edge.target_stage_id).first()
                    if d_target:
                        if d_target.node_type == 'decision':
                            results.extend(evaluate_workflow_edges(db, d_target.id, "approve", project_id, visited))
                        elif d_target.node_type == 'notification':
                            results.extend(evaluate_workflow_edges(db, d_target.id, "approve", project_id, visited))
                        elif d_target.node_type in ['task', 'end']:
                            results.append(d_target.id)
        elif target.node_type == 'notification':
            try:
                from app.models.user import User
                from app.utils.enums import UserRole
                from app.services import notification_service as notification_svc
                from app.models.project import Project
                proj = db.query(Project).filter(Project.id == project_id).first()
                if proj:
                    client = db.query(User).filter(User.company_id == proj.company_id, User.role == UserRole.CLIENT).first()
                    if client:
                        notification_svc.create_notification(
                            db, client.id, "Aviso de Sistema", f"El proyecto '{proj.name}' ha alcanzado: {target.name}", link=f"/aprobaciones"
                        )
            except Exception:
                pass
            results.extend(evaluate_workflow_edges(db, target.id, "approve", project_id, visited))
        else:
            if act == "approve":
                results.append(target.id)
                
    return list(set(results))

def _unlock_dependencies(db: Session, activity: Activity, action: str, current_user: User, auto_commit: bool = True):
    """
    action: 'approve' or 'observe'
    """
    from app.models.workflow import WorkflowStage
    if not activity.current_stage_id:
        return
        
    # Get next stages based on the action
    target_stage_ids = evaluate_workflow_edges(db, activity.current_stage_id, action, activity.project_id)
    if not target_stage_ids:
        return
        
    t_stage_id = target_stage_ids[0]
    t_stage = db.query(WorkflowStage).filter(WorkflowStage.id == t_stage_id).first()
    
    if t_stage:
        prev_stage_id = activity.current_stage_id
        activity.current_stage_id = t_stage.id
        
        # Run on_exit automations for old stage
        from app.services import automation_service as auto_svc
        auto_svc.process_stage_automations(db, activity, prev_stage_id, "on_exit", current_user.id)
        
        if t_stage.node_type == 'end':
            # It's fully completed
            activity.status = ActivityStatus.APPROVED
            _add_history(db, activity.id, current_user.id, HistoryAction.STATUS_CHANGED, "Flujo de trabajo finalizado", "Aprobada", "Completada")
        else:
            # Move to next stage and reset status
            prev_status = activity.status.value
            activity.status = ActivityStatus.ASSIGNED if activity.assigned_user_id else ActivityStatus.PENDING
            _add_history(db, activity.id, current_user.id, HistoryAction.STATUS_CHANGED, f"Avanzó a la etapa {t_stage.name}", prev_status, activity.status.value)
            
            # Run on_enter automations for new stage
            auto_svc.process_stage_automations(db, activity, t_stage.id, "on_enter", current_user.id)
            
            if activity.assigned_user_id:
                try:
                    from app.services import notification_service as notification_svc
                    notification_svc.create_notification(
                        db,
                        user_id=activity.assigned_user_id,
                        title="Nueva etapa asignada",
                        message=f"La actividad '{activity.title}' ha avanzado a '{t_stage.name}'.",
                        link=f"/actividades/{activity.id}"
                    )
                except Exception:
                    pass
        if auto_commit:
            db.commit()

async def start_activity(db: Session, activity_id: int, current_user: User, bg: BackgroundTasks) -> Activity:
    """Operativo: Asignada → En Proceso"""
    activity = get_by_id(db, activity_id)
    if activity.assigned_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el responsable puede iniciar la actividad")
    if activity.status != ActivityStatus.ASSIGNED:
        raise HTTPException(status_code=400, detail=f"No se puede iniciar desde el estado '{activity.status.value}'")
    prev = activity.status.value
    activity.status = ActivityStatus.IN_PROGRESS
    _add_history(db, activity_id, current_user.id, HistoryAction.STATUS_CHANGED, "Actividad iniciada", prev, ActivityStatus.IN_PROGRESS.value)
    db.commit()
    _emit_activity_update(activity_id)
    return get_by_id(db, activity_id)


async def send_to_review(db: Session, activity_id: int, current_user: User, bg: BackgroundTasks) -> Activity:
    """Operativo: En Proceso → En Revisión"""
    activity = get_by_id(db, activity_id)
    if activity.assigned_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el responsable puede enviar a revisión")
    if activity.status != ActivityStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail=f"No se puede enviar a revisión desde el estado '{activity.status.value}'")
    prev = activity.status.value
    activity.status = ActivityStatus.IN_REVIEW
    _add_history(db, activity_id, current_user.id, HistoryAction.SENT_TO_REVIEW, "Enviada a revisión", prev, ActivityStatus.IN_REVIEW.value)
    db.commit()
    # Notificar admins por email y en la app
    admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).all()
    user_name = current_user.name
    act_title = activity.title
    for admin in admins:
        bg.add_task(
            email_utils.send_activity_sent_to_review,
            admin.email, admin.name, act_title, user_name, activity_id
        )
        try:
            notification_svc.create_notification(
                db,
                user_id=admin.id,
                title="Actividad enviada a revisión",
                message=f"El usuario {user_name} envió '{act_title}' a revisión.",
                link=f"/actividades/{activity_id}"
            )
        except Exception:
            pass
    _emit_activity_update(activity_id)
    return get_by_id(db, activity_id)


async def approve_activity(db: Session, activity_id: int, current_user: User, bg: BackgroundTasks) -> Activity:
    """Admin o Cliente: Aprobar actividad"""
    activity = get_by_id(db, activity_id)
    if current_user.role.value == "cliente" and activity.project and activity.project.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para aprobar esta actividad")
    if current_user.role.value not in ["administrador", "cliente"]:
        raise HTTPException(status_code=403, detail="Solo administradores o clientes pueden aprobar actividades")
        
    if current_user.role.value == "cliente" and activity.status != ActivityStatus.IN_REVIEW:
        raise HTTPException(status_code=400, detail=f"Los clientes solo pueden aprobar actividades 'En Revisión'")
    prev = activity.status.value
    activity.status = ActivityStatus.APPROVED
    activity.approved_by_id = current_user.id
    activity.approved_at = datetime.now(timezone.utc)
    _add_history(db, activity_id, current_user.id, HistoryAction.APPROVED, "Actividad aprobada", prev, ActivityStatus.APPROVED.value)
    
    # Check if this activity is the 'end' node
    if activity.current_stage and activity.current_stage.node_type == 'end':
        if activity.project:
            activity.project.status = "finalizado"
        
    # Desbloquear dependencias (State Machine)
    _unlock_dependencies(db, activity, "approve", current_user, auto_commit=False)
    
    # Commit único atómico
    db.commit()

    # Notificar al responsable
    if activity.assigned_user:
        bg.add_task(
            email_utils.send_activity_status_changed,
            activity.assigned_user.email, activity.assigned_user.name, activity.title, "aprobada"
        )
        try:
            notification_svc.create_notification(
                db,
                user_id=activity.assigned_user_id,
                title="Actividad aprobada",
                message=f"Tu actividad '{activity.title}' ha sido aprobada.",
                link=f"/actividades/{activity.id}"
            )
        except Exception:
            pass
        
    _emit_activity_update(activity_id)
    return get_by_id(db, activity_id)


async def observe_activity(
    db: Session, activity_id: int, current_user: User, data: ActivityStatusUpdate, bg: BackgroundTasks
) -> Activity:
    """Admin o Cliente: Observar actividad"""
    activity = get_by_id(db, activity_id)
    if current_user.role.value == "cliente" and activity.project and activity.project.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para observar esta actividad")
    if current_user.role.value not in ["administrador", "cliente"]:
        raise HTTPException(status_code=403, detail="Solo administradores o clientes pueden observar actividades")
        
    if current_user.role.value == "cliente" and activity.status != ActivityStatus.IN_REVIEW:
        raise HTTPException(status_code=400, detail=f"Los clientes solo pueden observar actividades 'En Revisión'")
    if not data.observation:
        raise HTTPException(status_code=400, detail="Debe incluir una observación al rechazar la actividad")
    prev = activity.status.value
    activity.status = ActivityStatus.OBSERVED
    _add_history(db, activity_id, current_user.id, HistoryAction.OBSERVED, data.observation, prev, ActivityStatus.OBSERVED.value)
    db.commit()
    # Notificar al responsable
    if activity.assigned_user:
        bg.add_task(
            email_utils.send_activity_status_changed,
            activity.assigned_user.email, activity.assigned_user.name, activity.title, "observada", data.observation
        )
        try:
            notification_svc.create_notification(
                db,
                user_id=activity.assigned_user_id,
                title="Actividad observada",
                message=f"Tu actividad '{activity.title}' ha sido observada: {data.observation}",
                link=f"/actividades/{activity.id}"
            )
        except Exception:
            pass
            
    # Ruta de rechazo (State Machine)
    _unlock_dependencies(db, activity, "observe", current_user)
    _emit_activity_update(activity_id)
            
    return get_by_id(db, activity_id)


async def cancel_activity(db: Session, activity_id: int, current_user: User) -> Activity:
    """Admin: cualquier estado → Cancelada"""
    activity = get_by_id(db, activity_id)
    if activity.status == ActivityStatus.APPROVED:
        raise HTTPException(status_code=400, detail="No se puede cancelar una actividad ya aprobada")
    prev = activity.status.value
    activity.status = ActivityStatus.CANCELLED
    _add_history(db, activity_id, current_user.id, HistoryAction.CANCELLED, "Actividad cancelada por administrador", prev, ActivityStatus.CANCELLED.value)
    db.commit()
    if activity.assigned_user_id:
        from app.services import notification_service as notification_svc
        try:
            notification_svc.create_notification(
                db,
                user_id=activity.assigned_user_id,
                title="Actividad cancelada",
                message=f"Tu actividad '{activity.title}' ha sido cancelada.",
                link=f"/actividades/{activity.id}"
            )
        except Exception:
            pass
    _emit_activity_update(activity_id)
    return get_by_id(db, activity_id)


def start_timer(db: Session, activity_id: int, current_user: User) -> Activity:
    activity = get_by_id(db, activity_id)
    if activity.assigned_user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo el responsable o un admin puede iniciar el cronómetro")
    if activity.status != ActivityStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="La actividad debe estar 'en proceso' para iniciar el cronómetro")
    if activity.timer_started_at is not None:
        raise HTTPException(status_code=400, detail="El cronómetro ya está en marcha")
        
    activity.timer_started_at = datetime.now(timezone.utc)
    db.commit()
    _emit_activity_update(activity_id)
    return get_by_id(db, activity_id)


def stop_timer(db: Session, activity_id: int, current_user: User) -> Activity:
    activity = get_by_id(db, activity_id)
    if activity.assigned_user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo el responsable o un admin puede detener el cronómetro")
    if activity.timer_started_at is None:
        raise HTTPException(status_code=400, detail="El cronómetro no está en marcha")
        
    elapsed = (datetime.now(timezone.utc) - activity.timer_started_at).total_seconds()
    activity.time_spent_seconds = (activity.time_spent_seconds or 0) + int(elapsed)
    activity.timer_started_at = None
    db.commit()
    _emit_activity_update(activity_id)
    return get_by_id(db, activity_id)


def delete(db: Session, activity_id: int) -> None:
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    db.delete(activity)
    db.commit()
    _emit_activity_update(activity_id)
