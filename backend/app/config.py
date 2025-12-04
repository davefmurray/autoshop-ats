from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Supabase (required)
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str

    # CORS
    frontend_url: str = "http://localhost:5173"
    
    # Database URL (optional - not needed when using Supabase client)
    database_url: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
