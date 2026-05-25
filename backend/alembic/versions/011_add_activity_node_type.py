"""add activity node_type

Revision ID: 011_add_activity_node_type
Revises: 010_add_user_department
Create Date: 2026-05-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '011_add_activity_node_type'
down_revision: Union[str, None] = '23791ddfef9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activities', sa.Column('node_type', sa.String(length=50), server_default='task', nullable=False))


def downgrade() -> None:
    op.drop_column('activities', 'node_type')
