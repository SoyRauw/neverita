-- Bloque 7 — Comensales por comida
-- Guarda qué integrantes de la familia comen cada receta planificada.
-- Columna nullable → no afecta a los datos existentes.
--   NULL / omitido = toda la familia (comportamiento por defecto, compatible con lo anterior)
--   valor = JSON array de user_id, p.ej. [3,7]

ALTER TABLE daily_meals
  ADD COLUMN IF NOT EXISTS eaters TEXT NULL;
