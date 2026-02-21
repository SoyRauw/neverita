import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM ingredients');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM ingredients WHERE ingredient_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, image_url, average_expiry_days } = req.body;
    const [result] = await db.query(
      'INSERT INTO ingredients (name, category, image_url, average_expiry_days) VALUES (?, ?, ?, ?)',
      [name, category || 'otro', image_url, average_expiry_days]
    );
    res.status(201).json({ ingredient_id: result.insertId, name, category: category || 'otro', image_url, average_expiry_days });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, image_url, average_expiry_days } = req.body;
    const [result] = await db.query(
      'UPDATE ingredients SET name = ?, category = ?, image_url = ?, average_expiry_days = ? WHERE ingredient_id = ?',
      [name, category || 'otro', image_url, average_expiry_days, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ingredient_id: Number(req.params.id), name, category: category || 'otro', image_url, average_expiry_days });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM ingredients WHERE ingredient_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
