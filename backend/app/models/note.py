from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class ApplicantNote(Base):
    __tablename__ = "applicant_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("applicants.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Who added the note
    added_by = Column(Text)  # Display name
    added_by_id = Column(UUID(as_uuid=True))  # User ID from Supabase auth

    # Note content
    message = Column(Text, nullable=False)
