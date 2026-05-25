from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.company import Company
from app.models.project import Project
from app.schemas.company import CompanyCreate, CompanyUpdate


def get_all(db: Session, search: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[dict]:
    q = db.query(Company, func.count(Project.id).label("project_count")).outerjoin(Project, Project.company_id == Company.id)
    if search:
        q = q.filter(Company.name.ilike(f"%{search}%"))
    q = q.group_by(Company.id).offset(skip).limit(limit)
    results = []
    for company, count in q.all():
        company.project_count = count
        results.append(company)
    return results


def get_by_id(db: Session, company_id: int) -> Company:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    # Cargar conteo de proyectos
    company.project_count = db.query(func.count(Project.id)).filter(Project.company_id == company_id).scalar()
    return company


def create(db: Session, data: CompanyCreate) -> Company:
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    company.project_count = 0
    return company


def update(db: Session, company_id: int, data: CompanyUpdate) -> Company:
    company = get_by_id(db, company_id)
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(company, key, val)
    db.commit()
    db.refresh(company)
    return company


def delete(db: Session, company_id: int) -> None:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    db.delete(company)
    db.commit()
