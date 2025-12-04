from sqlalchemy import Column, String, Integer, Text, ARRAY, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Personal info
    name = Column(Text, nullable=False)
    phone = Column(Text, nullable=False)
    email = Column(Text, nullable=False)

    # Job info
    position = Column(Text, nullable=False)
    experience_years = Column(Integer, default=0)
    certifications = Column(ARRAY(Text), default=[])
    expected_pay = Column(Text)

    # Application info
    resume_url = Column(Text)
    source = Column(Text)
    notes = Column(Text)  # Quick notes field

    # Status pipeline
    status = Column(Text, nullable=False, default="NEW")

    # Valid status values
    VALID_STATUSES = [
        "NEW",
        "CONTACTED",
        "PHONE_SCREEN",
        "IN_PERSON_1",
        "IN_PERSON_2",
        "OFFER_SENT",
        "HIRED",
        "REJECTED"
    ]
