from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.supabase_client import get_supabase
from app.auth import get_current_user
from app.schemas.note import NoteCreate, NoteResponse

router = APIRouter(prefix="/api/applicants/{applicant_id}/notes", tags=["notes"])


@router.get("", response_model=List[NoteResponse])
def list_notes(applicant_id: UUID, current_user: dict = Depends(get_current_user)):
    """List all notes for an applicant. Requires auth."""
    supabase = get_supabase()
    
    # Verify applicant exists
    applicant = supabase.table("applicants").select("id").eq("id", str(applicant_id)).execute()
    if not applicant.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    result = supabase.table("applicant_notes")\
        .select("*")\
        .eq("applicant_id", str(applicant_id))\
        .order("created_at", desc=True)\
        .execute()
    
    return result.data


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    applicant_id: UUID,
    note: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a new note to an applicant. Requires auth."""
    supabase = get_supabase()
    
    # Verify applicant exists
    applicant = supabase.table("applicants").select("id").eq("id", str(applicant_id)).execute()
    if not applicant.data:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    data = {
        "applicant_id": str(applicant_id),
        "added_by": note.added_by or current_user.get("email", "Unknown"),
        "added_by_id": current_user.get("user_id"),
        "message": note.message
    }
    
    result = supabase.table("applicant_notes").insert(data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create note")
    
    return result.data[0]
