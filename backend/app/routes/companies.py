from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin, get_current_user
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
import app.services.company_service as company_svc

router = APIRouter(prefix="/api/companies", tags=["Empresas"])


@router.get("", response_model=List[CompanyResponse])
def list_companies(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Si el usuario es cliente, solo puede ver su propia empresa
    if current_user.role.value == "cliente":
        if not current_user.company_id:
            return []
        company = company_svc.get_by_id(db, current_user.company_id)
        return [company]
    return company_svc.get_all(db, search=search, skip=skip, limit=limit)


@router.post("", response_model=CompanyResponse, status_code=201)
def create_company(data: CompanyCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return company_svc.create(db, data)


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return company_svc.get_by_id(db, company_id)


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, data: CompanyUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return company_svc.update(db, company_id, data)


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    company_svc.delete(db, company_id)
