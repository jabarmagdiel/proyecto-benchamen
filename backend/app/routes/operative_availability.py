from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.operative_availability import (
    OperativeAvailabilityCreate,
    OperativeAvailabilityResponse,
    OperativeAvailabilitySummary,
)
import app.services.operative_availability_service as service

router = APIRouter(prefix="/api/operative-availability", tags=["Disponibilidad Operativos"])


@router.post("", response_model=OperativeAvailabilityResponse, status_code=status.HTTP_201_CREATED)
def create_availability(
    data: OperativeAvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_availability(db, current_user=current_user, data=data)


@router.get("/my", response_model=List[OperativeAvailabilityResponse])
def get_my_availabilities(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_user_availabilities(db, user_id=current_user.id, target_date=target_date)


@router.get("/team", response_model=List[OperativeAvailabilitySummary])
def get_team_matrix(
    target_date: date,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return service.get_team_availability_matrix(db, target_date=target_date)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_availability(db, availability_id=id, current_user=current_user)
    return None
