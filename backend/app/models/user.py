from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship


from app.core.database import Base
from app.utils.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", values_callable=lambda x: [e.value for e in x]),
        default=UserRole.OPERATIVE,
        nullable=False,
    )
    position: Mapped[str | None] = mapped_column(String(100))  # filmmaker, editora, diseñador, etc.
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    company: Mapped["Company | None"] = relationship("Company", back_populates="users")
    department: Mapped["Department | None"] = relationship("Department", back_populates="users")

    assigned_activities: Mapped[list["Activity"]] = relationship(
        "Activity", foreign_keys="Activity.assigned_user_id", back_populates="assigned_user"
    )
    created_activities: Mapped[list["Activity"]] = relationship(
        "Activity", foreign_keys="Activity.created_by_id", back_populates="created_by"
    )
    approved_activities: Mapped[list["Activity"]] = relationship(
        "Activity", foreign_keys="Activity.approved_by_id", back_populates="approved_by"
    )
    evidences: Mapped[list["Evidence"]] = relationship("Evidence", back_populates="user")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="user")
    history_entries: Mapped[list["ActivityHistory"]] = relationship(
        "ActivityHistory", back_populates="user"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    appointments_as_admin: Mapped[list["Appointment"]] = relationship(
        "Appointment", foreign_keys="Appointment.admin_id", back_populates="admin"
    )
    appointments_as_client: Mapped[list["Appointment"]] = relationship(
        "Appointment", foreign_keys="Appointment.client_id", back_populates="client"
    )


