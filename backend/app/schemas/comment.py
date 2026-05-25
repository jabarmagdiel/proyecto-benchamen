from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserListResponse


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    activity_id: int
    user_id: int
    content: str
    created_at: datetime
    user: UserListResponse

    model_config = {"from_attributes": True}
