-- ==============================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: DISPONIBILIDAD Y BLOQUEOS DE HORARIO FREELANCE
-- Ejecutar en el Editor SQL de Supabase (SQL Editor)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS operative_availabilities (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL DEFAULT '08:00',
  end_time VARCHAR(5) NOT NULL DEFAULT '18:00',
  is_full_day BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'busy', -- 'busy' (ocupado por trabajo externo), 'available' (turno disponible)
  reason VARCHAR(250),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda rápida por fecha y usuario
CREATE INDEX IF NOT EXISTS idx_op_avail_user_date ON operative_availabilities (user_id, date);
CREATE INDEX IF NOT EXISTS idx_op_avail_date ON operative_availabilities (date);
