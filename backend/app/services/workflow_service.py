from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional

from app.models.workflow import Workflow, WorkflowStage, WorkflowAutomation
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowStageCreate, WorkflowStageUpdate


def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Workflow]:
    return db.query(Workflow).order_by(Workflow.id.desc()).offset(skip).limit(limit).all()


def get_by_id(db: Session, workflow_id: int) -> Optional[Workflow]:
    return db.query(Workflow).filter(Workflow.id == workflow_id).first()


def get_default(db: Session) -> Optional[Workflow]:
    return db.query(Workflow).filter(Workflow.is_default == True).first()


def create(db: Session, data: WorkflowCreate) -> Workflow:
    if data.is_default:
        db.query(Workflow).filter(Workflow.is_default == True).update({"is_default": False})

    wf = Workflow(name=data.name, description=data.description, is_default=data.is_default)
    db.add(wf)
    db.flush()

    if data.stages:
        for stage_data in data.stages:
            stage = WorkflowStage(
                workflow_id=wf.id,
                name=stage_data.name,
                description=stage_data.description,
                order=stage_data.order,
                color=stage_data.color,
                requires_approval=stage_data.requires_approval,
                node_type=stage_data.node_type,
                department=stage_data.department,
                pos_x=stage_data.pos_x,
                pos_y=stage_data.pos_y
            )
            db.add(stage)
            db.flush()
            if stage_data.automations:
                for auto_data in stage_data.automations:
                    auto = WorkflowAutomation(
                        stage_id=stage.id,
                        trigger_event=auto_data.trigger_event,
                        action_type=auto_data.action_type,
                        action_payload=auto_data.action_payload
                    )
                    db.add(auto)

    db.commit()
    db.refresh(wf)
    return wf


def update(db: Session, workflow_id: int, data: WorkflowUpdate) -> Workflow:
    wf = get_by_id(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if data.is_default is True:
        db.query(Workflow).filter(Workflow.is_default == True, Workflow.id != workflow_id).update({"is_default": False})

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(wf, key, value)

    db.commit()
    db.refresh(wf)
    return wf


def delete(db: Session, workflow_id: int):
    wf = get_by_id(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if len(wf.projects) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete workflow that is in use by projects")

    db.delete(wf)
    db.commit()


# Stages
def add_stage(db: Session, workflow_id: int, data: WorkflowStageCreate) -> WorkflowStage:
    wf = get_by_id(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    stage = WorkflowStage(
        workflow_id=workflow_id,
        name=data.name,
        description=data.description,
        order=data.order,
        color=data.color,
        requires_approval=data.requires_approval,
        node_type=data.node_type,
        department=data.department,
        pos_x=data.pos_x,
        pos_y=data.pos_y
    )
    db.add(stage)
    db.flush()
    if data.automations:
        for auto_data in data.automations:
            auto = WorkflowAutomation(
                stage_id=stage.id,
                trigger_event=auto_data.trigger_event,
                action_type=auto_data.action_type,
                action_payload=auto_data.action_payload
            )
            db.add(auto)
            
    db.commit()
    db.refresh(stage)
    return stage


def update_stage(db: Session, stage_id: int, data: WorkflowStageUpdate) -> WorkflowStage:
    stage = db.query(WorkflowStage).filter(WorkflowStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(stage, key, value)

    db.commit()
    db.refresh(stage)
    return stage


def delete_stage(db: Session, stage_id: int):
    stage = db.query(WorkflowStage).filter(WorkflowStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
        
    if len(stage.activities) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete stage that has activities")

    db.delete(stage)
    db.commit()


# Edges
from app.models.workflow import WorkflowEdge
from app.schemas.workflow import WorkflowEdgeCreate, WorkflowEdgeUpdate

def add_edge(db: Session, workflow_id: int, data: WorkflowEdgeCreate) -> WorkflowEdge:
    wf = get_by_id(db, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    edge = WorkflowEdge(
        workflow_id=workflow_id,
        source_stage_id=data.source_stage_id,
        target_stage_id=data.target_stage_id,
        label=data.label,
        condition=data.condition
    )
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge

def update_edge(db: Session, edge_id: int, data: WorkflowEdgeUpdate) -> WorkflowEdge:
    edge = db.query(WorkflowEdge).filter(WorkflowEdge.id == edge_id).first()
    if not edge:
        raise HTTPException(status_code=404, detail="Edge not found")
        
    if data.label is not None:
        edge.label = data.label
    if data.condition is not None:
        edge.condition = data.condition
        
    db.commit()
    db.refresh(edge)
    return edge

def delete_edge(db: Session, edge_id: int):
    edge = db.query(WorkflowEdge).filter(WorkflowEdge.id == edge_id).first()
    if not edge:
        raise HTTPException(status_code=404, detail="Edge not found")
    
    db.delete(edge)
    db.commit()
