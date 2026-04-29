from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field
import uuid


class User(BaseModel):
    id: str
    name: str
    group: str
    role: str


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_type: str  # record.created | record.updated | record.deleted
    entity_id: str
    entity_name: str
    record_id: str
    record_title: str
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False


class IncomingEvent(BaseModel):
    event_type: str  # record.created | record.updated | record.deleted
    entity_id: str
    entity_name: str
    record_id: str
    record_title: str
    owner_group: str | None = None  # группа записи; None = видно всем (admin)
    changed_fields: list[str] = []
    old_values: dict[str, Any] = {}
    new_values: dict[str, Any] = {}
