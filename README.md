# 📊 Marketing Project Manager

Sistema fullstack profesional para gestión de proyectos y actividades de marketing.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + Shadcn UI |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2.0 + Alembic |
| Auth | JWT + bcrypt |
| Base de datos | PostgreSQL |
| Reportes | PDF (ReportLab) + Excel (openpyxl) |
| Email | fastapi-mail + SMTP |
| Docker | docker-compose.yml |

---

## 🚀 Instalación y ejecución

### Opción A: Con Docker (recomendado)

```bash
# Clonar/acceder al proyecto
cd marketing-project-manager

# Copiar variables de entorno del backend
cp backend/.env.example backend/.env
# Editar backend/.env con tu configuración (SMTP, etc.)

# Levantar todos los servicios
docker-compose up --build -d

# Ver logs
docker-compose logs -f backend
```

Accede a:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Docs API**: http://localhost:8000/docs

---

### Opción B: Manual (desarrollo)

#### 1. Base de datos PostgreSQL

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE marketing_db;"
```

#### 2. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar .env
cp .env.example .env
# Editar .env con tus valores

# Crear tablas con Alembic
alembic upgrade head

# Levantar servidor
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend (Next.js)

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar y configurar .env
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Levantar servidor de desarrollo
npm run dev
```

---

## 🔑 Credenciales por defecto

| Campo | Valor |
|-------|-------|
| Email | `admin@marketing.com` |
| Contraseña | `Admin123!` |
| Rol | Administrador |

---

## 📁 Estructura del proyecto

```
marketing-project-manager/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app principal
│   │   ├── core/             # Config, DB, Security
│   │   ├── models/           # SQLAlchemy ORM
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routes/           # Endpoints REST
│   │   ├── services/         # Lógica de negocio
│   │   └── utils/            # Enums, email
│   ├── alembic/              # Migraciones
│   ├── uploads/              # Archivos subidos
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # AuthContext
│   │   ├── lib/              # API client, utils
│   │   └── types/            # TypeScript interfaces
│   └── .env.example
├── database/
│   ├── schema.sql            # Script DDL completo
│   └── seed.sql              # Datos iniciales
├── docker-compose.yml
└── README.md
```

---

## 🔗 API Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/users` | Listar usuarios (admin) |
| POST | `/api/users` | Crear usuario (admin) |
| GET | `/api/companies` | Listar empresas |
| GET | `/api/projects` | Listar proyectos |
| GET | `/api/activities` | Listar actividades (admin) |
| GET | `/api/activities/my` | Mis actividades (operativo) |
| PATCH | `/api/activities/{id}/start` | Iniciar actividad |
| PATCH | `/api/activities/{id}/send-review` | Enviar a revisión |
| PATCH | `/api/activities/{id}/approve` | Aprobar (admin) |
| PATCH | `/api/activities/{id}/observe` | Observar (admin) |
| GET | `/api/activities/{id}/history` | Historial de actividad |
| PUT | `/api/users/me/profile` | Actualizar mi perfil |
| PATCH | `/api/users/me/password` | Cambiar mi contraseña |
| GET | `/api/dashboard/stats` | Estadísticas dashboard |
| GET | `/api/reports/activities/excel` | Exportar Excel |
| GET | `/api/reports/activities/pdf` | Exportar PDF |

Documentación interactiva completa: **http://localhost:8000/docs**

---

## 🔐 Roles y permisos

| Acción | Administrador | Operativo |
|--------|:---:|:---:|
| Ver todas las actividades | ✅ | ❌ |
| Ver mis actividades | ✅ | ✅ |
| Crear actividades | ✅ | ❌ |
| Aprobar actividades | ✅ | ❌ |
| Iniciar actividad | ❌ | ✅ |
| Subir evidencias | ✅ | ✅ |
| Enviar a revisión | ❌ | ✅ |
| Ver dashboard | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |

---

## 🗃️ Estados de actividad

```
Pendiente → Asignada → En Proceso → En Revisión → Aprobada ✅
                                        ↓
                                     Observada ⚠️ → En Proceso (corrección)
```

---

## 📧 Configuración de email (Gmail)

1. Habilitar verificación en 2 pasos en tu cuenta Gmail
2. Generar contraseña de aplicación: Cuenta → Seguridad → Contraseñas de aplicación
3. Configurar en `backend/.env`:
```env
MAIL_USERNAME=tu@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=tu@gmail.com
```

---

## 🐳 Docker - Comandos útiles

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (base de datos)
docker-compose down -v

# Ver logs del backend
docker-compose logs -f backend

# Ejecutar comando en el backend
docker-compose exec backend alembic upgrade head
```
