import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// 1. Obtener todas las recetas de una familia (incluyendo ingredientes)
router.get('/:family_id', async (req, res, next) => {
  try {
    const familyId = req.params.family_id;

    // Obtener las recetas asociadas a esta familia
    const [recipes] = await db.query(
      `SELECT r.* FROM recipes r
       INNER JOIN family_recipes fr ON r.recipe_id = fr.recipe_id
       WHERE fr.family_id = ?`,
      [familyId]
    );

    if (recipes.length === 0) return res.json([]);

    // Obtener todos los ingredientes de esas recetas en una sola query
    const recipeIds = recipes.map(r => r.recipe_id);
    const [ingredientRows] = await db.query(
      `SELECT ri.recipe_id, i.name, ri.quantity, i.unit
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
       WHERE ri.recipe_id IN (?)`,
      [recipeIds]
    );

    // Agrupar los ingredientes por recipe_id
    const ingredientsByRecipe = {};
    for (const row of ingredientRows) {
      if (!ingredientsByRecipe[row.recipe_id]) {
        ingredientsByRecipe[row.recipe_id] = [];
      }
      const qty = row.quantity ? `${row.quantity} ${row.unit || ''}`.trim() : row.unit || '';
      ingredientsByRecipe[row.recipe_id].push(qty ? `${row.name} (${qty})` : row.name);
    }

    // Combinar recetas con sus ingredientes
    const result = recipes.map(r => ({
      ...r,
      ingredients: ingredientsByRecipe[r.recipe_id] || [],
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// 2. Obtener las recetas DISPONIBLES para una familia (las que NO tiene asociadas aún)
router.get('/:family_id/available', async (req, res, next) => {
  try {
    const familyId = req.params.family_id;

    // Recetas que NO están en family_recipes para esta familia
    const [recipes] = await db.query(
      `SELECT r.* FROM recipes r
       WHERE r.recipe_id NOT IN (
           SELECT recipe_id FROM family_recipes WHERE family_id = ?
       )`,
      [familyId]
    );

    if (recipes.length === 0) return res.json([]);

    const recipeIds = recipes.map(r => r.recipe_id);
    const [ingredientRows] = await db.query(
      `SELECT ri.recipe_id, i.name, ri.quantity, i.unit
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
       WHERE ri.recipe_id IN (?)`,
      [recipeIds]
    );

    const ingredientsByRecipe = {};
    for (const row of ingredientRows) {
      if (!ingredientsByRecipe[row.recipe_id]) {
        ingredientsByRecipe[row.recipe_id] = [];
      }
      const qty = row.quantity ? `${row.quantity} ${row.unit || ''}`.trim() : row.unit || '';
      ingredientsByRecipe[row.recipe_id].push(qty ? `${row.name} (${qty})` : row.name);
    }

    const result = recipes.map(r => ({
      ...r,
      ingredients: ingredientsByRecipe[r.recipe_id] || [],
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// 3. Asociar una receta a una familia
router.post('/', async (req, res, next) => {
  try {
    const { family_id, recipe_id } = req.body;
    
    // Verificar si ya existe para evitar duplicados
    const [existing] = await db.query(
        'SELECT * FROM family_recipes WHERE family_id = ? AND recipe_id = ?',
        [family_id, recipe_id]
    );

    if (existing.length === 0) {
        await db.query(
            'INSERT INTO family_recipes (family_id, recipe_id) VALUES (?, ?)',
            [family_id, recipe_id]
        );
    }
    
    res.status(201).json({ family_id, recipe_id });
  } catch (err) { next(err); }
});

// 4. Desvincular una receta de una familia (soft delete)
router.delete('/:family_id/:recipe_id', async (req, res, next) => {
  try {
    const { family_id, recipe_id } = req.params;
    
    const [result] = await db.query(
        'DELETE FROM family_recipes WHERE family_id = ? AND recipe_id = ?',
        [family_id, recipe_id]
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    
    res.status(204).send();
  } catch (err) { next(err); }
});

