# Neverita — Changelog de mejoras y checklist de pruebas

> Trabajo de esta sesión, **todo local (sin push)**. Usa la sección **Checklist** para probar antes de desplegar.

---

## 0) ANTES DE PROBAR (importante)

- [ ] **`npm install`** en la raíz **y en `back/`** (nueva dependencia **`html5-qrcode`** en el front; los `package-lock.json` cambiaron por `npm audit fix`).
- [ ] **Reiniciar el backend**: `Ctrl+C` y `npm run dev` (hubo muchos cambios de servidor). En Windows, si sale `EADDRINUSE`, hay un `node` colgado en el `:3000` — ciérralo antes.
- [ ] **Recargar el front**: `Ctrl+Shift+R`.
- [ ] **Seguridad de dependencias:** `npm audit fix` aplicado → **front: 0 vulnerabilidades**; back: queda 1 (nodemailer) **no explotable** aquí (no usamos la opción `raw`), no forzada para no romper el envío de correos.
- [ ] **Respaldo** de la versión previa ya creado: rama `respaldo/web-original`, tag `respaldo-web-original-2026-07-23`, y zip `../neverita-web-original-backup.zip`.
- [ ] **Base de datos:** se agregó la columna `daily_meals.eaters` (TEXT NULL) — **ya aplicada** a tu TiDB (migración `back/migrations/003_meal_eaters.sql`).
- [ ] 🔐 **Rotar credenciales** expuestas en el chat (TiDB, Gemini, SerpAPI, correo) — pendiente de tu lado.

---

## 1) MEJORAS DEL PROMPT (18 items)

| # | Mejora | Estado |
|---|--------|--------|
| 1 | Popup animado con el **motivo** por el que no se puede planificar (arreglado el botón que no avisaba) | ✅ |
| 2 | Receta planificada en **formato libro**, pasos más legibles, ingredientes/porciones por persona | ✅ |
| 3 | Al **"Cambiar"** una planificada, pregunta **IA vs receta existente** | ✅ |
| 4 | Lista de compras por **secciones** (etiquetas flotantes + icono) + **unidades inteligentes** (1000 ml→1 L, 250.00 g→250 g, topes) | ✅ |
| 5 | **Autocomplete** de productos + validación IA "¿es un alimento?" (bloquea "carro") | ✅ |
| 6 | Inventario: fecha ya no se sale de la casilla + feedback **válido/inválido** de cantidad | ✅ |
| 7 | **Enter** acciona el código de invitación | ✅ |
| 8 | **Editar recetas + fotos guardan bien** (antes perdían los ingredientes) | ✅ |
| 9 | Recetario muestra **cantidades base** (sin recalcar "personas") | ✅ |
| 10 | **Editar todo**: usuario, correo (único), contraseña (verifica la actual), físicos | ✅ |
| 11 | **Salir de la familia**; el creador debe **transferir el mando** antes | ✅ |
| 12 | Menos espacio en blanco / mejor ubicación de tiempo-calorías | ⚠️ parcial (pase responsive) |
| 13 | **Fondo animado borroso** en Recetas | ✅ |
| 14 | Registro manual indica el **tipo de error** concreto | ✅ |
| 15 | Imágenes viejas que no cargan → **respaldo bonito** (degradado + icono) | ✅ |
| 16 | **Escanear QR** con la cámara para unirse a una casa | ✅ |
| 17 | Búsqueda con **lupa animada** | ✅ (Recetas, Inventario, Compras) |
| 18/19 | Interfaces modernas/animadas + **responsive móvil** + skills de diseño | ✅ (ver §3) |

---

## 2) AUDITORÍA DE ERRORES Y VALIDACIONES

Se corrió una **auditoría multi-agente con verificación adversarial**: **50 problemas reales confirmados** (8 HIGH, 26 MEDIUM, 16 LOW). **Arreglados los más importantes (~38)**, incluidos **TODOS los HIGH**:

- **Recetas manuales perdían los ingredientes** (guardaba "éxito" con 0 ingredientes) → ahora **persisten** (POST/PUT transaccional + parser robusto que aguanta editar/reguardar). *(= item 8)*
- **Planificar desde Recetas** no avisaba y descontaba inventario a destiempo → mensajes claros + sin doble descuento.
- **Cuadros "fantasma"** cuando no hay plan activo → se bloquea con aviso.
- **Editar perfil** no guardaba correo/nombre → ahora persiste todo. *(= item 10)*
- **Proxy de imágenes**: endurecido contra **SSRF** (DNS, IPv6, redirecciones re-validadas).
- **Validaciones de backend** (evitan 500 → 400 claro): compras (cantidad>0), inventario (NaN + fecha no anterior a hoy), daily-meals/menu-plans PUT, familia (role/kick/leave), correo único, mensaje de usuario duplicado.
- **Permisos**: "¿Cocinaste?" no le sale al ayudante; borrar sugerencia verifica autor/creador.
- **Silent-failures** ahora avisan: carga de integrantes, de compras, de recetas, de sugerencias.
- **Revertir en fallo**: borrar comida, editar comensales, guardar plan.
- **Caducidad**: un día vencido ya **omite solo ese día** (antes abortaba todo).

---

## 3) RESPONSIVE MÓVIL (auditoría dedicada)

Segunda auditoría (**31 problemas confirmados** a 360 px). Arreglados el **HIGH** y la mayoría:

