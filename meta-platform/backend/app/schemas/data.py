import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EntityRecordSchema(BaseModel):
    id: uuid.UUID
    entity_id: str
    data: dict[str, Any]
    owner_group: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CreateRecordRequest(BaseModel):
    data: dict[str, Any]


class UpdateRecordRequest(BaseModel):
    data: dict[str, Any]
