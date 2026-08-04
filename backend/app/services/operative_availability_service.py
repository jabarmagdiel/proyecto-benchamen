from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.operative_availability import OperativeAvailability
from app.models.user import User
from app.models.activity import Activity
from app.schemas.operative_availability import OperativeAvailabilityCreate, OperativeAvailabilitySummary
from app.utils.enums import UserRole, ActivityStatus


def create_availability(db: Session, current_user: User, data: OperativeAvailabilityCreate) -> OperativeAvailability:
    target_user_id = current_user.id

    # Si es admin y especificó un user_id, usar ese user_id
    if current_user.role == UserRole.ADMIN and data.user_id:
        target_user_id = data.user_id

    block = OperativeAvailability(
        user_id=target_user_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        is_full_day=data.is_full_day,
        status=data.status,
        reason=data.reason,
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


def get_user_availabilities(db: Session, user_id: int, target_date: Optional[date] = None) -> List[OperativeAvailability]:
    query = db.query(OperativeAvailability).filter(OperativeAvailability.user_id == user_id)
    if target_date:
        query = query.filter(OperativeAvailability.date == target_date)
    return query.order_by(OperativeAvailability.date.asc(), OperativeAvailability.start_time.asc()).all()


def delete_availability(db: Session, availability_id: int, current_user: User) -> None:
    block = db.query(OperativeAvailability).filter(OperativeAvailability.id == availability_id).first()
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bloqueo no encontrado")

    if current_user.role != UserRole.ADMIN and block.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para eliminar este bloqueo")

    db.delete(block)
    db.commit()


def get_team_availability_matrix(db: Session, target_date: date) -> List[OperativeAvailabilitySummary]:
    # Obtener todos los trabajadores activos (operativos y administradores)
    workers = db.query(User).filter(
        User.is_active == True,
        User.role.in_([UserRole.OPERATIVE, UserRole.ADMIN])
    ).all()

    # Obtener bloqueos de la fecha
    blocks = db.query(OperativeAvailability).filter(OperativeAvailability.date == target_date).all()
    blocks_by_user = {}
    for b in blocks:
        if b.user_id not in blocks_by_user:
            blocks_by_user[b.user_id] = []
        blocks_by_user[b.user_id].append(b)

    # Obtener actividades asignadas activas en esa fecha
    activities = db.query(Activity).filter(
        Activity.assigned_user_id.isnot(None),
        Activity.status.notin_([ActivityStatus.APPROVED, ActivityStatus.CANCELLED])
    ).all()

    activities_by_user = {}
    for act in activities:
        # Verificar si aplica a la fecha objetivo
        act_applies = False
        if act.start_date and act.deadline:
            if act.start_date <= target_date <= act.deadline:
                act_applies = True
        elif act.start_date and act.start_date == target_date:
            act_applies = True
        elif act.deadline and act.deadline == target_date:
            act_applies = True

        if act_applies:
            uid = act.assigned_user_id
            if uid not in activities_by_user:
                activities_by_user[uid] = []
            activities_by_user[uid].append(act)

    summaries: List[OperativeAvailabilitySummary] = []
    for worker in workers:
        user_blocks = blocks_by_user.get(worker.id, [])
        user_acts = activities_by_user.get(worker.id, [])

        if len(user_blocks) > 0:
            overall = "ocupado"
        elif len(user_acts) > 0:
            overall = "en_trabajo"
        else:
            overall = "libre"

        summaries.append(
            OperativeAvailabilitySummary(
                user_id=worker.id,
                user_name=worker.name,
                user_email=worker.email,
                user_role=worker.role.value if hasattr(worker.role, 'value') else str(worker.role),
                user_position=worker.position,
                overall_status=overall,
                busy_blocks=user_blocks,
                assigned_activities_count=len(user_acts),
                assigned_activities_titles=[a.title for a in user_acts],
            )
        )

    return summaries
