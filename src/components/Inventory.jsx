import React, { useState, useEffect } from 'react';
import { Trash, PlusCircle, X, Warning, WarningOctagon, CheckCircle } from '@phosphor-icons/react';
import { inventoryService, ingredientsService } from '../api';

// Devuelve el estado de caducidad de un item
// 'expired' | 'critical' | 'warning' | 'ok' | 'none'
const getExpiryStatus = (expiration_date) => {
    if (!expiration_date) return 'none';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiration_date);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)  return 'expired';   // Ya vencido
    if (diffDays === 0) return 'critical';  // Vence HOY
    if (diffDays <= 3)  return 'warning';   // Vence en 1-3 días
    return 'ok';
};

const EXPIRY_STYLES = {
    expired:  { bg: '#FEF2F2', color: '#DC2626', badgeBg: '#FEE2E2', badgeColor: '#DC2626', label: 'Vencido',      icon: <WarningOctagon size={15} weight="fill" /> },
    critical: { bg: '#FFF7ED', color: '#EA580C', badgeBg: '#FFEDD5', badgeColor: '#EA580C', label: 'Vence hoy',   icon: <Warning size={15} weight="fill" /> },
    warning:  { bg: '#FEFCE8', color: '#CA8A04', badgeBg: '#FEF9C3', badgeColor: '#CA8A04', label: 'Por vencer',  icon: <Warning size={15} weight="fill" /> },
    ok:       { bg: 'transparent', color: '#16A34A', badgeBg: '#DCFCE7', badgeColor: '#16A34A', label: null,      icon: null },
    none:     { bg: 'transparent', color: '#9CA3AF', badgeBg: '#F3F4F6', badgeColor: '#9CA3AF', label: null,      icon: null },
};

