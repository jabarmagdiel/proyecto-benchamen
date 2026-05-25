-- ============================================================
-- Seed: datos iniciales
-- ¡NOTA! Ejecutar DESPUÉS del schema.sql
-- ============================================================

-- Usuario administrador por defecto
-- Contraseña: Admin123! (bcrypt hash)
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

-- Empresa de ejemplo
INSERT INTO companies (name, contact_name, phone, email, address, status, created_at, updated_at)
VALUES
('TechCorp S.A.',    'Roberto Silva',   '555-0101', 'rsilva@techcorp.com',    'Av. Principal 123', 'activo', NOW(), NOW()),
('Innovate Labs',    'Diana Castillo',  '555-0202', 'diana@innovatelabs.com', 'Calle 5 Norte 456', 'activo', NOW(), NOW()),
('Retail Plus',      'Marcos Fernández','555-0303', 'marcos@retailplus.com',  'Zona Industrial 78', 'activo', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Usuario cliente de ejemplo (asociado a TechCorp S.A. - id 1)
-- Contraseña: Admin123!
INSERT INTO users (name, email, password_hash, role, position, company_id, is_active, created_at, updated_at)
VALUES (
    'Juan Pérez (TechCorp)',
    'cliente@marketing.com',
    '$2b$12$q2aij7BwZbWFORH9sASsK.fSc8zR7i//Vzxx5EPHTF/GU/EBoI/Ge',
    'cliente',
    'Gerente de Marketing',
    1,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

