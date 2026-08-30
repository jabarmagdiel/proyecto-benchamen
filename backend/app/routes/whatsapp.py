import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.whatsapp_message import WhatsAppMessage
from app.models.company import Company
from app.models.user import User
from app.schemas.whatsapp import (
    WhatsAppMessageCreate,
    WhatsAppMessageResponse,
    WhatsAppChatSummary,
    WhatsAppMessageSimulateInbound,
    WhatsAppTemplate,
)
from app.utils.deps import get_current_user
from app.utils.enums import UserRole

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])


def check_admin(user: User):
    if user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido únicamente para Administradores de ADDONS.",
        )


@router.get("/chats", response_model=list[WhatsAppChatSummary])
def get_whatsapp_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)

    # Fetch unique phone numbers and latest message per phone
    messages = (
        db.query(WhatsAppMessage)
        .order_by(WhatsAppMessage.created_at.desc())
        .all()
    )

    # Group by phone number
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

    # Seed default chats from registered companies if empty
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

    # Clean phone query
    clean_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")

    messages = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.phone_number.like(f"%{clean_phone}%"))
        .order_by(WhatsAppMessage.created_at.asc())
        .all()
    )

    # Mark inbound as read
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
            content="¡Hola! Te damos la bienvenida a ADDONS. Estamos dando seguimiento a tu proyecto. ¿En qué podemos ayudarte hoy?",
        ),
        WhatsAppTemplate(
            id="tpl_avance",
            title="📊 Avance de Proyecto / Pauta",
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
