from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.package import Package, PackageItem, CompanyPackage, CompanyPackageItem
from app.models.package_request import PackageRequest
from app.models.company import Company
from app.schemas.package import PackageCreate, PackageUpdate, CompanyPackageCreate
from app.models.user import User
from app.utils.enums import UserRole


def list_packages(db: Session, current_user: Optional[User] = None, category: Optional[str] = None, offering_type: Optional[str] = None):
    query = db.query(Package).options(joinedload(Package.items))

    if category:
        query = query.filter(Package.category == category)

    if offering_type:
        query = query.filter(Package.offering_type == offering_type)

    if current_user and current_user.role == UserRole.CLIENT:
        query = query.filter(Package.is_active == True)

    return query.order_by(Package.name).all()


def create_package(db: Session, package: PackageCreate):
    pack_data = package.model_dump(exclude={"items"})
    db_pack = Package(**pack_data)
    db.add(db_pack)
    db.commit()
    db.refresh(db_pack)

    if package.items:
        for item in package.items:
            db_item = PackageItem(
                package_id=db_pack.id,
                name=item.name,
                item_type=item.item_type,
                quantity=item.quantity,
            )
            db.add(db_item)
        db.commit()

    db_pack = (
        db.query(Package)
        .options(joinedload(Package.items))
        .filter(Package.id == db_pack.id)
        .first()
    )
    return db_pack


def update_package(db: Session, package_id: int, package: PackageUpdate):
    db_pack = db.query(Package).filter(Package.id == package_id).first()
    if not db_pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    update_data = package.model_dump(exclude_unset=True, exclude={"items"})
    for k, v in update_data.items():
        setattr(db_pack, k, v)

    if package.items is not None:
        db.query(PackageItem).filter(PackageItem.package_id == package_id).delete()
        for item in package.items:
            db_item = PackageItem(
                package_id=db_pack.id,
                name=item.name,
                item_type=item.item_type,
                quantity=item.quantity,
            )
            db.add(db_item)

    db.commit()

    db_pack = (
        db.query(Package)
        .options(joinedload(Package.items))
        .filter(Package.id == db_pack.id)
        .first()
    )
    return db_pack


def toggle_package_visibility(db: Session, package_id: int):
    db_pack = db.query(Package).filter(Package.id == package_id).first()
    if not db_pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    db_pack.is_active = not db_pack.is_active
    db.commit()

    db_pack = (
        db.query(Package)
        .options(joinedload(Package.items))
        .filter(Package.id == db_pack.id)
        .first()
    )
    return db_pack


def delete_package(db: Session, package_id: int):
    db_pack = db.query(Package).filter(Package.id == package_id).first()
    if not db_pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    db.delete(db_pack)
    db.commit()


# ─── Company Packages (Suscripciones) ─────────────────────────────────────────

def list_company_packages(db: Session, company_id: int):
    """Lista los paquetes suscritos a una empresa con sus ítems de consumo del mes."""
    subscriptions = (
        db.query(CompanyPackage)
        .options(
            joinedload(CompanyPackage.package).joinedload(Package.items),
            joinedload(CompanyPackage.items)
        )
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
    """Asigna un paquete a una empresa iniciando su suscripción mensualizada e instanciando sus ítems."""
    package = (
        db.query(Package)
        .options(joinedload(Package.items))
        .filter(Package.id == data.package_id)
        .first()
    )
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
    )
    db.add(db_cp)
    db.commit()
    db.refresh(db_cp)

    for p_item in package.items:
        cp_item = CompanyPackageItem(
            company_package_id=db_cp.id,
            package_item_id=p_item.id,
            name=p_item.name,
            item_type=p_item.item_type,
            quantity_initial=p_item.quantity * data.quantity,
            quantity_remaining=p_item.quantity * data.quantity,
        )
        db.add(cp_item)

    db.commit()

    db_cp = (
        db.query(CompanyPackage)
        .options(
            joinedload(CompanyPackage.package).joinedload(Package.items),
            joinedload(CompanyPackage.items)
        )
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


# ─── Admin: Gestión global de suscripciones ───────────────────────────────────

def list_all_subscriptions(db: Session) -> List[CompanyPackage]:
    """Lista TODAS las suscripciones del sistema con datos de empresa y paquete (solo admin)."""
    today = date.today()

    subs = (
        db.query(CompanyPackage)
        .options(
            joinedload(CompanyPackage.company),
            joinedload(CompanyPackage.package).joinedload(Package.items),
            joinedload(CompanyPackage.items),
        )
        .order_by(CompanyPackage.id.desc())
        .all()
    )

    # Auto-expirar suscripciones vencidas
    updated = False
    for sub in subs:
        if sub.end_date and sub.end_date < today and sub.status == "activo":
            sub.status = "expirado"
            updated = True

    if updated:
        db.commit()

    return subs


def renew_subscription(db: Session, cp_id: int, days: int = 30) -> CompanyPackage:
    """Extiende la suscripción por N días desde la fecha de fin actual (o hoy si ya expiró)."""
    sub = (
        db.query(CompanyPackage)
        .options(
            joinedload(CompanyPackage.company),
            joinedload(CompanyPackage.package).joinedload(Package.items),
            joinedload(CompanyPackage.items),
        )
        .filter(CompanyPackage.id == cp_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")

    today = date.today()
    base = sub.end_date if (sub.end_date and sub.end_date >= today) else today
    sub.end_date = base + timedelta(days=days)
    sub.status = "activo"
    db.commit()
    db.refresh(sub)
    return sub


def cancel_subscription(db: Session, cp_id: int) -> CompanyPackage:
    """Cancela una suscripción activa."""
    sub = db.query(CompanyPackage).filter(CompanyPackage.id == cp_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    sub.status = "cancelado"
    db.commit()
    db.refresh(sub)
    return sub


def add_quota(db: Session, cp_id: int, item_name: str, quantity: int) -> CompanyPackage:
    """Agrega cupos adicionales a un ítem específico de la suscripción."""
    sub = (
        db.query(CompanyPackage)
        .options(joinedload(CompanyPackage.items))
        .filter(CompanyPackage.id == cp_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")

    found = False
    for item in sub.items:
        if item.name.lower() == item_name.lower() and item.item_type == "por_cantidad":
            item.quantity_remaining += quantity
            item.quantity_initial += quantity
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail=f"Ítem '{item_name}' no encontrado en esta suscripción")

    db.commit()
    db.refresh(sub)
    return sub
