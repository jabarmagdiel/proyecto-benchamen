from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.schemas.package import PackageCreate, PackageUpdate, PackageResponse, CompanyPackageCreate, CompanyPackageResponse
import app.services.package_service as package_svc

router = APIRouter(prefix="/api/packages", tags=["Packages"])


# ─── Catálogo de paquetes ─────────────────────────────────────────────────────

@router.get("", response_model=List[PackageResponse])
def get_packages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return package_svc.list_packages(db, current_user=current_user)


@router.post("", response_model=PackageResponse, status_code=201)
def create_package(
    data: PackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return package_svc.create_package(db, data)


# ─── Company packages (DEBEN IR ANTES DE /{package_id}) ─────────────────────

@router.get("/company/{company_id}", response_model=List[CompanyPackageResponse])
def get_company_packages(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return package_svc.list_company_packages(db, company_id)


@router.post("/company", response_model=CompanyPackageResponse, status_code=201)
def assign_package(
    data: CompanyPackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return package_svc.assign_package_to_company(db, data)


@router.delete("/company/{cp_id}", status_code=204)
def remove_package(
    cp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    package_svc.remove_package_from_company(db, cp_id)


# ─── CRUD individual (DEBEN IR DESPUÉS de /company/*) ────────────────────────

@router.patch("/{package_id}/toggle-visibility", response_model=PackageResponse)
def toggle_package_visibility(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return package_svc.toggle_package_visibility(db, package_id)


@router.put("/{package_id}", response_model=PackageResponse)
def update_package(
    package_id: int,
    data: PackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return package_svc.update_package(db, package_id, data)


@router.delete("/{package_id}", status_code=204)
def delete_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    package_svc.delete_package(db, package_id)
