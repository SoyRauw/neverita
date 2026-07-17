# Neverita — Ideas futuras (funciones grandes por evaluar)

Estas son ideas/funciones que **NO** se implementaron todavía porque requieren **base de datos, backend y coordinación** con quien lleva la BD. Quedan aquí como posibles próximas funciones. Cada una incluye qué haría y qué haría falta.

---

## 0. Onboarding: preferencias de alimentación por integrante
**Idea:** al entrar por primera vez, una serie de preguntas sobre cómo se quiere llevar la alimentación (más carbohidratos, más proteínas, vegetariano, etc.), con opción de definirlo **por cada integrante del hogar** además de una preferencia **general del hogar**.

**Haría falta:**
- BD: preferencias por usuario y por familia (p. ej. `diet_preference` enum/tags; `es_vegetariano`, etc.).
- Backend: guardar/leer preferencias.
- Frontend: flujo de onboarding (wizard) al primer ingreso; luego editable en el perfil de cada integrante.
- Se conecta con (1) y (1b): las preferencias influyen en las recetas sugeridas y en el balance de porciones.

## 1. Cantidades balanceadas por características de cada persona (nutrición real)
**Idea:** al generar/escalar una receta, tener en cuenta **edad, altura y peso** de cada integrante de la casa, en vez de multiplicar igual para todos.

Hoy solo se multiplica por número de personas por igual. Pero en una familia de 4 (dos hombres de 20–23 años, ~80–90 kg y +1.80 m; una mamá de 37, 65 kg, 1.63 m; un niño de 9, ~30–50 kg) **no comen la misma cantidad**. Se quiere un aproximado **balanceado y sano** por persona.

Al planificar, poder **elegir persona por persona** de la casa (no solo un número), y que las cantidades totales y por-persona se calculen según sus características.

**Haría falta:**
- BD: perfil por usuario con `edad`, `altura`, `peso`, `sexo`, (opcional `nivel_actividad`).
- Backend: cálculo de necesidad calórica por persona (fórmula tipo Mifflin-St Jeor) → factor de porción por persona; escalar ingredientes por la suma de factores.
- Frontend: al planificar, seleccionar los integrantes que comerán (checkboxes con sus datos) en vez de solo “+/− personas”.

## 1b. Calorías automáticas de la receta según ingredientes
**Idea:** que las calorías de una receta **no se escriban a mano** sino que se calculen solas a partir de sus ingredientes (ya está bloqueado el campo al editar). Definición propuesta: **calorías por porción = (suma de calorías de todos los ingredientes) ÷ número de personas**.

**Haría falta:**
- BD: añadir a `ingredients` un campo de energía (p. ej. `calorias_por_100g` o `calorias_por_unidad`), o pedir la estimación a la IA.
- Backend: al crear/editar/generar receta, calcular el total desde `recipe_ingredients` (cantidad × calorías del ingrediente) y dividir entre `servings`.
- Frontend: mostrar el valor calculado (campo de solo lectura, ya implementado en el editor).

## 2. Métricas por usuario en el Resumen
**Idea:** además de las métricas generales del hogar, un apartado que muestre **usuario por usuario** sus métricas: calorías, carbohidratos, proteínas, grasas, azúcares, vegetales, etc.

**Haría falta:**
- Depende de (1) (saber cuánto le tocó a cada persona en cada comida hecha).
- Backend: agregación por usuario a partir de las comidas marcadas como hechas y su reparto.
- Frontend: en `Stats.jsx`, un selector/pestañas “Hogar / Por persona”.

## 3. Chat de sugerencias por día y comida (tipo grupo de WhatsApp)
**Idea:** una ventana **flotante en un costado** del planificador; al abrirla es un **chat grupal** donde los ayudantes/usuarios **sugieren qué quieren comer** un día y comida concretos. Se puede:
- Elegir día de la semana + una de las 3 comidas.
- Sugerir una comida nueva (solo el nombre).
- Sugerir ingredientes que haya en el inventario.
- Sugerir una receta ya existente.

**Haría falta:**
- BD: tabla `chat_messages` (family_id, user_id, day, meal, tipo, contenido, created_at) o `meal_suggestions`.
- Backend: endpoints para listar/crear mensajes por familia (idealmente con refresco por polling o websockets).
- Frontend: botón flotante + panel lateral tipo chat, con burbujas, autor y selector día/comida.

