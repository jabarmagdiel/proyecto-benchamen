from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# -- Packages --
class PackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: Decimal

class PackageCreate(PackageBase):
    pass

class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None

class PackageResponse(PackageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# -- Company Packages --
class CompanyPackageBase(BaseModel):
    company_id: int
    package_id: int
    quantity: int
    discount_percentage: Decimal
    final_price: Decimal

class CompanyPackageCreate(CompanyPackageBase):
    pass

class CompanyPackageResponse(CompanyPackageBase):
    id: int
    created_at: datetime
    package: Optional[PackageResponse] = None

    class Config:
        from_attributes = True
