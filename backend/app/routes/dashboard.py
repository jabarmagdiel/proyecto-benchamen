from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.dashboard import DashboardFull
import app.services.dashboard_service as dashboard_svc

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardFull)
def get_dashboard(
    company_id: int = None,
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return dashboard_svc.get_full_dashboard(db, current_user=current_user, company_id=company_id, project_id=project_id)

