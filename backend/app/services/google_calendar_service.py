"""
Google Calendar Service
=======================
Handles OAuth2 flow and Calendar API operations for syncing
admin appointments with Google Calendar.

Setup:
1. Create a project in Google Cloud Console
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials (Web Application)
4. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI to .env
"""
import json
import logging
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

# ── Helpers ────────────────────────────────────────────────────────────────────

def _is_configured() -> bool:
    """Check if Google OAuth credentials are configured in .env"""
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def _get_flow(state: Optional[str] = None):
    """Create an OAuth2 flow instance."""
    if not _is_configured():
        raise HTTPException(
            status_code=503,
            detail="Google Calendar no está configurado. Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET al archivo .env"
        )
    try:
        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        return flow
    except Exception as e:
        logger.error(f"Error creating OAuth flow: {e}")
        raise HTTPException(status_code=500, detail="Error al inicializar el flujo OAuth de Google")


def _build_service(credentials):
    """Build a Google Calendar API service client."""
    from googleapiclient.discovery import build
    return build("calendar", "v3", credentials=credentials)


def _load_credentials(user: User):
    """Load stored OAuth credentials for a user."""
    if not user.google_calendar_token:
        return None
    try:
        from google.oauth2.credentials import Credentials
        token_data = json.loads(user.google_calendar_token)
        return Credentials(
            token=token_data.get("token"),
            refresh_token=token_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=SCOPES,
        )
    except Exception as e:
        logger.warning(f"Could not load Google credentials for user {user.id}: {e}")
        return None


def _save_credentials(db: Session, user: User, credentials) -> None:
    """Persist refreshed credentials back to the database."""
    token_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "scopes": list(credentials.scopes) if credentials.scopes else SCOPES,
    }
    user.google_calendar_token = json.dumps(token_data)
    user.google_calendar_connected = True
    db.commit()


# ── Public API ─────────────────────────────────────────────────────────────────

def get_auth_url() -> dict:
    """
    Returns the Google OAuth2 authorization URL.
    The admin opens this URL to grant calendar access.
    """
    if not _is_configured():
        return {
            "configured": False,
            "auth_url": None,
            "message": "Google Calendar no está configurado en el servidor. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET al .env"
        }

    flow = _get_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return {"configured": True, "auth_url": auth_url}


def handle_oauth_callback(db: Session, user: User, code: str) -> dict:
    """Exchange the OAuth code for tokens and store them."""
    flow = _get_flow()
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        _save_credentials(db, user, credentials)
        return {"success": True, "message": "Google Calendar conectado correctamente"}
    except Exception as e:
        logger.error(f"OAuth callback error for user {user.id}: {e}")
        raise HTTPException(status_code=400, detail=f"Error al conectar Google Calendar: {str(e)}")


def get_connection_status(user: User) -> dict:
    """Returns whether the user has Google Calendar connected."""
    return {
        "configured": _is_configured(),
        "connected": bool(user.google_calendar_connected and user.google_calendar_token),
    }


def disconnect(db: Session, user: User) -> dict:
    """Revoke and delete stored Google Calendar credentials."""
    credentials = _load_credentials(user)
    if credentials:
        try:
            import requests as req_lib
            req_lib.post(
                "https://oauth2.googleapis.com/revoke",
                params={"token": credentials.token},
                timeout=5,
            )
        except Exception:
            pass  # If revocation fails, still clear local token

    user.google_calendar_token = None
    user.google_calendar_connected = False
    db.commit()
    return {"success": True, "message": "Google Calendar desconectado"}


# ── Calendar Event Operations ──────────────────────────────────────────────────

def _build_event_body(appointment) -> dict:
    """Build a Google Calendar event dict from an Appointment model instance."""
    date_str = str(appointment.date)  # "2026-08-10"
    start_dt = f"{date_str}T{appointment.start_time}:00"
    end_dt   = f"{date_str}T{appointment.end_time}:00"

    attendees = []
    if appointment.client and appointment.client.email:
        attendees.append({"email": appointment.client.email})

    return {
        "summary": appointment.title or "Cita — Benchamen Marketing",
        "description": appointment.notes or "",
        "start": {"dateTime": start_dt, "timeZone": "America/Caracas"},
        "end":   {"dateTime": end_dt,   "timeZone": "America/Caracas"},
        "attendees": attendees,
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email",  "minutes": 60},
                {"method": "popup",  "minutes": 15},
            ],
        },
    }


def create_calendar_event(db: Session, admin_user: User, appointment) -> Optional[str]:
    """
    Create a Google Calendar event for a new appointment slot.
    Returns the Google event ID or None if Google Calendar is not connected.
    """
    if not admin_user.google_calendar_connected:
        return None

    credentials = _load_credentials(admin_user)
    if not credentials:
        return None

    try:
        service = _build_service(credentials)
        event_body = _build_event_body(appointment)
        event = service.events().insert(calendarId="primary", body=event_body).execute()
        _save_credentials(db, admin_user, credentials)  # Persist any token refresh
        logger.info(f"Created Google Calendar event {event.get('id')} for appointment {appointment.id}")
        return event.get("id")
    except Exception as e:
        logger.warning(f"Google Calendar create event failed for appointment {appointment.id}: {e}")
        return None


def update_calendar_event(db: Session, admin_user: User, appointment, event_id: str) -> bool:
    """Update an existing Google Calendar event when appointment is booked."""
    if not admin_user.google_calendar_connected or not event_id:
        return False

    credentials = _load_credentials(admin_user)
    if not credentials:
        return False

    try:
        service = _build_service(credentials)
        event_body = _build_event_body(appointment)
        service.events().update(
            calendarId="primary", eventId=event_id, body=event_body
        ).execute()
        _save_credentials(db, admin_user, credentials)
        logger.info(f"Updated Google Calendar event {event_id}")
        return True
    except Exception as e:
        logger.warning(f"Google Calendar update event failed for event {event_id}: {e}")
        return False


def delete_calendar_event(db: Session, admin_user: User, event_id: str) -> bool:
    """Delete a Google Calendar event when appointment slot is removed."""
    if not admin_user.google_calendar_connected or not event_id:
        return False

    credentials = _load_credentials(admin_user)
    if not credentials:
        return False

    try:
        service = _build_service(credentials)
        service.events().delete(calendarId="primary", eventId=event_id).execute()
        _save_credentials(db, admin_user, credentials)
        logger.info(f"Deleted Google Calendar event {event_id}")
        return True
    except Exception as e:
        logger.warning(f"Google Calendar delete event failed for event {event_id}: {e}")
        return False
