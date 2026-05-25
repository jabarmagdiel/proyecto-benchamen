"""add_department

Revision ID: 007_add_department
Revises: 006_add_node_type
Create Date: 2026-05-24 21:11:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007_add_department'
down_revision: Union[str, None] = '006_add_node_type'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('workflow_stages', sa.Column('department', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('workflow_stages', 'department')
