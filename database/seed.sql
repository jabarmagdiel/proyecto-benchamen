-- ============================================================
-- Seed: datos iniciales
-- ¡NOTA! Ejecutar DESPUÉS del schema.sql
-- ============================================================

-- ─── Usuarios ────────────────────────────────────────────────────────────────
-- Administrador por defecto (contraseña: Admin123!)
INSERT INTO users (name, email, password_hash, role, position, is_active, created_at, updated_at)
VALUES (
    'Administrador',
    'admin@marketing.com',
    '$2b$12$q2aij7BwZbWFORH9sASsK.fSc8zR7i//Vzxx5EPHTF/GU/EBoI/Ge',
    'administrador',
    'Administrador del Sistema',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Usuarios operativos de ejemplo
INSERT INTO users (name, email, password_hash, role, position, is_active, created_at, updated_at)
VALUES
('María López',   'maria@marketing.com',  '$2b$12$q2aij7BwZbWFORH9sASsK.fSc8zR7i//Vzxx5EPHTF/GU/EBoI/Ge', 'operativo', 'Editora de video', true, NOW(), NOW()),
('Carlos Ruiz',   'carlos@marketing.com', '$2b$12$q2aij7BwZbWFORH9sASsK.fSc8zR7i//Vzxx5EPHTF/GU/EBoI/Ge', 'operativo', 'Filmmaker', true, NOW(), NOW()),
('Ana Torres',    'ana@marketing.com',    '$2b$12$q2aij7BwZbWFORH9sASsK.fSc8zR7i//Vzxx5EPHTF/GU/EBoI/Ge', 'operativo', 'Diseñadora gráfica', true, NOW(), NOW()),
('Luis Mendez',   'luis@marketing.com',   '$2b$12$q2aij7BwZbWFORH9sASsK.fSc8zR7i//Vzxx5EPHTF/GU/EBoI/Ge', 'operativo', 'Community Manager', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ─── Empresas ────────────────────────────────────────────────────────────────
-- Empresa Alfa Prestige (empresa principal del catálogo)
INSERT INTO companies (name, contact_name, phone, email, address, description, status, created_at, updated_at)
VALUES
(
    'Alfa Prestige',
    'Gerente Comercial',
    '',
    'contacto@alfaprestige.com',
    '',
    'Franquicia principal - TCT FBQ',
    'activo',
    NOW(),
    NOW()
),
(
    'TechCorp S.A.',
    'Roberto Silva',
    '555-0101',
    'rsilva@techcorp.com',
    'Av. Principal 123',
    NULL,
    'activo',
    NOW(),
    NOW()
),
(
    'Innovate Labs',
    'Diana Castillo',
    '555-0202',
    'diana@innovatelabs.com',
    'Calle 5 Norte 456',
    NULL,
    'activo',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- ─── Usuario cliente de ejemplo (asociado a TechCorp S.A.) ───────────────────
-- Contraseña: Admin123!
INSERT INTO users (name, email, password_hash, role, position, company_id, is_active, created_at, updated_at)
VALUES (
    'Juan Pérez (TechCorp)',
    'cliente@marketing.com',
    '$2b$12$q2aij7BwZbWFORH9sASsK.fSc8zR7i//Vzxx5EPHTF/GU/EBoI/Ge',
    'cliente',
    'Gerente de Marketing',
    (SELECT id FROM companies WHERE name = 'TechCorp S.A.' LIMIT 1),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- ─── Paquetes de servicios (Catálogo Alfa Prestige) ──────────────────────────
INSERT INTO packages (name, description, base_price, created_at)
VALUES
(
    'Paquete Básico',
    'Gestión de 2 redes sociales, 12 publicaciones mensuales, diseño de contenido básico y reporte mensual.',
    1500.00,
    NOW()
),
(
    'Paquete Estándar',
    'Gestión de 3 redes sociales, 20 publicaciones mensuales, diseño premium, 1 video corto mensual y reporte quincenal.',
    2800.00,
    NOW()
),
(
    'Paquete Premium',
    'Gestión de 5 redes sociales, 30 publicaciones mensuales, diseño premium, 4 videos cortos, sesión fotográfica mensual y reporte semanal.',
    5000.00,
    NOW()
),
(
    'Paquete Filmación',
    'Producción audiovisual completa: 1 video institucional o publicitario de hasta 3 minutos, guión, grabación, edición y entrega en múltiples formatos.',
    3500.00,
    NOW()
),
(
    'Paquete Fotografía',
    'Sesión fotográfica profesional de producto o corporativa: hasta 4 horas, 50 fotos editadas en alta resolución.',
    1200.00,
    NOW()
),
(
    'Paquete Diseño Gráfico',
    'Creación de identidad de marca: logotipo, manual de marca, paleta de colores, tipografía y plantillas para redes sociales.',
    2000.00,
    NOW()
),
(
    'Paquete Publicidad Digital',
    'Gestión de campañas pagadas (Meta Ads + Google Ads), segmentación de audiencias, presupuesto publicitario administrado y reporte de rendimiento.',
    3200.00,
    NOW()
),
(
    'Paquete Integral 360°',
    'Solución completa: redes sociales, producción de video, fotografía, diseño gráfico y publicidad digital. Todo incluido para marca completa.',
    9500.00,
    NOW()
)
ON CONFLICT DO NOTHING;
