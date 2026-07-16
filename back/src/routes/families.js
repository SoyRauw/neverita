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

// Función auxiliar para generar un código único de 6 dígitos
const generateUniqueCode = async () => {
    let code;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const [rows] = await db.query('SELECT family_id FROM families WHERE code = ?', [code]);
        if (rows.length === 0) {
            isUnique = true;
        }
        attempts++;
    }
    return code;
};

router.post('/', async (req, res, next) => {
  const { name, created_by } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre de la familia es obligatorio.' });
  if (!created_by) return res.status(400).json({ error: 'created_by es obligatorio.' });

  // Crear familia (con código autogenerado único) y vincular al creador de forma atómica.
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const code = await generateUniqueCode();
    const [result] = await connection.query(
      'INSERT INTO families (name, created_by, code) VALUES (?, ?, ?)',
      [name.trim(), created_by, code]
    );
    const family_id = result.insertId;
    await connection.query(
      'INSERT INTO user_family (user_id, family_id, role) VALUES (?, ?, ?)',
      [created_by, family_id, 'creador']
    );
    await connection.commit();
    res.status(201).json({ family_id, name: name.trim(), created_by, code });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
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
