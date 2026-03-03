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

// Obtener las familias completas de un usuario (JOIN) con conteo de integrantes
router.get('/families/:user_id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, 
              (SELECT COUNT(*) FROM user_family uf2 WHERE uf2.family_id = f.family_id) AS members
       FROM families f
       INNER JOIN user_family uf ON f.family_id = uf.family_id
       WHERE uf.user_id = ?`,
      [req.params.user_id]
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

    // 3. Insertar la relación
    await db.query('INSERT INTO user_family (user_id, family_id) VALUES (?, ?)', [user_id, family.family_id]);

    res.status(201).json(family);
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
