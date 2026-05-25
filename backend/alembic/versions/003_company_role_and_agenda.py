"""company_role_and_agenda

Revision ID: 003_company_role_and_agenda
Revises: 002_notifications
Create Date: 2026-05-24 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '003_company_role_and_agenda'
down_revision = '002_notifications'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Agregar 'cliente' al tipo ENUM user_role en PostgreSQL
    # PostgreSQL requiere que no estemos en una transacción para cambiar enums en versiones antiguas,
    # pero op.execute con COMMIT / ALTER TYPE ADD VALUE IF NOT EXISTS funciona de forma segura.
    op.execute("COMMIT")
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cliente'")

    # 2. Agregar columna company_id a la tabla de usuarios
    op.add_column('users', sa.Column('company_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_company', 'users', 'companies', ['company_id'], ['id'], ondelete='SET NULL')

    # 3. Crear tabla appointments
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.String(length=5), nullable=False),
        sa.Column('end_time', sa.String(length=5), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('title', sa.String(length=250), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_appointments_id'), 'appointments', ['id'], unique=False)
    op.create_index('idx_appointments_admin', 'appointments', ['admin_id'], unique=False)
    op.create_index('idx_appointments_client', 'appointments', ['client_id'], unique=False)
    op.create_index('idx_appointments_date', 'appointments', ['date'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_appointments_date', table_name='appointments')
    op.drop_index('idx_appointments_client', table_name='appointments')
    op.drop_index('idx_appointments_admin', table_name='appointments')
    op.drop_index(op.f('ix_appointments_id'), table_name='appointments')
    op.drop_table('appointments')

    op.drop_constraint('fk_users_company', 'users', type_='foreignkey')
    op.drop_column('users', 'company_id')
    # Nota: No eliminamos el valor 'cliente' del enum user_role en downgrade porque PostgreSQL no lo soporta de forma nativa.
