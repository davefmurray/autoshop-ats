from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.auth import get_current_user
from app.models.applicant import Applicant
from app.models.note import ApplicantNote
from app.schemas.note import NoteCreate, NoteResponse

router = APIRouter(prefix="/api/applicants/{applicant_id}/notes", tags=["notes"])


@router.get("", response_model=List[NoteResponse])
def list_notes(
    applicant_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all notes for an applicant.

    Requires authentication.
    Returns notes ordered by most recent first.
    """
    # Verify applicant exists
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    notes = (
        db.query(ApplicantNote)
        .filter(ApplicantNote.applicant_id == applicant_id)
        .order_by(ApplicantNote.created_at.desc())
        .all()
    )
    return notes


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    applicant_id: UUID,
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Add a new note to an applicant.

    Requires authentication.
    The current user is recorded as the note author.
    """
    # Verify applicant exists
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    db_note = ApplicantNote(
        applicant_id=applicant_id,
        added_by=note.added_by or current_user.get("email", "Unknown"),
        added_by_id=current_user.get("user_id"),
        message=note.message
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note
