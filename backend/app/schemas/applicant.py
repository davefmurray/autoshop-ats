from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

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

# Valid positions
VALID_POSITIONS = [
    "Technician",
    "GS",
    "Service Advisor",
    "Manager",
    "Tire Tech",
    "Lube Tech"
]


class ApplicantCreate(BaseModel):
    """Schema for creating a new applicant (public form submission)."""
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., min_length=1, max_length=200)
    position: str = Field(..., min_length=1)
    experience_years: int = Field(default=0, ge=0, le=50)
    certifications: List[str] = Field(default=[])
    expected_pay: Optional[str] = None
    source: Optional[str] = None
    resume_url: Optional[str] = None
    notes: Optional[str] = None


class ApplicantUpdate(BaseModel):
    """Schema for updating an applicant (admin only)."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[str] = Field(None, min_length=1, max_length=200)
    position: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    certifications: Optional[List[str]] = None
    expected_pay: Optional[str] = None
    source: Optional[str] = None
    resume_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

    def model_post_init(self, __context):
        if self.status and self.status not in VALID_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {VALID_STATUSES}")


class ApplicantResponse(BaseModel):
    """Full applicant response with all fields."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    name: str
    phone: str
    email: str
    position: str
    experience_years: int
    certifications: List[str]
    expected_pay: Optional[str]
    source: Optional[str]
    resume_url: Optional[str]
    notes: Optional[str]
    status: str

    class Config:
        from_attributes = True


class ApplicantListResponse(BaseModel):
    """Abbreviated applicant response for list view."""
    id: UUID
    created_at: datetime
    name: str
    position: str
    status: str
    experience_years: int
    source: Optional[str]

    class Config:
        from_attributes = True
