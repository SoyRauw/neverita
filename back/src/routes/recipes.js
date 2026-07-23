import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// ── Ingredientes de recetas escritas a mano ──────────────────────────────────
// Unidades base (van a ingredients.unit + recipe_ingredients.quantity)
const BASE_UNITS = { g: 'g', gr: 'g', gramo: 'g', gramos: 'g', kg: 'kg', ml: 'ml', l: 'l', lt: 'l', litro: 'l', litros: 'l', unidad: 'unidad', unidades: 'unidad', u: 'unidad' };
// Medidas de cocina (van a measure_qty/measure_unit)
const MEASURES = new Set(['cucharada', 'cucharadas', 'cucharadita', 'cucharaditas', 'taza', 'tazas', 'cup', 'pizca', 'pizcas', 'diente', 'dientes', 'rebanada', 'rebanadas', 'rodaja', 'rodajas', 'hoja', 'hojas', 'ramita', 'ramitas', 'lata', 'latas', 'sobre', 'sobres', 'vaso', 'vasos', 'chorro', 'puñado']);

// Convierte una línea en { name, quantity, unit, measure_qty, measure_unit }.
// Acepta el formato de ENTRADA ("200 g pasta", "2 huevos", "Tomate") y el de
// VISUALIZACIÓN que devuelve el GET ("Pasta (200 g)", "1 cucharada de Aceite (15 ml)"),
// para que editar una receta y volver a guardar no rompa los ingredientes.
function parseIngredientLine(line) {
  const s = (line || '').trim();
  if (!s) return null;
  // Formato de visualización con paréntesis: "[m_qty m_unit de ] Nombre (qty? unit)".
  // El número dentro del paréntesis es opcional (p.ej. "Sal (g)").
  const disp = s.match(/^(?:([\d]+(?:[.,]\d+)?)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\s+de\s+)?(.+?)\s*\(\s*([\d]+(?:[.,]\d+)?)?\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ]*)\s*\)\s*$/);
  if (disp) {
    const dqty = disp[4] ? parseFloat(disp[4].replace(',', '.')) : null;
    const dunit = (disp[5] || '').trim().toLowerCase();
    const knownUnit = !!BASE_UNITS[dunit];
    // Solo lo tratamos como cantidad/unidad si hay número o una unidad conocida;
    // si no, seguramente es un nombre con paréntesis (ej. "Pan (integral)") → cae abajo.
    if (dqty != null || knownUnit) {
      return {
        name: disp[3].trim(),
        quantity: dqty,
        unit: knownUnit ? BASE_UNITS[dunit] : (dunit || null),
        measure_qty: disp[1] ? parseFloat(disp[1].replace(',', '.')) : null,
        measure_unit: disp[2] ? disp[2].toLowerCase() : null,
      };
    }
  }
  const m = s.match(/^([\d]+(?:[.,]\d+)?)\s*([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)?\s*(?:de\s+)?(.*)$/);
  if (m && m[1]) {
    const qty = parseFloat(m[1].replace(',', '.'));
    const word = (m[2] || '').toLowerCase();
    const rest = (m[3] || '').trim();
    if (BASE_UNITS[word]) {
      if (!rest) return { name: s, quantity: null, unit: null, measure_qty: null, measure_unit: null };
      return { name: rest, quantity: qty, unit: BASE_UNITS[word], measure_qty: null, measure_unit: null };
    }
    if (MEASURES.has(word)) {
      if (!rest) return { name: s, quantity: null, unit: null, measure_qty: null, measure_unit: null };
      return { name: rest, quantity: null, unit: null, measure_qty: qty, measure_unit: word };
    }
    // número + palabra que NO es unidad → forma parte del nombre ("2 huevos")
    const name = `${m[2] ? m[2] + ' ' : ''}${rest}`.trim();
    return { name: name || s, quantity: qty, unit: null, measure_qty: null, measure_unit: null };
  }
  return { name: s, quantity: null, unit: null, measure_qty: null, measure_unit: null };
}

