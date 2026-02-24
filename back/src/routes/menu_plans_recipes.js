import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// GET /daily-meals?menu_plan_id=X — trae las comidas del plan con datos de la receta
router.get('/', async (req, res, next) => {
  try {
    const { menu_plan_id } = req.query;
    if (!menu_plan_id) {
      const [rows] = await db.query('SELECT * FROM daily_meals');
      return res.json(rows);
    }
    const [rows] = await db.query(
      `SELECT dm.daily_meal_id, dm.menu_plan_id, dm.meal_type, dm.day_of_week, dm.recipe_id,
              r.title, r.image_url, r.calories_per_serving, r.preparation_time, r.instructions, r.description
       FROM daily_meals dm
       JOIN recipes r ON dm.recipe_id = r.recipe_id
       WHERE dm.menu_plan_id = ?`,
      [menu_plan_id]
    );
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
  try {
    const { menu_plan_id, recipe_id, meal_type, day_of_week } = req.body;
    // Reemplazar si ya existe ese slot (upsert manual)
    await db.query(
      'DELETE FROM daily_meals WHERE menu_plan_id = ? AND meal_type = ? AND day_of_week = ?',
      [menu_plan_id, meal_type, day_of_week]
    );
    const [result] = await db.query(
      'INSERT INTO daily_meals (menu_plan_id, recipe_id, meal_type, day_of_week) VALUES (?, ?, ?, ?)',
      [menu_plan_id, recipe_id, meal_type, day_of_week]
    );
    res.status(201).json({ daily_meal_id: result.insertId, menu_plan_id, recipe_id, meal_type, day_of_week });
  } catch (err) { next(err); }
});

router.put('/:daily_meal_id', async (req, res, next) => {
  try {
    const { meal_type, day_of_week, recipe_id, menu_plan_id } = req.body;
    const [result] = await db.query(
      'UPDATE daily_meals SET menu_plan_id = ?, recipe_id = ?, meal_type = ?, day_of_week = ? WHERE daily_meal_id = ?',
      [menu_plan_id, recipe_id, meal_type, day_of_week, req.params.daily_meal_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ daily_meal_id: Number(req.params.daily_meal_id), menu_plan_id, recipe_id, meal_type, day_of_week });
  } catch (err) { next(err); }
});

router.delete('/:daily_meal_id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM daily_meals WHERE daily_meal_id = ?', [req.params.daily_meal_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
