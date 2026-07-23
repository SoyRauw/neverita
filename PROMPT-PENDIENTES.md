# Neverita — Prompt de trabajo pendiente (por bloques)

> Pega este documento como primer mensaje en Claude Code (dentro del repo) cuando retomes el proyecto.
> Cubre lo que quedó pendiente después de la sesión de rediseño visual. Trabaja **bloque por bloque, en orden**.

---

## Contexto del proyecto

**Neverita** es una app de gestión de cocina familiar.
- **Frontend:** React 19 + Vite + `react-router-dom` 7 (HashRouter). Se despliega en **GitHub Pages** con `npm run deploy` (NO se despliega solo al hacer push). Sitio: `https://soyrauw.github.io/neverita/`.
- **Backend:** Express + MySQL/TiDB (`mysql2/promise`, ESM). En **Render** (`https://neverita.onrender.com`), auto-deploy al hacer push a `main`. Capa de servicios del front: `src/api.js`.
- **Idioma:** todo en español (UI y explicaciones).
- **Estética:** paleta naranja cálida (`--primary:#FF9F43`, `--primary-2:#FF7F50`, `--primary-deep:#e67e22`, tinta `--ink:#2A2118`). Una sola tipografía (Nunito). Mantén esta estética; hay una librería de animaciones y componentes ya hechos (`nv-*`, `.btn-primary`, `.nv-field`, `NvSelect`, `.nv-upload-btn`, etc.) — **reúsalos**.

## Cómo trabajar
1. **Bloque por bloque, en orden.** Antes de cada bloque, explica en español qué archivos tocarás y espera confirmación si el cambio es grande.
2. **Pregunta ANTES** de: (a) cambiar el esquema de BD, (b) agregar dependencias. Propón y espera el "sí".
3. Después de cada bloque: `npm run build` y confirma que compila. **No hagas push sin que te lo pidan**; y siempre `git pull` antes de push (hay un colaborador en el mismo repo).
4. **Reutiliza** lo existente en vez de duplicar. Cambios mínimos y enfocados.

## ⚠️ Contexto de la Base de Datos (leer primero)
- **`back/menu.sql` está DESACTUALIZADO.** La BD en vivo ya tiene columnas/tablas que no aparecen ahí (ej.: `user_family.role`, `inventory.is_frozen/frozen_at/is_leftover/source_recipe_id`, `recipe_ingredients.measure_qty/measure_unit`, `recipes.recommended_meal`, `daily_meals.is_completed/completed_at`, `families.code`, tablas `password_resets` y `shopping_list`).
- **Antes de cualquier migración**, pídele al usuario que corra `SHOW COLUMNS FROM <tabla>;` y te pegue el resultado para escribir el SQL exacto.
- Motor: MariaDB/MySQL. Contraseñas ya con hash bcrypt (`back/src/utils/password.js`).

---

# BLOQUES FUNCIONALES (requieren BD + backend)

## BLOQUE 1 — Perfil por integrante (edad, peso, altura, sexo)  ⭐ base de todo
**Objetivo:** guardar datos físicos de cada usuario de la casa, para luego balancear porciones y sacar métricas por persona.

- **BD (pedir OK):** `ALTER TABLE users ADD birth_date DATE NULL, ADD height_cm INT NULL, ADD weight_kg DECIMAL(5,2) NULL, ADD sex ENUM('m','f','otro') NULL, ADD activity_level ENUM('bajo','medio','alto') NULL DEFAULT 'medio';` (usa `birth_date` para que la edad se calcule sola).
- **Backend:** exponer estos campos en `users` (GET/PUT), sin devolver `password`.
- **Frontend:** UI para editar estos datos por integrante (en el perfil de cada miembro dentro de `FamilyManager.jsx`, o en "Editar Perfil"). `src/api.js` con el método correspondiente.
- **Criterio:** cada integrante puede tener y editar edad/peso/altura/sexo/actividad; se guardan y persisten.

## BLOQUE 2 — Onboarding de preferencias de alimentación
**Objetivo:** al primer ingreso, preguntas sobre cómo se quiere comer (más carbohidratos / más proteínas / vegetariano, etc.), por integrante + preferencia general del hogar.

- **BD (pedir OK):** preferencia por usuario y por familia (ej. `users.diet_preference`, `families.diet_preference` o tabla de tags).
- **Frontend:** flujo tipo wizard al primer ingreso; luego editable en el perfil de cada integrante.
- **Criterio:** las preferencias se guardan y quedan disponibles para influir en recetas/porciones (Bloques 3 y 4).

## BLOQUE 3 — Porciones balanceadas por persona al planificar
**Objetivo:** que las cantidades no se multipliquen igual para todos. Al planificar, **elegir persona por persona** quién comerá y calcular cantidades sanas según sus características.

- Depende de Bloque 1 (datos por persona).
- **Backend/lógica:** necesidad calórica por persona (fórmula Mifflin-St Jeor) → factor de porción por persona; escalar ingredientes por la suma de factores.
- **Frontend:** en el flujo de planificar, reemplazar el "+/− personas" por una **selección de integrantes** (checkbox con sus datos). Mostrar total y por-persona.
- **Criterio:** planificar con 2 hombres jóvenes + mamá + niño da cantidades distintas y balanceadas, no una simple multiplicación.

## BLOQUE 4 — Calorías automáticas de la receta según ingredientes
**Objetivo:** que las calorías se calculen solas (ya está bloqueado el campo al editar). Definición: **calorías por porción = (suma de calorías de todos los ingredientes) ÷ personas**.

- **BD (pedir OK):** añadir energía por ingrediente (`ingredients.calorias_por_100g` o similar), o pedir estimación a la IA.
- **Backend:** al crear/editar/generar, calcular desde `recipe_ingredients` (cantidad × calorías) ÷ `servings`.
- **Frontend:** mostrar el valor calculado (el campo de solo lectura ya existe en el editor).
- **Criterio:** las calorías de una receta reflejan sus ingredientes y se actualizan solas.

