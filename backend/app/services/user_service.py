from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse, UserPasswordUpdate
from app.core.security import hash_password, verify_password


def get_all(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[User]:
    q = db.query(User)
    if search:
        q = q.filter(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    return q.offset(skip).limit(limit).all()


def get_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def create(db: Session, data: UserCreate) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        position=data.position,
        company_id=data.company_id,
    )
    
    if data.department_ids:
        from app.models.department import Department
        deps = db.query(Department).filter(Department.id.in_(data.department_ids)).all()
        user.departments = deps
        
    db.add(user)
    db.commit()
    db.refresh(user)
    return user



def update(db: Session, user_id: int, data: UserUpdate) -> User:
    user = get_by_id(db, user_id)
    update_data = data.model_dump(exclude_unset=True)
    if "email" in update_data:
        existing = db.query(User).filter(User.email == update_data["email"], User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está en uso")
            
    if "department_ids" in update_data:
        dept_ids = update_data.pop("department_ids")
        if dept_ids is not None:
            from app.models.department import Department
            deps = db.query(Department).filter(Department.id.in_(dept_ids)).all()
            user.departments = deps
            
    for key, val in update_data.items():
        setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return user


def toggle_active(db: Session, user_id: int) -> User:
    user = get_by_id(db, user_id)
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user_id: int, data: UserPasswordUpdate) -> User:
    user = get_by_id(db, user_id)
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user_id: int) -> None:
    user = get_by_id(db, user_id)
    db.delete(user)
    db.commit()


def get_capacity(db: Session) -> List[dict]:
    from app.models.activity import Activity, ActivityStatus
    from datetime import datetime, timedelta, timezone
    
    # Obtener usuarios operativos y diseñadores (los que hacen tareas)
    users = db.query(User).filter(User.role.in_(["operativo", "disenador"])).all()
    
    # Calcular inicio de la semana actual
    now = datetime.now(timezone.utc)
    start_of_week = now - timedelta(days=now.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    
    results = []
    for u in users:
        # Actividades activas
        active_count = db.query(Activity).filter(
            Activity.assigned_user_id == u.id,
            Activity.status.in_([ActivityStatus.ASSIGNED, ActivityStatus.IN_PROGRESS, ActivityStatus.OBSERVED])
        ).count()
        
        # Horas trackeadas en la semana (aprox: sumamos time_spent_seconds de actividades actualizadas esta semana)
        # Una forma más precisa sería usar ActivityHistory, pero por simplicidad usaremos time_spent_seconds de las actividades del usuario
        # que hayan tenido actividad recientemente, o simplemente sumamos todo el time_spent_seconds de sus tareas.
        # Para ser precisos con la semana, podríamos filtrar actividades actualizadas >= start_of_week
        recent_activities = db.query(Activity).filter(
            Activity.assigned_user_id == u.id,
            Activity.updated_at >= start_of_week
        ).all()
        
        tracked_seconds = sum(a.time_spent_seconds for a in recent_activities if a.time_spent_seconds)
        weekly_hours = tracked_seconds / 3600.0
        
        # Determinar status
        status = "Libre"
        if active_count > 5 or weekly_hours > 35:
            status = "Sobrecargado"
        elif active_count > 0 or weekly_hours > 0:
            status = "Ocupado"
            
        results.append({
            "user_id": u.id,
            "name": u.name,
            "department_name": u.departments[0].name if u.departments else None,
            "active_activities_count": active_count,
            "weekly_tracked_hours": round(weekly_hours, 1),
            "capacity_status": status
        })
        
    return results
