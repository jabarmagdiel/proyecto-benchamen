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
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp", "image/x-png", "image/pjpeg", "image/heic", "image/avif", "image/tiff",
    "application/pdf",
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip", "application/x-zip-compressed", "application/x-rar-compressed", "application/octet-stream"
}

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".ico", ".heic", ".avif",
    ".pdf", ".mp4", ".mov", ".avi", ".webm", ".doc", ".docx", ".xls", ".xlsx", ".zip", ".rar", ".7z", ".txt"
}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp", ".heic", ".avif", ".ico"}


def _cloudinary_enabled() -> bool:
    return bool(
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    )


async def _upload_to_cloudinary(content: bytes, filename: str, activity_id: int) -> dict:
    """Upload file to Cloudinary and return url + public_id."""
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

    ext = os.path.splitext(filename or "")[1].lower()
    public_id = f"benchamen/actividades/{activity_id}/{uuid.uuid4().hex}"
    resource_type = "image" if ext in IMAGE_EXTENSIONS else ("video" if ext in {".mp4", ".mov", ".avi", ".webm"} else "raw")

    result = cloudinary.uploader.upload(
        content,
        public_id=public_id,
        resource_type=resource_type,
        use_filename=False,
        overwrite=False,
    )

    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id"),
    }


def _delete_from_cloudinary(file_url: str) -> None:
    """Delete a file from Cloudinary by its URL (best-effort)."""
    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        # Extract public_id from URL
        # URL format: https://res.cloudinary.com/<cloud>/image/upload/v.../benchamen/...
        if "cloudinary.com" in file_url:
            # Find the upload/ or raw/ segment and take everything after the version
            for sep in ["/upload/", "/raw/upload/", "/video/upload/"]:
                if sep in file_url:
                    after = file_url.split(sep, 1)[1]
                    # Remove version prefix like v1234567890/
                    if after.startswith("v") and "/" in after:
                        after = after.split("/", 1)[1]
                    # Remove extension for image/video
                    public_id = os.path.splitext(after)[0]
                    cloudinary.uploader.destroy(public_id, resource_type="raw")
                    cloudinary.uploader.destroy(public_id, resource_type="image")
                    cloudinary.uploader.destroy(public_id, resource_type="video")
                    break
    except Exception:
        pass


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
    ext = os.path.splitext(file.filename or "")[1].lower()

    if file.content_type not in ALLOWED_MIME_TYPES and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido: {file.filename} ({file.content_type})")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"El archivo supera el límite de {settings.MAX_FILE_SIZE_MB}MB")

    # Determinar tipo
    is_image = (
        (file.content_type and file.content_type.startswith("image/"))
        or ext in IMAGE_EXTENSIONS
    )
    ev_type = EvidenceType.IMAGE if is_image else EvidenceType.FILE

    mime_type = file.content_type or "application/octet-stream"
    if mime_type == "application/octet-stream" and ext:
        if ext in [".png"]: mime_type = "image/png"
        elif ext in [".jpg", ".jpeg"]: mime_type = "image/jpeg"
        elif ext in [".webp"]: mime_type = "image/webp"
        elif ext in [".gif"]: mime_type = "image/gif"
        elif ext in [".pdf"]: mime_type = "application/pdf"

    file_url: str
    public_id: str | None = None

    if _cloudinary_enabled():
        # ── Subir a Cloudinary (almacenamiento permanente) ──────────────────────
        try:
            result = await _upload_to_cloudinary(content, file.filename, activity_id)
            file_url = result["url"]
            public_id = result.get("public_id")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error subiendo a Cloudinary: {str(e)}")
    else:
        # ── Guardar localmente (desarrollo / docker-compose) ────────────────────
        upload_dir = os.path.join(settings.UPLOAD_DIR, str(activity_id))
        os.makedirs(upload_dir, exist_ok=True)
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, unique_name)
        with open(file_path, "wb") as f:
            f.write(content)
        file_url = f"/uploads/{activity_id}/{unique_name}"

    evidence = Evidence(
        activity_id=activity_id,
        user_id=user_id,
        evidence_type=ev_type,
        file_url=file_url,
        file_name=file.filename,
        file_size=len(content),
        mime_type=mime_type,
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

    if evidence.file_url:
        if "cloudinary.com" in evidence.file_url:
            _delete_from_cloudinary(evidence.file_url)
        else:
            # Archivo local
            file_path = evidence.file_url.lstrip("/")
            if os.path.exists(file_path):
                os.remove(file_path)

    db.delete(evidence)
    db.commit()
