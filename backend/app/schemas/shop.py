from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class ShopCreate(BaseModel):
    """Create a new shop during signup"""
    name: str
    slug: str


class ShopResponse(BaseModel):
    id: UUID
    created_at: datetime
    name: str
    slug: str
    settings: Dict[str, Any]


class ShopPublic(BaseModel):
    """Public shop info for apply page"""
    id: UUID
    name: str
    slug: str