- **HIGH:** el modal "Agregar Producto" se cortaba en móvil (no se veía el botón) → **scroll interno**, footer fijo.
- Footer del modal IA **no aplasta** los botones (se envuelven).
- Barra de selección múltiple **por encima** de la nav inferior.
- **Área segura del iPhone** (composer de sugerencias, login, footers).
- Compras: etiqueta de sección visible bajo la barra de familia; botón borrar visible en táctil.
- Inventario: header apila botones; cantidad/unidad alineadas.
- Familia: edición de miembro colapsa a 1 columna en pantallas angostas; FamilySelect permite scroll.
- Calendario móvil muestra el **nombre del plato**.
- **Touch targets** ≥40px en varios botones; inputs a 16px (sin auto-zoom iOS).
- **Lupa de búsqueda animada** al enfocar (Recetas, Inventario, Compras).
- **Touch targets ≥40px** en todos los botones señalados (cerrar, volver, quitar, mostrar contraseña, chips, tarjetas de inventario).

✅ **Los 31 findings de responsive están aplicados.**

---

## 3.1) AJUSTES FINALES DE DISEÑO

- **Tarjetas de receta rediseñadas:** menos espacio en blanco; **kcal y tiempo** ahora son chips "glass" sobre la foto; imagen más compacta; botones alineados entre tarjetas.
- **Pasos de recetas alineados:** se corrigió un choque de clase CSS (`.nv-steps`) que centraba los pasos; ahora salen en columna, numerados y alineados (detalle planificado **y** recetario).
- **Bug corregido:** el fondo animado de Recetas hacía que **los modales no abrieran** (detalle/editar/nueva/planificar) — arreglado.

## 4) BASE DE DATOS Y DEPENDENCIAS

- **BD:** `ALTER TABLE daily_meals ADD COLUMN eaters TEXT NULL` (comensales por comida). Nullable, no afecta datos previos. **Ya aplicada.**
- **Backend Render** (al pushear): usa la misma BD, así que la columna ya existe; el **código** con las rutas nuevas (`/img`, `/daily-meals/:id/eaters`, `/user-family/leave`) toma efecto al desplegar.
- **Dependencia nueva:** `html5-qrcode` (front) — el colaborador debe `npm install` tras el pull.

---

## 5) CHECKLIST DE PRUEBAS (paso a paso)

### Planificador
- [ ] Selecciona ingredientes + ≥2 cuadros → **"Plan variado"**: genera 1 receta por cuadro.
- [ ] Con ingredientes pobres o inconexos → aparece el **popup de motivo** (no pantalla vacía).
- [ ] **"Seleccionar varios"**: toca cuadros **vacíos** → "Planificar (N)". Toca uno **con receta** → modo gestionar → **Editar / Eliminar (N)**.
- [ ] Editar múltiple: cambia receta y comensales → **"Guardar cambios"** actualiza (no crea encima).
- [ ] Intenta planificar **sin seleccionar personas** → error claro.
- [ ] Marca una comida como cocinada → descuenta inventario (a un ayudante **no** le aparece el aviso).

### Detalle de comida
- [ ] Abre una comida planificada → **"¿Quiénes comen?"**: agrega/quita personas → cantidades y kcal se recalculan y **se guardan solas**.
- [ ] "Cambiar" → pregunta **IA vs existente**. Pasos en **formato libro**.

### Recetas
- [ ] Crea una receta manual con ingredientes (uno por línea) → **se guardan**; reábrela y **edítala** → siguen bien.
- [ ] Deja calorías/porciones inválidas → **error concreto**.
- [ ] Imagen que no carga → **respaldo con icono** (no rota).
- [ ] Recetario muestra **cantidades base** (sin stepper de personas).

### Inventario
- [ ] Agrega un producto: busca (autocomplete) o crea nuevo; intenta **"carro"** → lo bloquea.
- [ ] Cantidad negativa/enorme → aviso; cantidad válida → borde verde.
- [ ] En móvil, el modal **hace scroll** y se ve el botón "Agregar".
- [ ] Cantidades se ven bonitas: **1 kg**, **1 L**, **250 g** (sin ceros de más).

### Compras
- [ ] Los productos se agrupan en **secciones** con etiqueta + icono.
- [ ] Agregar con cantidad inválida → aviso.

### Cuenta / Familia
- [ ] Edita **usuario, correo, contraseña (con la actual), físicos** → guarda y **persiste al recargar**.
- [ ] Correo/usuario repetido → mensaje claro.
- [ ] **Salir de la familia**: si eres creador y hay otros, exige **transferir el mando**.
- [ ] **Unirse por QR**: botón "Escanear QR" abre cámara y te une.
- [ ] **Enter** en el código funciona.

### Móvil (probar en el teléfono o DevTools 360–414 px)
- [ ] Todo se ve sin **desbordes horizontales** ni contenido cortado.
- [ ] Modales hacen scroll; barras respetan la nav inferior y el "notch".

---

## 6) DESPLIEGUE (cuando lo autorices)

- [ ] `git pull` (hay colaborador).
- [ ] Revisar `git status` / diff.
- [ ] `git add` + commit con mensaje claro.
- [ ] Push a `main` → Render auto-despliega el back.
- [ ] `npm run deploy` → front a GitHub Pages.
- [ ] Probar en producción (recordar que el front en gh-pages es **https**; el back en Render también).
