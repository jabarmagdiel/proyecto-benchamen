from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.utils.enums import EvidenceType


class Evidence(Base):
    __tablename__ = "evidences"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    activity_id: Mapped[int] = mapped_column(ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    evidence_type: Mapped[EvidenceType] = mapped_column(
        SAEnum(EvidenceType, name="evidence_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    file_url: Mapped[str | None] = mapped_column(String(1000))   # ruta local del archivo
    drive_url: Mapped[str | None] = mapped_column(String(1000))  # link de Drive
    file_name: Mapped[str | None] = mapped_column(String(500))
    file_size: Mapped[int | None] = mapped_column()              # bytes
    mime_type: Mapped[str | None] = mapped_column(String(100))
    note: Mapped[str | None] = mapped_column(Text)               # nota/descripción

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relaciones
    activity: Mapped["Activity"] = relationship("Activity", back_populates="evidences")
    user: Mapped["User"] = relationship("User", back_populates="evidences")
