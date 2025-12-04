from fastapi import APIRouter

router = APIRouter(prefix="/api/constants", tags=["constants"])

POSITIONS = [
    "Master Technician (A-Tech)", "B-Tech", "C-Tech", "Lube Technician",
    "Transmission Technician", "GS Technician", "Tire Technician",
    "Service Advisor", "Service Writer (Junior Advisor)", "Service Manager",
    "General Manager", "Customer Service Agent", "Parts Manager",
    "Parts Runner", "Shop Foreman / Lead Tech", "Shop Porter",
    "Bookkeeper", "Marketing Coordinator", "Other"
]

STATUSES = [
    "NEW", "CONTACTED", "PHONE_SCREEN", "IN_PERSON_1", "IN_PERSON_2",
    "TECH_TEST", "OFFER_SENT", "OFFER_ACCEPTED", "HIRED", "REJECTED"
]

SOURCES = [
    "Website", "Google", "Indeed", "Facebook", "TikTok",
    "Referral", "Walk-in", "ZipRecruiter", "Returning Applicant", "Other"
]


@router.get("")
def get_constants():
    """PUBLIC: Get all form constants"""
    return {
        "positions": POSITIONS,
        "statuses": STATUSES,
        "sources": SOURCES
    }
