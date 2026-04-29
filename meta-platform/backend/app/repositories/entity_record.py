import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.models.entity_record import EntityRecord


class EntityRecordRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_entity(
        self,
        entity_id: str,
        owner_group: str | None = None,
        is_admin: bool = False,
    ) -> list[EntityRecord]:
        stmt = select(EntityRecord).where(EntityRecord.entity_id == entity_id)
        if not is_admin and owner_group is not None:
            stmt = stmt.where(EntityRecord.owner_group == owner_group)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, entity_id: str, record_id: uuid.UUID) -> EntityRecord | None:
        result = await self.db.execute(
            select(EntityRecord).where(
                EntityRecord.entity_id == entity_id,
                EntityRecord.id == record_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        entity_id: str,
        data: dict[str, Any],
        owner_group: str | None = None,
    ) -> EntityRecord:
        record = EntityRecord(entity_id=entity_id, data=data, owner_group=owner_group)
        self.db.add(record)
        await self.db.flush()
        return record

    async def update(self, entity_id: str, record_id: uuid.UUID, patch: dict[str, Any]) -> EntityRecord | None:
        record = await self.get(entity_id, record_id)
        if not record:
            return None
        record.data = {**record.data, **patch}
        flag_modified(record, "data")
        record.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return record

    async def delete(self, entity_id: str, record_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            delete(EntityRecord).where(
                EntityRecord.entity_id == entity_id,
                EntityRecord.id == record_id,
            )
        )
        return result.rowcount > 0
