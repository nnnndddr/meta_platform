"""Seed the Task entity schema and sample records. Run once after migrations."""
import asyncio

from app.db.session import AsyncSessionLocal
from app.repositories.entity_record import EntityRecordRepository
from app.repositories.entity_schema import EntitySchemaRepository
from app.schemas.meta import ActionMeta, EntityMeta, FieldMeta, XUIHints


TASK_META = EntityMeta(
    id="task",
    name="Task",
    description="Kanban-style task management",
    layout="kanban",
    fields=[
        FieldMeta(
            name="title",
            type="text",
            label="Title",
            required=True,
            **{"x-ui": XUIHints(placeholder="Enter task title...")},
        ),
        FieldMeta(
            name="status",
            type="select",
            label="Status",
            required=True,
            options=["todo", "in_progress", "review", "done"],
            default="todo",
            **{"x-ui": XUIHints(
                widget="badge",
                kanban_group=True,
                color_map={"todo": "gray", "in_progress": "blue", "review": "yellow", "done": "green"},
            )},
        ),
        FieldMeta(
            name="priority",
            type="select",
            label="Priority",
            options=["low", "medium", "high", "critical"],
            default="medium",
            **{"x-ui": XUIHints(
                widget="badge",
                color_map={"low": "gray", "medium": "blue", "high": "orange", "critical": "red"},
            )},
        ),
        FieldMeta(
            name="assignee",
            type="user",
            label="Assignee",
            **{"x-ui": XUIHints(widget="avatar")},
        ),
        FieldMeta(
            name="due_date",
            type="date",
            label="Due Date",
            **{"x-ui": XUIHints(widget="date-picker")},
        ),
        FieldMeta(name="tags", type="tags", label="Tags"),
        FieldMeta(
            name="progress",
            type="progress",
            label="Progress",
            **{"x-ui": XUIHints(widget="progress-bar")},
        ),
        FieldMeta(
            name="description",
            type="textarea",
            label="Description",
            **{"x-ui": XUIHints(placeholder="Describe the task...")},
        ),
    ],
    actions=[
        ActionMeta(id="create", label="New Task", icon="plus", variant="primary"),
    ],
)

SAMPLE_RECORDS = [
    {"title": "Setup CI/CD pipeline", "status": "done", "priority": "high", "assignee": "Alice", "due_date": "2026-04-01", "tags": ["devops", "ci"], "progress": 100, "description": "Configure GitHub Actions"},
    {"title": "Design system tokens", "status": "in_progress", "priority": "medium", "assignee": "Bob", "due_date": "2026-04-15", "tags": ["design"], "progress": 60, "description": "Colors, typography, spacing"},
    {"title": "API authentication", "status": "review", "priority": "critical", "assignee": "Alice", "due_date": "2026-04-12", "tags": ["security", "api"], "progress": 90, "description": "JWT + refresh tokens"},
    {"title": "Write unit tests", "status": "todo", "priority": "medium", "assignee": "Carol", "due_date": "2026-04-20", "tags": ["testing"], "progress": 0, "description": "Cover core business logic"},
    {"title": "Performance audit", "status": "todo", "priority": "low", "assignee": "Bob", "due_date": "2026-04-25", "tags": ["perf"], "progress": 0, "description": "Lighthouse + bundle analysis"},
    {"title": "Database migrations", "status": "in_progress", "priority": "high", "assignee": "Carol", "due_date": "2026-04-14", "tags": ["db"], "progress": 40, "description": "Alembic migrations for v2"},
]


async def seed():
    async with AsyncSessionLocal() as db:
        schema_repo = EntitySchemaRepository(db)
        existing = await schema_repo.get("task")
        if existing:
            print("Already seeded, skipping.")
            return

        await schema_repo.upsert("task", TASK_META)

        record_repo = EntityRecordRepository(db)
        for record_data in SAMPLE_RECORDS:
            await record_repo.create("task", record_data)

        await db.commit()
        print(f"Seeded task entity + {len(SAMPLE_RECORDS)} sample records.")


if __name__ == "__main__":
    asyncio.run(seed())
