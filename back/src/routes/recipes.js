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
    res.status(201).json({ recipe_id: result.insertId, title, description, instructions, difficulty, preparation_time, servings: servings || 1, image_url, calories_per_serving, created_by: created_by || null, family_id: family_id || null, ingredients: [] });
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
