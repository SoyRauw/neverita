import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// GET /recipes — devuelve todas las recetas con sus ingredientes embebidos
router.get('/', async (req, res, next) => {
  try {
    // 1. Traer todas las recetas
    const [recipes] = await db.query('SELECT * FROM recipes');

    if (recipes.length === 0) return res.json([]);

    // 2. Traer todos los ingredientes de esas recetas en una sola query JOIN
    const recipeIds = recipes.map(r => r.recipe_id);
    const [ingredientRows] = await db.query(
      `SELECT ri.recipe_id, i.name, ri.quantity, i.unit
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
      ingredientsByRecipe[row.recipe_id].push(qty ? `${row.name} (${qty})` : row.name);
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
      `SELECT i.name, ri.quantity, i.unit
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
       WHERE ri.recipe_id = ?`,
      [req.params.id]
    );

    recipe.ingredients = ingredientRows.map(row => {
      const qty = row.quantity ? `${row.quantity} ${row.unit || ''}`.trim() : row.unit || '';
      return qty ? `${row.name} (${qty})` : row.name;
    });

    res.json(recipe);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO recipes (title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', instructions || '', difficulty || 'regular', preparation_time || 0, servings || 1, image_url || '', calories_per_serving || null, created_by || null, family_id || null]
    );
    const recipe_id = result.insertId;
    
    // Si hay una familia asociada, vinculamos la receta a la familia en la tabla intermedia
    if (family_id) {
       await db.query(
          'INSERT INTO family_recipes (family_id, recipe_id) VALUES (?, ?)',
          [family_id, recipe_id]
       );
    }
    
    res.status(201).json({ recipe_id: recipe_id, title, description, instructions, difficulty, preparation_time, servings: servings || 1, image_url, calories_per_serving, created_by: created_by || null, family_id: family_id || null, ingredients: [] });
  } catch (err) { next(err); }
});
// POST /recipes/validate-expiration — valida que los ingredientes de una receta no estén vencidos para la fecha planificada
router.post('/validate-expiration', async (req, res, next) => {
  try {
    const { recipe_id, family_id, scheduled_date } = req.body;
    if (!recipe_id || !family_id || !scheduled_date) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }

    // 1. Obtener los ingredientes requeridos por la receta
    const [recipeIngs] = await db.query(
      `SELECT ri.ingredient_id, i.name 
       FROM recipe_ingredients ri 
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id 
       WHERE ri.recipe_id = ?`,
      [recipe_id]
    );

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
    // Usamos T12:00:00 para forzar la lectura correcta y evitar desfases por zona horaria
    const scheduledDateObj = new Date(`${scheduled_date}T12:00:00`);
    scheduledDateObj.setHours(0, 0, 0, 0);
    const expiredIngredients = [];

    for (const reqIng of recipeIngs) {
      const invItems = inventory.filter(item => item.ingredient_id === reqIng.ingredient_id);
      
      // Si no lo tiene en el inventario, asumimos que lo va a comprar, así que no lo bloqueamos
      if (invItems.length === 0) continue;

      // Buscar si hay AL MENOS UN ítem que NO esté vencido para la fecha
      const hasValidItem = invItems.some(item => {
        if (!item.expiration_date) return true; // No tiene fecha de caducidad = no se vence
        const expDate = new Date(item.expiration_date);
        expDate.setHours(0, 0, 0, 0);
        return expDate.getTime() >= scheduledDateObj.getTime();
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
    const [recipeIngs] = await db.query(
      `SELECT ri.ingredient_id, i.name 
       FROM recipe_ingredients ri 
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id 
       WHERE ri.recipe_id = ?`,
      [recipe_id]
    );

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
  try {
    const { title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id } = req.body;
    const [result] = await db.query(
      'UPDATE recipes SET title = ?, description = ?, instructions = ?, difficulty = ?, preparation_time = ?, servings = ?, image_url = ?, calories_per_serving = ?, created_by = ?, family_id = ? WHERE recipe_id = ?',
      [title, description || '', instructions || '', difficulty || 'regular', preparation_time || 0, servings || 1, image_url || '', calories_per_serving || null, created_by || null, family_id || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ recipe_id: Number(req.params.id), title, description, instructions, difficulty, preparation_time, servings: servings || 1, image_url, calories_per_serving, created_by: created_by || null, family_id: family_id || null });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM recipes WHERE recipe_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
