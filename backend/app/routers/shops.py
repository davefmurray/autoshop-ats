from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID
import re

from app.supabase_client import get_supabase
from app.auth import get_current_user
from app.schemas.shop import ShopCreate, ShopResponse, ShopPublic

router = APIRouter(prefix="/api/shops", tags=["shops"])


def slugify(name: str) -> str:
    """Convert shop name to URL-safe slug"""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug[:50]


@router.get("/by-slug/{slug}", response_model=ShopPublic)
def get_shop_by_slug(slug: str):
    """PUBLIC: Get shop info by slug for apply page"""
    supabase = get_supabase()
    
    result = supabase.table("shops").select("id, name, slug").eq("slug", slug).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return result.data[0]


@router.get("/by-id/{shop_id}", response_model=ShopPublic)
def get_shop_by_id(shop_id: UUID):
    """PUBLIC: Get shop info by ID for apply page"""
    supabase = get_supabase()
    
    result = supabase.table("shops").select("id, name, slug").eq("id", str(shop_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return result.data[0]


@router.post("", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
def create_shop(shop: ShopCreate, current_user: dict = Depends(get_current_user)):
    """Create a new shop (during signup)"""
    supabase = get_supabase()
    user_id = current_user.get("user_id")
    
    # Check if user already has a shop
    profile = supabase.table("profiles").select("shop_id").eq("id", user_id).execute()
    if profile.data and profile.data[0].get("shop_id"):
        raise HTTPException(status_code=400, detail="User already has a shop")
    
    # Generate slug if not provided
    slug = shop.slug or slugify(shop.name)
    
    # Check slug uniqueness
    existing = supabase.table("shops").select("id").eq("slug", slug).execute()
    if existing.data:
        # Append random suffix
        import uuid
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
    
    # Create shop
    shop_data = {
        "name": shop.name,
        "slug": slug,
        "settings": {}
    }
    
    result = supabase.table("shops").insert(shop_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create shop")
    
    new_shop = result.data[0]
    
    # Link user to shop
    supabase.table("profiles").update({"shop_id": new_shop["id"]}).eq("id", user_id).execute()
    
    return new_shop


@router.get("/mine", response_model=ShopResponse)
def get_my_shop(current_user: dict = Depends(get_current_user)):
    """Get current user's shop"""
    supabase = get_supabase()
    shop_id = current_user.get("shop_id")
    
    if not shop_id:
        raise HTTPException(status_code=404, detail="No shop associated with user")
    
    result = supabase.table("shops").select("*").eq("id", shop_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return result.data[0]
