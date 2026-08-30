from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserListResponse
from app.schemas.company import CompanyResponse
from app.schemas.project import ProjectResponse


class FinancialTransactionBase(BaseModel):
    type: str  # "ingreso" o "egreso"
    title: str
    description: Optional[str] = None
    amount: float
    category: str
    payment_method: Optional[str] = "transferencia"
    payment_reference: Optional[str] = None
    receipt_url: Optional[str] = None
    receipt_drive_url: Optional[str] = None
    transaction_date: date
    company_id: Optional[int] = None
    project_id: Optional[int] = None


class FinancialTransactionCreate(FinancialTransactionBase):
    pass


class FinancialTransactionUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    receipt_url: Optional[str] = None
    receipt_drive_url: Optional[str] = None
    transaction_date: Optional[date] = None
    company_id: Optional[int] = None
    project_id: Optional[int] = None


class FinancialTransactionResponse(FinancialTransactionBase):
    id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyResponse] = None
    project: Optional[ProjectResponse] = None
    created_by: Optional[UserListResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CategorySummary(BaseModel):
    category: str
    type: str  # "ingreso" o "egreso"
    total_amount: float
    count: int


class MonthlyFlow(BaseModel):
    year: int
    month: int
    month_name: str
    total_ingresos: float
    total_egresos: float
    balance: float


class FinancialSummaryResponse(BaseModel):
    total_ingresos_manuales: float
    total_ingresos_qr_verificados: float
    total_ingresos_global: float
    total_egresos_global: float
    balance_neto: float
    ingresos_count: int
    egresos_count: int
    categories_breakdown: List[CategorySummary]
    monthly_flow: List[MonthlyFlow]
