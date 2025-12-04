from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.auth import get_current_user
from app.models.applicant import Applicant
from app.models.note import ApplicantNote
from app.schemas.applicant import (
    ApplicantCreate,
    ApplicantUpdate,
    ApplicantResponse,
    ApplicantListResponse,
    VALID_STATUSES,
)

router = APIRouter(prefix="/api/applicants", tags=["applicants"])


@router.post("", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED)
def create_applicant(
    applicant: ApplicantCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new applicant (PUBLIC endpoint for application form).

    No authentication required - this is the public apply form.
    """
    db_applicant = Applicant(
        name=applicant.name,
        phone=applicant.phone,
        email=applicant.email,
        position=applicant.position,
        experience_years=applicant.experience_years,
        certifications=applicant.certifications,
        expected_pay=applicant.expected_pay,
        source=applicant.source,
        resume_url=applicant.resume_url,
        notes=applicant.notes,
        status="NEW"
    )
    db.add(db_applicant)
    db.commit()
    db.refresh(db_applicant)

    # Create initial note
    initial_note = ApplicantNote(
        applicant_id=db_applicant.id,
        added_by="System",
        message=f"Application submitted via {applicant.source or 'website'}."
    )
    db.add(initial_note)
    db.commit()

    return db_applicant


@router.get("", response_model=List[ApplicantListResponse])
def list_applicants(
    status: Optional[str] = Query(None, description="Filter by status"),
    position: Optional[str] = Query(None, description="Filter by position"),
    search: Optional[str] = Query(None, description="Search name/email/phone"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all applicants with optional filters.

    Requires authentication.
    """
    query = db.query(Applicant)

    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {VALID_STATUSES}"
            )
        query = query.filter(Applicant.status == status)

    if position:
        query = query.filter(Applicant.position == position)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Applicant.name.ilike(search_term),
                Applicant.email.ilike(search_term),
                Applicant.phone.ilike(search_term)
            )
        )

    # Order by most recent first
    query = query.order_by(Applicant.created_at.desc())

    return query.all()


@router.get("/{applicant_id}", response_model=ApplicantResponse)
def get_applicant(
    applicant_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a single applicant by ID.

    Requires authentication.
    """
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return applicant


@router.patch("/{applicant_id}", response_model=ApplicantResponse)
def update_applicant(
    applicant_id: UUID,
    updates: ApplicantUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an applicant's fields.

    Requires authentication.
    If status is changed, an automatic note is created.
    """
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    old_status = applicant.status
    update_data = updates.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(applicant, field, value)

    # Create auto-note if status changed
    if "status" in update_data and update_data["status"] != old_status:
        status_note = ApplicantNote(
            applicant_id=applicant_id,
            added_by=current_user.get("email", "Unknown"),
            added_by_id=current_user.get("user_id"),
            message=f"Status changed from {old_status} to {update_data['status']}."
        )
        db.add(status_note)

    db.commit()
    db.refresh(applicant)
    return applicant


@router.delete("/{applicant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_applicant(
    applicant_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an applicant.

    Requires authentication.
    This is a hard delete - notes are cascade deleted.
    """
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    db.delete(applicant)
    db.commit()
    return None
