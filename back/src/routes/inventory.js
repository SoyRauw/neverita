import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { family_id } = req.query;
    let query = 'SELECT * FROM inventory';
    const params = [];
    if (family_id) {
      query += ' WHERE family_id = ?';
      params.push(family_id);
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM inventory WHERE inventory_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { family_id, ingredient_id, quantity, expiration_date } = req.body;
    const [result] = await db.query(
      'INSERT INTO inventory (family_id, ingredient_id, quantity, expiration_date) VALUES (?, ?, ?, ?)',
      [family_id, ingredient_id, quantity, expiration_date]
    );
    res.status(201).json({ inventory_id: result.insertId, family_id, ingredient_id, quantity, expiration_date });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { family_id, ingredient_id, quantity, expiration_date } = req.body;
    const [result] = await db.query(
      'UPDATE inventory SET family_id = ?, ingredient_id = ?, quantity = ?, expiration_date = ? WHERE inventory_id = ?',
      [family_id, ingredient_id, quantity, expiration_date, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ inventory_id: Number(req.params.id), family_id, ingredient_id, quantity, expiration_date });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM inventory WHERE inventory_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
