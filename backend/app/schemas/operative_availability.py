from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class OperativeAvailabilityBase(BaseModel):
    date: date
    start_time: str = "08:00"
    end_time: str = "18:00"
    is_full_day: bool = False
    status: str = "busy"  # 'busy', 'available'
    reason: Optional[str] = None


class OperativeAvailabilityCreate(OperativeAvailabilityBase):
    user_id: Optional[int] = None  # Si es Admin, puede asignarlo a un usuario específico


class OperativeAvailabilityResponse(OperativeAvailabilityBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class OperativeAvailabilitySummary(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    user_role: str
    user_position: Optional[str] = None
    overall_status: str  # 'libre', 'ocupado', 'en_trabajo'
    busy_blocks: List[OperativeAvailabilityResponse] = []
    assigned_activities_count: int = 0
    assigned_activities_titles: List[str] = []