## BLOQUE 5 — Métricas por usuario en el Resumen
**Objetivo:** además de las métricas del hogar, un apartado **usuario por usuario** con calorías, carbohidratos, proteína, grasa, azúcares, vegetales, etc.

- Depende de Bloques 1 y 3 (saber qué le tocó a cada persona).
- **Frontend:** en `Stats.jsx`, pestañas/selector "Hogar / Por persona".
- **Criterio:** se pueden ver las métricas de cada integrante por separado.

## BLOQUE 6 — Chat / sugerencias por día y comida
**Objetivo:** ventana **flotante en un costado**; al abrirla, un chat grupal tipo WhatsApp donde los ayudantes sugieren qué comer un día/comida específicos: comida nueva (solo nombre), ingredientes del inventario, o una receta existente. Visible para creador y chef.

- **BD (pedir OK):** tabla `chat_messages` / `meal_suggestions` (family_id, user_id, day, meal, tipo, contenido, created_at).
- **Backend:** endpoints para listar/crear mensajes por familia (refresco por polling).
- **Frontend:** botón flotante + panel lateral con burbujas, autor y selector día/comida; bandeja de sugerencias por slot.
- **Criterio:** un ayudante sugiere una comida para un día/comida y el creador/chef la ve.

## BLOQUE 7 — Planificación multi-slot (rango de días × comidas, recetas distintas)
**Objetivo:** hoy solo se saca UNA comida y se repite. Se quiere elegir un **rango de días y comidas** (ej. toda la semana el almuerzo, o las 3 comidas los 7 días) y que la IA genere **recetas DISTINTAS por espacio**, validando **caducidad** de ingredientes y solapamiento con recetas de días anteriores.

- **Backend/IA:** generar un plan **multi-slot** (varias recetas a la vez) considerando inventario, caducidad y no repetir.
- **Frontend:** rediseño del flujo de planificación: selección de rango día×comida + revisión de propuestas por slot antes de confirmar.
- **Criterio:** seleccionar varios espacios genera recetas diferentes por cada uno, no la misma repetida.

## BLOQUE 8 — Validación "¿cocinaste?" + descuento real de inventario
**Objetivo:** aviso una sola vez por sesión (mientras no se responda), **por franja horaria** (desayuno >9am, almuerzo >4pm, cena >10pm), para confirmar si se cocinó la comida planificada y con qué **cantidad real** → **descuenta del inventario** real y **prioriza la próxima compra**.

- **Nota:** hoy el descuento ocurre **al planificar** (estimado), no al "marcar como hecha". Este bloque mueve/duplica el descuento al momento real.
- **BD:** reutilizar `daily_meals.is_completed/completed_at`; opcional guardar cantidades reales.
- **Backend:** al confirmar, descontar inventario (adaptar `/inventory/deduct` a cantidades reales) y marcar faltantes para compras.
- **Frontend:** modal/aviso que se dispara por hora local y estado no respondido (una vez por sesión), con opción de ajustar cantidades.
- **Criterio:** el aviso aparece a su hora, permite confirmar cantidades y el inventario se descuenta de verdad.

---

# BLOQUE TÉCNICO

## BLOQUE 9 — Fluidez de navegación + limpieza de código muerto
**Objetivo:** mejorar la fluidez entre tabs/interfaces/modales y **eliminar código muerto** que genera **consultas innecesarias a la BD**.

- Revisar cargas repetidas de inventario/recetas al cambiar de vista o abrir modales; cachear o evitar refetch redundante.
- Buscar y quitar estados/efectos/endpoints sin uso.
- **Criterio:** menos peticiones repetidas, transiciones más suaves, sin romper funciones.

---

# BLOQUES VISUALES (sin BD)

## BLOQUE 10 — Calendario / date picker propio
**Objetivo:** reemplazar el selector de fecha nativo (el "sudoku" de cuadritos, sin diseño) por un **calendario propio** animado y con color, reutilizable. Aplica a "Agregar Producto" (inventario) y demás fechas.
- Componente `NvDatePicker` (sin dependencia nueva, o proponer una ligera y pedir OK).
- **Criterio:** el selector de fecha se ve moderno, con animación y en la paleta de la app.

## BLOQUE 11 — Barrido de emojis → iconos flotantes
**Objetivo:** reemplazar los emojis estáticos por **iconos Phosphor flotantes/modernos** (estilo del estado vacío / `.nv-title-ic`) **en toda la web** (títulos, modales, avisos).
- Ya hecho de muestra en el título "Mi Inventario".
- **Criterio:** no quedan emojis "de sistema" en títulos/acciones principales; se ven iconos modernos.

## BLOQUE 12 — Aplicar NvSelect a los `select` restantes
**Objetivo:** usar el desplegable moderno `NvSelect` (ya creado) en los `select` nativos que queden (modal "Agregar Producto" del inventario: unidad y categoría, formularios de crear ingrediente, etc.).
- **Criterio:** no quedan `<select>` nativos feos; todos usan `NvSelect` animado.

---

## Estado de lo YA HECHO (referencia, no rehacer)
- Rediseño visual del planificador, recetas (tarjetas + detalle libro), compras, modales, FamilySelect.
- Editar receta (nombre/tiempo/personas; calorías bloqueadas; imagen solo por archivo → data URL).
- Stepper de personas en el detalle que reescala ingredientes.
- QR de invitación arreglado (deep-link `?join=CÓDIGO`).
- Endurecimiento del backend (hashing, validaciones, 404, etc.).
- Responsive móvil de tarjetas de receta y lista de compras.
