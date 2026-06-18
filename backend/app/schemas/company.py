from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.utils.enums import CompanyStatus


class CompanyCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    description: Optional[str] = None
    dashboard_url: Optional[str] = None
    status: CompanyStatus = CompanyStatus.ACTIVE


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CompanyStatus] = None
    dashboard_url: Optional[str] = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    contact_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    description: Optional[str]
    dashboard_url: Optional[str] = None
    status: CompanyStatus
    created_at: datetime
    project_count: Optional[int] = 0

    model_config = {"from_attributes": True}
