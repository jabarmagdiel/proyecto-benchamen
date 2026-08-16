from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    date: date
    start_time: str  # HH:MM
    end_time: str    # HH:MM


class AppointmentBook(BaseModel):
    title: str
    notes: Optional[str] = None
    start_time: Optional[str] = None  # HH:MM escogido por el cliente
    end_time: Optional[str] = None    # HH:MM escogido por el cliente


class MeetingCreate(BaseModel):
    title: str
    date: date
    start_time: str
    end_time: str
    is_group: bool = True
    attendee_ids: Optional[List[int]] = None
    meeting_link: Optional[str] = None
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
    meeting_link: Optional[str] = None
    is_group: Optional[bool] = False
    attendee_ids: Optional[List[int]] = None
    attendees_names: Optional[List[str]] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    company_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