// Busca-o-crea cada ingrediente y lo enlaza a la receta. Usa la conexión de la transacción.
async function persistRecipeIngredients(connection, recipe_id, lines) {
  const parsed = (Array.isArray(lines) ? lines : []).map(parseIngredientLine).filter(p => p && p.name && p.name.trim());
  for (const p of parsed) {
    const nm = p.name.trim();
    const [existing] = await connection.query('SELECT ingredient_id FROM ingredients WHERE LOWER(name) = LOWER(?) LIMIT 1', [nm]);
    let ingId;
    if (existing.length) ingId = existing[0].ingredient_id;
    else {
      const formatted = nm.charAt(0).toUpperCase() + nm.slice(1).toLowerCase();
      const [ins] = await connection.query('INSERT INTO ingredients (name, unit, category, average_expiry_days) VALUES (?, ?, ?, ?)', [formatted, p.unit || 'unidad', 'otro', 7]);
      ingId = ins.insertId;
    }
    const safeQty = p.quantity != null ? Math.max(0, Number(p.quantity)) : null;
    await connection.query('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, measure_qty, measure_unit) VALUES (?, ?, ?, ?, ?)', [recipe_id, ingId, safeQty, p.measure_qty, p.measure_unit]);
  }
  return parsed.length;
}

// Trae los ingredientes de una receta ya formateados como strings (mismo formato que el GET).
async function fetchRecipeIngredients(connection, recipe_id) {
  const [rows] = await connection.query(
    `SELECT i.name, ri.quantity, i.unit, ri.measure_qty, ri.measure_unit
     FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
     WHERE ri.recipe_id = ?`, [recipe_id]);
  return rows.map(row => {
    const qty = row.quantity ? `${row.quantity} ${row.unit || ''}`.trim() : (row.unit || '');
    const mp = row.measure_qty && row.measure_unit ? `${row.measure_qty} ${row.measure_unit} de ` : '';
    return qty ? `${mp}${row.name} (${qty})` : `${mp}${row.name}`;
  });
}

// Saneo compartido de servings/calorías (evita negativos / no-numéricos).
function sanitizeServings(v) { const n = Number(v); return (Number.isFinite(n) && n > 0) ? Math.round(n) : 1; }
function sanitizeCalories(v) { if (v === null || v === undefined || v === '') return null; const n = Number(v); return (Number.isFinite(n) && n >= 0) ? Math.round(n) : null; }

