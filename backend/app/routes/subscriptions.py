from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.schemas.package import CompanyPackageResponse
import app.services.package_service as package_svc

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions (Admin)"])


class RenewPayload(BaseModel):
    days: int = 30


class AddQuotaPayload(BaseModel):
    item_name: str
    quantity: int


@router.get("", response_model=List[CompanyPackageResponse])
def list_all_subscriptions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Lista todas las suscripciones del sistema (solo admin)."""
    return package_svc.list_all_subscriptions(db)


@router.patch("/{cp_id}/renew", response_model=CompanyPackageResponse)
def renew_subscription(
    cp_id: int,
    payload: RenewPayload = RenewPayload(),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Extiende una suscripción por N días."""
    return package_svc.renew_subscription(db, cp_id=cp_id, days=payload.days)


@router.patch("/{cp_id}/cancel", response_model=CompanyPackageResponse)
def cancel_subscription(
    cp_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Cancela una suscripción."""
    return package_svc.cancel_subscription(db, cp_id=cp_id)


@router.patch("/{cp_id}/add-quota", response_model=CompanyPackageResponse)
def add_quota(
    cp_id: int,
    payload: AddQuotaPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Agrega cupos adicionales a un ítem de la suscripción."""
    return package_svc.add_quota(db, cp_id=cp_id, item_name=payload.item_name, quantity=payload.quantity)
