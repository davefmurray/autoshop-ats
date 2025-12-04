from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import applicants_router, notes_router, upload_router, shops_router, constants_router

settings = get_settings()

app = FastAPI(
    title="AutoShopATS API",
    description="Applicant Tracking System for Automotive Shops",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",  # Allow all localhost ports
    allow_origins=[settings.frontend_url] if settings.frontend_url else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(applicants_router)
app.include_router(notes_router)
app.include_router(upload_router)
app.include_router(shops_router)
app.include_router(constants_router)


@app.get("/")
def root():
    return {"status": "ok", "app": "AutoShopATS API", "version": "2.0.0"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
