from __future__ import annotations
from datetime import date, datetime, timezone
from sqlalchemy import String, Text, Date, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship


from app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    admin_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[str] = mapped_column(String(5), nullable=False)  # HH:MM
    end_time: Mapped[str] = mapped_column(String(5), nullable=False)    # HH:MM
    status: Mapped[str] = mapped_column(String(20), default="available", nullable=False)  # available, booked, cancelled, meeting
    title: Mapped[str | None] = mapped_column(String(250))
    notes: Mapped[str | None] = mapped_column(Text)
    meeting_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_group: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    attendee_ids: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relaciones
    admin: Mapped["User"] = relationship("User", foreign_keys=[admin_id], back_populates="appointments_as_admin")
    client: Mapped["User | None"] = relationship("User", foreign_keys=[client_id], back_populates="appointments_as_client")

