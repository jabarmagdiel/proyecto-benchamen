from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.package import Package, CompanyPackage
from app.schemas.package import PackageCreate, PackageUpdate, CompanyPackageCreate


def list_packages(db: Session):
    return db.query(Package).order_by(Package.name).all()


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


def delete_package(db: Session, package_id: int):
    db_pack = db.query(Package).filter(Package.id == package_id).first()
    if not db_pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    db.delete(db_pack)
    db.commit()


# ─── Company Packages ─────────────────────────────────────────────────────────

def list_company_packages(db: Session, company_id: int):
    """Lista los paquetes asignados a una empresa, con datos del paquete incluidos."""
    return (
        db.query(CompanyPackage)
        .options(joinedload(CompanyPackage.package))
        .filter(CompanyPackage.company_id == company_id)
        .order_by(CompanyPackage.id)
        .all()
    )


def assign_package_to_company(db: Session, data: CompanyPackageCreate):
    """Asigna un paquete a una empresa y retorna el registro con los datos del paquete."""
    # Verificar que el paquete existe
    package = db.query(Package).filter(Package.id == data.package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    db_cp = CompanyPackage(**data.model_dump())
    db.add(db_cp)
    db.commit()
    db.refresh(db_cp)

    # Cargar la relación explícitamente para la respuesta
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
        raise HTTPException(status_code=404, detail="Paquete de empresa no encontrado")
    db.delete(db_cp)
    db.commit()
