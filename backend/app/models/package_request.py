from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PackageRequest(Base):
    __tablename__ = "package_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id", ondelete="CASCADE"), nullable=False)
    client_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Tipo de solicitud: "subscription_payment" (Suscripción/Pago) o "work_request" (Entrega de trabajo)
    request_type = Column(String(30), nullable=False, default="subscription_payment")

    # Si es "work_request", tipo de entregable: "video", "drone", "art", "template_art", "ad"
    deliverable_type = Column(String(30), nullable=True)
    quantity_requested = Column(Integer, nullable=False, default=1)

    # Estado de la solicitud: "pendiente", "aceptada", "en_proceso", "entregada", "rechazada"
    status = Column(String(20), nullable=False, default="pendiente")

    # Estado del Pago (para suscripciones): "pendiente_verificacion", "pago_verificado", "rechazado"
    payment_status = Column(String(30), nullable=False, default="pendiente_verificacion")
    payment_method = Column(String(50), nullable=True)  # "QR", "Transferencia", "Efectivo"
    payment_reference = Column(String(100), nullable=True)  # Nro comprobante o referencia
    payment_receipt_url = Column(String(500), nullable=True)  # URL de la imagen o archivo del comprobante de pago

    title = Column(String(250), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relaciones
    company = relationship("Company")
    package = relationship("Package")
    client_user = relationship("User")
