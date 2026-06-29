import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import SessionLocal
from sqlalchemy import text

# ─── Crear carpeta de uploads si no existe ────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# ─── Instancia de la aplicación ───────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="API REST para gestión de proyectos y actividades de marketing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.on_event("startup")
def run_migrations():
    """Ejecuta las migraciones de BD necesarias automáticamente al iniciar."""
    db = SessionLocal()

    migrations = [
        # user_departments table
        (
            "user_departments",
            """
            CREATE TABLE IF NOT EXISTS user_departments (
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, department_id)
            );
            """,
        ),
        # Migrar department_id de users a user_departments
        (
            "migrate_user_departments",
            """
            INSERT INTO user_departments (user_id, department_id)
            SELECT u.id, u.department_id
            FROM users u
            WHERE u.department_id IS NOT NULL
              AND EXISTS (SELECT 1 FROM departments d WHERE d.id = u.department_id)
            ON CONFLICT DO NOTHING;
            """,
        ),
        # workflow_id en activities
        (
            "activities.workflow_id",
            "ALTER TABLE activities ADD COLUMN IF NOT EXISTS workflow_id INT REFERENCES workflows(id) ON DELETE SET NULL;",
        ),
        # department_id en projects
        (
            "projects.department_id",
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(id) ON DELETE SET NULL;",
        ),
        # Tabla packages
        (
            "packages",
            """
            CREATE TABLE IF NOT EXISTS packages (
                id          SERIAL PRIMARY KEY,
                name        VARCHAR(150) NOT NULL,
                description TEXT,
                base_price  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """,
        ),
        # Tabla company_packages
        (
            "company_packages",
            """
            CREATE TABLE IF NOT EXISTS company_packages (
                id                  SERIAL PRIMARY KEY,
                company_id          INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                package_id          INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
                quantity            INT NOT NULL DEFAULT 1,
                discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
                final_price         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """,
        ),
        # Índices de company_packages
        (
            "idx_company_packages",
            """
            CREATE INDEX IF NOT EXISTS idx_company_packages_company ON company_packages(company_id);
            CREATE INDEX IF NOT EXISTS idx_company_packages_package ON company_packages(package_id);
            """,
        ),
    ]

    for name, sql in migrations:
        try:
            db.execute(text(sql))
            db.commit()
            print(f"✅ Migración '{name}' OK")
        except Exception as e:
            print(f"❌ Error en migración '{name}': {e}")
            db.rollback()

    db.close()
    print("✅ Todas las migraciones automáticas verificadas.")


# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "https://proyecto-benchamen.vercel.app",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Servir archivos estáticos (uploads) ──────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ─── Registrar routers ────────────────────────────────────────────────────────
from app.routes import (
    auth,
    users,
    companies,
    projects,
    activities,
    evidences,
    comments,
    dashboard,
    reports,
    notifications,
    departments,
    workflows,
    appointments,
    packages,
    package_requests,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(projects.router)
app.include_router(activities.router)
app.include_router(evidences.router)
app.include_router(comments.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(departments.router)
app.include_router(workflows.router)
app.include_router(appointments.router)
app.include_router(packages.router)
app.include_router(package_requests.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": f"✅ {settings.APP_NAME} API activa", "docs": "/docs"}


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}
