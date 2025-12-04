from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class NoteCreate(BaseModel):
    """Schema for creating a new note."""
    message: str = Field(..., min_length=1)
    added_by: Optional[str] = None  # Display name


class NoteResponse(BaseModel):
    """Note response schema."""
    id: UUID
    applicant_id: UUID
    created_at: datetime
    added_by: Optional[str]
    added_by_id: Optional[UUID]
    message: str

    class Config:
        from_attributes = True
