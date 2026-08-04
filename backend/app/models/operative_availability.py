from __future__ import annotations
from datetime import date, datetime, timezone
from sqlalchemy import String, Boolean, Date, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OperativeAvailability(Base):
    __tablename__ = "operative_availabilities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[str] = mapped_column(String(5), default="08:00", nullable=False)  # HH:MM
    end_time: Mapped[str] = mapped_column(String(5), default="18:00", nullable=False)    # HH:MM
    is_full_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="busy", nullable=False)  # busy, available
    reason: Mapped[str | None] = mapped_column(String(250), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relaciones
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
