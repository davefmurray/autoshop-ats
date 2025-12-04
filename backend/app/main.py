from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import applicants_router, notes_router, upload_router

settings = get_settings()

app = FastAPI(
    title="AutoShopATS API",
    description="Applicant Tracking System for Automotive Shops",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(applicants_router)
app.include_router(notes_router)
app.include_router(upload_router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "app": "AutoShopATS API", "version": "1.0.0"}


@app.get("/api/health")
def health():
    """Health check for monitoring."""
    return {"status": "healthy"}
