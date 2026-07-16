import express from 'express';
import { db } from '../db.js';
import { hashPassword, verifyPassword, looksHashed, passwordIssues } from '../utils/password.js';

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
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    }

    const [rows] = await db.query(
      'SELECT user_id, username, name, email, password FROM users WHERE username = ?',
      [username]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Migración transparente: si la contraseña estaba en texto plano, la re-guardamos hasheada.
    if (!looksHashed(user.password)) {
      try {
        const hashed = await hashPassword(password);
        await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, user.user_id]);
      } catch (e) { /* si falla la migración, no bloqueamos el login */ }
    }

    res.json({ user_id: user.user_id, username: user.username, name: user.name, email: user.email });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, password, name, email } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: 'El nombre de usuario es obligatorio.' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'El correo es obligatorio.' });
    const pwIssues = passwordIssues(password);
    if (pwIssues.length) return res.status(400).json({ error: `La contraseña debe tener: ${pwIssues.join(', ')}.` });

    const cleanEmail = email.trim().toLowerCase();
    const hashed = await hashPassword(password);
    const [result] = await db.query(
      'INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
      [username.trim(), hashed, name.trim(), cleanEmail]
    );
    res.status(201).json({ user_id: result.insertId, username: username.trim(), name: name.trim(), email: cleanEmail });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { username, password, name, email } = req.body;
    if (!username || !name) return res.status(400).json({ error: 'Usuario y nombre son obligatorios.' });

    // Si viene contraseña nueva, validarla y hashearla; si no, conservar la actual.
    let passwordSql = '';
    const params = [username, name, email || null];
    if (password) {
      const pwIssues = passwordIssues(password);
      if (pwIssues.length) return res.status(400).json({ error: `La contraseña debe tener: ${pwIssues.join(', ')}.` });
      passwordSql = ', password = ?';
      params.push(await hashPassword(password));
    }
    params.push(req.params.id);

    const [result] = await db.query(
      `UPDATE users SET username = ?, name = ?, email = ?${passwordSql} WHERE user_id = ?`,
      params
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
