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
        if (!family_id || !name || !String(name).trim()) return res.status(400).json({ error: 'Faltan campos obligatorios' });
        const qty = quantity === undefined || quantity === null || quantity === '' ? 1 : Number(quantity);
        if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'La cantidad debe ser un número mayor que 0.' });

        const [result] = await db.query(
            'INSERT INTO shopping_list (family_id, name, quantity, unit, source) VALUES (?, ?, ?, ?, ?)',
            [family_id, String(name).trim(), qty, unit || 'unidad', source]
        );
        res.status(201).json({
            item_id: result.insertId,
            family_id,
            name: String(name).trim(),
            quantity: qty,
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
            const q = Number(quantity);
            if (!Number.isFinite(q) || q <= 0) return res.status(400).json({ error: 'La cantidad debe ser un número mayor que 0.' });
            updates.push('quantity = ?');
            params.push(q);
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

// GET: Sugerencias inteligentes basadas en los ingredientes que usa la familia en sus recetas
// Excluye: ingredientes ya en la lista, ingredientes ya en el inventario con stock > 0
// Ordena por frecuencia de uso en las recetas de la familia
router.get('/suggestions', async (req, res, next) => {
    try {
        const { family_id } = req.query;
        if (!family_id) return res.status(400).json({ error: 'Falta family_id' });

        // 1. IDs de ingredientes ya en la lista de compras (sin marcar como comprados)
        const [listRows] = await db.query(
            `SELECT LOWER(name) as name_lower FROM shopping_list WHERE family_id = ? AND checked = 0`,
            [family_id]
        );
        const inListNames = new Set(listRows.map(r => r.name_lower));

        // 2. IDs de ingredientes que ya tienen stock en inventario (cantidad > 0)
        const [invRows] = await db.query(
            `SELECT DISTINCT ingredient_id FROM inventory WHERE family_id = ? AND quantity > 0`,
            [family_id]
        );
        const inStockIds = new Set(invRows.map(r => r.ingredient_id));

        // 3. Ingredientes más usados en las recetas de la familia, ordenados por frecuencia
        const [recipeIngRows] = await db.query(
            `SELECT i.ingredient_id, i.name, i.unit, i.category, i.average_expiry_days,
                    COUNT(ri.recipe_id) AS usage_count
             FROM recipe_ingredients ri
             JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
             JOIN family_recipes fr ON ri.recipe_id = fr.recipe_id
             WHERE fr.family_id = ?
             GROUP BY i.ingredient_id, i.name, i.unit, i.category, i.average_expiry_days
             ORDER BY usage_count DESC
             LIMIT 50`,
            [family_id]
        );

        // 4. Filtrar: excluir los que ya están en lista o en stock
        const suggestions = recipeIngRows.filter(ing => {
            if (inStockIds.has(ing.ingredient_id)) return false;
            if (inListNames.has(ing.name.toLowerCase())) return false;
            return true;
        }).slice(0, 20); // Máximo 20 sugerencias

        res.json(suggestions);
    } catch (err) { next(err); }
});

