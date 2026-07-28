from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


# -- Packages --
class PackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: Decimal
    is_active: bool = True

    # Entregables mensualizados
    videos_count: int = 0
    drone_count: int = 0
    arts_count: int = 0
    template_arts_count: int = 0
    ad_management: bool = False


class PackageCreate(PackageBase):
    pass


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    is_active: Optional[bool] = None

    videos_count: Optional[int] = None
    drone_count: Optional[int] = None
    arts_count: Optional[int] = None
    template_arts_count: Optional[int] = None
    ad_management: Optional[bool] = None


class PackageResponse(PackageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# -- Company Packages (Suscripciones) --
class CompanyPackageBase(BaseModel):
    company_id: int
    package_id: int
    quantity: int = 1
    discount_percentage: Decimal = Decimal("0.00")
    final_price: Decimal = Decimal("0.00")


class CompanyPackageCreate(CompanyPackageBase):
    pass


class CompanyPackageResponse(CompanyPackageBase):
    id: int
    status: str = "activo"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    videos_remaining: int = 0
    drone_remaining: int = 0
    arts_remaining: int = 0
    template_arts_remaining: int = 0
    ad_management: bool = False

    created_at: datetime
    package: Optional[PackageResponse] = None

    class Config:
        from_attributes = True
