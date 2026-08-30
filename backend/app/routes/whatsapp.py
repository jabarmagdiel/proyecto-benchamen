import urllib.parse
import urllib.request
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.whatsapp_message import WhatsAppMessage
from app.models.whatsapp_config import WhatsAppConfig
from app.models.company import Company
from app.models.user import User
from app.schemas.whatsapp import (
    WhatsAppMessageCreate,
    WhatsAppMessageResponse,
    WhatsAppChatSummary,
    WhatsAppMessageSimulateInbound,
    WhatsAppTemplate,
    WhatsAppConfigCreate,
    WhatsAppConfigSchema,
)
from app.utils.deps import get_current_user
from app.utils.enums import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])


def check_admin(user: User):
    if user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido únicamente para Administradores de ADDONS.",
        )


# ─── Configuración de WhatsApp Corporativo ─────────────────────────────────────
@router.get("/config", response_model=WhatsAppConfigSchema | None)
def get_whatsapp_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    config = db.query(WhatsAppConfig).order_by(WhatsAppConfig.id.desc()).first()
    return config


@router.post("/config", response_model=WhatsAppConfigSchema)
def save_whatsapp_config(
    payload: WhatsAppConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    config = db.query(WhatsAppConfig).order_by(WhatsAppConfig.id.desc()).first()
    if config:
        config.company_phone = payload.company_phone
        config.phone_number_id = payload.phone_number_id
        config.waba_id = payload.waba_id
        config.access_token = payload.access_token
        if payload.verify_token:
            config.verify_token = payload.verify_token
        config.is_active = payload.is_active
    else:
        config = WhatsAppConfig(
            company_phone=payload.company_phone,
            phone_number_id=payload.phone_number_id,
            waba_id=payload.waba_id,
            access_token=payload.access_token,
            verify_token=payload.verify_token or "addons_secret_token",
            is_active=payload.is_active,
        )
        db.add(config)

    db.commit()
    db.refresh(config)
    return config


# ─── Webhook de Meta WhatsApp Cloud API ───────────────────────────────────────
@router.get("/webhook")
def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    db: Session = Depends(get_db),
):
    """Endpoint oficial de verificación exigido por Meta for Developers."""
    config = db.query(WhatsAppConfig).order_by(WhatsAppConfig.id.desc()).first()
    expected_token = config.verify_token if config else "addons_secret_token"

    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        logger.info("✅ Meta Webhook verificado exitosamente")
        return Response(content=hub_challenge, media_type="text/plain")

    raise HTTPException(status_code=403, detail="Token de verificación inválido")