**Extensión — sugerencias de los ayudantes:** que los **ayudantes** puedan sugerir recetas (nuevas o ya existentes) para un **día y comida específicos**, y que tanto el **creador/admin** como el **chef** las vean (bandeja de sugerencias por slot). Reutiliza la misma tabla de sugerencias/chat con un tipo "sugerencia de receta".

## 4. Validación “¿cocinaste la receta planificada?” + cantidad real
**Idea:** un aviso que aparece **una sola vez cada vez que entras a la web** (mientras no se responda) preguntando si se cocinó la comida planificada, con opción de indicar la **cantidad real** usada (porque el cálculo es una recomendación, no la realidad).

- Aparece **después de la hora promedio** de cada comida: desayuno **después de 9 am**, almuerzo **después de 4 pm**, cena **después de 10 pm**.
- Al confirmar, **descuenta del inventario** los ingredientes según lo realmente usado y da **prioridad a un aviso de próxima compra** para lo que se está agotando.

> Nota: ya existe en el proyecto “marcar como hecha” (columna `is_completed` en `daily_meals`). Esta idea lo **extiende** con el aviso automático por horario + cantidad real + descuento de inventario.

**Haría falta:**
- BD: reutilizar `daily_meals.is_completed`/`completed_at`; opcional guardar cantidades reales.
- Backend: endpoint que, al confirmar, descuente inventario (ya existe `/inventory/deduct`, adaptarlo a cantidades reales) y marque faltantes para compras.
- Frontend: modal/aviso que se dispara por hora local y estado no respondido (una vez por sesión).

## 5. Planificación por rango de días × comidas con recetas distintas
**Idea:** hoy, al planificar con IA o con recetas existentes, solo puedes sacar **una** comida y repetirla en varios espacios (siempre la misma). Se quiere:
- Elegir **por día** qué planificar y **en qué comida**.
- Poder tildar, por ejemplo, **los 7 días para el almuerzo**, o toda la semana con las 3 comidas, etc.
- Que la IA genere **opciones distintas** para cada espacio seleccionado (no la misma comida en todos).
- Validar la **caducidad** de los ingredientes y si ya están **planificados en otras recetas de días anteriores**, para no chocar.

**Haría falta:**
- Backend/IA: generar un **plan multi-slot** (varias recetas a la vez) considerando inventario, caducidad y solapamiento entre días.
- Frontend: rediseño del flujo de planificación (selección de rango día×comida + revisión de las propuestas por slot antes de confirmar).

---

---

## Hallazgos de validación (revisados)
- **¿"Marcar como hecha" descuenta del inventario?** → **No** en el momento de marcarla. El descuento del inventario ocurre **al planificar** la receta (`/inventory/deduct`, con cantidades estimadas). El endpoint `/complete` solo marca `is_completed`. La idea (4) propone mover/duplicar ese descuento al **confirmar que se cocinó**, con la **cantidad real**.
- **Escalado de ingredientes al cambiar personas:** sí escala en el paso "¿para cuántas personas?", pero **solo** para ingredientes con formato `Nombre (cantidad unidad)`. Si un ingrediente no trae cantidad, no se puede escalar; y las unidades enteras (p. ej. "1 tomate" → "1.5") necesitan **redondeo sensato**. Mejora: normalizar cantidades y redondear unidades contables.
- **Cambio de imagen al editar receta:** era por usar `URL.createObjectURL` (enlace temporal `blob:` que no persiste). **Ya corregido**: la imagen se incrusta como data URL redimensionado.

## Pendiente visual (barridos, no funciones grandes)
- **Calendario/date picker moderno:** reemplazar el selector de fecha nativo (el "sudoku" de cuadritos) por un **calendario propio** animado y con color (componente reutilizable). Aplica a "Agregar Producto" y demás fechas.
- **Reemplazar todos los emojis** por iconos flotantes/modernos **en toda la web** (barrido por muchos archivos).
- **Aplicar el desplegable moderno (NvSelect)** en los `select` restantes (unidad/categoría del modal de inventario, etc.). Ya aplicado en la lista de compras.
