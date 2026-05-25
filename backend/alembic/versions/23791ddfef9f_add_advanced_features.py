"""add advanced features

Revision ID: 23791ddfef9f
Revises: 010
Create Date: 2026-05-25 01:32:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '23791ddfef9f'
down_revision = '010_add_user_department'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add BLOCKED to activity_status Enum if PostgreSQL. 
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE activity_status ADD VALUE IF NOT EXISTS 'bloqueada';")

    # 2. Add time_spent_seconds and timer_started_at to activities
    op.add_column('activities', sa.Column('time_spent_seconds', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('activities', sa.Column('timer_started_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('activities', 'timer_started_at')
    op.drop_column('activities', 'time_spent_seconds')
