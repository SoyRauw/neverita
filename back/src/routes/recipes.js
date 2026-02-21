import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM recipes');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM recipes WHERE recipe_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO recipes (title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, instructions, difficulty, preparation_time, servings || 1, image_url, calories_per_serving, created_by || null, family_id || null]
    );
    res.status(201).json({ recipe_id: result.insertId, title, description, instructions, difficulty, preparation_time, servings: servings || 1, image_url, calories_per_serving, created_by: created_by || null, family_id: family_id || null });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, instructions, difficulty, preparation_time, servings, image_url, calories_per_serving, created_by, family_id } = req.body;
    const [result] = await db.query(
      'UPDATE recipes SET title = ?, description = ?, instructions = ?, difficulty = ?, preparation_time = ?, servings = ?, image_url = ?, calories_per_serving = ?, created_by = ?, family_id = ? WHERE recipe_id = ?',
      [title, description, instructions, difficulty, preparation_time, servings || 1, image_url, calories_per_serving, created_by || null, family_id || null, req.params.id]
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
