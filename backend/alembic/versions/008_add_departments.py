"""add_departments

Revision ID: 008_add_departments
Revises: 007_add_department
Create Date: 2026-05-24 21:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008_add_departments'
down_revision: Union[str, None] = '007_add_department'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
