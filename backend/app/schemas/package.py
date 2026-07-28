from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


# -- Package Items --
class PackageItemBase(BaseModel):
    name: str
    item_type: str = "por_cantidad"  # 'por_cantidad' o 'indefinido'
    quantity: int = 0


class PackageItemCreate(PackageItemBase):
    pass


class PackageItemResponse(PackageItemBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True


# -- Packages --
class PackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "marketing"        # 'marketing', 'software', etc.
    price_type: str = "fixed"          # 'fixed' o 'custom_text'
    price_text: Optional[str] = "Por definir en reunión"
    base_price: Decimal = Decimal("0.00")
    is_active: bool = True


class PackageCreate(PackageBase):
    items: Optional[List[PackageItemCreate]] = []


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price_type: Optional[str] = None
    price_text: Optional[str] = None
    base_price: Optional[Decimal] = None
    is_active: Optional[bool] = None
    items: Optional[List[PackageItemCreate]] = None


class PackageResponse(PackageBase):
    id: int
    created_at: datetime
    items: List[PackageItemResponse] = []

    class Config:
        from_attributes = True


# -- Company Package Items --
class CompanyPackageItemResponse(BaseModel):
    id: int
    name: str
    item_type: str
    quantity_initial: int
    quantity_remaining: int

    class Config:
        from_attributes = True


# -- Company Packages --
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

    created_at: datetime
    package: Optional[PackageResponse] = None
    items: List[CompanyPackageItemResponse] = []

    class Config:
        from_attributes = True
