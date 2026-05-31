from datetime import datetime, timezone
import sqlalchemy as sa
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(250), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    stages: Mapped[list["WorkflowStage"]] = relationship(
        "WorkflowStage", back_populates="workflow", cascade="all, delete-orphan", order_by="WorkflowStage.order"
    )
    edges: Mapped[list["WorkflowEdge"]] = relationship(
        "WorkflowEdge", back_populates="workflow", cascade="all, delete-orphan"
    )


class WorkflowStage(Base):
    __tablename__ = "workflow_stages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    color: Mapped[str] = mapped_column(String(20), default="blue")
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    node_type: Mapped[str] = mapped_column(String(50), default="task")
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pos_x: Mapped[float | None] = mapped_column(sa.Float, nullable=True)
    pos_y: Mapped[float | None] = mapped_column(sa.Float, nullable=True)

    # Relaciones
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="stages")
    automations: Mapped[list["WorkflowAutomation"]] = relationship(
        "WorkflowAutomation", back_populates="stage", cascade="all, delete-orphan"
    )
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="current_stage")
    
    # Edges donde este nodo es el origen
    outgoing_edges: Mapped[list["WorkflowEdge"]] = relationship(
        "WorkflowEdge", foreign_keys="[WorkflowEdge.source_stage_id]", back_populates="source_stage", cascade="all, delete-orphan"
    )
    # Edges donde este nodo es el destino
    incoming_edges: Mapped[list["WorkflowEdge"]] = relationship(
        "WorkflowEdge", foreign_keys="[WorkflowEdge.target_stage_id]", back_populates="target_stage", cascade="all, delete-orphan"
    )


class WorkflowAutomation(Base):
    __tablename__ = "workflow_automations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    stage_id: Mapped[int] = mapped_column(ForeignKey("workflow_stages.id", ondelete="CASCADE"), nullable=False)
    trigger_event: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., 'on_enter', 'on_exit', 'on_approve'
    action_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., 'notify_client', 'notify_admin', 'require_client_approval'
    action_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True) # Any additional config
    
    # Relaciones
    stage: Mapped["WorkflowStage"] = relationship("WorkflowStage", back_populates="automations")


class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    source_stage_id: Mapped[int] = mapped_column(ForeignKey("workflow_stages.id", ondelete="CASCADE"), nullable=False)
    target_stage_id: Mapped[int] = mapped_column(ForeignKey("workflow_stages.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    condition: Mapped[str | None] = mapped_column(String(200), nullable=True) # Ex: 'approved', 'rejected'

    # Relaciones
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="edges")
    source_stage: Mapped["WorkflowStage"] = relationship("WorkflowStage", foreign_keys=[source_stage_id], back_populates="outgoing_edges")
    target_stage: Mapped["WorkflowStage"] = relationship("WorkflowStage", foreign_keys=[target_stage_id], back_populates="incoming_edges")
