from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

Base = declarative_base()

# Lazy initialization - don't connect at import time
_engine = None
_SessionLocal = None


def get_engine():
    """Get or create the database engine with proper pooling settings."""
    global _engine
    if _engine is None:
        settings = get_settings()
        # Configure for Supabase pooler (Supavisor)
        _engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=300,    # Recycle connections every 5 minutes
            pool_size=5,
            max_overflow=10,
        )
    return _engine


def get_session_local():
    """Get or create the session factory."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine()
        )
    return _SessionLocal


def get_db():
    """Dependency that provides a database session."""
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
