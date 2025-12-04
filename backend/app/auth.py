from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings
from app.supabase_client import get_supabase

settings = get_settings()
security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Supabase JWT token and return the payload."""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(payload: dict = Depends(verify_token)) -> dict:
    """Extract user info from JWT and fetch shop_id from profile."""
    user_id = payload.get("sub")
    
    # Fetch profile to get shop_id
    supabase = get_supabase()
    profile = supabase.table("profiles").select("shop_id, full_name").eq("id", user_id).execute()
    
    shop_id = None
    full_name = None
    if profile.data:
        shop_id = profile.data[0].get("shop_id")
        full_name = profile.data[0].get("full_name")
    
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role", "authenticated"),
        "shop_id": shop_id,
        "full_name": full_name,
    }
