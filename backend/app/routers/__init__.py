from app.routers.applicants import router as applicants_router
from app.routers.notes import router as notes_router
from app.routers.upload import router as upload_router
from app.routers.shops import router as shops_router
from app.routers.constants import router as constants_router

__all__ = ["applicants_router", "notes_router", "upload_router", "shops_router", "constants_router"]
