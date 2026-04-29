from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_schema import EntitySchema
from app.schemas.meta import EntityMeta


class EntitySchemaRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, entity_id: str) -> EntitySchema | None:
        result = await self.db.execute(
            select(EntitySchema).where(EntitySchema.entity_id == entity_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[EntitySchema]:
        result = await self.db.execute(select(EntitySchema))
        return list(result.scalars().all())

    async def upsert(self, entity_id: str, meta: EntityMeta) -> EntitySchema:
        existing = await self.get(entity_id)
        if existing:
            existing.meta = meta.model_dump(by_alias=True)
            existing.version = existing.version + 1
            await self.db.flush()
            return existing
        row = EntitySchema(
            entity_id=entity_id,
            meta=meta.model_dump(by_alias=True),
            version=1,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def delete(self, entity_id: str) -> bool:
        result = await self.db.execute(
            delete(EntitySchema).where(EntitySchema.entity_id == entity_id)
        )
        return result.rowcount > 0
