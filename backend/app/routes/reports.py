from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin_or_gerencia
import app.services.report_service as report_svc

router = APIRouter(prefix="/api/reports", tags=["Reportes"])


@router.get("/activities/excel")
def activities_excel(
    company_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_gerencia),
):
    return report_svc.export_activities_excel(
        db, current_user=current_user, company_id=company_id, project_id=project_id,
        status=status, date_from=date_from, date_to=date_to,
    )


@router.get("/activities/pdf")
def activities_pdf(
    company_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_gerencia),
):
    return report_svc.export_activities_pdf(
        db, current_user=current_user, company_id=company_id, project_id=project_id,
        status=status, date_from=date_from, date_to=date_to,
    )
