from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, field_validator
from app.utils.enums import ProjectStatus, Priority
from app.schemas.company import CompanyResponse
from app.schemas.user import UserListResponse


class ProjectCreate(BaseModel):
    company_id: int
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    status: ProjectStatus = ProjectStatus.PLANNED
    priority: Priority = Priority.MEDIUM
    main_responsible_id: Optional[int] = None
    department_id: Optional[int] = None

    @field_validator("deadline")
    @classmethod
    def deadline_after_start(cls, v, info):
        start = info.data.get("start_date")
        if v and start and v < start:
            raise ValueError("La fecha límite no puede ser anterior a la fecha de inicio")
        return v


class ProjectUpdate(BaseModel):
    company_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[Priority] = None
    main_responsible_id: Optional[int] = None
    department_id: Optional[int] = None


class ProjectResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: Optional[str]
    start_date: Optional[date]
    deadline: Optional[date]
    status: ProjectStatus
    priority: Priority
    main_responsible_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyResponse] = None
    main_responsible: Optional[UserListResponse] = None
    department_id: Optional[int] = None
    activity_count: Optional[int] = 0
    progress: Optional[float] = 0.0  # porcentaje de actividades aprobadas

    model_config = {"from_attributes": True}
