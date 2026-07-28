from typing import List, Optional
from datetime import date, timedelta
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.package_request import PackageRequest
from app.models.company import Company
from app.models.package import Package, CompanyPackage
from app.models.user import User
from app.schemas.package_request import PackageRequestCreate, PackageRequestUpdateStatus, VerifyPaymentPayload, WorkRequestActionPayload
from app.services.notification_service import create_notification
from app.utils.enums import UserRole


def create_request(db: Session, req: PackageRequestCreate, client_user_id: int) -> PackageRequest:
    # Verificar que el paquete existe
    package = db.query(Package).filter(Package.id == req.package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    db_req = PackageRequest(
        company_id=req.company_id,
        package_id=req.package_id,
        client_user_id=client_user_id,
        request_type=req.request_type,
        deliverable_type=req.deliverable_type,
        quantity_requested=req.quantity_requested,
        payment_method=req.payment_method,
        payment_reference=req.payment_reference,
        title=req.title,
        notes=req.notes,
        status="pendiente",
        payment_status="pendiente_verificacion" if req.request_type == "subscription_payment" else "pago_verificado"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)

    # Cargar relaciones
    db_req = db.query(PackageRequest).options(
        joinedload(PackageRequest.company),
        joinedload(PackageRequest.package),
        joinedload(PackageRequest.client_user)
    ).filter(PackageRequest.id == db_req.id).first()

    # Notificar a administradores
    admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).all()
    client = db_req.client_user
    company_name = db_req.company.name if db_req.company else "Empresa"

    notif_title = "💳 Nuevo Pago de Suscripción" if req.request_type == "subscription_payment" else "📌 Nueva Solicitud de Entregable"
    notif_msg = f"El cliente {client.name} ({company_name}) ha enviado una solicitud para '{package.name}'."

    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            title=notif_title,
            message=notif_msg,
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
        if not user.company_id:
            return []
        query = query.filter(PackageRequest.company_id == user.company_id)

    return query.order_by(PackageRequest.created_at.desc()).all()


def verify_payment(db: Session, request_id: int, payload: VerifyPaymentPayload) -> PackageRequest:
    db_req = db.query(PackageRequest).options(
        joinedload(PackageRequest.package),
        joinedload(PackageRequest.company)
    ).filter(PackageRequest.id == request_id).first()

    if not db_req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if payload.payment_status == "pago_verificado":
        db_req.payment_status = "pago_verificado"
        db_req.status = "aceptada"

        # Activar suscripción en la empresa del cliente
        package = db_req.package
        if package:
            start = date.today()
            end = start + timedelta(days=30)
            db_cp = CompanyPackage(
                company_id=db_req.company_id,
                package_id=db_req.package_id,
                quantity=1,
                discount_percentage=0,
                final_price=package.base_price,
                status="activo",
                start_date=start,
                end_date=end,
                videos_remaining=package.videos_count,
                drone_remaining=package.drone_count,
                arts_remaining=package.arts_count,
                template_arts_remaining=package.template_arts_count,
                ad_management=package.ad_management,
            )
            db.add(db_cp)

        create_notification(
            db=db,
            user_id=db_req.client_user_id,
            title="✅ Pago Verificado y Suscripción Activada",
            message=f"Tu pago para el paquete '{package.name if package else ''}' ha sido verificado correctamente. ¡Tus cupos del mes están disponibles!",
            link="/paquetes"
        )
    else:
        db_req.payment_status = "rechazado"
        db_req.status = "rechazada"

        create_notification(
            db=db,
            user_id=db_req.client_user_id,
            title="❌ Comprobante de Pago Rechazado",
            message=f"El comprobante de pago para '{db_req.package.name if db_req.package else ''}' ha sido rechazado. Por favor contacta al administrador.",
            link="/paquetes"
        )

    db.commit()
    db.refresh(db_req)
    return db_req


def handle_work_request(db: Session, request_id: int, payload: WorkRequestActionPayload) -> PackageRequest:
    db_req = db.query(PackageRequest).options(
        joinedload(PackageRequest.package),
        joinedload(PackageRequest.company)
    ).filter(PackageRequest.id == request_id).first()

    if not db_req:
        raise HTTPException(status_code=404, detail="Solicitud de trabajo no encontrada")

    if payload.action == "approve":
        db_req.status = "aceptada"

        # Descontar -1 del cupo del cliente en su suscripción activa
        subscription = (
            db.query(CompanyPackage)
            .filter(
                CompanyPackage.company_id == db_req.company_id,
                CompanyPackage.status == "activo"
            )
            .order_by(CompanyPackage.id.desc())
            .first()
        )

        if subscription:
            dtype = db_req.deliverable_type
            qty = db_req.quantity_requested or 1
            if dtype == "video" and subscription.videos_remaining >= qty:
                subscription.videos_remaining -= qty
            elif dtype == "drone" and subscription.drone_remaining >= qty:
                subscription.drone_remaining -= qty
            elif dtype == "art" and subscription.arts_remaining >= qty:
                subscription.arts_remaining -= qty
            elif dtype == "template_art" and subscription.template_arts_remaining >= qty:
                subscription.template_arts_remaining -= qty

        create_notification(
            db=db,
            user_id=db_req.client_user_id,
            title="✅ Solicitud de Trabajo Aprobada",
            message=f"Tu solicitud '{db_req.title or db_req.deliverable_type}' ha sido aprobada y el cupo se ha descontado de tu suscripción.",
            link="/paquetes"
        )
    else:
        db_req.status = "rechazada"
        create_notification(
            db=db,
            user_id=db_req.client_user_id,
            title="❌ Solicitud de Trabajo Rechazada",
            message=f"Tu solicitud '{db_req.title or db_req.deliverable_type}' no pudo ser procesada.",
            link="/paquetes"
        )

    db.commit()
    db.refresh(db_req)
    return db_req


def update_status(db: Session, request_id: int, req: PackageRequestUpdateStatus) -> PackageRequest:
    db_req = db.query(PackageRequest).options(
        joinedload(PackageRequest.package),
        joinedload(PackageRequest.company)
    ).filter(PackageRequest.id == request_id).first()

    if not db_req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    db_req.status = req.status
    db.commit()
    db.refresh(db_req)
    return db_req
