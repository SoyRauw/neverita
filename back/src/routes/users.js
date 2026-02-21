import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, name, email FROM users');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, name, email FROM users WHERE user_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query(
      'SELECT user_id, username, name, email FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, password, name, email } = req.body;
    const [result] = await db.query(
      'INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
      [username, password, name, email || null]
    );
    res.status(201).json({ user_id: result.insertId, username, name, email: email || null });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { username, password, name, email } = req.body;
    const [result] = await db.query(
      'UPDATE users SET username = ?, password = ?, name = ?, email = ? WHERE user_id = ?',
      [username, password, name, email || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ user_id: Number(req.params.id), username, name, email: email || null });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
