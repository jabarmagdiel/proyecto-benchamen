"""add_workflow_edges

Revision ID: 005_add_workflow_edges
Revises: fc77b9b063dd
Create Date: 2026-05-24 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_add_workflow_edges'
down_revision: Union[str, None] = 'fc77b9b063dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add pos_x and pos_y to workflow_stages
    op.add_column('workflow_stages', sa.Column('pos_x', sa.Float(), nullable=True))
    op.add_column('workflow_stages', sa.Column('pos_y', sa.Float(), nullable=True))

    # 2. Create workflow_edges table
    op.create_table('workflow_edges',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('workflow_id', sa.Integer(), nullable=False),
    sa.Column('source_stage_id', sa.Integer(), nullable=False),
    sa.Column('target_stage_id', sa.Integer(), nullable=False),
    sa.Column('condition', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['source_stage_id'], ['workflow_stages.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['target_stage_id'], ['workflow_stages.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['workflow_id'], ['workflows.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workflow_edges_id'), 'workflow_edges', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_workflow_edges_id'), table_name='workflow_edges')
    op.drop_table('workflow_edges')
    op.drop_column('workflow_stages', 'pos_y')
    op.drop_column('workflow_stages', 'pos_x')
