from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.notification import NotificationResponse, NotificationUnreadCount
import app.services.notification_service as notification_svc

router = APIRouter(prefix="/api/notifications", tags=["Notificaciones"])


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return notification_svc.get_user_notifications(db, user_id=current_user.id, limit=limit)


@router.get("/unread-count", response_model=NotificationUnreadCount)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    count = notification_svc.get_unread_count(db, user_id=current_user.id)
    return {"count": count}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return notification_svc.mark_as_read(db, user_id=current_user.id, notification_id=notification_id)


@router.post("/read-all", status_code=204)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notification_svc.mark_all_as_read(db, user_id=current_user.id)
