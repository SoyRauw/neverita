import React, { useState, useEffect } from 'react';
import { Trash, PlusCircle, X } from '@phosphor-icons/react';
import { inventoryService, ingredientsService } from '../api';

const Inventory = ({ currentFamily }) => {
    const [items, setItems] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado del modal para agregar
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        ingredient_id: '',
        quantity: '',
        unit: 'unidades',
        expiration_date: '',
    });
    const [saving, setSaving] = useState(false);

    const units = ['unidades', 'gr', 'kg', 'ml', 'litros', 'paquetes'];

    // ---------- Cargar inventario + ingredientes ----------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [inv, ing] = await Promise.all([
                    inventoryService.getAll(),
                    ingredientsService.getAll(),
                ]);
                setIngredients(ing);

                // Filtrar por familia si currentFamily está disponible
                const filtered = currentFamily
                    ? inv.filter(i => i.family_id === currentFamily.family_id || i.family_id === currentFamily.id)
                    : inv;

                // Enriquecer con el nombre del ingrediente
                const enriched = filtered.map(item => {
                    const ingredient = ing.find(i => i.ingredient_id === item.ingredient_id);
                    return {
                        ...item,
                        name: ingredient ? ingredient.name : `Ingrediente #${item.ingredient_id}`,
                    };
                });

                setItems(enriched);
            } catch (err) {
                setError('No se pudo cargar el inventario. ¿Está el backend corriendo?');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentFamily]);

    // ---------- Eliminar ítem ----------
    const handleDelete = async (inventoryId) => {
        try {
            await inventoryService.delete(inventoryId);
            setItems(prev => prev.filter(i => i.inventory_id !== inventoryId));
        } catch (err) {
            alert('Error al eliminar el ítem.');
            console.error(err);
        }
    };

    // ---------- Agregar ítem ----------
    const handleAdd = async () => {
        if (!form.ingredient_id || !form.quantity) {
            alert('Selecciona un ingrediente e indica la cantidad.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                family_id: currentFamily?.family_id || currentFamily?.id || null,
                ingredient_id: Number(form.ingredient_id),
                quantity: `${form.quantity} ${form.unit}`,
                expiration_date: form.expiration_date || null,
            };
            const created = await inventoryService.create(payload);
            const ingredient = ingredients.find(i => i.ingredient_id === created.ingredient_id);
            setItems(prev => [...prev, {
                ...created,
                name: ingredient ? ingredient.name : `Ingrediente #${created.ingredient_id}`,
            }]);
            setShowModal(false);
            setForm({ ingredient_id: '', quantity: '', unit: 'unidades', expiration_date: '' });
        } catch (err) {
            alert('Error al agregar el producto.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // ---------- Render ----------
    return (
        <div className="main-content">
            <header>
                <div className="header-title">
                    <h1>📦 Mi Inventario</h1>
                    <p>Gestiona lo que tienes en tu nevera
                        {currentFamily && <span style={{ color: '#FF9F43', fontWeight: 600 }}> — {currentFamily.name}</span>}
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <PlusCircle size={20} weight="bold" /> Agregar Producto
                </button>
            </header>

            <div className="calendar-wrapper">
                {loading && <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>Cargando inventario...</p>}
                {error && <p style={{ color: '#e74c3c', textAlign: 'center', padding: '2rem' }}>{error}</p>}

                {!loading && !error && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem' }}>Producto</th>
                                <th>Cantidad</th>
                                <th>Vencimiento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                                        No hay ítems en el inventario. ¡Agrega uno!
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.inventory_id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>
                                            <span style={{
                                                backgroundColor: '#FFF4E5',
                                                color: '#F7B27B',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem'
                                            }}>
                                                {item.expiration_date
                                                    ? new Date(item.expiration_date).toLocaleDateString()
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(item.inventory_id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FA7070' }}
                                                title="Eliminar"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* -------- MODAL AGREGAR -------- */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 800 }}>Agregar Producto</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={22} color="#9CA3AF" />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', display: 'block', marginBottom: 6 }}>
                                    Ingrediente
                                </label>
                                <select
                                    value={form.ingredient_id}
                                    onChange={e => setForm({ ...form, ingredient_id: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: '1rem', outline: 'none' }}
                                >
                                    <option value="">— Selecciona un ingrediente —</option>
                                    {ingredients.map(ing => (
                                        <option key={ing.ingredient_id} value={ing.ingredient_id}>
                                            {ing.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', display: 'block', marginBottom: 6 }}>
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={form.quantity}
                                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                                        placeholder="Ej: 2"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', display: 'block', marginBottom: 6 }}>
                                        Unidad
                                    </label>
                                    <select
                                        value={form.unit}
                                        onChange={e => setForm({ ...form, unit: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: '1rem', outline: 'none' }}
                                    >
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', display: 'block', marginBottom: 6 }}>
                                    Fecha de vencimiento (opcional)
                                </label>
                                <input
                                    type="date"
                                    value={form.expiration_date}
                                    onChange={e => setForm({ ...form, expiration_date: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn-generate" onClick={handleAdd} disabled={saving}>
                                {saving ? 'Guardando...' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;