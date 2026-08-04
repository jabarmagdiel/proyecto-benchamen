from datetime import date, datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentBook, AppointmentResponse
from app.services import notification_service as notif_svc


def _to_response(apt: Appointment) -> AppointmentResponse:
    client_name = None
    client_email = None
    company_name = None
    if apt.client:
        client_name = apt.client.name
        client_email = apt.client.email
        if apt.client.company:
            company_name = apt.client.company.name

    return AppointmentResponse(
        id=apt.id,
        admin_id=apt.admin_id,
        client_id=apt.client_id,
        date=apt.date,
        start_time=apt.start_time,
        end_time=apt.end_time,
        status=apt.status,
        title=apt.title,
        notes=apt.notes,
        client_name=client_name,
        client_email=client_email,
        company_name=company_name,
        created_at=apt.created_at,
        updated_at=apt.updated_at,
    )


def _format_date_es(d: date) -> str:
    """Formatea una fecha como 'Martes 27 de Mayo de 2026'."""
    DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    MONTHS = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    day_name  = DAYS[d.weekday()]
    month_name = MONTHS[d.month - 1]
    return f"{day_name} {d.day} de {month_name} de {d.year}"


def _emit_appointment_update():
    try:
        from app.core.websocket import notify_realtime
        notify_realtime(entity="appointments", action="update")
    except Exception:
        pass


def _generate_hourly_slots(start_time_str: str, end_time_str: str) -> List[tuple]:
    """Convierte un rango HH:MM a HH:MM (ej 07:00 a 16:00) en intervalos individuales de 1 hora."""
    sh, sm = map(int, start_time_str.split(":"))
    eh, em = map(int, end_time_str.split(":"))
    start_minutes = sh * 60 + sm
    end_minutes = eh * 60 + em

    slots = []
    curr = start_minutes
    while curr + 60 <= end_minutes:
        s_h, s_m = divmod(curr, 60)
        e_h, e_m = divmod(curr + 60, 60)
        slots.append((f"{s_h:02d}:{s_m:02d}", f"{e_h:02d}:{e_m:02d}"))
        curr += 60

    if len(slots) == 0 and start_minutes < end_minutes:
        slots.append((start_time_str, end_time_str))

    return slots


def create_availability(db: Session, admin_id: int, data: AppointmentCreate) -> AppointmentResponse:
    # Validar que la hora de inicio sea menor a la de fin
    if data.start_time >= data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La hora de inicio debe ser anterior a la hora de fin",
        )

    # Validar traslape con otra ranura del mismo admin en la misma fecha
    overlap = db.query(Appointment).filter(
        Appointment.admin_id == admin_id,
        Appointment.date == data.date,
        Appointment.status != "cancelled",
        and_(
            Appointment.start_time < data.end_time,
            Appointment.end_time > data.start_time,
        )
    ).first()

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una ranura de disponibilidad que se traslapa en esta fecha y horario",
        )

    apt = Appointment(
        admin_id=admin_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        status="available",
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)

    _emit_appointment_update()
    return _to_response(apt)


def get_available_slots(db: Session, selected_date: Optional[date] = None) -> List[AppointmentResponse]:
    today = date.today()
    q = db.query(Appointment).filter(
        Appointment.status == "available",
        Appointment.date >= today
    )
    if selected_date:
        q = q.filter(Appointment.date == selected_date)

    slots = q.order_by(Appointment.date.asc(), Appointment.start_time.asc()).all()
    return [_to_response(s) for s in slots]


