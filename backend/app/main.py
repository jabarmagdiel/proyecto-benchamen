import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
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
app.include_router(appointments.router)
app.include_router(workflows.router)
app.include_router(departments.router)



@app.get("/", tags=["Root"])
def root():
    return {"message": f"✅ {settings.APP_NAME} API activa", "docs": "/docs"}


@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}
