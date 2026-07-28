-- ==============================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: PAQUETES DINÁMICOS, CATEGORÍAS Y PRECIOS FLEXIBLES
-- Ejecutar en el Editor SQL de Supabase (SQL Editor)
-- ==============================================================================

-- 1. Actualizar tabla de paquetes (Categoría, Tipo de Precio, Visibilidad)
ALTER TABLE packages 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'marketing',
  ADD COLUMN IF NOT EXISTS price_type VARCHAR(30) NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS price_text VARCHAR(100) DEFAULT 'Por definir en reunión',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Crear tabla de Contenidos Dinámicos del Paquete
CREATE TABLE IF NOT EXISTS package_items (
  id SERIAL PRIMARY KEY,
  package_id INT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  item_type VARCHAR(30) NOT NULL DEFAULT 'por_cantidad', -- 'por_cantidad' o 'indefinido'
  quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Actualizar tabla de paquetes de empresa (Suscripciones)
ALTER TABLE company_packages 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- 4. Crear tabla de Cupos Restantes de Suscripción de Empresa
CREATE TABLE IF NOT EXISTS company_package_items (
  id SERIAL PRIMARY KEY,
  company_package_id INT NOT NULL REFERENCES company_packages(id) ON DELETE CASCADE,
  package_item_id INT REFERENCES package_items(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  item_type VARCHAR(30) NOT NULL DEFAULT 'por_cantidad',
  quantity_initial INT NOT NULL DEFAULT 0,
  quantity_remaining INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Actualizar la tabla de solicitudes
ALTER TABLE package_requests 
  ADD COLUMN IF NOT EXISTS request_type VARCHAR(30) NOT NULL DEFAULT 'subscription_payment',
  ADD COLUMN IF NOT EXISTS deliverable_type VARCHAR(150),
  ADD COLUMN IF NOT EXISTS quantity_requested INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'pendiente_verificacion',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS title VARCHAR(250);

-- Asegurar visibilidad por defecto en paquetes existentes
UPDATE packages SET is_active = TRUE WHERE is_active IS NULL;
