from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.schemas.financial_transaction import (
    FinancialTransactionCreate,
    FinancialTransactionUpdate,
    FinancialTransactionResponse,
    FinancialSummaryResponse,
)
import app.services.finance_service as finance_svc

router = APIRouter(prefix="/api/finances", tags=["Finanzas"])


@router.get("", response_model=List[FinancialTransactionResponse])
def list_transactions(
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return finance_svc.list_transactions(
        db, type=type, category=category, company_id=company_id, project_id=project_id,
        start_date=start_date, end_date=end_date, search=search, skip=skip, limit=limit
    )


@router.get("/summary", response_model=FinancialSummaryResponse)
def get_summary(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return finance_svc.get_financial_summary(db)


@router.get("/excel")
def export_excel(
    type: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return finance_svc.export_finances_excel(
        db, type=type, company_id=company_id, project_id=project_id, start_date=start_date, end_date=end_date
    )


@router.post("/upload-receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    _=Depends(require_admin),
):
    import os, uuid
    from app.core.config import settings

    ALLOWED_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".avif", ".heic", ".pdf"}
    MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido: {ext}. Usa PNG, JPG, WEBP, GIF o PDF.")

    content = await file.read()
    if len(content) > MAX_BYTES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"El archivo supera el límite de {settings.MAX_FILE_SIZE_MB}MB.")

    # ── Cloudinary (producción) ─────────────────────────────────────────────────
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            import cloudinary, cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
            public_id = f"benchamen/finanzas/{uuid.uuid4().hex}"
            is_image = ext in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".avif", ".heic"}
            resource_type = "image" if is_image else "raw"
            result = cloudinary.uploader.upload(
                content,
                public_id=public_id,
                resource_type=resource_type,
                use_filename=False,
                overwrite=False,
            )
            return {"url": result.get("secure_url"), "storage": "cloudinary"}
        except Exception as e:
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail=f"Error al subir a Cloudinary: {str(e)}")

    # ── Almacenamiento local (desarrollo) ───────────────────────────────────────
    upload_dir = os.path.join(settings.UPLOAD_DIR, "finances")
    os.makedirs(upload_dir, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    return {"url": f"/uploads/finances/{unique_name}", "storage": "local"}


@router.post("", response_model=FinancialTransactionResponse, status_code=201)
def create_transaction(
    data: FinancialTransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return finance_svc.create_transaction(db, data, current_user.id)


@router.put("/{transaction_id}", response_model=FinancialTransactionResponse)
def update_transaction(
    transaction_id: int,
    data: FinancialTransactionUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return finance_svc.update_transaction(db, transaction_id, data)


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    finance_svc.delete_transaction(db, transaction_id)
