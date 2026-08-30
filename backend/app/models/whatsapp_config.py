from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WhatsAppConfig(Base):
    __tablename__ = "whatsapp_config"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_phone: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. +18095550199
    phone_number_id: Mapped[str | None] = mapped_column(String(100), nullable=True) # Meta Phone Number ID
    waba_id: Mapped[str | None] = mapped_column(String(100), nullable=True) # Meta WhatsApp Business Account ID
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True) # Meta Permanent Access Token
    verify_token: Mapped[str | None] = mapped_column(String(100), nullable=True, default="addons_secret_token") # Webhook verification
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
