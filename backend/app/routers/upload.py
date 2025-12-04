from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from app.config import get_settings
import uuid

router = APIRouter(prefix="/api/upload", tags=["upload"])

settings = get_settings()


class UploadUrlRequest(BaseModel):
    file_name: str
    content_type: str = "application/pdf"


class UploadUrlResponse(BaseModel):
    upload_url: str
    public_url: str


@router.post("/resume", response_model=UploadUrlResponse)
def get_resume_upload_url(request: UploadUrlRequest):
    """
    Get a presigned URL for uploading a resume to Supabase Storage.

    This is a PUBLIC endpoint (used by the apply form).
    Returns both the upload URL and the final public URL.
    """
    # Validate content type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/gif"]
    if request.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content type. Allowed: {allowed_types}"
        )

    # Generate unique file path
    file_ext = request.file_name.split(".")[-1] if "." in request.file_name else "pdf"
    unique_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = f"resumes/{unique_name}"

    try:
        # Create Supabase client with service key for admin access
        supabase = create_client(settings.supabase_url, settings.supabase_service_key)

        # Create signed upload URL (valid for 1 hour)
        result = supabase.storage.from_("resumes").create_signed_upload_url(file_path)

        if not result:
            raise HTTPException(status_code=500, detail="Failed to create upload URL")

        # Construct public URL
        public_url = f"{settings.supabase_url}/storage/v1/object/public/resumes/{unique_name}"

        return UploadUrlResponse(
            upload_url=result.get("signedUrl") or result.get("signed_url", ""),
            public_url=public_url
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload URL creation failed: {str(e)}")
