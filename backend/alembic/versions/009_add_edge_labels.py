"""add_edge_labels

Revision ID: 009_add_edge_labels
Revises: 008_add_departments
Create Date: 2026-05-24 21:23:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '009_add_edge_labels'
down_revision: Union[str, None] = '008_add_departments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('workflow_edges', sa.Column('label', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('workflow_edges', 'label')
