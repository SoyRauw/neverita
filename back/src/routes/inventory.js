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

    // Si no se envió fecha de vencimiento, calcularla automáticamente
    let finalExpDate = expiration_date;
    if (!finalExpDate) {
      const [ingRows] = await db.query(
        'SELECT average_expiry_days FROM ingredients WHERE ingredient_id = ?',
        [ingredient_id]
      );
      const avgDays = ingRows.length > 0 && ingRows[0].average_expiry_days
        ? ingRows[0].average_expiry_days
        : 7; // fallback 7 días
      const date = new Date();
      date.setDate(date.getDate() + avgDays);
      finalExpDate = date.toISOString().split('T')[0]; // formato YYYY-MM-DD
    }

    const [result] = await db.query(
      'INSERT INTO inventory (family_id, ingredient_id, quantity, expiration_date) VALUES (?, ?, ?, ?)',
      [family_id, ingredient_id, quantity, finalExpDate]
    );
    res.status(201).json({ inventory_id: result.insertId, family_id, ingredient_id, quantity, expiration_date: finalExpDate });
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

// ==========================================
// DESCONTAR INGREDIENTES AL PLANIFICAR RECETA
// ==========================================
router.post('/deduct', async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { recipe_id, family_id, multiplier } = req.body;
    if (!recipe_id || !family_id) {
      return res.status(400).json({ error: 'Faltan recipe_id o family_id' });
    }
    // multiplier = personas / servings_base (default 1 = sin escalar)
    const scale = Math.max(0.01, Number(multiplier) || 1);

    // 1. Obtener los ingredientes que necesita la receta
    const [recipeIngs] = await connection.query(
      'SELECT ingredient_id, quantity FROM recipe_ingredients WHERE recipe_id = ?',
      [recipe_id]
    );

    if (recipeIngs.length === 0) {
      connection.release();
      return res.json({ message: 'La receta no tiene ingredientes registrados', deducted: [] });
    }

    await connection.beginTransaction();
    const deducted = [];

    for (const ri of recipeIngs) {
      let needed = Math.round((Number(ri.quantity) || 0) * scale * 100) / 100;
      if (needed <= 0) continue;

      // 2. Buscar entradas del inventario de esta familia para este ingrediente
      //    Ordenar por fecha de vencimiento más próxima (gastar los que vencen primero)
      const [invRows] = await connection.query(
        'SELECT inventory_id, quantity FROM inventory WHERE family_id = ? AND ingredient_id = ? ORDER BY expiration_date ASC',
        [family_id, ri.ingredient_id]
      );

      for (const inv of invRows) {
        if (needed <= 0) break;

        const available = Number(inv.quantity) || 0;

        if (available <= needed) {
          // Se usa toda esta entrada → eliminarla
          await connection.query('DELETE FROM inventory WHERE inventory_id = ?', [inv.inventory_id]);
          needed -= available;
          deducted.push({ ingredient_id: ri.ingredient_id, removed: available, inventory_id: inv.inventory_id, action: 'deleted' });
        } else {
          // Descontar parcialmente
          const remaining = available - needed;
          await connection.query('UPDATE inventory SET quantity = ? WHERE inventory_id = ?', [remaining, inv.inventory_id]);
          deducted.push({ ingredient_id: ri.ingredient_id, removed: needed, inventory_id: inv.inventory_id, action: 'reduced', remaining });
          needed = 0;
        }
      }
    }

    await connection.commit();
    console.log('📦 Inventario descontado para receta', recipe_id, ':', deducted.length, 'operaciones');
    res.json({ message: 'Inventario actualizado', deducted });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error al descontar inventario:', err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
});
