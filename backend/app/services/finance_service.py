from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from fastapi import HTTPException

from app.models.financial_transaction import FinancialTransaction
from app.models.package_request import PackageRequest
from app.models.package import Package
from app.schemas.financial_transaction import (
    FinancialTransactionCreate,
    FinancialTransactionUpdate,
    CategorySummary,
    MonthlyFlow,
    FinancialSummaryResponse,
)

MONTH_NAMES_ES = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]


def list_transactions(
    db: Session,
    type: Optional[str] = None,
    category: Optional[str] = None,
    company_id: Optional[int] = None,
    project_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
) -> List[FinancialTransaction]:
    q = db.query(FinancialTransaction).options(
        joinedload(FinancialTransaction.company),
        joinedload(FinancialTransaction.project),
        joinedload(FinancialTransaction.created_by),
    )

    if type:
        q = q.filter(FinancialTransaction.type == type)
    if category:
        q = q.filter(FinancialTransaction.category == category)
    if company_id:
        q = q.filter(FinancialTransaction.company_id == company_id)
    if project_id:
        q = q.filter(FinancialTransaction.project_id == project_id)
    if start_date:
        q = q.filter(FinancialTransaction.transaction_date >= start_date)
    if end_date:
        q = q.filter(FinancialTransaction.transaction_date <= end_date)
    if search:
        s = f"%{search.lower()}%"
        q = q.filter(
            func.lower(FinancialTransaction.title).like(s) |
            func.lower(FinancialTransaction.category).like(s) |
            func.lower(FinancialTransaction.payment_reference).like(s)
        )

    return q.order_by(FinancialTransaction.transaction_date.desc(), FinancialTransaction.id.desc()).offset(skip).limit(limit).all()


def create_transaction(db: Session, data: FinancialTransactionCreate, creator_id: int) -> FinancialTransaction:
    transaction = FinancialTransaction(
        **data.model_dump(),
        created_by_id=creator_id
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return db.query(FinancialTransaction).options(
        joinedload(FinancialTransaction.company),
        joinedload(FinancialTransaction.project),
        joinedload(FinancialTransaction.created_by),
    ).filter(FinancialTransaction.id == transaction.id).first()


def update_transaction(db: Session, transaction_id: int, data: FinancialTransactionUpdate) -> FinancialTransaction:
    transaction = db.query(FinancialTransaction).filter(FinancialTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Registro financiero no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return db.query(FinancialTransaction).options(
        joinedload(FinancialTransaction.company),
        joinedload(FinancialTransaction.project),
        joinedload(FinancialTransaction.created_by),
    ).filter(FinancialTransaction.id == transaction.id).first()


def delete_transaction(db: Session, transaction_id: int):
    transaction = db.query(FinancialTransaction).filter(FinancialTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Registro financiero no encontrado")
    db.delete(transaction)
    db.commit()


def get_financial_summary(db: Session) -> FinancialSummaryResponse:
    # 1. Total Ingresos Manuales
    ingresos_manuales_res = db.query(
        func.coalesce(func.sum(FinancialTransaction.amount), 0.0),
        func.count(FinancialTransaction.id)
    ).filter(FinancialTransaction.type == "ingreso").first()

    total_ingresos_manuales = float(ingresos_manuales_res[0] if ingresos_manuales_res else 0.0)
    ingresos_count = int(ingresos_manuales_res[1] if ingresos_manuales_res else 0)

    # 2. Total Ingresos QR Verificados (Suscripciones)
    qr_verified_res = db.query(
        func.coalesce(func.sum(Package.base_price), 0.0)
    ).join(PackageRequest, PackageRequest.package_id == Package.id).filter(
        PackageRequest.payment_status == "pago_verificado"
    ).scalar()

    total_ingresos_qr = float(qr_verified_res or 0.0)

    # 3. Total Egresos Globales
    egresos_res = db.query(
        func.coalesce(func.sum(FinancialTransaction.amount), 0.0),
        func.count(FinancialTransaction.id)
    ).filter(FinancialTransaction.type == "egreso").first()

    total_egresos_global = float(egresos_res[0] if egresos_res else 0.0)
    egresos_count = int(egresos_res[1] if egresos_res else 0)

    total_ingresos_global = total_ingresos_manuales + total_ingresos_qr
    balance_neto = total_ingresos_global - total_egresos_global

    # 4. Desglose por categorías
    cat_rows = db.query(
        FinancialTransaction.category,
        FinancialTransaction.type,
        func.coalesce(func.sum(FinancialTransaction.amount), 0.0),
        func.count(FinancialTransaction.id)
    ).group_by(FinancialTransaction.category, FinancialTransaction.type).all()

    categories_breakdown = [
        CategorySummary(
            category=row[0],
            type=row[1],
            total_amount=float(row[2]),
            count=int(row[3])
        )
        for row in cat_rows
    ]

    # 5. Flujo mensual (Últimos 12 meses)
    monthly_rows = db.query(
        extract('year', FinancialTransaction.transaction_date).label('yr'),
        extract('month', FinancialTransaction.transaction_date).label('mo'),
        FinancialTransaction.type,
        func.coalesce(func.sum(FinancialTransaction.amount), 0.0)
    ).group_by('yr', 'mo', FinancialTransaction.type).order_by('yr', 'mo').all()

    monthly_map = {}
    for yr, mo, t_type, amt in monthly_rows:
        yr_i, mo_i = int(yr), int(mo)
        key = (yr_i, mo_i)
        if key not in monthly_map:
            monthly_map[key] = {"ingreso": 0.0, "egreso": 0.0}
        monthly_map[key][t_type] += float(amt)

    monthly_flow = []
    for (y, m), val in sorted(monthly_map.items()):
        month_name = MONTH_NAMES_ES[m] if 1 <= m <= 12 else str(m)
        ing = val["ingreso"]
        eg = val["egreso"]
        monthly_flow.append(MonthlyFlow(
            year=y,
            month=m,
            month_name=f"{month_name} {y}",
            total_ingresos=ing,
            total_egresos=eg,
            balance=ing - eg
        ))

    return FinancialSummaryResponse(
        total_ingresos_manuales=total_ingresos_manuales,
        total_ingresos_qr_verificados=total_ingresos_qr,
        total_ingresos_global=total_ingresos_global,
        total_egresos_global=total_egresos_global,
        balance_neto=balance_neto,
        ingresos_count=ingresos_count,
        egresos_count=egresos_count,
        categories_breakdown=categories_breakdown,
        monthly_flow=monthly_flow
    )
