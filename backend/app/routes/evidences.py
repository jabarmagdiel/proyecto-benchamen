from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.evidence import EvidenceLinkCreate, EvidenceResponse
from app.utils.enums import UserRole
import app.services.evidence_service as evidence_svc

router = APIRouter(tags=["Evidencias"])


@router.get("/api/activities/{activity_id}/evidences", response_model=List[EvidenceResponse])
def list_evidences(activity_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from app.services import activity_service as activity_svc
    from fastapi import HTTPException
    activity = activity_svc.get_by_id(db, activity_id)
    if current_user.role.value == "cliente" and activity.project and activity.project.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver las evidencias de esta actividad")
    return evidence_svc.get_by_activity(db, activity_id)


@router.post("/api/activities/{activity_id}/evidences/upload", response_model=EvidenceResponse, status_code=201)
async def upload_evidence(
    activity_id: int,
    file: UploadFile = File(...),
    note: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await evidence_svc.upload_file(db, activity_id, current_user.id, file, note)


@router.post("/api/activities/{activity_id}/evidences/link", response_model=EvidenceResponse, status_code=201)
def add_drive_link(
    activity_id: int,
    data: EvidenceLinkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return evidence_svc.add_link(db, activity_id, current_user.id, data)


@router.delete("/api/evidences/{evidence_id}", status_code=204)
def delete_evidence(evidence_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    is_admin = current_user.role == UserRole.ADMIN
    evidence_svc.delete(db, evidence_id, current_user.id, is_admin)
