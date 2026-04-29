"""add owner_group to entity_records

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-22

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "entity_records",
        sa.Column("owner_group", sa.String(128), nullable=True),
    )
    op.create_index("ix_entity_records_owner_group", "entity_records", ["owner_group"])


def downgrade() -> None:
    op.drop_index("ix_entity_records_owner_group", table_name="entity_records")
    op.drop_column("entity_records", "owner_group")