// GET /recipes — devuelve todas las recetas con sus ingredientes embebidos
router.get('/', async (req, res, next) => {
  try {
    // 1. Traer todas las recetas
    const [recipes] = await db.query('SELECT * FROM recipes');

    if (recipes.length === 0) return res.json([]);

    // 2. Traer todos los ingredientes de esas recetas en una sola query JOIN
    const recipeIds = recipes.map(r => r.recipe_id);
    const [ingredientRows] = await db.query(
      `SELECT ri.recipe_id, i.name, ri.quantity, i.unit, ri.measure_qty, ri.measure_unit
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
       WHERE ri.recipe_id IN (?)`,
      [recipeIds]
    );

    // 3. Agrupar los ingredientes por recipe_id
    const ingredientsByRecipe = {};
    for (const row of ingredientRows) {
      if (!ingredientsByRecipe[row.recipe_id]) {
        ingredientsByRecipe[row.recipe_id] = [];
      }
      const qty = row.quantity ? `${row.quantity} ${row.unit || ''}`.trim() : row.unit || '';
      const measurePart = row.measure_qty && row.measure_unit ? `${row.measure_qty} ${row.measure_unit} de ` : '';
      ingredientsByRecipe[row.recipe_id].push(qty ? `${measurePart}${row.name} (${qty})` : `${measurePart}${row.name}`);
    }

    // 4. Combinar recetas con sus ingredientes
    const result = recipes.map(r => ({
      ...r,
      ingredients: ingredientsByRecipe[r.recipe_id] || [],
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// GET /recipes/:id — una receta con sus ingredientes
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM recipes WHERE recipe_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const recipe = rows[0];

    const [ingredientRows] = await db.query(
      `SELECT i.name, ri.quantity, i.unit, ri.measure_qty, ri.measure_unit
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
       WHERE ri.recipe_id = ?`,
      [req.params.id]
    );

    recipe.ingredients = ingredientRows.map(row => {
      const qty = row.quantity ? `${row.quantity} ${row.unit || ''}`.trim() : row.unit || '';
      const measurePart = row.measure_qty && row.measure_unit ? `${row.measure_qty} ${row.measure_unit} de ` : '';
      return qty ? `${measurePart}${row.name} (${qty})` : `${measurePart}${row.name}`;
    });

    res.json(recipe);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const { title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id, recommended_meal, ingredient_lines } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'El título de la receta es obligatorio.' });
  const validMeals = ['desayuno', 'almuerzo', 'cena', 'cualquiera'];
  const mealType = validMeals.includes(recommended_meal) ? recommended_meal : 'cualquiera';
  const servingsVal = sanitizeServings(servings);
  const caloriesVal = sanitizeCalories(calories_per_serving);

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO recipes (title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id, recommended_meal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), description || '', instructions || '', difficulty || 'regular', preparation_time || 0, servingsVal, image_url || '', caloriesVal, created_by || null, family_id || null, mealType]
    );
    const recipe_id = result.insertId;

    if (family_id) {
      await connection.query('INSERT INTO family_recipes (family_id, recipe_id) VALUES (?, ?)', [family_id, recipe_id]);
    }
    // Item 8: persistir los ingredientes escritos a mano (busca-o-crea + recipe_ingredients).
    if (Array.isArray(ingredient_lines) && ingredient_lines.length) {
      await persistRecipeIngredients(connection, recipe_id, ingredient_lines);
    }
    const ingredients = await fetchRecipeIngredients(connection, recipe_id);
    await connection.commit();

    res.status(201).json({ recipe_id, title: title.trim(), description, instructions, difficulty, preparation_time, servings: servingsVal, image_url, calories_per_serving: caloriesVal, created_by: created_by || null, family_id: family_id || null, recommended_meal: mealType, ingredients });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
});
// POST /recipes/validate-expiration — valida que los ingredientes de una receta no estén vencidos para la fecha planificada
router.post('/validate-expiration', async (req, res, next) => {
  try {
    const { recipe_id, family_id, scheduled_date } = req.body;
    if (!recipe_id || !family_id || !scheduled_date) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }

    // 1. Obtener los ingredientes requeridos por la receta
    const [recipeIngsRaw] = await db.query(
      `SELECT ri.ingredient_id, i.name 
       FROM recipe_ingredients ri 
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id 
       WHERE ri.recipe_id = ?`,
      [recipe_id]
    );

    // Ignorar 'agua' ya que se asume que siempre está disponible
    const recipeIngs = recipeIngsRaw.filter(i => i.name.toLowerCase() !== 'agua');

    if (!recipeIngs.length) return res.json({ valid: true });

    // 2. Obtener el inventario de la familia para esos ingredientes
    const ingredientIds = recipeIngs.map(i => i.ingredient_id);
    const [inventory] = await db.query(
      `SELECT ingredient_id, expiration_date 
       FROM inventory 
       WHERE family_id = ? AND ingredient_id IN (?)`,
      [family_id, ingredientIds]
    );

    // 3. Validar caducidad
    const expiredIngredients = [];

    for (const reqIng of recipeIngs) {
      const invItems = inventory.filter(item => item.ingredient_id === reqIng.ingredient_id);
      
      // Si no lo tiene en el inventario, asumimos que lo va a comprar, así que no lo bloqueamos
      if (invItems.length === 0) continue;

      // Buscar si hay AL MENOS UN ítem que NO esté vencido para la fecha
      // Normalizar a string YYYY-MM-DD (mysql2 puede devolver Date o string según config)
      const toDateStr = (val) => {
        if (!val) return null;
        if (typeof val === 'string') return val.split('T')[0];
        if (val instanceof Date) return val.toISOString().split('T')[0];
        return String(val).split('T')[0];
      };
      const hasValidItem = invItems.some(item => {
        if (!item.expiration_date) return true; // No tiene fecha de caducidad = no se vence
        const expStr = toDateStr(item.expiration_date);
        const scheduledStr = scheduled_date.split('T')[0];
        // El ítem es válido si vence el mismo día o después (scheduledStr <= expStr)
        return scheduledStr <= expStr;
      });

      // Si TODOS los ítems de este ingrediente están vencidos para esa fecha, es un error
      if (!hasValidItem) {
        expiredIngredients.push(reqIng.name);
      }
    }

    if (expiredIngredients.length > 0) {
      return res.json({ valid: false, expiredIngredients });
    }

    res.json({ valid: true });
  } catch (err) { next(err); }
});

