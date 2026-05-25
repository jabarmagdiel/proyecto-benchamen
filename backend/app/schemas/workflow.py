from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class WorkflowAutomationBase(BaseModel):
    trigger_event: str
    action_type: str
    action_payload: Optional[Dict[str, Any]] = None

class WorkflowAutomationCreate(WorkflowAutomationBase):
    pass

class WorkflowAutomationResponse(WorkflowAutomationBase):
    id: int
    stage_id: int


class WorkflowStageBase(BaseModel):
    name: str
    description: Optional[str] = None
    order: int = 0
    color: str = "blue"
    requires_approval: bool = False
    node_type: str = "task"
    department: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None

class WorkflowStageCreate(WorkflowStageBase):
    automations: Optional[List[WorkflowAutomationCreate]] = None

class WorkflowStageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    color: Optional[str] = None
    requires_approval: Optional[bool] = None
    node_type: Optional[str] = None
    department: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None

class WorkflowStageResponse(WorkflowStageBase):
    id: int
    workflow_id: int
    automations: List[WorkflowAutomationResponse] = []


class WorkflowEdgeBase(BaseModel):
    source_stage_id: int
    target_stage_id: int
    label: Optional[str] = None
    condition: Optional[str] = None

class WorkflowEdgeCreate(WorkflowEdgeBase):
    pass

class WorkflowEdgeUpdate(BaseModel):
    label: Optional[str] = None
    condition: Optional[str] = None

class WorkflowEdgeResponse(WorkflowEdgeBase):
    id: int
    workflow_id: int


class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False

class WorkflowCreate(WorkflowBase):
    stages: Optional[List[WorkflowStageCreate]] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None

class WorkflowResponse(WorkflowBase):
    id: int
    created_at: datetime
    updated_at: datetime
    stages: List[WorkflowStageResponse] = []
    edges: List[WorkflowEdgeResponse] = []

