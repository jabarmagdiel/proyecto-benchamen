from sqlalchemy.orm import Session
from app.models.activity import Activity
from app.models.workflow import WorkflowAutomation
from app.services.notification_service import create_notification


def process_stage_automations(db: Session, activity: Activity, stage_id: int, event: str, triggered_by_id: int):
    """
    Evalúa y ejecuta las automatizaciones configuradas para una etapa y un evento específico.
    event: 'on_enter' | 'on_exit' | 'on_approve'
    """
    automations = db.query(WorkflowAutomation).filter(
        WorkflowAutomation.stage_id == stage_id,
        WorkflowAutomation.trigger_event == event
    ).all()

    for auto in automations:
        _execute_action(db, activity, auto, triggered_by_id)


def _execute_action(db: Session, activity: Activity, automation: WorkflowAutomation, triggered_by_id: int):
    action = automation.action_type
    
    if action == "notify_client":
        # Notificar al cliente
        client_id = activity.project.company.admin_id if hasattr(activity.project.company, 'admin_id') else None
        # Buscar usuario cliente si no hay admin directo
        if not client_id:
            from app.models.user import User
            from app.utils.enums import UserRole
            client = db.query(User).filter(User.company_id == activity.project.company_id, User.role == UserRole.CLIENTE).first()
            if client:
                client_id = client.id

        if client_id:
            msg = automation.action_payload.get("message", f"La actividad '{activity.title}' ha avanzado.") if automation.action_payload else f"La actividad '{activity.title}' ha avanzado."
            create_notification(db, client_id, "Actualización de Proyecto", msg, type="system")

    elif action == "notify_admin":
        from app.models.user import User
        from app.utils.enums import UserRole
        admins = db.query(User).filter(User.role == UserRole.ADMINISTRADOR).all()
        msg = automation.action_payload.get("message", f"Atención requerida en: '{activity.title}'") if automation.action_payload else f"Atención requerida en: '{activity.title}'"
        for adm in admins:
            create_notification(db, adm.id, "Aviso Automático", msg, type="system")

    elif action == "require_client_approval":
        # Esto normalmente marca un flag en la actividad, pero por ahora solo notificamos
        pass
