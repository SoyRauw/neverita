-- Amplía recipes.image_url de TEXT (64 KB) a MEDIUMTEXT (16 MB).
-- Las fotos de receta se guardan como data URL base64; una foto redimensionada
-- supera con facilidad los 64 KB de TEXT y provocaba error 500 ("Data too long")
-- al crear/editar recetas con imagen. MEDIUMTEXT es amplio y no destructivo.
ALTER TABLE recipes MODIFY COLUMN image_url MEDIUMTEXT NULL;