// POST /recipes/validate-ingredients — verifica que la familia tenga todos los ingredientes de la receta en inventario
router.post('/validate-ingredients', async (req, res, next) => {
  try {
    const { recipe_id, family_id } = req.body;
    if (!recipe_id || !family_id) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }

    // 1. Obtener ingredientes requeridos por la receta
    const [recipeIngsRaw] = await db.query(
      `SELECT ri.ingredient_id, i.name 
       FROM recipe_ingredients ri 
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id 
       WHERE ri.recipe_id = ?`,
      [recipe_id]
    );

    // Ignorar 'agua' ya que se asume que siempre está disponible
    const recipeIngs = recipeIngsRaw.filter(i => i.name.toLowerCase() !== 'agua');

    if (!recipeIngs.length) return res.json({ valid: true }); // sin ingredientes registrados, permitir

    // 2. Obtener ingredientes disponibles en el inventario de la familia (con cantidad > 0)
    const ingredientIds = recipeIngs.map(i => i.ingredient_id);
    const [inventory] = await db.query(
      `SELECT ingredient_id, SUM(quantity) AS total 
       FROM inventory 
       WHERE family_id = ? AND ingredient_id IN (?) 
       GROUP BY ingredient_id`,
      [family_id, ingredientIds]
    );

    const inStockIds = new Set(inventory.filter(i => i.total > 0).map(i => i.ingredient_id));

    // 3. Detectar cuáles faltan
    const missingIngredients = recipeIngs
      .filter(i => !inStockIds.has(i.ingredient_id))
      .map(i => i.name);

    if (missingIngredients.length > 0) {
      return res.json({ valid: false, missingIngredients });
    }

    res.json({ valid: true });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  const { title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id, recommended_meal, ingredient_lines } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'El título de la receta es obligatorio.' });
  const validMeals = ['desayuno', 'almuerzo', 'cena', 'cualquiera'];
  const mealType = validMeals.includes(recommended_meal) ? recommended_meal : 'cualquiera';
  const servingsVal = sanitizeServings(servings);
  const caloriesVal = sanitizeCalories(calories_per_serving);

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.query(
      'UPDATE recipes SET title = ?, description = ?, instructions = ?, difficulty = ?, preparation_time = ?, servings = ?, image_url = ?, calories_per_serving = ?, created_by = ?, family_id = ?, recommended_meal = ? WHERE recipe_id = ?',
      [title.trim(), description || '', instructions || '', difficulty || 'regular', preparation_time || 0, servingsVal, image_url || '', caloriesVal, created_by || null, family_id || null, mealType, req.params.id]
    );
    if (result.affectedRows === 0) { await connection.rollback(); return res.status(404).json({ error: 'Not found' }); }

    // Item 8: si se envían ingredientes, reemplazar los existentes.
    if (Array.isArray(ingredient_lines)) {
      await connection.query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [req.params.id]);
      if (ingredient_lines.length) await persistRecipeIngredients(connection, req.params.id, ingredient_lines);
    }
    const ingredients = await fetchRecipeIngredients(connection, req.params.id);
    await connection.commit();

    res.json({ recipe_id: Number(req.params.id), title: title.trim(), description, instructions, difficulty, preparation_time, servings: servingsVal, image_url, calories_per_serving: caloriesVal, created_by: created_by || null, family_id: family_id || null, recommended_meal: mealType, ingredients });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM recipes WHERE recipe_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
