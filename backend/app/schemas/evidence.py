from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator
from app.utils.enums import EvidenceType
from app.schemas.user import UserListResponse


class EvidenceLinkCreate(BaseModel):
    evidence_type: EvidenceType
    drive_url: Optional[str] = None
    note: Optional[str] = None

    @field_validator("drive_url")
    @classmethod
    def validate_url(cls, v):
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("La URL debe comenzar con http:// o https://")
        return v


class EvidenceResponse(BaseModel):
    id: int
    activity_id: int
    user_id: int
    evidence_type: EvidenceType
    file_url: Optional[str]
    drive_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    note: Optional[str]
    created_at: datetime
    user: Optional[UserListResponse] = None

    model_config = {"from_attributes": True}
