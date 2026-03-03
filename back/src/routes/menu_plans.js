import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// GET /menu-plans?family_id=X — filtrar por familia
// GET /menu-plans?created_by=X — filtrar por usuario
router.get('/', async (req, res, next) => {
  try {
    const { created_by, family_id } = req.query;
    let query = 'SELECT * FROM menu_plans';
    const params = [];
    if (family_id) {
      query += ' WHERE family_id = ?';
      params.push(family_id);
    } else if (created_by) {
      query += ' WHERE created_by = ?';
      params.push(created_by);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_plans WHERE menu_plan_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { plan_name, start_date, created_by, family_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO menu_plans (plan_name, start_date, created_by, family_id) VALUES (?, ?, ?, ?)',
      [plan_name, start_date, created_by, family_id]
    );
    res.status(201).json({ menu_plan_id: result.insertId, plan_name, start_date, created_by, family_id });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { plan_name, start_date, created_by, family_id } = req.body;
    const [result] = await db.query(
      'UPDATE menu_plans SET plan_name = ?, start_date = ?, created_by = ?, family_id = ? WHERE menu_plan_id = ?',
      [plan_name, start_date, created_by, family_id, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ menu_plan_id: Number(req.params.id), plan_name, start_date, created_by, family_id });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM menu_plans WHERE menu_plan_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
