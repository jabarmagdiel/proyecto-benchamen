"""add_node_type

Revision ID: 006_add_node_type
Revises: 005_add_workflow_edges
Create Date: 2026-05-24 20:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006_add_node_type'
down_revision: Union[str, None] = '005_add_workflow_edges'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('workflow_stages', sa.Column('node_type', sa.String(length=50), server_default='task', nullable=False))


def downgrade() -> None:
    op.drop_column('workflow_stages', 'node_type')
