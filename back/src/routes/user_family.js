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

// Obtener las familias completas de un usuario (JOIN) con conteo de integrantes y ROL
router.get('/families/:user_id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, 
              uf.role,
              (SELECT COUNT(*) FROM user_family uf2 WHERE uf2.family_id = f.family_id) AS members
       FROM families f
       INNER JOIN user_family uf ON f.family_id = uf.family_id
       WHERE uf.user_id = ?`,
      [req.params.user_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Obtener miembros de una familia con sus roles
router.get('/members/:family_id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, uf.role
       FROM users u
       INNER JOIN user_family uf ON u.user_id = uf.user_id
       WHERE uf.family_id = ?
       ORDER BY FIELD(uf.role, 'creador', 'chef', 'ayudante')`,
      [req.params.family_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Unirse a una familia usando código de invitación
router.post('/join', async (req, res, next) => {
  try {
    const { user_id, code } = req.body;

    // 1. Buscar la familia por código
    const [families] = await db.query('SELECT * FROM families WHERE code = ?', [code]);
    if (!families.length) {
      return res.status(404).json({ error: 'Código no válido. No se encontró ninguna familia.' });
    }
    const family = families[0];

    // 2. Verificar que el usuario no sea ya miembro
    const [existing] = await db.query(
      'SELECT * FROM user_family WHERE user_id = ? AND family_id = ?',
      [user_id, family.family_id]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Ya eres miembro de esta familia.' });
    }

    // 3. Insertar la relación con rol ayudante
    await db.query('INSERT INTO user_family (user_id, family_id, role) VALUES (?, ?, ?)', [user_id, family.family_id, 'ayudante']);

    res.status(201).json(family);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { user_id, family_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO user_family (user_id, family_id, role) VALUES (?, ?, ?)',
      [user_id, family_id, 'ayudante']
    );
    res.status(201).json({ user_id, family_id, role: 'ayudante' });
  } catch (err) { next(err); }
});

// Cambiar rol de un miembro (solo el creador puede)
router.put('/role', async (req, res, next) => {
  try {
    const { requester_id, target_user_id, family_id, new_role } = req.body;
    // Verificar que el que pide es el creador
    const [requester] = await db.query(
      'SELECT role FROM user_family WHERE user_id = ? AND family_id = ?',
      [requester_id, family_id]
    );
    if (!requester.length || requester[0].role !== 'creador') {
      return res.status(403).json({ error: 'Solo el creador puede cambiar roles.' });
    }
    // No se puede cambiar el rol del creador
    const [target] = await db.query(
      'SELECT role FROM user_family WHERE user_id = ? AND family_id = ?',
      [target_user_id, family_id]
    );
    if (target.length && target[0].role === 'creador') {
      return res.status(403).json({ error: 'No se puede cambiar el rol del creador.' });
    }
    await db.query(
      'UPDATE user_family SET role = ? WHERE user_id = ? AND family_id = ?',
      [new_role, target_user_id, family_id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Expulsar miembro (solo el creador puede)
router.delete('/kick', async (req, res, next) => {
  try {
    const { requester_id, target_user_id, family_id } = req.body;
    const [requester] = await db.query(
      'SELECT role FROM user_family WHERE user_id = ? AND family_id = ?',
      [requester_id, family_id]
    );
    if (!requester.length || requester[0].role !== 'creador') {
      return res.status(403).json({ error: 'Solo el creador puede expulsar miembros.' });
    }
    // No se puede expulsar al creador
    const [target] = await db.query(
      'SELECT role FROM user_family WHERE user_id = ? AND family_id = ?',
      [target_user_id, family_id]
    );
    if (target.length && target[0].role === 'creador') {
      return res.status(403).json({ error: 'No se puede expulsar al creador.' });
    }
    await db.query(
      'DELETE FROM user_family WHERE user_id = ? AND family_id = ?',
      [target_user_id, family_id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:user_id/:family_id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM user_family WHERE user_id = ? AND family_id = ?', [req.params.user_id, req.params.family_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
