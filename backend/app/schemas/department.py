from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    level: Optional[int] = 1
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    user_ids: Optional[List[int]] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    is_active: Optional[bool] = None
    user_ids: Optional[List[int]] = None

class DepartmentResponse(DepartmentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
