from datetime import date, datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Numeric, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False, index=True)  # "ingreso" o "egreso"
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False, default=0.00)
    category = Column(String(100), nullable=False)
    payment_method = Column(String(50), nullable=True, default="transferencia")
    payment_reference = Column(String(100), nullable=True)
    receipt_url = Column(Text, nullable=True)          # Imagen/PDF subida (Cloudinary o local)
    receipt_drive_url = Column(Text, nullable=True)     # Link externo (Google Drive, Dropbox, etc.)
    transaction_date = Column(Date, nullable=False, default=date.today, index=True)

    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    company = relationship("Company")
    project = relationship("Project")
    created_by = relationship("User")
