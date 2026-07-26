from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, field_validator
from app.utils.enums import CompanyStatus


class CompanyCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: CompanyStatus = CompanyStatus.ACTIVE

    @field_validator("contact_name", "phone", "email", "address", "description", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CompanyStatus] = None

    @field_validator("name", "contact_name", "phone", "email", "address", "description", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Any:
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v


class CompanyResponse(BaseModel):
    id: int
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    status: CompanyStatus
    created_at: datetime
    project_count: Optional[int] = 0

    model_config = {"from_attributes": True}
