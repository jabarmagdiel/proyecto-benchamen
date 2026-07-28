from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey, DateTime, Date, Boolean, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)

    # Tipo de Oferta: 'package' (paquete mensual) o 'individual_service' (servicio suelto a la carta)
    offering_type = Column(String(30), nullable=False, default="package")

    # Categoría: 'marketing', 'diseno', 'software', etc.
    category = Column(String(50), nullable=False, default="marketing")

    # Precio: 'fixed' (definido en base_price) o 'custom_text' (ej. "Por definir en reunión")
    price_type = Column(String(30), nullable=False, default="fixed")
    price_text = Column(String(100), nullable=True, default="Por definir en reunión")
    base_price = Column(Numeric(10, 2), nullable=False, default=0.00)

    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("PackageItem", back_populates="package", cascade="all, delete-orphan")
    company_packages = relationship("CompanyPackage", back_populates="package", cascade="all, delete-orphan")


class PackageItem(Base):
    __tablename__ = "package_items"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)

    # Tipo de ítem: 'por_cantidad' (ej. 4 Videos) o 'indefinido' (ej. Arte de plantilla incluído)
    item_type = Column(String(30), nullable=False, default="por_cantidad")
    quantity = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    package = relationship("Package", back_populates="items")


class CompanyPackage(Base):
    __tablename__ = "company_packages"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    discount_percentage = Column(Numeric(5, 2), nullable=False, default=0.00)
    final_price = Column(Numeric(10, 2), nullable=False, default=0.00)

    # Estado y fechas de suscripción
    status = Column(String(20), nullable=False, default="activo")  # activo, expirado, cancelado
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="packages")
    package = relationship("Package", back_populates="company_packages")
    items = relationship("CompanyPackageItem", back_populates="company_package", cascade="all, delete-orphan")


class CompanyPackageItem(Base):
    __tablename__ = "company_package_items"

    id = Column(Integer, primary_key=True, index=True)
    company_package_id = Column(Integer, ForeignKey("company_packages.id", ondelete="CASCADE"), nullable=False)
    package_item_id = Column(Integer, ForeignKey("package_items.id", ondelete="SET NULL"), nullable=True)

    name = Column(String(150), nullable=False)
    item_type = Column(String(30), nullable=False, default="por_cantidad")
    quantity_initial = Column(Integer, nullable=False, default=0)
    quantity_remaining = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company_package = relationship("CompanyPackage", back_populates="items")
