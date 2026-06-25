"""add package_request_id to projects

Revision ID: 012_add_package_req
Revises: 011_add_activity_node_type
Create Date: 2026-06-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '012_add_package_req'
down_revision = '011_add_activity_node_type'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('projects', sa.Column('package_request_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_projects_package_request_id', 'projects', 'package_requests', ['package_request_id'], ['id'], ondelete='SET NULL')

def downgrade() -> None:
    op.drop_constraint('fk_projects_package_request_id', 'projects', type_='foreignkey')
    op.drop_column('projects', 'package_request_id')
