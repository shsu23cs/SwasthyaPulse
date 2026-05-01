"""Database engine, session factory, and Base for SQLAlchemy ORM."""
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Store the SQLite file in the backend/ directory
DB_PATH = Path(__file__).parent / "swasthyapulse.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + multi-thread
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a DB session and ensures it's closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Create all tables defined via Base.metadata (called at startup)."""
    # Import models so they register with Base.metadata
    from backend import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