def book_slot(db: Session, appointment_id: int, client_id: int, data: AppointmentBook) -> AppointmentResponse:
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita o ranura no encontrada",
        )

    if apt.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta ranura ya no está disponible para reserva",
        )

    # Determinar horario de reserva (si el cliente eligió un sub-intervalo)
    req_start = data.start_time if data.start_time else apt.start_time
    req_end   = data.end_time if data.end_time else apt.end_time

    if req_start >= req_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La hora de inicio debe ser anterior a la hora de fin",
        )

    if req_start < apt.start_time or req_end > apt.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El horario reservado debe estar dentro del rango disponible ({apt.start_time} - {apt.end_time})",
        )

    orig_start = apt.start_time
    orig_end   = apt.end_time

    # 1. Crear residuo anterior si la reserva empieza después del inicio disponible
    if req_start > orig_start:
        before_apt = Appointment(
            admin_id=apt.admin_id,
            date=apt.date,
            start_time=orig_start,
            end_time=req_start,
            status="available",
        )
        db.add(before_apt)

    # 2. Crear residuo posterior si la reserva termina antes del fin disponible
    if req_end < orig_end:
        after_apt = Appointment(
            admin_id=apt.admin_id,
            date=apt.date,
            start_time=req_end,
            end_time=orig_end,
            status="available",
        )
        db.add(after_apt)

    # 3. Actualizar la ranura reservada con el sub-intervalo elegido por el cliente
    apt.client_id = client_id
    apt.start_time = req_start
    apt.end_time   = req_end
    apt.title = data.title
    apt.notes = data.notes
    apt.status = "booked"
    apt.updated_at = datetime.now()

    db.commit()
    db.refresh(apt)

    # ── Notificación al administrador ──────────────────────────────────────────
    # Cargar datos del cliente para el mensaje
    client = db.query(User).filter(User.id == client_id).first()
    client_display = client.name if client else "Un cliente"
    company_display = ""
    if client and client.company:
        company_display = f" ({client.company.name})"

    fecha_str = _format_date_es(apt.date)
    horario_str = f"{apt.start_time} – {apt.end_time}"

    notif_svc.create_notification(
        db=db,
        user_id=apt.admin_id,
        title=f"📅 Nueva cita reservada — {fecha_str}",
        message=(
            f"{client_display}{company_display} ha agendado una reunión contigo.\n"
            f"📌 Asunto: {data.title}\n"
            f"🕐 Horario: {horario_str}\n"
            f"{('💬 Nota: ' + data.notes) if data.notes else ''}"
        ).strip(),
        link="/agenda",
    )

    _emit_appointment_update()
    return _to_response(apt)


def get_my_appointments(db: Session, user: User) -> List[AppointmentResponse]:
    if user.role == "administrador":
        # Administrador ve todo su horario
        apts = db.query(Appointment).filter(
            Appointment.admin_id == user.id
        ).order_by(Appointment.date.desc(), Appointment.start_time.desc()).all()
    elif user.role == "cliente":
        # Cliente ve solo sus reservas
        apts = db.query(Appointment).filter(
            Appointment.client_id == user.id
        ).order_by(Appointment.date.desc(), Appointment.start_time.desc()).all()
    else:
        apts = []

    return [_to_response(a) for a in apts]


def cancel_appointment(db: Session, appointment_id: int, user: User) -> AppointmentResponse:
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada",
        )

    prev_client_id   = apt.client_id
    prev_title       = apt.title
    prev_date        = apt.date
    prev_start       = apt.start_time
    prev_end         = apt.end_time
    admin_id         = apt.admin_id

    if user.role == "administrador":
        if apt.admin_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para cancelar esta cita",
            )
        was_booked = apt.status == "booked"
        apt.status = "cancelled"

        # Notificar al cliente si había una reserva activa
        if was_booked and prev_client_id:
            fecha_str   = _format_date_es(prev_date)
            horario_str = f"{prev_start} – {prev_end}"
            notif_svc.create_notification(
                db=db,
                user_id=prev_client_id,
                title="❌ Tu cita ha sido cancelada por el administrador",
                message=(
                    f"La reunión '{prev_title or 'sin título'}' programada para el {fecha_str} "
                    f"({horario_str}) ha sido cancelada. Por favor contacta al administrador para reagendar."
                ),
                link="/agenda",
            )

    elif user.role == "cliente":
        if apt.client_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes cancelar una cita reservada por otro cliente",
            )
        # Cliente libera el slot (vuelve a disponible)
        apt.client_id = None
        apt.title = None
        apt.notes = None
        apt.status = "available"

        # Notificar al administrador que el cliente canceló
        fecha_str   = _format_date_es(prev_date)
        horario_str = f"{prev_start} – {prev_end}"
        client_display = user.name
        company_display = ""
        if hasattr(user, "company") and user.company:
            company_display = f" ({user.company.name})"

        notif_svc.create_notification(
            db=db,
            user_id=admin_id,
            title=f"🔔 Cita cancelada — {fecha_str}",
            message=(
                f"{client_display}{company_display} ha cancelado la reunión '{prev_title or 'sin título'}' "
                f"del {fecha_str} ({horario_str}). El slot ha quedado libre nuevamente."
            ),
            link="/agenda",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción",
        )

    apt.updated_at = datetime.now()
    db.commit()
    db.refresh(apt)
    _emit_appointment_update()
    return _to_response(apt)


def delete_slot(db: Session, appointment_id: int, admin_id: int) -> None:
    apt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.admin_id == admin_id
    ).first()

    if not apt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ranura no encontrada o no pertenece a tu disponibilidad",
        )

    if apt.status == "booked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar una ranura que ya ha sido reservada. Debes cancelarla primero.",
        )

    db.delete(apt)
    db.commit()
    _emit_appointment_update()
