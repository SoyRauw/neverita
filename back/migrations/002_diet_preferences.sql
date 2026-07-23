-- Bloque 2 — Preferencias alimentarias por usuario
-- Añade tipo de dieta, objetivo y restricciones/alergias (JSON) a la tabla users.
-- Columnas nullable → no afecta a los usuarios existentes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS diet_type VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS goal VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT NULL;

-- Valores esperados (validados en el backend, no en la BD):
--   diet_type: omnivoro | vegetariano | vegano | pescetariano
--   goal:      bajar | mantener | ganar
--   dietary_restrictions: JSON array, p.ej. ["gluten","lactosa"]
