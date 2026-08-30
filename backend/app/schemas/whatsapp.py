from datetime import datetime
from pydantic import BaseModel, Field


class WhatsAppMessageCreate(BaseModel):
    phone_number: str = Field(..., description="Número telefónico del cliente")
    client_name: str = Field(..., description="Nombre del cliente")
    company_id: int | None = None
    message_text: str = Field(..., description="Texto del mensaje a enviar por WhatsApp")
    media_url: str | None = None


class WhatsAppMessageSimulateInbound(BaseModel):
    phone_number: str = Field(..., description="Número telefónico del cliente")
    client_name: str = Field(..., description="Nombre del cliente")
    company_id: int | None = None
    message_text: str = Field(..., description="Texto simulado recibido del cliente")


class WhatsAppMessageResponse(BaseModel):
    id: int
    phone_number: str
    client_name: str
    company_id: int | None = None
    admin_id: int | None = None
    direction: str
    message_text: str
    media_url: str | None = None
    status: str
    created_at: datetime
    whatsapp_url: str | None = None

    class Config:
        from_attributes = True


class WhatsAppChatSummary(BaseModel):
    phone_number: str
    client_name: str
    company_name: str | None = None
    company_id: int | None = None
    last_message: str
    last_message_time: datetime
    unread_count: int = 0
    unread: bool = False


class WhatsAppTemplate(BaseModel):
    id: str
    title: str
    category: str
    content: str
