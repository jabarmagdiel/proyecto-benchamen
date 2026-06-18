from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.company import CompanyResponse
from app.schemas.package import PackageResponse
from app.schemas.user import UserResponse

class PackageRequestBase(BaseModel):
    package_id: int
    notes: Optional[str] = None

class PackageRequestCreate(PackageRequestBase):
    company_id: int

class PackageRequestUpdateStatus(BaseModel):
    status: str # "pendiente", "aceptada", "en_proceso", "entregada", "rechazada"

class PackageRequestResponse(PackageRequestBase):
    id: int
    company_id: int
    client_user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    company: Optional[CompanyResponse] = None
    package: Optional[PackageResponse] = None
    client_user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
