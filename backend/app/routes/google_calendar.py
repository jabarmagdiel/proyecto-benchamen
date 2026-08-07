from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
import app.services.google_calendar_service as gcal

router = APIRouter(prefix="/api/google-calendar", tags=["Google Calendar"])


@router.get("/auth-url")
def get_auth_url(
    _: User = Depends(require_admin),
):
    """
    Returns the Google OAuth2 URL for the admin to authorize Calendar access.
    If GOOGLE_CLIENT_ID is not configured, returns configured=False with a message.
    """
    return gcal.get_auth_url()


@router.get("/callback")
def oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Called by the frontend after the user completes Google OAuth.
    Exchanges the code for tokens and stores them.
    """
    return gcal.handle_oauth_callback(db, current_user, code)


@router.get("/status")
def connection_status(
    current_user: User = Depends(get_current_user),
):
    """Returns whether the current user has Google Calendar connected."""
    return gcal.get_connection_status(current_user)


@router.delete("/disconnect")
def disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Revokes and deletes the stored Google Calendar credentials."""
    return gcal.disconnect(db, current_user)
