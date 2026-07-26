-- ============================================================
-- Schema: Marketing Project Manager
-- Base de datos: PostgreSQL
-- ============================================================

-- Tipos ENUM
CREATE TYPE user_role AS ENUM ('administrador', 'operativo', 'cliente');
CREATE TYPE activity_status AS ENUM ('pendiente', 'asignada', 'en_proceso', 'en_revision', 'observada', 'aprobada', 'cancelada', 'bloqueada');
CREATE TYPE project_status AS ENUM ('planificado', 'en_proceso', 'en_pausa', 'finalizado', 'cancelado');
CREATE TYPE activity_type AS ENUM ('filmacion', 'edicion_video', 'diseno_grafico', 'fotografia', 'copywriting', 'publicacion_redes', 'planificacion_contenido', 'reunion_cliente', 'entrega_material', 'otro');
CREATE TYPE evidence_type AS ENUM ('imagen', 'archivo', 'link_drive', 'link_externo');
CREATE TYPE priority_level AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE company_status AS ENUM ('activo', 'inactivo');
CREATE TYPE history_action AS ENUM ('creada', 'asignada', 'cambio_estado', 'evidencia_subida', 'enviada_revision', 'observada', 'aprobada', 'cancelada', 'comentada', 'editada');

-- ─── Usuarios ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role        user_role NOT NULL DEFAULT 'operativo',
    position    VARCHAR(100),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url  VARCHAR(500),
    company_id  INT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Empresas ─────────────────────────────────────────────────────────────────
CREATE TABLE companies (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(150),
    phone           VARCHAR(30),
    email           VARCHAR(255),
    address         VARCHAR(500),
    description     TEXT,
    status          company_status NOT NULL DEFAULT 'activo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Proyectos ────────────────────────────────────────────────────────────────
CREATE TABLE projects (
    id                      SERIAL PRIMARY KEY,
    company_id              INT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    department_id           INT,
    main_responsible_id     INT REFERENCES users(id) ON DELETE SET NULL,
    name                    VARCHAR(250) NOT NULL,
    description             TEXT,
    start_date              DATE,
    deadline                DATE,
    status                  project_status NOT NULL DEFAULT 'planificado',
    priority                priority_level NOT NULL DEFAULT 'media',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Actividades ──────────────────────────────────────────────────────────────
CREATE TABLE activities (
    id                  SERIAL PRIMARY KEY,
    project_id          INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workflow_id         INT,
    assigned_user_id    INT REFERENCES users(id) ON DELETE SET NULL,
    created_by_id       INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by_id      INT REFERENCES users(id) ON DELETE SET NULL,
    title               VARCHAR(250) NOT NULL,
    description         TEXT,
    activity_type       activity_type NOT NULL DEFAULT 'otro',
    priority            priority_level NOT NULL DEFAULT 'media',
    status              activity_status NOT NULL DEFAULT 'pendiente',
    start_date          DATE,
    deadline            DATE,
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Departamentos y Usuarios (Muchos a Muchos) ───────────────────────────────
CREATE TABLE user_departments (
    user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id       INT NOT NULL,
    PRIMARY KEY (user_id, department_id)
);

-- ─── Evidencias ───────────────────────────────────────────────────────────────
CREATE TABLE evidences (
    id              SERIAL PRIMARY KEY,
    activity_id     INT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    evidence_type   evidence_type NOT NULL,
    file_url        VARCHAR(1000),
    drive_url       VARCHAR(1000),
    file_name       VARCHAR(500),
    file_size       INT,
    mime_type       VARCHAR(100),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Comentarios ──────────────────────────────────────────────────────────────
CREATE TABLE comments (
    id              SERIAL PRIMARY KEY,
    activity_id     INT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Historial de actividad ───────────────────────────────────────────────────
CREATE TABLE activity_history (
    id                  SERIAL PRIMARY KEY,
    activity_id         INT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id             INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action              history_action NOT NULL,
    previous_status     VARCHAR(50),
    new_status          VARCHAR(50),
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notificaciones ───────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id                  SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(250) NOT NULL,
    message             TEXT NOT NULL,
    link                VARCHAR(500),
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_activities_project ON activities(project_id);
CREATE INDEX idx_activities_user ON activities(assigned_user_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_deadline ON activities(deadline);
CREATE INDEX idx_evidences_activity ON evidences(activity_id);
CREATE INDEX idx_comments_activity ON comments(activity_id);
CREATE INDEX idx_history_activity ON activity_history(activity_id);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ─── Appointments ─────────────────────────────────────────────────────────────
CREATE TABLE appointments (
    id              SERIAL PRIMARY KEY,
    admin_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       INT REFERENCES users(id) ON DELETE SET NULL,
    date            DATE NOT NULL,
    start_time      VARCHAR(5) NOT NULL,
    end_time        VARCHAR(5) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'available',
    title           VARCHAR(250),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_admin ON appointments(admin_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(date);

-- ─── Paquetes de servicios ────────────────────────────────────────────────────
CREATE TABLE packages (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    base_price      NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Paquetes asignados a empresas (cotizador) ────────────────────────────────
CREATE TABLE company_packages (
    id                  SERIAL PRIMARY KEY,
    company_id          INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    package_id          INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    quantity            INT NOT NULL DEFAULT 1,
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    final_price         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_packages_company ON company_packages(company_id);
CREATE INDEX idx_company_packages_package ON company_packages(package_id);


