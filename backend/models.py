"""SQLAlchemy ORM models: Project, Post, Alert."""
import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from backend.database import Base


def _now():
    return datetime.now(timezone.utc)


def _uuid():
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    # Stored as JSON strings
    keywords_json = Column(Text, default="[]")
    sources_json = Column(Text, default="[]")
    frequency = Column(String, default="daily")  # realtime | hourly | daily
    status = Column(String, default="active")    # active | paused
    posts_collected = Column(Integer, default=0)
    alerts_triggered = Column(Integer, default=0)
    created_at = Column(DateTime, default=_now)

    posts = relationship("Post", back_populates="project", cascade="all, delete-orphan")

    @property
    def keywords(self):
        return json.loads(self.keywords_json or "[]")

    @keywords.setter
    def keywords(self, value):
        self.keywords_json = json.dumps(value)

    @property
    def sources(self):
        return json.loads(self.sources_json or "[]")

    @sources.setter
    def sources(self, value):
        self.sources_json = json.dumps(value)


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    source = Column(String, default="Web")
    author = Column(String, default="Anonymous")
    author_handle = Column(String, default="@anon")
    url = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=_now)
    sentiment = Column(String, default="neutral")   # positive | negative | neutral
    sentiment_score = Column(Float, default=0.0)
    # JSON arrays
    keywords_json = Column(Text, default="[]")
    entities_json = Column(Text, default='{"drugs":[],"symptoms":[],"conditions":[]}')
    has_alert = Column(Boolean, default=False)
    severity = Column(String, nullable=True)         # low | medium | high | None
    privacy_masked = Column(Boolean, default=False)
    # Alert review status
    alert_status = Column(String, default="open")    # open | reviewed | escalated | dismissed

    project = relationship("Project", back_populates="posts")

    @property
    def keywords(self):
        return json.loads(self.keywords_json or "[]")

    @keywords.setter
    def keywords(self, value):
        self.keywords_json = json.dumps(value)

    @property
    def entities(self):
        return json.loads(self.entities_json or '{"drugs":[],"symptoms":[],"conditions":[]}')

    @entities.setter
    def entities(self, value):
        self.entities_json = json.dumps(value)
