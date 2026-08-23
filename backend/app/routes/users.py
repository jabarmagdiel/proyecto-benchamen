from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse, UserPasswordUpdate, UserProfileUpdate, UserCapacityResponse
import app.services.user_service as user_svc

router = APIRouter(prefix="/api/users", tags=["Usuarios"])


@router.get("", response_model=List[UserListResponse])
def list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.utils.enums import UserRole
    dept_ids = None
    if current_user.role == UserRole.GERENCIA:
        user_dept_ids = [d.id for d in current_user.departments]
        if department_id and department_id in user_dept_ids:
            dept_ids = [department_id]
        else:
            dept_ids = user_dept_ids
    elif department_id:
        dept_ids = [department_id]

    return user_svc.get_all(
        db,
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        department_id=None,
        department_ids=dept_ids,
    )


@router.get("/capacity", response_model=List[UserCapacityResponse])
def get_user_capacity(
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    return user_svc.get_capacity(db)


@router.post("", response_model=UserResponse, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return user_svc.create(db, data)


@router.put("/me/profile", response_model=UserResponse)
def update_my_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    update_data = UserUpdate(
        name=data.name,
        email=data.email,
        position=data.position
    )
    return user_svc.update(db, current_user.id, update_data)


@router.patch("/me/password", response_model=UserResponse)
def change_my_password(
    data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return user_svc.change_password(db, current_user.id, data)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    return user_svc.get_by_id(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return user_svc.update(db, user_id, data)


@router.patch("/{user_id}/toggle", response_model=UserResponse)
def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    return user_svc.toggle_active(db, user_id)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user_svc.delete(db, user_id)
