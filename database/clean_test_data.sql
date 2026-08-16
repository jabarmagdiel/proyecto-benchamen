-- ============================================================
-- Script de Limpieza de Datos de Prueba para Supabase
-- Vacía: Finanzas, Suscripciones, Actividades, Proyectos, Clientes Antiguos y Agendas.
-- (Conserva: Usuarios Administradores, Operativos, Paquetes base y Roles/Departamentos).
-- ============================================================

-- 1. Vaciar evidencias, comentarios e historial de actividades
TRUNCATE TABLE activity_history CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE evidences CASCADE;

-- 2. Vaciar actividades y proyectos
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE projects CASCADE;

-- 3. Vaciar solicitudes de paquetes, finanzas, pagos y suscripciones de empresas
TRUNCATE TABLE package_requests CASCADE;
TRUNCATE TABLE company_packages CASCADE;

-- 4. Vaciar citas / agendas y matriz de disponibilidad del equipo
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE operative_availabilities CASCADE;

-- 5. Vaciar notificaciones y empresas (Clientes antiguos)
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE companies CASCADE;

-- 6. Eliminar cuentas de usuarios con rol "cliente" de prueba
DELETE FROM users WHERE role = 'cliente';

-- 7. Reiniciar secuencias de IDs para comenzar desde 1
ALTER SEQUENCE IF EXISTS activities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS package_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS company_packages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS appointments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS operative_availabilities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS comments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS evidences_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS activity_history_id_seq RESTART WITH 1;
