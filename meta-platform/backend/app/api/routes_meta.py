from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.entity_schema import EntitySchemaRepository
from app.schemas.meta import EntityMeta

router = APIRouter(prefix="/api/meta", tags=["meta"])


def _to_meta(row) -> EntityMeta:
    return EntityMeta.model_validate(row.meta)


@router.get("", response_model=list[EntityMeta])
async def list_metas(db: AsyncSession = Depends(get_db)):
    repo = EntitySchemaRepository(db)
    rows = await repo.list_all()
    return [_to_meta(r) for r in rows]


@router.get("/{entity_id}", response_model=EntityMeta)
async def get_meta(entity_id: str, db: AsyncSession = Depends(get_db)):
    repo = EntitySchemaRepository(db)
    row = await repo.get(entity_id)
    if not row:
        raise HTTPException(404, f"Entity '{entity_id}' not found")
    return _to_meta(row)


@router.post("/{entity_id}", response_model=EntityMeta)
async def upsert_meta(entity_id: str, meta: EntityMeta, db: AsyncSession = Depends(get_db)):
    meta.id = entity_id
    repo = EntitySchemaRepository(db)
    row = await repo.upsert(entity_id, meta)
    await db.commit()
    return _to_meta(row)


@router.delete("/{entity_id}")
async def delete_meta(entity_id: str, db: AsyncSession = Depends(get_db)):
    repo = EntitySchemaRepository(db)
    deleted = await repo.delete(entity_id)
    await db.commit()
    if not deleted:
        raise HTTPException(404, f"Entity '{entity_id}' not found")
    return {"ok": True}
