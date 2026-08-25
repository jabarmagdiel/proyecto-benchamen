-- ==============================================================================
-- SCRIPT DE MIGRACIÓN SUPABASE: MÓDULO DE FINANZAS, INGRESOS Y EGRESOS
-- Ejecutar en el Editor SQL de Supabase (SQL Editor)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'ingreso' o 'egreso'
    title VARCHAR(250) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'transferencia',
    payment_reference VARCHAR(100),
    receipt_url TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    company_id INT REFERENCES companies(id) ON DELETE SET NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    created_by_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fin_trans_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fin_trans_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fin_trans_company ON financial_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_project ON financial_transactions(project_id);
