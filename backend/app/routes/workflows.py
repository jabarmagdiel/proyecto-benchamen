from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.schemas.workflow import (
    WorkflowResponse, WorkflowCreate, WorkflowUpdate,
    WorkflowStageResponse, WorkflowStageCreate, WorkflowStageUpdate,
    WorkflowEdgeResponse, WorkflowEdgeCreate, WorkflowEdgeUpdate
)
import app.services.workflow_service as workflow_svc

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])


@router.get("", response_model=List[WorkflowResponse])
def get_workflows(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return workflow_svc.get_all(db, skip=skip, limit=limit)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    wf = workflow_svc.get_by_id(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.post("", response_model=WorkflowResponse, status_code=201)
def create_workflow(data: WorkflowCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return workflow_svc.create(db, data)


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(workflow_id: int, data: WorkflowUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return workflow_svc.update(db, workflow_id, data)


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(workflow_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    workflow_svc.delete(db, workflow_id)


# Stages
@router.post("/{workflow_id}/stages", response_model=WorkflowStageResponse, status_code=201)
def add_workflow_stage(workflow_id: int, data: WorkflowStageCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return workflow_svc.add_stage(db, workflow_id, data)


@router.put("/stages/{stage_id}", response_model=WorkflowStageResponse)
def update_workflow_stage(stage_id: int, data: WorkflowStageUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return workflow_svc.update_stage(db, stage_id, data)


@router.delete("/stages/{stage_id}", status_code=204)
def delete_workflow_stage(stage_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    workflow_svc.delete_stage(db, stage_id)


# Edges
@router.post("/{workflow_id}/edges", response_model=WorkflowEdgeResponse, status_code=201)
def add_workflow_edge(workflow_id: int, data: WorkflowEdgeCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return workflow_svc.add_edge(db, workflow_id, data)

@router.put("/edges/{edge_id}", response_model=WorkflowEdgeResponse)
def update_workflow_edge(edge_id: int, data: WorkflowEdgeUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return workflow_svc.update_edge(db, edge_id, data)

@router.delete("/edges/{edge_id}", status_code=204)
def delete_workflow_edge(edge_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    workflow_svc.delete_edge(db, edge_id)
