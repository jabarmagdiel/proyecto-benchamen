import os
import uuid
from typing import List
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.evidence import Evidence
from app.models.activity_history import ActivityHistory
from app.models.activity import Activity
from app.schemas.evidence import EvidenceLinkCreate
from app.utils.enums import EvidenceType, HistoryAction
from app.core.config import settings


ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "video/mp4", "video/quicktime",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
}


def _get_activity(db: Session, activity_id: int) -> Activity:
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return activity


def get_by_activity(db: Session, activity_id: int) -> List[Evidence]:
    _get_activity(db, activity_id)
    return db.query(Evidence).filter(Evidence.activity_id == activity_id).order_by(Evidence.created_at.desc()).all()


def get_by_project(db: Session, project_id: int) -> List[Evidence]:
    return db.query(Evidence).join(Activity).filter(Activity.project_id == project_id).order_by(Evidence.created_at.desc()).all()


async def upload_file(db: Session, activity_id: int, user_id: int, file: UploadFile, note: str = None) -> Evidence:
    _get_activity(db, activity_id)
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido: {file.content_type}")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"El archivo supera el límite de {settings.MAX_FILE_SIZE_MB}MB")

    # Guardar archivo
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(activity_id))
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Determinar tipo
    ev_type = EvidenceType.IMAGE if file.content_type.startswith("image/") else EvidenceType.FILE

    evidence = Evidence(
        activity_id=activity_id,
        user_id=user_id,
        evidence_type=ev_type,
        file_url=f"/uploads/{activity_id}/{unique_name}",
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type,
        note=note,
    )
    db.add(evidence)
    db.add(ActivityHistory(
        activity_id=activity_id,
        user_id=user_id,
        action=HistoryAction.EVIDENCE_UPLOADED,
        description=f"Evidencia subida: {file.filename}",
    ))
    db.commit()
    db.refresh(evidence)
    try:
        from app.services import notification_service as notification_svc
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if activity and activity.created_by_id and activity.created_by_id != user_id:
            notification_svc.create_notification(
                db,
                user_id=activity.created_by_id,
                title="Nueva evidencia de actividad",
                message=f"El responsable subió evidencia para la actividad '{activity.title}'.",
                link=f"/actividades/{activity.id}"
            )
    except Exception:
        pass
    return evidence


def add_link(db: Session, activity_id: int, user_id: int, data: EvidenceLinkCreate) -> Evidence:
    _get_activity(db, activity_id)
    evidence = Evidence(
        activity_id=activity_id,
        user_id=user_id,
        evidence_type=data.evidence_type,
        drive_url=data.drive_url,
        note=data.note,
    )
    db.add(evidence)
    db.add(ActivityHistory(
        activity_id=activity_id,
        user_id=user_id,
        action=HistoryAction.EVIDENCE_UPLOADED,
        description=f"Link registrado: {data.drive_url}",
    ))
    db.commit()
    db.refresh(evidence)
    try:
        from app.services import notification_service as notification_svc
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if activity and activity.created_by_id and activity.created_by_id != user_id:
            notification_svc.create_notification(
                db,
                user_id=activity.created_by_id,
                title="Nueva evidencia de actividad",
                message=f"El responsable registró un link de evidencia para la actividad '{activity.title}'.",
                link=f"/actividades/{activity.id}"
            )
    except Exception:
        pass
    return evidence


def delete(db: Session, evidence_id: int, user_id: int, is_admin: bool) -> None:
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidencia no encontrada")
    if not is_admin and evidence.user_id != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta evidencia")
    # Si es archivo físico, eliminarlo
    if evidence.file_url:
        file_path = evidence.file_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)
    db.delete(evidence)
    db.commit()
