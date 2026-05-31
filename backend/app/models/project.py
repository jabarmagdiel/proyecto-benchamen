from datetime import datetime, timezone, date
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.utils.enums import ProjectStatus, Priority


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id", ondelete="SET NULL"))
    main_responsible_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(250), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    deadline: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ProjectStatus] = mapped_column(
        SAEnum(ProjectStatus, name="project_status", values_callable=lambda x: [e.value for e in x]),
        default=ProjectStatus.PLANNED,
        nullable=False,
    )
    priority: Mapped[Priority] = mapped_column(
        SAEnum(Priority, name="priority_level", values_callable=lambda x: [e.value for e in x]),
        default=Priority.MEDIUM,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    company: Mapped["Company"] = relationship("Company", back_populates="projects")
    department: Mapped["Department | None"] = relationship("Department")
    main_responsible: Mapped["User | None"] = relationship("User", foreign_keys=[main_responsible_id])
    activities: Mapped[list["Activity"]] = relationship(
        "Activity", back_populates="project", cascade="all, delete-orphan"
    )
