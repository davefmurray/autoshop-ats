from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.supabase_client import get_supabase
from app.auth import get_current_user
from app.schemas.applicant import (
    ApplicantCreate,
    ApplicantUpdate,
    ApplicantResponse,
    ApplicantListResponse,
    VALID_STATUSES,
)
from fastapi import Depends

router = APIRouter(prefix="/api/applicants", tags=["applicants"])


@router.post("", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED)
def create_applicant(applicant: ApplicantCreate):
    """Create a new applicant (PUBLIC endpoint for application form)."""
    supabase = get_supabase()
    
    data = {
        "name": applicant.name,
        "phone": applicant.phone,
        "email": applicant.email,
        "position": applicant.position,
        "experience_years": applicant.experience_years or 0,
        "certifications": applicant.certifications or [],
        "expected_pay": applicant.expected_pay,
        "source": applicant.source,
        "resume_url": applicant.resume_url,
        "notes": applicant.notes,
        "status": "NEW"
    }
    
    result = supabase.table("applicants").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create applicant")
    
    new_applicant = result.data[0]
    
    # Create initial note
    supabase.table("applicant_notes").insert({
        "applicant_id": new_applicant["id"],
        "added_by": "System",
        "message": f"Application submitted via {applicant.source or 'website'}."
    }).execute()
    
    return new_applicant


@router.get("", response_model=List[ApplicantListResponse])
def list_applicants(
    status: Optional[str] = Query(None),
    position: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """List all applicants with optional filters. Requires auth."""
    supabase = get_supabase()
    
    query = supabase.table("applicants").select("*")
    
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status")
        query = query.eq("status", status)
    
    if position:
        query = query.eq("position", position)
    
    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,phone.ilike.%{search}%")
    
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{applicant_id}", response_model=ApplicantResponse)
def get_applicant(applicant_id: UUID, current_user: dict = Depends(get_current_user)):
    """Get a single applicant by ID. Requires auth."""
    supabase = get_supabase()
    
    result = supabase.table("applicants").select("*").eq("id", str(applicant_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    return result.data[0]


@router.patch("/{applicant_id}", response_model=ApplicantResponse)
def update_applicant(
    applicant_id: UUID,
    updates: ApplicantUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an applicant. Requires auth."""
    supabase = get_supabase()
    
    # Get current applicant
    current = supabase.table("applicants").select("status").eq("id", str(applicant_id)).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    old_status = current.data[0]["status"]
    update_data = updates.model_dump(exclude_unset=True)
    
    # Update applicant
    result = supabase.table("applicants").update(update_data).eq("id", str(applicant_id)).execute()
    
    # Create auto-note if status changed
    if "status" in update_data and update_data["status"] != old_status:
        supabase.table("applicant_notes").insert({
            "applicant_id": str(applicant_id),
            "added_by": current_user.get("email", "Unknown"),
            "added_by_id": current_user.get("user_id"),
            "message": f"Status changed from {old_status} to {update_data['status']}."
        }).execute()
    
    return result.data[0]


@router.delete("/{applicant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_applicant(applicant_id: UUID, current_user: dict = Depends(get_current_user)):
    """Delete an applicant. Requires auth."""
    supabase = get_supabase()
    
    result = supabase.table("applicants").delete().eq("id", str(applicant_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    return None
