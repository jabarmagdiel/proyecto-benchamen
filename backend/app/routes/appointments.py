from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.appointment import AppointmentCreate, AppointmentBook, AppointmentResponse, MeetingCreate
import app.services.appointment_service as appointment_svc

router = APIRouter(prefix="/api/appointments", tags=["Agenda"])


@router.post("/meeting", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value not in ["administrador", "gerencia"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores o gerencia pueden solicitar/programar reuniones"
        )
    return appointment_svc.create_meeting(db, admin=current_user, data=data)


@router.post("/availability", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_availability(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el administrador puede publicar disponibilidad"
        )
    return appointment_svc.create_availability(db, admin_id=current_user.id, data=data)


@router.get("/availability", response_model=List[AppointmentResponse])
def get_available_slots(
    selected_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return appointment_svc.get_available_slots(db, selected_date=selected_date)


@router.patch("/{id}/book", response_model=AppointmentResponse)
def book_appointment(
    id: int,
    data: AppointmentBook,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los clientes pueden reservar citas"
        )
    return appointment_svc.book_slot(db, appointment_id=id, client_id=current_user.id, data=data)


@router.get("/my", response_model=List[AppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return appointment_svc.get_my_appointments(db, user=current_user)


@router.patch("/{id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return appointment_svc.cancel_appointment(db, appointment_id=id, user=current_user)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el administrador puede eliminar slots de disponibilidad"
        )
    appointment_svc.delete_slot(db, appointment_id=id, admin_id=current_user.id)
    return None
