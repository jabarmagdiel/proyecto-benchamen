from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin, get_current_user
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
import app.services.project_service as project_svc

router = APIRouter(prefix="/api/projects", tags=["Proyectos"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    company_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role.value == "cliente":
        company_id = current_user.company_id
    return project_svc.get_all(db, company_id=company_id, status=status, search=search, skip=skip, limit=limit)


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return project_svc.create(db, data, current_user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = project_svc.get_by_id(db, project_id)
    if current_user.role.value == "cliente" and project.company_id != current_user.company_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este proyecto")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return project_svc.update(db, project_id, data, current_user.id)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    project_svc.delete(db, project_id)


@router.get("/{project_id}/evidences")
def get_project_evidences(project_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from app.schemas.evidence import EvidenceResponse
    from app.services.evidence_service import get_by_project
    project = project_svc.get_by_id(db, project_id)
    if current_user.role.value == "cliente" and project.company_id != current_user.company_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este proyecto")
    evidences = get_by_project(db, project_id)
    # Convert to schema manually or let FastAPI handle it. 
    # Return list of EvidenceResponse
    return [EvidenceResponse.model_validate(e) for e in evidences]
