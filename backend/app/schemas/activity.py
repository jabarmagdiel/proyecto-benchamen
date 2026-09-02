from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, field_validator
from app.utils.enums import ActivityStatus, ActivityType, Priority
from app.schemas.user import UserListResponse


class WorkflowStageResponse(BaseModel):
    id: int
    name: str
    node_type: str = "task"
    model_config = {"from_attributes": True}



class ActivityCreate(BaseModel):
    project_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    reference_link: Optional[str] = None
    activity_type: ActivityType = ActivityType.OTHER
    node_type: str = "task"
    priority: Priority = Priority.MEDIUM
    assigned_user_id: Optional[int] = None
    workflow_id: Optional[int] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None

    @field_validator("deadline")
    @classmethod
    def deadline_after_start(cls, v, info):
        start = info.data.get("start_date")
        if v and start and v < start:
            raise ValueError("La fecha límite no puede ser anterior a la fecha de inicio")
        return v


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reference_link: Optional[str] = None
    activity_type: Optional[ActivityType] = None
    node_type: Optional[str] = None
    priority: Optional[Priority] = None
    assigned_user_id: Optional[int] = None
    workflow_id: Optional[int] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    status: Optional[ActivityStatus] = None
    current_stage_id: Optional[int] = None


class ActivityStatusUpdate(BaseModel):
    observation: Optional[str] = None  # requerido cuando se observa


class ActivityResponse(BaseModel):
    id: int
    project_id: Optional[int] = None
    title: str
    description: Optional[str]
    reference_link: Optional[str] = None
    activity_type: ActivityType
    node_type: str = "task"
    priority: Priority
    status: ActivityStatus
    current_stage_id: Optional[int] = None
    workflow_id: Optional[int] = None
    assigned_user_id: Optional[int]
    created_by_id: int
    approved_by_id: Optional[int]
    start_date: date | None = None
    deadline: date | None = None
    approved_at: datetime | None = None
    time_spent_seconds: int = 0
    timer_started_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    assigned_user: Optional[UserListResponse] = None
    created_by: Optional[UserListResponse] = None
    approved_by: Optional[UserListResponse] = None
    evidence_count: Optional[int] = 0
    comment_count: Optional[int] = 0
    # project info
    project_name: Optional[str] = None
    company_name: Optional[str] = None
    
    current_stage: Optional[WorkflowStageResponse] = None
    
    # Final product info
    latest_evidence_url: Optional[str] = None
    latest_evidence_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ActivityListResponse(BaseModel):
    id: int
    title: str
    activity_type: ActivityType
    node_type: str = "task"
    priority: Priority
    status: ActivityStatus
    workflow_id: Optional[int] = None
    deadline: Optional[date]
    created_by_id: Optional[int] = None
    created_by: Optional[UserListResponse] = None
    assigned_user: Optional[UserListResponse] = None
    project_name: Optional[str] = None
    company_name: Optional[str] = None
    evidence_count: int = 0

    model_config = {"from_attributes": True}
