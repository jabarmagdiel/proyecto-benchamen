import logging
from typing import List, Optional

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Configuración FastMail ───────────────────────────────────────────────────
mail_from = settings.MAIL_FROM if settings.MAIL_FROM else "noreply@example.com"
mail_username = settings.MAIL_USERNAME if settings.MAIL_USERNAME else "noreply"

conf = ConnectionConfig(
    MAIL_USERNAME=mail_username,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=mail_from,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_TLS,
    MAIL_SSL_TLS=settings.MAIL_SSL,
    USE_CREDENTIALS=True if settings.MAIL_USERNAME else False,
    VALIDATE_CERTS=True,
)

fast_mail = FastMail(conf)


async def send_email(
    to: List[str],
    subject: str,
    body: str,
) -> bool:
    """Envía un correo HTML. Retorna True si fue exitoso."""
    if not settings.MAIL_USERNAME:
        logger.warning("Email no configurado. Omitiendo envío.")
        return False
    try:
        message = MessageSchema(
            subject=subject,
            recipients=to,
            body=body,
            subtype=MessageType.html,
        )
        await fast_mail.send_message(message)
        return True
    except Exception as e:
        logger.error(f"Error enviando email: {e}")
        return False


# ─── Templates de email ───────────────────────────────────────────────────────

def _base_template(title: str, content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }}
        .container {{ background: white; border-radius: 8px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 30px; color: white; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; }}
        .body {{ padding: 30px; color: #374151; line-height: 1.6; }}
        .badge {{ display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }}
        .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }}
        .btn {{ display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 {title}</h1>
          <p style="margin:8px 0 0 0; opacity:0.85;">Marketing Project Manager</p>
        </div>
        <div class="body">{content}</div>
        <div class="footer">© 2024 Marketing Project Manager · Este correo fue generado automáticamente.</div>
      </div>
    </body>
    </html>
    """


async def send_activity_assigned(user_email: str, user_name: str, activity_title: str, project_name: str, deadline: str):
    content = f"""
    <p>Hola <strong>{user_name}</strong>,</p>
    <p>Se te ha asignado una nueva actividad en el sistema:</p>
    <table style="width:100%; border-collapse:collapse; margin-top:16px;">
      <tr><td style="padding:8px; background:#f3f4f6; font-weight:bold;">Actividad</td><td style="padding:8px;">{activity_title}</td></tr>
      <tr><td style="padding:8px; background:#f3f4f6; font-weight:bold;">Proyecto</td><td style="padding:8px;">{project_name}</td></tr>
      <tr><td style="padding:8px; background:#f3f4f6; font-weight:bold;">Fecha límite</td><td style="padding:8px;">{deadline}</td></tr>
    </table>
    <p>Ingresa al sistema para ver los detalles y comenzar a trabajar.</p>
    <a href="{settings.FRONTEND_URL}/mis-actividades" class="btn">Ver mis actividades →</a>
    """
    await send_email(
        to=[user_email],
        subject=f"📋 Nueva actividad asignada: {activity_title}",
        body=_base_template("Nueva actividad asignada", content),
    )


async def send_activity_status_changed(
    user_email: str, user_name: str, activity_title: str, new_status: str, observation: Optional[str] = None
):
    obs_html = f"<p><strong>Observación:</strong> {observation}</p>" if observation else ""
    status_colors = {
        "aprobada": "#22c55e",
        "observada": "#f59e0b",
        "cancelada": "#ef4444",
        "en_revision": "#3b82f6",
    }
    color = status_colors.get(new_status, "#6b7280")
    content = f"""
    <p>Hola <strong>{user_name}</strong>,</p>
    <p>El estado de tu actividad ha cambiado:</p>
    <table style="width:100%; border-collapse:collapse; margin-top:16px;">
      <tr><td style="padding:8px; background:#f3f4f6; font-weight:bold;">Actividad</td><td style="padding:8px;">{activity_title}</td></tr>
      <tr><td style="padding:8px; background:#f3f4f6; font-weight:bold;">Nuevo estado</td>
          <td style="padding:8px;"><span class="badge" style="background:{color}20; color:{color};">● {new_status.replace('_',' ').title()}</span></td></tr>
    </table>
    {obs_html}
    <a href="{settings.FRONTEND_URL}/mis-actividades" class="btn">Ver actividad →</a>
    """
    await send_email(
        to=[user_email],
        subject=f"🔔 Cambio de estado: {activity_title}",
        body=_base_template("Actualización de actividad", content),
    )


async def send_activity_sent_to_review(
    admin_email: str, admin_name: str, activity_title: str, user_name: str, activity_id: int
):
    content = f"""
    <p>Hola <strong>{admin_name}</strong>,</p>
    <p><strong>{user_name}</strong> ha enviado una actividad a revisión:</p>
    <table style="width:100%; border-collapse:collapse; margin-top:16px;">
      <tr><td style="padding:8px; background:#f3f4f6; font-weight:bold;">Actividad</td><td style="padding:8px;">{activity_title}</td></tr>
      <tr><td style="padding:8px; background:#f3f4f6; font-weight:bold;">Enviado por</td><td style="padding:8px;">{user_name}</td></tr>
    </table>
    <p>Ingresa al sistema para revisar las evidencias y aprobar o hacer observaciones.</p>
    <a href="{settings.FRONTEND_URL}/actividades/{activity_id}" class="btn">Revisar actividad →</a>
    """
    await send_email(
        to=[admin_email],
        subject=f"👀 Actividad en revisión: {activity_title}",
        body=_base_template("Actividad lista para revisión", content),
    )
