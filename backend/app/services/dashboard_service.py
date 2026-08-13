from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.activity import Activity
from app.models.project import Project
from app.models.company import Company
from app.models.user import User
from app.schemas.dashboard import DashboardStats, StatusCount, UserActivityCount, LateActivity, DashboardFull
from app.utils.enums import ActivityStatus, ProjectStatus


def get_full_dashboard(
    db: Session,
    current_user: User,
    company_id: Optional[int] = None,
    project_id: Optional[int] = None
) -> DashboardFull:
    today = date.today()
    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    # 1. Seguridad: Si el usuario es de tipo cliente, forzar su company_id y validar proyecto
    if role_val == "cliente":
        company_id = current_user.company_id
        if project_id:
            # Validar que el proyecto pertenezca a la empresa del cliente
            proj = db.query(Project).filter(Project.id == project_id, Project.company_id == company_id).first()
            if not proj:
                project_id = None

    # 2. Consultas Generales de Contadores (con Filtros)
    # Total de Empresas
    if role_val == "cliente" or company_id:
        c_id = company_id if company_id else current_user.company_id
        total_companies = db.query(func.count(Company.id)).filter(Company.id == c_id).scalar() or 0
    elif project_id:
        proj = db.query(Project).filter(Project.id == project_id).first()
        total_companies = 1 if proj else 0
    else:
        total_companies = db.query(func.count(Company.id)).scalar() or 0

    # Total de Proyectos
    proj_q = db.query(func.count(Project.id))
    if role_val == "operativo":
        # Proyectos asignados al operativo a través de sus actividades
        proj_q = proj_q.join(Activity, Activity.project_id == Project.id).filter(Activity.assigned_user_id == current_user.id)
    
    if project_id:
        proj_q = proj_q.filter(Project.id == project_id)
    elif company_id:
        proj_q = proj_q.filter(Project.company_id == company_id)
        
    total_projects = proj_q.distinct().scalar() or 0

    # Proyectos Activos
    act_proj_q = db.query(func.count(Project.id)).filter(Project.status == ProjectStatus.IN_PROGRESS)
    if role_val == "operativo":
        act_proj_q = act_proj_q.join(Activity, Activity.project_id == Project.id).filter(Activity.assigned_user_id == current_user.id)
        
    if project_id:
        act_proj_q = act_proj_q.filter(Project.id == project_id)
    elif company_id:
        act_proj_q = act_proj_q.filter(Project.company_id == company_id)
        
    active_projects = act_proj_q.distinct().scalar() or 0

    # 3. Distribución de Actividades por Estado (1 sola consulta SQL agrupada)
    status_q = db.query(Activity.status, func.count(Activity.id))
    if role_val == "operativo":
        status_q = status_q.filter(Activity.assigned_user_id == current_user.id)
    if project_id:
        status_q = status_q.filter(Activity.project_id == project_id)
    elif company_id:
        status_q = status_q.join(Project, Project.id == Activity.project_id).filter(Project.company_id == company_id)

    status_rows = status_q.group_by(Activity.status).all()
    status_counts = { (st.value if hasattr(st, "value") else str(st)): cnt for st, cnt in status_rows }

    # 4. Total Actividades Demoradas (Contador)
    late_q = db.query(func.count(Activity.id)).filter(
        Activity.deadline < today,
        Activity.status.not_in([ActivityStatus.APPROVED, ActivityStatus.CANCELLED])
    )
    if role_val == "operativo":
        late_q = late_q.filter(Activity.assigned_user_id == current_user.id)
        
    if project_id:
        late_q = late_q.filter(Activity.project_id == project_id)
    elif company_id:
        late_q = late_q.join(Project, Project.id == Activity.project_id).filter(Project.company_id == company_id)
        
    late = late_q.scalar() or 0

    # 5. Carga de Trabajo (Gráfico de Barras)
    if role_val == "administrador":
        # Administrador ve carga agrupada por usuario operativo (Top 10)
        user_q = (
            db.query(User.id, User.name, func.count(Activity.id).label("count"))
            .join(Activity, Activity.assigned_user_id == User.id)
        )
        if project_id:
            user_q = user_q.filter(Activity.project_id == project_id)
        elif company_id:
            user_q = user_q.join(Project, Project.id == Activity.project_id).filter(Project.company_id == company_id)
            
        user_counts = (
            user_q.group_by(User.id, User.name)
            .order_by(func.count(Activity.id).desc())
            .limit(10)
            .all()
        )
        activity_by_user = [UserActivityCount(user_id=uid, user_name=name, count=cnt) for uid, name, cnt in user_counts]
    else:
        # Operativo y Cliente ven carga agrupada por PROYECTO
        proj_group_q = db.query(Project.id, Project.name, func.count(Activity.id).label("count")).join(Activity, Activity.project_id == Project.id)
        if role_val == "operativo":
            proj_group_q = proj_group_q.filter(Activity.assigned_user_id == current_user.id)
        elif role_val == "cliente":
            proj_group_q = proj_group_q.filter(Project.company_id == company_id)
            
        if project_id:
            proj_group_q = proj_group_q.filter(Project.id == project_id)
        elif company_id and role_val == "operativo":
            proj_group_q = proj_group_q.filter(Project.company_id == company_id)
            
        proj_counts = (
            proj_group_q.group_by(Project.id, Project.name)
            .order_by(func.count(Activity.id).desc())
            .limit(10)
            .all()
        )
        activity_by_user = [UserActivityCount(user_id=pid, user_name=name, count=cnt) for pid, name, cnt in proj_counts]

    # 6. Listado de Entregas Atrasadas (Máx 20)
    late_list_q = (
        db.query(Activity, User.name, Project.name.label("pname"), Company.name.label("cname"))
        .outerjoin(User, User.id == Activity.assigned_user_id)
        .join(Project, Project.id == Activity.project_id)
        .join(Company, Company.id == Project.company_id)
        .filter(
            Activity.deadline < today,
            Activity.status.not_in([ActivityStatus.APPROVED, ActivityStatus.CANCELLED])
        )
    )
    if role_val == "operativo":
        late_list_q = late_list_q.filter(Activity.assigned_user_id == current_user.id)
    elif role_val == "cliente":
        late_list_q = late_list_q.filter(Project.company_id == company_id)
        
    if project_id:
        late_list_q = late_list_q.filter(Activity.project_id == project_id)
    elif company_id and role_val != "cliente":
        late_list_q = late_list_q.filter(Project.company_id == company_id)
        
    late_activities_rows = (
        late_list_q.order_by(Activity.deadline.asc())
        .limit(20)
        .all()
    )
    
    late_list = []
    for act, uname, pname, cname in late_activities_rows:
        days = (today - act.deadline).days if act.deadline else 0
        late_list.append(LateActivity(
            id=act.id,
            title=act.title,
            deadline=str(act.deadline),
            status=act.status.value,
            assigned_user_name=uname or "Sin asignar",
            project_name=pname,
            company_name=cname,
            days_late=days,
        ))

    stats = DashboardStats(
        total_companies=total_companies,
        total_projects=total_projects,
        active_projects=active_projects,
        pending_activities=status_counts.get("pendiente", 0),
        in_progress_activities=status_counts.get("en_proceso", 0),
        in_review_activities=status_counts.get("en_revision", 0),
        observed_activities=status_counts.get("observada", 0),
        approved_activities=status_counts.get("aprobada", 0),
        cancelled_activities=status_counts.get("cancelada", 0),
        late_activities=late,
    )

    activity_by_status = [
        StatusCount(status=st.value, count=status_counts.get(st.value, 0))
        for st in ActivityStatus
    ]

    return DashboardFull(
        stats=stats,
        activity_by_status=activity_by_status,
        activity_by_user=activity_by_user,
        late_activities=late_list,
    )
