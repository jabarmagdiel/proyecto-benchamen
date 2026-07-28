from datetime import date, timedelta
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.package import Package, CompanyPackage
from app.schemas.package import PackageCreate, PackageUpdate, CompanyPackageCreate
from app.models.user import User
from app.utils.enums import UserRole


def list_packages(db: Session, current_user: Optional[User] = None, only_active: bool = False):
    query = db.query(Package)
    # Si el usuario es cliente o se solicita solo activos, filtrar por is_active == True
    if only_active or (current_user and current_user.role == UserRole.CLIENT):
        query = query.filter(Package.is_active == True)
    return query.order_by(Package.name).all()


def create_package(db: Session, package: PackageCreate):
    db_pack = Package(**package.model_dump())
    db.add(db_pack)
    db.commit()
    db.refresh(db_pack)
    return db_pack


def update_package(db: Session, package_id: int, package: PackageUpdate):
    db_pack = db.query(Package).filter(Package.id == package_id).first()
    if not db_pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    update_data = package.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_pack, k, v)

    db.commit()
    db.refresh(db_pack)
    return db_pack


def toggle_package_visibility(db: Session, package_id: int):
    db_pack = db.query(Package).filter(Package.id == package_id).first()
    if not db_pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    db_pack.is_active = not db_pack.is_active
    db.commit()
    db.refresh(db_pack)
    return db_pack


def delete_package(db: Session, package_id: int):
    db_pack = db.query(Package).filter(Package.id == package_id).first()
    if not db_pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    db.delete(db_pack)
    db.commit()


# ─── Company Packages (Suscripciones) ─────────────────────────────────────────

def list_company_packages(db: Session, company_id: int):
    """Lista los paquetes suscritos a una empresa, verificando vencimientos mensualizados."""
    subscriptions = (
        db.query(CompanyPackage)
        .options(joinedload(CompanyPackage.package))
        .filter(CompanyPackage.company_id == company_id)
        .order_by(CompanyPackage.id.desc())
        .all()
    )

    today = date.today()
    updated = False
    for sub in subscriptions:
        if sub.end_date and sub.end_date < today and sub.status == "activo":
            sub.status = "expirado"
            updated = True

    if updated:
        db.commit()

    return subscriptions


def assign_package_to_company(db: Session, data: CompanyPackageCreate):
    """Asigna un paquete a una empresa iniciando su suscripción mensualizada y cargando los cupos iniciales."""
    package = db.query(Package).filter(Package.id == data.package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    start = date.today()
    end = start + timedelta(days=30)

    db_cp = CompanyPackage(
        company_id=data.company_id,
        package_id=data.package_id,
        quantity=data.quantity,
        discount_percentage=data.discount_percentage,
        final_price=data.final_price,
        status="activo",
        start_date=start,
        end_date=end,
        videos_remaining=package.videos_count * data.quantity,
        drone_remaining=package.drone_count * data.quantity,
        arts_remaining=package.arts_count * data.quantity,
        template_arts_remaining=package.template_arts_count * data.quantity,
        ad_management=package.ad_management,
    )
    db.add(db_cp)
    db.commit()
    db.refresh(db_cp)

    db_cp = (
        db.query(CompanyPackage)
        .options(joinedload(CompanyPackage.package))
        .filter(CompanyPackage.id == db_cp.id)
        .first()
    )
    return db_cp


def remove_package_from_company(db: Session, cp_id: int):
    db_cp = db.query(CompanyPackage).filter(CompanyPackage.id == cp_id).first()
    if not db_cp:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    db.delete(db_cp)
    db.commit()
