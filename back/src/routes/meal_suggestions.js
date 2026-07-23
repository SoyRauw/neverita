import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

const KINDS = ['nueva', 'inventario', 'receta'];

// GET /meal-suggestions?family_id=X — lista con autor, rol y (si aplica) datos de la receta
router.get('/', async (req, res, next) => {
  try {
    const { family_id } = req.query;
    if (!family_id) return res.status(400).json({ error: 'family_id es obligatorio.' });
    const [rows] = await db.query(
      `SELECT s.suggestion_id, s.family_id, s.user_id, s.day_of_week, s.meal_type, s.kind,
              s.content, s.recipe_id, s.created_at,
              u.name AS author_name,
              uf.role AS author_role,
              r.title AS recipe_title, r.image_url AS recipe_image
       FROM meal_suggestions s
       LEFT JOIN users u ON u.user_id = s.user_id
       LEFT JOIN user_family uf ON uf.user_id = s.user_id AND uf.family_id = s.family_id
       LEFT JOIN recipes r ON r.recipe_id = s.recipe_id
       WHERE s.family_id = ?
       ORDER BY s.created_at ASC`,
      [family_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /meal-suggestions — crea una sugerencia
router.post('/', async (req, res, next) => {
  try {
    const { family_id, user_id, day_of_week, meal_type, kind, content, recipe_id } = req.body;
    if (!family_id || !user_id) return res.status(400).json({ error: 'family_id y user_id son obligatorios.' });
    if (!KINDS.includes(kind)) return res.status(400).json({ error: 'Tipo de sugerencia inválido.' });
    if (kind === 'receta' && !recipe_id) return res.status(400).json({ error: 'Falta la receta sugerida.' });
    if ((kind === 'nueva' || kind === 'inventario') && (!content || !String(content).trim())) {
      return res.status(400).json({ error: 'La sugerencia no puede estar vacía.' });
    }
    const [result] = await db.query(
      `INSERT INTO meal_suggestions (family_id, user_id, day_of_week, meal_type, kind, content, recipe_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [family_id, user_id, day_of_week || null, meal_type || null, kind, content ? String(content).trim() : null, recipe_id || null]
    );
    res.status(201).json({ suggestion_id: result.insertId });
  } catch (err) { next(err); }
});

// DELETE /meal-suggestions/:id — borra una sugerencia (solo el autor o el creador de la familia)
router.delete('/:id', async (req, res, next) => {
  try {
    const requesterId = req.query.requester_id || (req.body && req.body.requester_id);
    const [rows] = await db.query('SELECT user_id, family_id FROM meal_suggestions WHERE suggestion_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const sug = rows[0];
    let allowed = requesterId && String(sug.user_id) === String(requesterId);
    if (!allowed && requesterId) {
      const [role] = await db.query('SELECT role FROM user_family WHERE user_id = ? AND family_id = ?', [requesterId, sug.family_id]);
      allowed = role.length && role[0].role === 'creador';
    }
    if (!allowed) return res.status(403).json({ error: 'Solo el autor o el creador pueden borrar esta sugerencia.' });
    await db.query('DELETE FROM meal_suggestions WHERE suggestion_id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});
