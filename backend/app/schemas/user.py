from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.utils.enums import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.OPERATIVE
    position: Optional[str] = None
    company_id: Optional[int] = None
    department_ids: Optional[list[int]] = []

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None
    company_id: Optional[int] = None
    department_ids: Optional[list[int]] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    position: Optional[str] = None


class DepartmentBasic(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    position: Optional[str]
    is_active: bool
    avatar_url: Optional[str]
    company_id: Optional[int]
    departments: list[DepartmentBasic] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    position: Optional[str]
    is_active: bool
    company_id: Optional[int]
    departments: list[DepartmentBasic] = []
    created_at: datetime

    model_config = {"from_attributes": True}

class UserCapacityResponse(BaseModel):
    user_id: int
    name: str
    department_name: Optional[str]
    active_activities_count: int
    weekly_tracked_hours: float
    capacity_status: str # "Libre", "Ocupado", "Sobrecargado"
