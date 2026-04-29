from collections import defaultdict
from fastapi import WebSocket
from models import Notification, User

DEMO_USERS: list[User] = [
    User(id="alice", name="Alice Johnson",  group="engineering", role="member"),
    User(id="bob",   name="Bob Smith",      group="engineering", role="admin"),
    User(id="carol", name="Carol Williams", group="design",      role="member"),
    User(id="dave",  name="Dave Brown",     group="design",      role="member"),
]

DEMO_USER_IDS = {u.id for u in DEMO_USERS}

# user_id -> list of Notification (newest first, capped at 100)
_notifications: dict[str, list[Notification]] = defaultdict(list)

# user_id -> set of active WebSocket connections
_connections: dict[str, set[WebSocket]] = defaultdict(set)


def add_notification(notif: Notification) -> None:
    store = _notifications[notif.user_id]
    store.insert(0, notif)
    if len(store) > 100:
        store.pop()


def get_notifications(user_id: str, limit: int = 50) -> list[Notification]:
    return _notifications[user_id][:limit]


def mark_all_read(user_id: str) -> None:
    for n in _notifications[user_id]:
        n.read = True


def delete_notification(user_id: str, notification_id: str) -> bool:
    store = _notifications[user_id]
    before = len(store)
    _notifications[user_id] = [n for n in store if n.id != notification_id]
    return len(_notifications[user_id]) < before


def unread_count(user_id: str) -> int:
    return sum(1 for n in _notifications[user_id] if not n.read)


def register_connection(user_id: str, ws: WebSocket) -> None:
    _connections[user_id].add(ws)


def remove_connection(user_id: str, ws: WebSocket) -> None:
    _connections[user_id].discard(ws)


def get_connections(user_id: str) -> set[WebSocket]:
    return _connections[user_id].copy()
