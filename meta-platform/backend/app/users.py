from dataclasses import dataclass


@dataclass
class DemoUser:
    id: str
    name: str
    group: str
    role: str  # "admin" | "member"


DEMO_USERS: dict[str, DemoUser] = {
    "alice": DemoUser("alice", "Alice Johnson",  "engineering", "member"),
    "bob":   DemoUser("bob",   "Bob Smith",      "engineering", "admin"),
    "carol": DemoUser("carol", "Carol Williams", "design",      "member"),
    "dave":  DemoUser("dave",  "Dave Brown",     "design",      "member"),
}


def get_user(user_id: str) -> DemoUser | None:
    return DEMO_USERS.get(user_id)
