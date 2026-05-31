import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import SessionLocal
from sqlalchemy import text
from app.routes import auth, users, companies, projects, activities, evidences, comments, dashboard, reports, notifications, appointments, workflows, departments

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
    """Ejecuta las migraciones de BD necesarias automáticamente al iniciar el servidor en Render"""
    db = SessionLocal()
    
    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS user_departments (
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, department_id)
            );
        """))
        db.commit()
    except Exception as e:
        print("❌ Error creando user_departments:", e)
        db.rollback()

    try:
        db.execute(text("""
            INSERT INTO user_departments (user_id, department_id)
            SELECT id, department_id FROM users WHERE department_id IS NOT NULL
            ON CONFLICT DO NOTHING;
        """))
        db.commit()
    except Exception as e:
        print("❌ Error migrando departamentos de usuarios:", e)
        db.rollback()

    try:
        db.execute(text("ALTER TABLE activities ADD COLUMN IF NOT EXISTS workflow_id INT REFERENCES workflows(id) ON DELETE SET NULL;"))
        db.commit()
    except Exception as e:
        print("❌ Error alterando activities:", e)
        db.rollback()

    try:
        db.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(id) ON DELETE SET NULL;"))
        db.commit()
    except Exception as e:
        print("❌ Error alterando projects:", e)
        db.rollback()

    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS packages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS company_packages (
                id SERIAL PRIMARY KEY,
                company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                package_id INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
                quantity INT NOT NULL DEFAULT 1,
                discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
                final_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        db.commit()
    except Exception as e:
        print("❌ Error creando tablas de paquetes:", e)
        db.rollback()

    print("✅ Migraciones automáticas verificadas/ejecutadas con éxito.")
    db.close()


# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "https://proyecto-benchamen.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Servir archivos estáticos (uploads) ──────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ─── Registrar routers ────────────────────────────────────────────────────────
from app.routes import users, companies, projects, activities, evidences, comments, dashboard, reports, notifications, departments, workflows, appointments, auth, packages

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



@app.get("/", tags=["Root"])
def root():
    return {"message": f"✅ {settings.APP_NAME} API activa", "docs": "/docs"}


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}
