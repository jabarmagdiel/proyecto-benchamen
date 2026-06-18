-- ============================================================
-- SUPABASE FIX: Ejecutar este script en el SQL Editor de Supabase
-- Agrega las tablas faltantes de forma segura (IF NOT EXISTS)
-- y carga los datos iniciales de paquetes.
-- ============================================================

-- ─── 1. Tablas faltantes ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS packages (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    base_price  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_packages (
    id                  SERIAL PRIMARY KEY,
    company_id          INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    package_id          INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    quantity            INT NOT NULL DEFAULT 1,
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    final_price         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_packages_company ON company_packages(company_id);
CREATE INDEX IF NOT EXISTS idx_company_packages_package ON company_packages(package_id);

CREATE TABLE IF NOT EXISTS package_requests (
    id              SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    package_id      INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    client_user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. Columnas faltantes en tablas existentes ───────────────────────────────

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS dashboard_url VARCHAR(500);

ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS workflow_id INT REFERENCES workflows(id) ON DELETE SET NULL;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(id) ON DELETE SET NULL;

-- ─── 3. Paquetes de servicios (Catálogo Alfa Prestige) ───────────────────────

INSERT INTO packages (name, description, base_price)
VALUES
(
    'Paquete Básico',
    'Gestión de 2 redes sociales, 12 publicaciones mensuales, diseño de contenido básico y reporte mensual.',
    1500.00
),
(
    'Paquete Estándar',
    'Gestión de 3 redes sociales, 20 publicaciones mensuales, diseño premium, 1 video corto mensual y reporte quincenal.',
    2800.00
),
(
    'Paquete Premium',
    'Gestión de 5 redes sociales, 30 publicaciones mensuales, diseño premium, 4 videos cortos, sesión fotográfica mensual y reporte semanal.',
    5000.00
),
(
    'Paquete Filmación',
    'Producción audiovisual completa: 1 video institucional o publicitario de hasta 3 minutos, guión, grabación, edición y entrega en múltiples formatos.',
    3500.00
),
(
    'Paquete Fotografía',
    'Sesión fotográfica profesional de producto o corporativa: hasta 4 horas, 50 fotos editadas en alta resolución.',
    1200.00
),
(
    'Paquete Diseño Gráfico',
    'Creación de identidad de marca: logotipo, manual de marca, paleta de colores, tipografía y plantillas para redes sociales.',
    2000.00
),
(
    'Paquete Publicidad Digital',
    'Gestión de campañas pagadas (Meta Ads + Google Ads), segmentación de audiencias, presupuesto publicitario administrado y reporte de rendimiento.',
    3200.00
),
(
    'Paquete Integral 360°',
    'Solución completa: redes sociales, producción de video, fotografía, diseño gráfico y publicidad digital. Todo incluido para marca completa.',
    9500.00
)
ON CONFLICT DO NOTHING;
