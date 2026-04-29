from fastapi import APIRouter
from pydantic import BaseModel

from app.users import DEMO_USERS

router = APIRouter(prefix="/api/users", tags=["users"])


class UserSchema(BaseModel):
    id: str
    name: str
    group: str
    role: str


@router.get("", response_model=list[UserSchema])
async def list_users():
    return [
        UserSchema(id=u.id, name=u.name, group=u.group, role=u.role)
        for u in DEMO_USERS.values()
    ]