const Inventory = ({ currentFamily, userRole }) => {
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
    const [creatingNew, setCreatingNew] = useState(false);
    const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'unidad', category: 'otro' });

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
                        unit: ingredient ? ingredient.unit : '',
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
                quantity: Number(form.quantity),
                expiration_date: form.expiration_date || null,
            };
            const created = await inventoryService.create(payload);
            const ingredient = ingredients.find(i => i.ingredient_id === created.ingredient_id);
            setItems(prev => [...prev, {
                ...created,
                name: ingredient ? ingredient.name : `Ingrediente #${created.ingredient_id}`,
                unit: ingredient ? ingredient.unit : '',
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

    // ---------- Crear ingrediente nuevo ----------
    const handleCreateIngredient = async () => {
        if (!newIngredient.name.trim()) {
            alert('Escribe el nombre del ingrediente.');
            return;
        }
        try {
            const created = await ingredientsService.create({
                name: newIngredient.name.trim(),
                unit: newIngredient.unit,
                category: newIngredient.category,
            });
            // Agregar a la lista local y seleccionarlo
            setIngredients(prev => [...prev, created]);
            setForm(prev => ({ ...prev, ingredient_id: String(created.ingredient_id) }));
            setCreatingNew(false);
            setNewIngredient({ name: '', unit: 'unidad', category: 'otro' });
        } catch (err) {
            alert('Error al crear el ingrediente.');
            console.error(err);
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
                    <>
                        {/* VISTA DESKTOP: Tabla */}
                        <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                    items.map((item) => {
                                        const status = getExpiryStatus(item.expiration_date);
                                        const style = EXPIRY_STYLES[status];
                                        return (
                                        <tr key={item.inventory_id} style={{ borderBottom: '1px solid #eee', background: style.bg, transition: 'background 0.3s' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {style.icon && <span style={{ color: style.color }}>{style.icon}</span>}
                                                <span style={{ color: status === 'expired' ? '#DC2626' : 'inherit', textDecoration: status === 'expired' ? 'line-through' : 'none' }}>
                                                    {item.name}
                                                </span>
                                                {style.label && (
                                                    <span style={{ background: style.badgeBg, color: style.badgeColor, fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                                                        {style.label}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: status === 'expired' ? '#9CA3AF' : 'inherit' }}>{item.quantity} {item.unit}</td>
                                            <td>
                                                <span style={{
                                                    backgroundColor: style.badgeBg,
                                                    color: style.badgeColor,
                                                    padding: '4px 8px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: status !== 'ok' && status !== 'none' ? 700 : 400,
                                                }}>
                                                    {item.expiration_date
                                                        ? new Date(item.expiration_date).toLocaleDateString()
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td>
                                                {userRole !== 'ayudante' && (
                                                    <button
                                                        onClick={() => handleDelete(item.inventory_id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FA7070' }}
                                                        title="Eliminar"
                                                    >
                                                        <Trash size={20} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* VISTA MÓVIL: Cards */}
                        <div className="inventory-mobile-list" style={{ display: 'none' }}>
                            {items.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                                    No hay ítems en el inventario. ¡Agrega uno!
                                </p>
                            ) : (
                                items.map((item) => {
                                    const status = getExpiryStatus(item.expiration_date);
                                    const style = EXPIRY_STYLES[status];
                                    return (
                                    <div key={item.inventory_id} className="inv-card" style={{ background: style.bg, borderLeft: status !== 'ok' && status !== 'none' ? `3px solid ${style.color}` : undefined }}>
                                        <div className="inv-card-icon">{status === 'expired' ? '🗑️' : status === 'critical' ? '⚠️' : status === 'warning' ? '⏳' : '📦'}</div>
                                        <div className="inv-card-info">
                                            <h4 style={{ color: status === 'expired' ? '#DC2626' : 'inherit', textDecoration: status === 'expired' ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {item.name}
                                                {style.label && (
                                                    <span style={{ background: style.badgeBg, color: style.badgeColor, fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>
                                                        {style.label}
                                                    </span>
                                                )}
                                            </h4>
                                            <p style={{ color: status === 'expired' ? '#9CA3AF' : 'inherit' }}>{item.quantity} {item.unit}</p>
                                            {item.expiration_date && (
                                                <span className="inv-card-expiry" style={{ color: style.badgeColor, fontWeight: status !== 'ok' && status !== 'none' ? 700 : 400 }}>
                                                    {status === 'expired' ? 'Venció: ' : 'Vence: '}{new Date(item.expiration_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        {userRole !== 'ayudante' && (
                                            <button
                                                className="inv-card-delete"
                                                onClick={() => handleDelete(item.inventory_id)}
                                                title="Eliminar"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        )}
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>
                                        Ingrediente
                                    </label>
                                    <button
                                        onClick={() => setCreatingNew(!creatingNew)}
                                        style={{
                                            background: creatingNew ? '#FEF2F2' : '#FFF7ED',
                                            color: creatingNew ? '#DC2626' : '#FF9F43',
                                            border: 'none', borderRadius: 8,
                                            padding: '4px 12px', fontSize: '0.8rem',
                                            fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        {creatingNew ? '✕ Cancelar' : '+ Nuevo Producto'}
                                    </button>
                                </div>

                                {creatingNew ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#FFFBF5', border: '2px dashed #FFD9A0', borderRadius: 12, padding: 14 }}>
                                        <input
                                            type="text"
                                            placeholder="Nombre del ingrediente (Ej: Harina Pan)"
                                            value={newIngredient.name}
                                            onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <select
                                                value={newIngredient.unit}
                                                onChange={e => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                                                style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: '0.9rem' }}
                                            >
                                                <option value="unidad">Unidad</option>
                                                <option value="g">Gramos (g)</option>
                                                <option value="kg">Kilogramos (kg)</option>
                                                <option value="ml">Mililitros (ml)</option>
                                                <option value="l">Litros (l)</option>
                                                <option value="cup">Taza</option>
                                            </select>
                                            <select
                                                value={newIngredient.category}
                                                onChange={e => setNewIngredient({ ...newIngredient, category: e.target.value })}
                                                style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: '0.9rem' }}
                                            >
                                                <option value="vegetal">Vegetal</option>
                                                <option value="fruta">Fruta</option>
                                                <option value="proteína">Proteína</option>
                                                <option value="lácteo">Lácteo</option>
                                                <option value="grano">Grano</option>
                                                <option value="condimento">Condimento</option>
                                                <option value="grasa">Grasa</option>
                                                <option value="bebida">Bebida</option>
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={handleCreateIngredient}
                                            style={{
                                                background: '#FF9F43', color: 'white', border: 'none',
                                                borderRadius: 10, padding: '8px 16px', fontWeight: 700,
                                                cursor: 'pointer', fontSize: '0.9rem'
                                            }}
                                        >
                                            Crear y seleccionar
                                        </button>
                                    </div>
                                ) : (
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
                                )}
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
                                    <div style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '2px solid #E5E7EB', fontSize: '1rem', background: '#F3F4F6', color: '#6B7280' }}>
                                        {form.ingredient_id
                                            ? (ingredients.find(i => i.ingredient_id === Number(form.ingredient_id))?.unit || '—')
                                            : '—'}
                                    </div>
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
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleAdd} disabled={saving}>
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