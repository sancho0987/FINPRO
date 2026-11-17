-- Presupuesto global del hogar para cada período financiero.
-- Un valor de 0 conserva el comportamiento anterior: se usa la suma de
-- presupuestos por categoría como referencia general.
ALTER TABLE settings ADD COLUMN monthly_budget_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_budget_cents >= 0);
