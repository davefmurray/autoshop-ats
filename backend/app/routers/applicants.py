from fastapi import APIRouter, HTTPException, Query, status, Depends
from typing import List, Optional
from uuid import UUID

from app.supabase_client import get_supabase
from app.auth import get_current_user
from app.schemas.applicant import (
    ApplicantCreate, ApplicantUpdate, ApplicantResponse,
    ApplicantListResponse, VALID_STATUSES, VALID_POSITIONS
)

router = APIRouter(prefix="/api/applicants", tags=["applicants"])


@router.post("", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED)
def create_applicant(applicant: ApplicantCreate):
    """PUBLIC: Submit a job application"""
    supabase = get_supabase()
    
    # Verify shop exists
    shop = supabase.table("shops").select("id").eq("id", str(applicant.shop_id)).execute()
    if not shop.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    data = {
        "shop_id": str(applicant.shop_id),
        "full_name": applicant.full_name,
        "email": applicant.email,
        "phone": applicant.phone,
        "position_applied": applicant.position_applied,
        "source": applicant.source,
        "form_data": applicant.form_data or {},
        "internal_data": {},
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
    """List applicants for current user's shop"""
    supabase = get_supabase()
    shop_id = current_user.get("shop_id")
    
    if not shop_id:
        raise HTTPException(status_code=400, detail="User not associated with a shop")
    
    query = supabase.table("applicants").select(
        "id, created_at, full_name, email, phone, position_applied, status, source"
    ).eq("shop_id", shop_id)
    
    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status")
        query = query.eq("status", status)
    
    if position:
        query = query.eq("position_applied", position)
    
    if search:
        query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%,phone.ilike.%{search}%")
    
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{applicant_id}", response_model=ApplicantResponse)
def get_applicant(applicant_id: UUID, current_user: dict = Depends(get_current_user)):
    """Get single applicant detail"""
    supabase = get_supabase()
    shop_id = current_user.get("shop_id")
    
    result = supabase.table("applicants").select("*")\
        .eq("id", str(applicant_id))\
        .eq("shop_id", shop_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    return result.data[0]


@router.patch("/{applicant_id}", response_model=ApplicantResponse)
def update_applicant(
    applicant_id: UUID,
    updates: ApplicantUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update applicant fields"""
    supabase = get_supabase()
    shop_id = current_user.get("shop_id")
    
    # Get current applicant
    current = supabase.table("applicants").select("*")\
        .eq("id", str(applicant_id))\
        .eq("shop_id", shop_id)\
        .execute()
    
    if not current.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    old_status = current.data[0]["status"]
    update_data = updates.model_dump(exclude_unset=True)
    
    # Handle JSONB merge for form_data and internal_data
    if "form_data" in update_data and update_data["form_data"]:
        existing_form = current.data[0].get("form_data", {})
        existing_form.update(update_data["form_data"])
        update_data["form_data"] = existing_form
    
    if "internal_data" in update_data and update_data["internal_data"]:
        existing_internal = current.data[0].get("internal_data", {})
        existing_internal.update(update_data["internal_data"])
        update_data["internal_data"] = existing_internal
    
    result = supabase.table("applicants").update(update_data)\
        .eq("id", str(applicant_id))\
        .eq("shop_id", shop_id)\
        .execute()
    
    # Auto-note if status changed
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
    """Delete applicant"""
    supabase = get_supabase()
    shop_id = current_user.get("shop_id")
    
    result = supabase.table("applicants").delete()\
        .eq("id", str(applicant_id))\
        .eq("shop_id", shop_id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    return None
