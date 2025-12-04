from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

VALID_STATUSES = [
    "NEW", "CONTACTED", "PHONE_SCREEN", "IN_PERSON_1", "IN_PERSON_2",
    "TECH_TEST", "OFFER_SENT", "OFFER_ACCEPTED", "HIRED", "REJECTED"
]

VALID_POSITIONS = [
    "Master Technician (A-Tech)", "B-Tech", "C-Tech", "Lube Technician",
    "Transmission Technician", "GS Technician", "Tire Technician",
    "Service Advisor", "Service Writer (Junior Advisor)", "Service Manager",
    "General Manager", "Customer Service Agent", "Parts Manager",
    "Parts Runner", "Shop Foreman / Lead Tech", "Shop Porter",
    "Bookkeeper", "Marketing Coordinator", "Other"
]

VALID_SOURCES = [
    "Website", "Google", "Indeed", "Facebook", "TikTok",
    "Referral", "Walk-in", "ZipRecruiter", "Returning Applicant", "Other"
]


class ApplicantCreate(BaseModel):
    """Public application submission"""
    shop_id: UUID
    full_name: str
    email: str
    phone: str
    position_applied: str
    source: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = {}


class ApplicantUpdate(BaseModel):
    """Admin update - any field"""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position_applied: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    internal_data: Optional[Dict[str, Any]] = None


class ApplicantResponse(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    shop_id: UUID
    full_name: str
    email: str
    phone: str
    position_applied: str
    status: str
    source: Optional[str]
    form_data: Dict[str, Any]
    internal_data: Dict[str, Any]


class ApplicantListResponse(BaseModel):
    id: UUID
    created_at: datetime
    full_name: str
    email: str
    phone: str
    position_applied: str
    status: str
    source: Optional[str]
