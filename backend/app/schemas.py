from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

# ---------- Auth ----------


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    avatar_url: str | None = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Documents ----------


class UploadResult(BaseModel):
    document_id: str
    filename: str
    chunks: int


# ---------- Chats ----------


class Turn(BaseModel):
    """One message in the running conversation sent to the model."""

    role: Literal["human", "assistant"]
    content: str


class Message(BaseModel):
    """One message as persisted for the UI transcript."""

    sender: str
    text: str


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    document_id: str
    chat_history: list[Turn] = Field(default_factory=list)


class QueryResponse(BaseModel):
    answer: str
    chat_history: list[Turn]


class SaveChatRequest(BaseModel):
    pdf_name: str
    document_id: str
    messages: list[Message]


class ChatSummary(BaseModel):
    id: str
    pdf_name: str
    document_id: str
    created_at: datetime


class Chat(ChatSummary):
    messages: list[Message]
