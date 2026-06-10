import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// Helper: normaliza columnas DATE que mysql2 puede devolver como objetos Date
const normalizeItem = (item) => {
  const i = { ...item };
  if (i.expiration_date instanceof Date) i.expiration_date = i.expiration_date.toISOString().split('T')[0];
  if (i.frozen_at instanceof Date) i.frozen_at = i.frozen_at.toISOString();
  return i;
};

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
    res.json(rows.map(normalizeItem));
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
    const { family_id, ingredient_id, quantity, expiration_date, is_frozen } = req.body;

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

    const frozenVal = is_frozen ? 1 : 0;
    const frozenAtVal = is_frozen ? new Date() : null;

    const [result] = await db.query(
      'INSERT INTO inventory (family_id, ingredient_id, quantity, expiration_date, is_frozen, frozen_at) VALUES (?, ?, ?, ?, ?, ?)',
      [family_id, ingredient_id, quantity, finalExpDate, frozenVal, frozenAtVal]
    );
    res.status(201).json({ inventory_id: result.insertId, family_id, ingredient_id, quantity, expiration_date: finalExpDate, is_frozen: !!frozenVal });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { family_id, ingredient_id, quantity, expiration_date, is_frozen } = req.body;
    
    // Primero obtener el item actual para comparar el estado
    const [currentRows] = await db.query('SELECT expiration_date, is_frozen, frozen_at FROM inventory WHERE inventory_id = ?', [req.params.id]);
    if (currentRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const current = currentRows[0];

    let query = 'UPDATE inventory SET family_id = ?, ingredient_id = ?, quantity = ?';
    let params = [family_id, ingredient_id, quantity];
    
    let finalExpDate = expiration_date; // por defecto usamos el que viene

    if (is_frozen !== undefined) {
      const isNowFrozen = is_frozen ? 1 : 0;
      query += ', is_frozen = ?';
      params.push(isNowFrozen);

      if (isNowFrozen === 1 && current.is_frozen === 0) {
        // Congelando: guardar la fecha actual
        query += ', frozen_at = NOW()';
      } else if (isNowFrozen === 0 && current.is_frozen === 1 && current.frozen_at) {
        // Descongelando: calcular cuántos días estuvo congelado y sumarlos a la fecha de vencimiento
        const oldExpDate = new Date(current.expiration_date);
        const frozenAt = new Date(current.frozen_at);
        const now = new Date();
        
        // Diferencia en días enteros
        const diffTime = Math.abs(now - frozenAt);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Desplazar la fecha de vencimiento
        oldExpDate.setDate(oldExpDate.getDate() + diffDays);
        finalExpDate = oldExpDate.toISOString().split('T')[0];
        
        query += ', frozen_at = NULL';
      }
    }

    query += ', expiration_date = ? WHERE inventory_id = ?';
    params.push(finalExpDate, req.params.id);

    await db.query(query, params);
    
    let returnedFrozenAt = current.frozen_at;
    if (is_frozen !== undefined) {
      const isNowFrozen = is_frozen ? 1 : 0;
      if (isNowFrozen === 1 && current.is_frozen === 0) returnedFrozenAt = new Date();
      else if (isNowFrozen === 0) returnedFrozenAt = null;
    }
    
    res.json({ inventory_id: Number(req.params.id), family_id, ingredient_id, quantity, expiration_date: finalExpDate, is_frozen, frozen_at: returnedFrozenAt });
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
