import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM recipe_ingredients');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:recipe_id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM recipe_ingredients WHERE recipe_id = ?', [req.params.recipe_id]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { recipe_id, ingredient_id, quantity } = req.body;
    const [result] = await db.query(
      'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)',
      [recipe_id, ingredient_id, quantity]
    );
    res.status(201).json({ recipe_id, ingredient_id, quantity });
  } catch (err) { next(err); }
});

router.put('/:recipe_id/:ingredient_id', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const [result] = await db.query(
      'UPDATE recipe_ingredients SET quantity = ? WHERE recipe_id = ? AND ingredient_id = ?',
      [quantity, req.params.recipe_id, req.params.ingredient_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ recipe_id: Number(req.params.recipe_id), ingredient_id: Number(req.params.ingredient_id), quantity });
  } catch (err) { next(err); }
});

router.delete('/:recipe_id/:ingredient_id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM recipe_ingredients WHERE recipe_id = ? AND ingredient_id = ?', [req.params.recipe_id, req.params.ingredient_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
