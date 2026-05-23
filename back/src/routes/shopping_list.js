import express from 'express';
import { db } from '../db.js';

export const router = express.Router();

// GET: Obtener lista de compras de la familia
router.get('/', async (req, res, next) => {
    try {
        const { family_id } = req.query;
        if (!family_id) return res.status(400).json({ error: 'Falta family_id' });
        
        const [rows] = await db.query(
            'SELECT * FROM shopping_list WHERE family_id = ? ORDER BY checked ASC, created_at DESC', 
            [family_id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// POST: Agregar un nuevo item a la lista
router.post('/', async (req, res, next) => {
    try {
        const { family_id, name, quantity, unit, source = 'manual' } = req.body;
        if (!family_id || !name) return res.status(400).json({ error: 'Faltan campos obligatorios' });

        const [result] = await db.query(
            'INSERT INTO shopping_list (family_id, name, quantity, unit, source) VALUES (?, ?, ?, ?, ?)',
            [family_id, name, quantity || 1, unit || 'unidad', source]
        );
        res.status(201).json({ 
            item_id: result.insertId, 
            family_id, 
            name, 
            quantity: quantity || 1, 
            unit: unit || 'unidad', 
            checked: 0, 
            source 
        });
    } catch (err) { next(err); }
});

// PUT: Actualizar un item (marcar como comprado o editar)
router.put('/:id', async (req, res, next) => {
    try {
        const { checked, quantity, unit } = req.body;
        const updates = [];
        const params = [];

        if (checked !== undefined) {
            updates.push('checked = ?');
            params.push(checked ? 1 : 0);
        }
        if (quantity !== undefined) {
            updates.push('quantity = ?');
            params.push(quantity);
        }
        if (unit !== undefined) {
            updates.push('unit = ?');
            params.push(unit);
        }

        if (updates.length === 0) return res.json({ success: true });

        params.push(req.params.id);
        
        await db.query(`UPDATE shopping_list SET ${updates.join(', ')} WHERE item_id = ?`, params);
        res.json({ success: true });
    } catch (err) { next(err); }
});

// DELETE: Eliminar un item específico
router.delete('/:id', async (req, res, next) => {
    try {
        await db.query('DELETE FROM shopping_list WHERE item_id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { next(err); }
});

// DELETE: Limpiar todos los marcados como comprados de una familia
router.delete('/clear/:family_id', async (req, res, next) => {
    try {
        await db.query('DELETE FROM shopping_list WHERE family_id = ? AND checked = 1', [req.params.family_id]);
        res.json({ success: true });
    } catch (err) { next(err); }
});
