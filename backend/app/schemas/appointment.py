from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    date: date
    start_time: str  # HH:MM
    end_time: str    # HH:MM


class AppointmentBook(BaseModel):
    title: str
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    admin_id: int
    client_id: Optional[int] = None
    date: date
    start_time: str
    end_time: str
    status: str
    title: Optional[str] = None
    notes: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    company_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
