from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.utils.enums import UserRole
from app.schemas.package_request import (
    PackageRequestCreate,
    PackageRequestUpdateStatus,
    PackageRequestResponse,
    VerifyPaymentPayload,
    WorkRequestActionPayload,
)
import app.services.package_request_service as request_svc

router = APIRouter(prefix="/api/package-requests", tags=["Package Requests"])


@router.post("", response_model=PackageRequestResponse, status_code=201)
def create_request(
    req: PackageRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Solo clientes pueden enviar solicitudes")
    if current_user.company_id != req.company_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para esta empresa")

    return request_svc.create_request(db, req, current_user.id)


@router.get("", response_model=List[PackageRequestResponse])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return request_svc.list_requests(db, current_user)


@router.post("/{request_id}/verify-payment", response_model=PackageRequestResponse)
def verify_payment(
    request_id: int,
    payload: VerifyPaymentPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores pueden verificar pagos")
    return request_svc.verify_payment(db, request_id, payload)


@router.post("/{request_id}/work-action", response_model=PackageRequestResponse)
def handle_work_action(
    request_id: int,
    payload: WorkRequestActionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores pueden gestionar solicitudes de trabajo")
    return request_svc.handle_work_request(db, request_id, payload)


@router.patch("/{request_id}", response_model=PackageRequestResponse)
def update_request_status(
    request_id: int,
    req: PackageRequestUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo administradores pueden cambiar el estado")
    return request_svc.update_status(db, request_id, req)
