from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserResponse
import app.services.auth_service as auth_svc

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Limiter local para este router
_limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse)
@_limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autenticación de usuario.
    Protegido: máximo 10 intentos por minuto por IP.
    Después de ese límite el servidor responde 429 Too Many Requests.
    """
    return auth_svc.login(db, data)


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout():
    """El logout es manejado en el frontend eliminando el token."""
    return {"message": "Sesión cerrada correctamente"}
