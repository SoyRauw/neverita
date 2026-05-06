import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM families');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM families WHERE family_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, created_by, code } = req.body;
    const [result] = await db.query('INSERT INTO families (name, created_by, code) VALUES (?, ?, ?)', [name, created_by, code || null]);
    const family_id = result.insertId;
    // Vincular automáticamente al creador con la familia
    await db.query('INSERT INTO user_family (user_id, family_id, role) VALUES (?, ?, ?)', [created_by, family_id, 'creador']);
    res.status(201).json({ family_id, name, created_by, code: code || null });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, created_by } = req.body;
    const [result] = await db.query('UPDATE families SET name = ?, created_by = ? WHERE family_id = ?', [name, created_by, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ family_id: Number(req.params.id), name, created_by });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM families WHERE family_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
