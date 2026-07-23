import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// eaters: en BD es un TEXT con un JSON array de user_id. NULL = toda la familia.
function parseEaters(raw) {
  if (raw == null) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    const ids = arr.map(Number).filter(n => Number.isFinite(n));
    return ids.length ? ids : null;
  } catch { return null; }
}
function serializeEaters(value) {
  if (!Array.isArray(value)) return null;
  const ids = value.map(Number).filter(n => Number.isFinite(n));
  return ids.length ? JSON.stringify(ids) : null;
}

// GET /daily-meals?menu_plan_id=X — trae las comidas del plan con datos de la receta
router.get('/', async (req, res, next) => {
  try {
    const { menu_plan_id } = req.query;
    if (!menu_plan_id) {
      return res.status(400).json({ error: 'menu_plan_id es obligatorio.' });
    }
    const [rows] = await db.query(
      `SELECT dm.daily_meal_id, dm.menu_plan_id, dm.meal_type, dm.day_of_week, dm.recipe_id, dm.is_completed, dm.completed_at, dm.eaters,
              r.title, r.image_url, r.calories_per_serving, r.preparation_time, r.instructions, r.description, r.servings
       FROM daily_meals dm
       JOIN recipes r ON dm.recipe_id = r.recipe_id
       WHERE dm.menu_plan_id = ?`,
      [menu_plan_id]
    );

    // Normalizar eaters (TEXT JSON) a array de user_id (o null = toda la familia)
    for (const meal of rows) {
      meal.eaters = parseEaters(meal.eaters);
    }

    // Traer ingredientes de las recetas del plan
    if (rows.length > 0) {
      const recipeIds = [...new Set(rows.map(r => r.recipe_id))];
      const [ingredientRows] = await db.query(
        `SELECT ri.recipe_id, i.name, ri.quantity, i.unit
         FROM recipe_ingredients ri
         JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
         WHERE ri.recipe_id IN (?)`,
        [recipeIds]
      );
      const ingredientsByRecipe = {};
      for (const row of ingredientRows) {
        if (!ingredientsByRecipe[row.recipe_id]) ingredientsByRecipe[row.recipe_id] = [];
        const qty = row.quantity ? `${row.quantity} ${row.unit || ''}`.trim() : row.unit || '';
        ingredientsByRecipe[row.recipe_id].push(qty ? `${row.name} (${qty})` : row.name);
      }
      for (const meal of rows) {
        meal.ingredients = ingredientsByRecipe[meal.recipe_id] || [];
      }
    }

    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:daily_meal_id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM daily_meals WHERE daily_meal_id = ?', [req.params.daily_meal_id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /daily-meals — guarda una receta en un slot del menú
router.post('/', async (req, res, next) => {
  const { menu_plan_id, recipe_id, meal_type, day_of_week, eaters } = req.body;
  if (!menu_plan_id || !recipe_id || !meal_type || !day_of_week) {
    return res.status(400).json({ error: 'menu_plan_id, recipe_id, meal_type y day_of_week son obligatorios.' });
  }
  const eatersStr = serializeEaters(eaters); // null = toda la familia

  // Upsert atómico: DELETE + INSERT dentro de una transacción para no perder
  // el slot previo si el INSERT falla.
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    await connection.query(
      'DELETE FROM daily_meals WHERE menu_plan_id = ? AND meal_type = ? AND day_of_week = ?',
      [menu_plan_id, meal_type, day_of_week]
    );
    const [result] = await connection.query(
      'INSERT INTO daily_meals (menu_plan_id, recipe_id, meal_type, day_of_week, eaters) VALUES (?, ?, ?, ?, ?)',
      [menu_plan_id, recipe_id, meal_type, day_of_week, eatersStr]
    );
    await connection.commit();
    res.status(201).json({ daily_meal_id: result.insertId, menu_plan_id, recipe_id, meal_type, day_of_week, eaters: parseEaters(eatersStr) });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
});

router.put('/:daily_meal_id', async (req, res, next) => {
  try {
    const { meal_type, day_of_week, recipe_id, menu_plan_id, eaters } = req.body;
    if (!menu_plan_id || !recipe_id || !meal_type || !day_of_week) {
      return res.status(400).json({ error: 'menu_plan_id, recipe_id, meal_type y day_of_week son obligatorios.' });
    }
    const eatersStr = serializeEaters(eaters);
    const [result] = await db.query(
      'UPDATE daily_meals SET menu_plan_id = ?, recipe_id = ?, meal_type = ?, day_of_week = ?, eaters = ? WHERE daily_meal_id = ?',
      [menu_plan_id, recipe_id, meal_type, day_of_week, eatersStr, req.params.daily_meal_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ daily_meal_id: Number(req.params.daily_meal_id), menu_plan_id, recipe_id, meal_type, day_of_week, eaters: parseEaters(eatersStr) });
  } catch (err) { next(err); }
});

router.delete('/:daily_meal_id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM daily_meals WHERE daily_meal_id = ?', [req.params.daily_meal_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

// PUT /daily-meals/:daily_meal_id/eaters — actualiza SOLO los comensales de una comida
router.put('/:daily_meal_id/eaters', async (req, res, next) => {
  try {
    const eatersStr = serializeEaters(req.body.eaters); // null = toda la familia
    const [result] = await db.query(
      'UPDATE daily_meals SET eaters = ? WHERE daily_meal_id = ?',
      [eatersStr, req.params.daily_meal_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ daily_meal_id: Number(req.params.daily_meal_id), eaters: parseEaters(eatersStr) });
  } catch (err) { next(err); }
});

// POST /daily-meals/:daily_meal_id/complete — marca una comida como completada o pendiente
router.put('/:daily_meal_id/complete', async (req, res, next) => {
  try {
    const { is_completed } = req.body;
    const isCompletedVal = is_completed ? 1 : 0;
    
    let query = 'UPDATE daily_meals SET is_completed = ?';
    let params = [isCompletedVal];
    
    if (isCompletedVal === 1) {
      query += ', completed_at = NOW()';
    } else {
      query += ', completed_at = NULL';
    }
    query += ' WHERE daily_meal_id = ?';
    params.push(req.params.daily_meal_id);
    
    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    
    res.json({ success: true, is_completed: isCompletedVal });
  } catch (err) { next(err); }
});

