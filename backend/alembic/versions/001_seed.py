"""seed inicial

Revision ID: 001_seed
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

revision = '001_seed'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Insertar usuario admin inicial
    op.execute(
        f"""
        INSERT INTO users (name, email, password_hash, role, position, is_active, created_at, updated_at)
        VALUES (
            'Administrador',
            'admin@marketing.com',
            '{pwd_context.hash("Admin123!")}',
            'administrador',
            'Administrador del Sistema',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE email = 'admin@marketing.com'")
