from fastapi import APIRouter, HTTPException, UploadFile

from app import minio_client

router = APIRouter(prefix="/api/attachments", tags=["attachments"])


def object_name(entity_id: str, record_id: str, filename: str) -> str:
    return f"{entity_id}/{record_id}/{filename}"


@router.post("/{entity_id}/{record_id}", status_code=201)
async def upload_attachment(entity_id: str, record_id: str, file: UploadFile):
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    name = object_name(entity_id, record_id, file.filename or "file")
    await minio_client.upload_object(name, data, file.content_type or "application/octet-stream")
    return {"name": file.filename, "size": len(data), "content_type": file.content_type}


@router.get("/{entity_id}/{record_id}")
async def list_attachments(entity_id: str, record_id: str):
    prefix = f"{entity_id}/{record_id}/"
    return await minio_client.list_objects(prefix)


@router.get("/{entity_id}/{record_id}/{filename}/url")
async def get_presigned_url(entity_id: str, record_id: str, filename: str):
    name = object_name(entity_id, record_id, filename)
    url = await minio_client.presigned_get_url(name)
    return {"url": url}


@router.delete("/{entity_id}/{record_id}/{filename}")
async def delete_attachment(entity_id: str, record_id: str, filename: str):
    name = object_name(entity_id, record_id, filename)
    await minio_client.delete_object(name)
    return {"ok": True}
