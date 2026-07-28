from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.company import CompanyResponse
from app.schemas.package import PackageResponse
from app.schemas.user import UserResponse


class PackageRequestBase(BaseModel):
    package_id: int
    company_id: int
    request_type: str = "subscription_payment"  # "subscription_payment" o "work_request"
    deliverable_type: Optional[str] = None       # "video", "drone", "art", "template_art", "ad"
    quantity_requested: int = 1
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    title: Optional[str] = None
    notes: Optional[str] = None


class PackageRequestCreate(PackageRequestBase):
    pass


class PackageRequestUpdateStatus(BaseModel):
    status: str  # "pendiente", "aceptada", "en_proceso", "entregada", "rechazada"


class VerifyPaymentPayload(BaseModel):
    payment_status: str = "pago_verificado"  # "pago_verificado" o "rechazado"
    payment_notes: Optional[str] = None


class WorkRequestActionPayload(BaseModel):
    action: str  # "approve" o "reject"
    notes: Optional[str] = None


class PackageRequestResponse(PackageRequestBase):
    id: int
    client_user_id: int
    status: str
    payment_status: str
    created_at: datetime
    updated_at: datetime

    company: Optional[CompanyResponse] = None
    package: Optional[PackageResponse] = None
    client_user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
