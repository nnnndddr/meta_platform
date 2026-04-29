import asyncio
from datetime import timedelta
from functools import partial
from io import BytesIO

from minio import Minio

from app.core.config import settings

minio_instance: Minio | None = None


def get_client() -> Minio:
    global minio_instance
    if minio_instance is None:
        minio_instance = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
    return minio_instance


async def run_sync(fn, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args, **kwargs))


async def ensure_bucket() -> None:
    client = get_client()
    bucket = settings.minio_bucket

    def do_ensure():
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)

    await run_sync(do_ensure)


async def upload_object(object_name: str, data: bytes, content_type: str) -> None:
    client = get_client()

    def do_upload():
        client.put_object(
            settings.minio_bucket,
            object_name,
            BytesIO(data),
            length=len(data),
            content_type=content_type,
        )

    await run_sync(do_upload)


async def list_objects(prefix: str) -> list[dict]:
    client = get_client()

    def do_list():
        objects = client.list_objects(settings.minio_bucket, prefix=prefix)
        result = []
        for obj in objects:
            result.append({
                "name": obj.object_name.split("/")[-1],
                "size": obj.size,
                "last_modified": obj.last_modified.isoformat() if obj.last_modified else None,
            })
        return result

    return await run_sync(do_list)


async def delete_object(object_name: str) -> None:
    client = get_client()
    await run_sync(client.remove_object, settings.minio_bucket, object_name)


async def presigned_get_url(object_name: str, expires_hours: int = 1) -> str:
    client = get_client()

    def do_presign():
        return client.presigned_get_object(
            settings.minio_bucket,
            object_name,
            expires=timedelta(hours=expires_hours),
        )

    return await run_sync(do_presign)