@router.post("/webhook")
async def receive_meta_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Webhook en tiempo real para recibir mensajes de clientes que escriben al WhatsApp corporativo."""
    try:
        body = await request.json()
        logger.info(f"📩 Meta Webhook payload recibido: {body}")

        entry = body.get("entry", [])
        for e in entry:
            changes = e.get("changes", [])
            for c in changes:
                value = c.get("value", {})
                messages = value.get("messages", [])
                contacts = value.get("contacts", [])

                client_name = "Cliente WhatsApp"
                if contacts and len(contacts) > 0:
                    profile = contacts[0].get("profile", {})
                    client_name = profile.get("name", client_name)

                for msg in messages:
                    from_phone = msg.get("from")
                    text_obj = msg.get("text", {})
                    msg_text = text_obj.get("body", "")

                    if from_phone and msg_text:
                        formatted_phone = f"+{from_phone}"
                        # Check company match
                        company = db.query(Company).filter(Company.phone.like(f"%{from_phone}%")).first()
                        company_id = company.id if company else None

                        new_msg = WhatsAppMessage(
                            phone_number=formatted_phone,
                            client_name=client_name,
                            company_id=company_id,
                            direction="inbound",
                            message_text=msg_text,
                            status="delivered",
                        )
                        db.add(new_msg)
                        db.commit()

        return {"status": "ok"}
    except Exception as err:
        logger.error(f"❌ Error al procesar Meta Webhook: {err}")
        return {"status": "error", "detail": str(err)}


# ─── Endpoints de Chat ────────────────────────────────────────────────────────
@router.get("/chats", response_model=list[WhatsAppChatSummary])
def get_whatsapp_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    messages = (
        db.query(WhatsAppMessage)
        .order_by(WhatsAppMessage.created_at.desc())
        .all()
    )

    chats_dict = {}
    for msg in messages:
        if msg.phone_number not in chats_dict:
            comp_name = None
            if msg.company_id:
                company = db.query(Company).filter(Company.id == msg.company_id).first()
                if company:
                    comp_name = company.name

            chats_dict[msg.phone_number] = WhatsAppChatSummary(
                phone_number=msg.phone_number,
                client_name=msg.client_name,
                company_id=msg.company_id,
                company_name=comp_name,
                last_message=msg.message_text,
                last_message_time=msg.created_at,
                unread_count=1 if msg.direction == "inbound" and msg.status != "read" else 0,
                unread=True if msg.direction == "inbound" and msg.status != "read" else False,
            )

    if not chats_dict:
        companies = db.query(Company).filter(Company.phone.isnot(None)).all()
        for comp in companies:
            if comp.phone and comp.phone not in chats_dict:
                chats_dict[comp.phone] = WhatsAppChatSummary(
                    phone_number=comp.phone,
                    client_name=comp.contact_name or comp.name,
                    company_id=comp.id,
                    company_name=comp.name,
                    last_message="¡Hola! Bienvenido al canal de atención oficial de ADDONS.",
                    last_message_time=comp.created_at,
                    unread_count=0,
                    unread=False,
                )

    return list(chats_dict.values())


@router.get("/messages/{phone_number}", response_model=list[WhatsAppMessageResponse])
def get_whatsapp_messages(
    phone_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    clean_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")

    messages = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.phone_number.like(f"%{clean_phone}%"))
        .order_by(WhatsAppMessage.created_at.asc())
        .all()
    )

    for msg in messages:
        if msg.direction == "inbound" and msg.status != "read":
            msg.status = "read"
    db.commit()

    response_list = []
    for m in messages:
        encoded_text = urllib.parse.quote(m.message_text)
        wa_url = f"https://wa.me/{clean_phone}?text={encoded_text}"
        res = WhatsAppMessageResponse.model_validate(m)
        res.whatsapp_url = wa_url
        response_list.append(res)

    return response_list


@router.post("/send", response_model=WhatsAppMessageResponse)
def send_whatsapp_message(
    payload: WhatsAppMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    clean_phone = payload.phone_number.replace("+", "").replace(" ", "").replace("-", "")

    msg = WhatsAppMessage(
        phone_number=payload.phone_number,
        client_name=payload.client_name,
        company_id=payload.company_id,
        admin_id=current_user.id,
        direction="outbound",
        message_text=payload.message_text,
        media_url=payload.media_url,
        status="sent",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Si la API oficial de Meta está configurada, intentar envío por Graph API
    config = db.query(WhatsAppConfig).filter(WhatsAppConfig.is_active == True).order_by(WhatsAppConfig.id.desc()).first()
    if config and config.access_token and config.phone_number_id:
        try:
            url = f"https://graph.facebook.com/v19.0/{config.phone_number_id}/messages"
            headers = {
                "Authorization": f"Bearer {config.access_token}",
                "Content-Type": "application/json",
            }
            body_data = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "text",
                "text": {"body": payload.message_text},
            }
            req = urllib.request.Request(url, data=json.dumps(body_data).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req) as resp:
                logger.info(f"✅ Mensaje enviado vía Meta Graph API: {resp.read().decode('utf-8')}")
                msg.status = "delivered"
                db.commit()
        except Exception as err:
            logger.error(f"⚠️ Error enviando a través de Meta Graph API: {err}")

    encoded_text = urllib.parse.quote(payload.message_text)
    wa_url = f"https://wa.me/{clean_phone}?text={encoded_text}"

    res = WhatsAppMessageResponse.model_validate(msg)
    res.whatsapp_url = wa_url
    return res


@router.post("/simulate-receive", response_model=WhatsAppMessageResponse)
def simulate_whatsapp_inbound(
    payload: WhatsAppMessageSimulateInbound,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    msg = WhatsAppMessage(
        phone_number=payload.phone_number,
        client_name=payload.client_name,
        company_id=payload.company_id,
        direction="inbound",
        message_text=payload.message_text,
        status="delivered",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return WhatsAppMessageResponse.model_validate(msg)


@router.get("/templates", response_model=list[WhatsAppTemplate])
def get_whatsapp_templates(
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    return [
        WhatsAppTemplate(
            id="tpl_bienvenida",
            title="👋 Bienvenida Cliente",
            category="General",
            content="¡Hola! Te damos la bienvenida a ADDONS. Estamos dando seguimiento a tu consulta. ¿En qué podemos ayudarte hoy?",
        ),
        WhatsAppTemplate(
            id="tpl_avance",
            title="📊 Avance de Proyecto / Meta Ads",
            category="Entregas",
            content="¡Hola! Te compartimos el reporte actualizado de rendimiento de tus campañas de Meta Ads. Puedes revisarlo en tu panel privado de ADDONS.",
        ),
        WhatsAppTemplate(
            id="tpl_factura",
            title="💳 Confirmación de Pago",
            category="Finanzas",
            content="¡Hola! Hemos registrado tu pago satisfactoriamente en el sistema. Gracias por tu confianza en ADDONS.",
        ),
        WhatsAppTemplate(
            id="tpl_cita",
            title="📅 Confirmación de Cita",
            category="Agenda",
            content="¡Hola! Te recordamos nuestra reunión estratégica programada. Quedamos atentos para conectar a tiempo.",
        ),
    ]
