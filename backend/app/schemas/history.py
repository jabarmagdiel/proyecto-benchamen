from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.utils.enums import HistoryAction
from app.schemas.user import UserListResponse


class HistoryResponse(BaseModel):
    id: int
    activity_id: int
    user_id: int
    action: HistoryAction
    previous_status: Optional[str]
    new_status: Optional[str]
    description: Optional[str]
    created_at: datetime
    user: Optional[UserListResponse] = None

    model_config = {"from_attributes": True}
