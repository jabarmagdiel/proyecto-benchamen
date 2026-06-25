from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.package_request import PackageRequest
from app.models.user import User
from app.models.package import Package
from app.schemas.package_request import PackageRequestCreate, PackageRequestUpdateStatus
from app.services.notification_service import create_notification
from app.utils.enums import UserRole

def create_request(db: Session, req: PackageRequestCreate, client_user_id: int) -> PackageRequest:
    # Verify package exists
    package = db.query(Package).filter(Package.id == req.package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    db_req = PackageRequest(
        company_id=req.company_id,
        package_id=req.package_id,
        client_user_id=client_user_id,
        notes=req.notes,
        status="pendiente"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)

    # Load relationships for return
    db_req = db.query(PackageRequest).options(
        joinedload(PackageRequest.company),
        joinedload(PackageRequest.package),
        joinedload(PackageRequest.client_user)
    ).filter(PackageRequest.id == db_req.id).first()

    # Notify all admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).all()
    client = db_req.client_user
    company_name = db_req.company.name if db_req.company else "Empresa"
    
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            title="Nueva Solicitud de Paquete",
            message=f"El cliente {client.name} ({company_name}) ha solicitado el paquete '{package.name}'.",
            link="/paquetes"
        )

    return db_req

def list_requests(db: Session, user: User) -> List[PackageRequest]:
    query = db.query(PackageRequest).options(
        joinedload(PackageRequest.company),
        joinedload(PackageRequest.package),
        joinedload(PackageRequest.client_user)
    )
    
    if user.role == UserRole.CLIENT:
        # Cliente solo ve los de su empresa
        if not user.company_id:
            return []
        query = query.filter(PackageRequest.company_id == user.company_id)
    # Admin ve todos, Operativos no deberian acceder pero si acceden ven todos o vacio (idealmente restringido en router)

    return query.order_by(PackageRequest.created_at.desc()).all()

def update_status(db: Session, request_id: int, req: PackageRequestUpdateStatus) -> PackageRequest:
    db_req = db.query(PackageRequest).options(
        joinedload(PackageRequest.package),
        joinedload(PackageRequest.company)
    ).filter(PackageRequest.id == request_id).first()
    
    if not db_req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    old_status = db_req.status
    db_req.status = req.status
    db.commit()
    db.refresh(db_req)

    # Notify client if status changed
    if old_status != req.status:
        status_msg = req.status.upper()
        create_notification(
            db=db,
            user_id=db_req.client_user_id,
            title=f"Estado de Paquete Actualizado",
            message=f"Tu solicitud del paquete '{db_req.package.name}' ha cambiado a estado: {status_msg}.",
            link="/mis-paquetes"
        )

    return db_req
