from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.comment import Comment
from app.models.activity_history import ActivityHistory
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter(tags=["Comentarios"])


@router.get("/api/activities/{activity_id}/comments", response_model=List[CommentResponse])
def list_comments(activity_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.activity_id == activity_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@router.post("/api/activities/{activity_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(
    activity_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    comment = Comment(
        activity_id=activity_id,
        user_id=current_user.id,
        content=data.content,
    )
    db.add(comment)
    # Registrar en historial
    from app.utils.enums import HistoryAction
    history = ActivityHistory(
        activity_id=activity_id,
        user_id=current_user.id,
        action=HistoryAction.COMMENTED,
        description=f"Comentario agregado",
    )
    db.add(history)
    db.commit()
    db.refresh(comment)
    # Enviar notificación
    try:
        from app.models.activity import Activity
        from app.services import notification_service as notification_svc
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if activity:
            if current_user.id != activity.assigned_user_id and activity.assigned_user_id:
                notification_svc.create_notification(
                    db,
                    user_id=activity.assigned_user_id,
                    title="Nuevo comentario",
                    message=f"{current_user.name} comentó en tu actividad '{activity.title}'.",
                    link=f"/actividades/{activity.id}"
                )
            elif current_user.id == activity.assigned_user_id and activity.created_by_id and activity.created_by_id != current_user.id:
                notification_svc.create_notification(
                    db,
                    user_id=activity.created_by_id,
                    title="Nuevo comentario",
                    message=f"El responsable {current_user.name} comentó en '{activity.title}'.",
                    link=f"/actividades/{activity.id}"
                )
    except Exception:
        pass
    # Recargar con relación user
    return db.query(Comment).options(joinedload(Comment.user)).filter(Comment.id == comment.id).first()
