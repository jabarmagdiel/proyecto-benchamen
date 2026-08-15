from datetime import datetime, timezone, date
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.utils.enums import ActivityStatus, ActivityType, Priority


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    workflow_id: Mapped[int | None] = mapped_column(ForeignKey("workflows.id", ondelete="SET NULL"))
    current_stage_id: Mapped[int | None] = mapped_column(ForeignKey("workflow_stages.id", ondelete="SET NULL"))
    assigned_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    title: Mapped[str] = mapped_column(String(250), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    activity_type: Mapped[ActivityType] = mapped_column(
        SAEnum(ActivityType, name="activity_type", values_callable=lambda x: [e.value for e in x]),
        default=ActivityType.OTHER,
        nullable=False,
    )
    priority: Mapped[Priority] = mapped_column(
        SAEnum(Priority, name="priority_level", values_callable=lambda x: [e.value for e in x]),
        default=Priority.MEDIUM,
        nullable=False,
    )
    status: Mapped[ActivityStatus] = mapped_column(
        SAEnum(ActivityStatus, name="activity_status", values_callable=lambda x: [e.value for e in x]),
        default=ActivityStatus.PENDING,
        nullable=False,
    )

    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    timer_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    node_type: Mapped[str] = mapped_column(String(50), default="task", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    project: Mapped["Project | None"] = relationship("Project", back_populates="activities")
    workflow: Mapped["Workflow | None"] = relationship("Workflow")
    current_stage: Mapped["WorkflowStage | None"] = relationship("WorkflowStage", back_populates="activities")
    assigned_user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[assigned_user_id], back_populates="assigned_activities"
    )
    created_by: Mapped["User"] = relationship(
        "User", foreign_keys=[created_by_id], back_populates="created_activities"
    )
    approved_by: Mapped["User | None"] = relationship(
        "User", foreign_keys=[approved_by_id], back_populates="approved_activities"
    )
    evidences: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="activity", cascade="all, delete-orphan"
    )
    comments: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="activity", cascade="all, delete-orphan"
    )
    history: Mapped[list["ActivityHistory"]] = relationship(
        "ActivityHistory", back_populates="activity", cascade="all, delete-orphan"
    )
