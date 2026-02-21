import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM user_family');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:user_id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM user_family WHERE user_id = ?', [req.params.user_id]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { user_id, family_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO user_family (user_id, family_id) VALUES (?, ?)',
      [user_id, family_id]
    );
    res.status(201).json({ user_id, family_id });
  } catch (err) { next(err); }
});

// No PUT because table only stores user_id and family_id

router.delete('/:user_id/:family_id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM user_family WHERE user_id = ? AND family_id = ?', [req.params.user_id, req.params.family_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
