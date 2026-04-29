import uuid

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.entity_record import EntityRecordRepository
from app.repositories.entity_schema import EntitySchemaRepository
from app.schemas.data import CreateRecordRequest, EntityRecordSchema, UpdateRecordRequest
from app.users import DemoUser, get_user

router = APIRouter(prefix="/api/data", tags=["data"])

NOTIFICATION_SERVICE_URL = "http://localhost:8001/internal/events"

_TITLE_KEYS = ["title", "name", "summary", "subject", "label"]


def extract_title(data: dict, record_id: str) -> str:
    for key in _TITLE_KEYS:
        val = data.get(key)
        if val and isinstance(val, str):
            return val
    return f"Record {str(record_id)[:8]}"


def resolve_user(request: Request) -> DemoUser | None:
    user_id = request.headers.get("X-User-ID", "")
    return get_user(user_id)


async def emit_event(payload: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.post(NOTIFICATION_SERVICE_URL, json=payload)
    except Exception:
        pass


async def require_entity(entity_id: str, db: AsyncSession):
    row = await EntitySchemaRepository(db).get(entity_id)
    if not row:
        raise HTTPException(404, f"Entity '{entity_id}' not found")
    return row


@router.get("/{entity_id}", response_model=list[EntityRecordSchema])
async def list_records(entity_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    await require_entity(entity_id, db)
    user = resolve_user(request)
    repo = EntityRecordRepository(db)
    return await repo.list_by_entity(
        entity_id,
        owner_group=user.group if user else None,
        is_admin=user.role == "admin" if user else False,
    )


@router.get("/{entity_id}/{record_id}", response_model=EntityRecordSchema)
async def get_record(entity_id: str, record_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = EntityRecordRepository(db)
    record = await repo.get(entity_id, record_id)
    if not record:
        raise HTTPException(404, "Record not found")
    return record


@router.post("/{entity_id}", response_model=EntityRecordSchema)
async def create_record(
    entity_id: str,
    body: CreateRecordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    schema = await require_entity(entity_id, db)
    user = resolve_user(request)
    repo = EntityRecordRepository(db)
    record = await repo.create(
        entity_id,
        body.data,
        owner_group=user.group if user else None,
    )
    await db.commit()
    await db.refresh(record)
    background_tasks.add_task(emit_event, {
        "event_type": "record.created",
        "entity_id": entity_id,
        "entity_name": schema.meta.get("name", entity_id),
        "record_id": str(record.id),
        "record_title": extract_title(record.data, record.id),
        "owner_group": record.owner_group,
        "changed_fields": [],
        "old_values": {},
        "new_values": {},
    })
    return record


@router.patch("/{entity_id}/{record_id}", response_model=EntityRecordSchema)
async def update_record(
    entity_id: str,
    record_id: uuid.UUID,
    body: UpdateRecordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    schema = await EntitySchemaRepository(db).get(entity_id)
    repo = EntityRecordRepository(db)
    old_record = await repo.get(entity_id, record_id)
    if not old_record:
        raise HTTPException(404, "Record not found")
    old_data = dict(old_record.data)
    record = await repo.update(entity_id, record_id, body.data)
    await db.commit()
    await db.refresh(record)
    changed = [k for k in body.data if body.data.get(k) != old_data.get(k)]
    background_tasks.add_task(emit_event, {
        "event_type": "record.updated",
        "entity_id": entity_id,
        "entity_name": schema.meta.get("name", entity_id) if schema else entity_id,
        "record_id": str(record.id),
        "record_title": extract_title(record.data, record.id),
        "owner_group": record.owner_group,
        "changed_fields": changed,
        "old_values": {k: old_data.get(k) for k in changed},
        "new_values": {k: body.data.get(k) for k in changed},
    })
    return record


@router.delete("/{entity_id}/{record_id}")
async def delete_record(
    entity_id: str,
    record_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    schema = await EntitySchemaRepository(db).get(entity_id)
    repo = EntityRecordRepository(db)
    record = await repo.get(entity_id, record_id)
    title = extract_title(record.data, record_id) if record else str(record_id)[:8]
    deleted = await repo.delete(entity_id, record_id)
    await db.commit()
    if not deleted:
        raise HTTPException(404, "Record not found")
    background_tasks.add_task(emit_event, {
        "event_type": "record.deleted",
        "entity_id": entity_id,
        "entity_name": schema.meta.get("name", entity_id) if schema else entity_id,
        "record_id": str(record_id),
        "record_title": title,
        "owner_group": record.owner_group if record else None,
        "changed_fields": [],
        "old_values": {},
        "new_values": {},
    })
    return {"ok": True}
