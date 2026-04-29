import asyncio
from datetime import datetime, timedelta

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import storage
from email_sender import send_creation_emails
from models import IncomingEvent, Notification, User

# Дедупликация событий: храним сигнатуры последних событий на 2 секунды.
recent_event_keys: dict[str, datetime] = {}
DEDUP_TTL = timedelta(seconds=2)


def is_duplicate_event(event: IncomingEvent) -> bool:
    key = f"{event.event_type}:{event.entity_id}:{event.record_id}"
    now = datetime.utcnow()
    stale = [k for k, t in recent_event_keys.items() if now - t > DEDUP_TTL]
    for k in stale:
        del recent_event_keys[k]
    if key in recent_event_keys:
        return True
    recent_event_keys[key] = now
    return False

app = FastAPI(title="Notification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_message(event: IncomingEvent) -> str:
    title = f'"{event.record_title}"'
    if event.event_type == "record.created":
        return f'New {event.entity_name}: {title} was created'
    if event.event_type == "record.deleted":
        return f'{event.entity_name} {title} was deleted'
    if "status" in event.changed_fields and "status" in event.new_values:
        new_status = event.new_values["status"]
        return f'{event.entity_name} {title}: status changed to "{new_status}"'
    return f'{event.entity_name} {title} was updated'


@app.get("/users", response_model=list[User])
async def list_users():
    return storage.DEMO_USERS


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(user_id: str, websocket: WebSocket):
    await websocket.accept()
    storage.register_connection(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("action") == "ping":
                await websocket.send_json({"action": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        storage.remove_connection(user_id, websocket)


@app.post("/internal/events", status_code=202)
async def receive_event(event: IncomingEvent):
    if is_duplicate_event(event):
        return {"ok": True, "count": 0, "skipped": True}
    message = build_message(event)
    notifications: list[Notification] = []
    for user in storage.DEMO_USERS:
        if event.owner_group and user.role != "admin" and user.group != event.owner_group:
            continue
        notif = Notification(
            user_id=user.id,
            event_type=event.event_type,
            entity_id=event.entity_id,
            entity_name=event.entity_name,
            record_id=event.record_id,
            record_title=event.record_title,
            message=message,
        )
        storage.add_notification(notif)
        notifications.append(notif)

    async def broadcast(notif: Notification):
        dead: list = []
        for ws in storage.get_connections(notif.user_id):
            try:
                await ws.send_json(notif.model_dump(mode="json"))
            except Exception:
                dead.append(ws)
        for ws in dead:
            storage.remove_connection(notif.user_id, ws)

    tasks = [broadcast(n) for n in notifications]
    if event.event_type == "record.created":
        tasks.append(
            send_creation_emails(
                entity_name=event.entity_name,
                record_title=event.record_title,
                message=message,
            )
        )
    await asyncio.gather(*tasks)
    return {"ok": True, "count": len(notifications)}


@app.get("/notifications/{user_id}", response_model=list[Notification])
async def get_notifications(user_id: str, limit: int = 50):
    if user_id not in storage.DEMO_USER_IDS:
        raise HTTPException(404, "User not found")
    return storage.get_notifications(user_id, limit)


@app.post("/notifications/{user_id}/read-all")
async def mark_all_read(user_id: str):
    if user_id not in storage.DEMO_USER_IDS:
        raise HTTPException(404, "User not found")
    storage.mark_all_read(user_id)
    return {"ok": True}


@app.delete("/notifications/{user_id}/{notification_id}")
async def delete_notification(user_id: str, notification_id: str):
    if user_id not in storage.DEMO_USER_IDS:
        raise HTTPException(404, "User not found")
    deleted = storage.delete_notification(user_id, notification_id)
    if not deleted:
        raise HTTPException(404, "Notification not found")
    return {"ok": True}


@app.get("/health")
async def health():
    return {"ok": True}
