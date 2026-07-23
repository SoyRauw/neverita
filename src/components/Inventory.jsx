import React, { useState, useEffect } from 'react';
import { showToast } from '../Toast';
import { Trash, PlusCircle, X, Warning, WarningOctagon, CheckCircle, Snowflake, ListChecks, Package, MagnifyingGlass } from '@phosphor-icons/react';
import { inventoryService, ingredientsService, aiService } from '../api';
import { formatQty, isReasonableQty, maxReasonable } from '../units';
import NvDatePicker from './NvDatePicker';
import NvSelect from './NvSelect';

const UNIT_OPTS = [
    { value: 'g', label: 'Gramos (g)' }, { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'ml', label: 'Mililitros (ml)' }, { value: 'l', label: 'Litros (l)' },
    { value: 'cup', label: 'Taza' }, { value: 'unidad', label: 'Unidad' },
];
const CAT_OPTS = [
    { value: 'vegetal', label: 'Vegetal' }, { value: 'fruta', label: 'Fruta' },
    { value: 'proteína', label: 'Proteína' }, { value: 'lácteo', label: 'Lácteo' },
    { value: 'grano', label: 'Grano' }, { value: 'condimento', label: 'Condimento' },
    { value: 'grasa', label: 'Grasa' }, { value: 'bebida', label: 'Bebida' }, { value: 'otro', label: 'Otro' },
];
// Vencimiento mínimo permitido: mañana (no se pueden agregar productos ya vencidos/de hoy).
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Devuelve el estado de caducidad de un item
// 'expired' | 'critical' | 'warning' | 'ok' | 'none'
const getExpiryStatus = (expiration_date, is_frozen) => {
    if (is_frozen) return 'frozen';
    if (!expiration_date) return 'none';
    const now = new Date();
    now.setHours(12, 0, 0, 0); // Comparar con mediodía
    const dateStr = expiration_date.includes('T') ? expiration_date.split('T')[0] : expiration_date;
    const exp = new Date(dateStr + 'T12:00:00');
    exp.setHours(12, 0, 0, 0);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)  return 'expired';   // Ya vencido
    if (diffDays === 0) return 'critical';  // Vence HOY
    if (diffDays <= 3)  return 'warning';   // Vence en 1-3 días
    return 'ok';
};

const EXPIRY_STYLES = {
    frozen:   { bg: '#F0F9FF', color: '#0EA5E9', badgeBg: '#E0F2FE', badgeColor: '#0EA5E9', label: 'Congelado',   icon: <Snowflake size={15} weight="fill" /> },
    expired:  { bg: '#FEF2F2', color: '#DC2626', badgeBg: '#FEE2E2', badgeColor: '#DC2626', label: 'Vencido',      icon: <WarningOctagon size={15} weight="fill" /> },
    critical: { bg: '#FFF7ED', color: '#EA580C', badgeBg: '#FFEDD5', badgeColor: '#EA580C', label: 'Vence hoy',   icon: <Warning size={15} weight="fill" /> },
    warning:  { bg: '#FEFCE8', color: '#CA8A04', badgeBg: '#FEF9C3', badgeColor: '#CA8A04', label: 'Por vencer',  icon: <Warning size={15} weight="fill" /> },
    ok:       { bg: 'transparent', color: '#16A34A', badgeBg: '#DCFCE7', badgeColor: '#16A34A', label: null,      icon: null },
    none:     { bg: 'transparent', color: '#9b8d7c', badgeBg: '#FFF6EC', badgeColor: '#9b8d7c', label: null,      icon: null },
};

const Inventory = ({ currentFamily, userRole }) => {
    const [items, setItems] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Autocomplete
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);

    // Modo "crear nuevo"
    const [creatingNew, setCreatingNew] = useState(false);
    const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'g', category: 'otro', average_expiry_days: 7 });
    const [aiLoading, setAiLoading] = useState(false); // spinner mientras IA responde

    // Cantidad y fecha
    const [quantity, setQuantity] = useState('');
    const [expirationDate, setExpirationDate] = useState('');

    // Eliminación: confirmación individual y selección múltiple
    const [pendingDelete, setPendingDelete] = useState(null); // item a confirmar
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]); // inventory_id seleccionados
    const [confirmBulk, setConfirmBulk] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const toggleSelected = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const exitSelection = () => { setSelectionMode(false); setSelectedIds([]); };
    const allSelected = items.length > 0 && selectedIds.length === items.length;
    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? [] : items.map(i => i.inventory_id));
    };

    // Sugerencias filtradas del autocomplete
    const suggestions = searchText.trim().length >= 1
        ? ingredients.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase())).slice(0, 8)
        : [];

    // Fecha estimada según average_expiry_days del ingrediente seleccionado
    const calcEstimatedExpiry = (ing) => {
        if (!ing || !ing.average_expiry_days) return null;
        const d = new Date();
        d.setDate(d.getDate() + ing.average_expiry_days);
        return d.toISOString().split('T')[0];
    };
    const estimatedExpiry = selectedIngredient && !expirationDate ? calcEstimatedExpiry(selectedIngredient) : null;

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
                const filtered = currentFamily
                    ? inv.filter(i => i.family_id === currentFamily.family_id || i.family_id === currentFamily.id)
                    : inv;
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

    // Debounce: llamar a la IA 700ms después de que el usuario deja de escribir el nombre
    useEffect(() => {
        const name = newIngredient.name.trim();
        if (!creatingNew || name.length < 3) return;
        setAiLoading(true);
        const timer = setTimeout(async () => {
            try {
                const info = await aiService.ingredientInfo(name);
                setNewIngredient(prev => ({
                    ...prev,
                    unit: info.unit || prev.unit,
                    category: info.category || prev.category,
                    average_expiry_days: info.average_expiry_days || prev.average_expiry_days,
                    is_food: info.is_food !== false,
                }));
            } catch (e) { /* silencioso */ }
            finally { setAiLoading(false); }
        }, 700);
        return () => clearTimeout(timer);
    }, [newIngredient.name, creatingNew]);

    const resetModal = () => {
        setSearchText('');
        setSelectedIngredient(null);
        setCreatingNew(false);
        setNewIngredient({ name: '', unit: 'g', category: 'otro', average_expiry_days: 7 });
        setAiLoading(false);
        setQuantity('');
        setExpirationDate('');
        setShowSuggestions(false);
    };

    // ---------- Eliminar ítem (tras confirmar) ----------
    const handleDelete = async (inventoryId) => {
        try {
            await inventoryService.delete(inventoryId);
            setItems(prev => prev.filter(i => i.inventory_id !== inventoryId));
        } catch (err) {
            showToast('Error al eliminar el ítem.');
            console.error(err);
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        await handleDelete(pendingDelete.inventory_id);
        setDeleting(false);
        setPendingDelete(null);
    };

    // ---------- Eliminar varios ítems ----------
    const confirmBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setDeleting(true);
        const ids = [...selectedIds];
        const failed = [];
        for (const id of ids) {
            try {
                await inventoryService.delete(id);
            } catch (err) {
                console.error(err);
                failed.push(id);
            }
        }
        setItems(prev => prev.filter(i => failed.includes(i.inventory_id) || !ids.includes(i.inventory_id)));
        setDeleting(false);
        setConfirmBulk(false);
        if (failed.length > 0) {
            showToast(`No se pudieron eliminar ${failed.length} ítem(s).`);
            setSelectedIds(failed);
        } else {
            exitSelection();
        }
    };

    // ---------- Seleccionar sugerencia ----------
    const handleSelectSuggestion = (ing) => {
        setSelectedIngredient(ing);
        setSearchText(ing.name);
        setShowSuggestions(false);
        setCreatingNew(false);
    };

    // ---------- Crear ingrediente nuevo ----------
    const handleCreateIngredient = async () => {
        const nm = newIngredient.name.trim();
        if (!nm) { showToast('Escribe el nombre del ingrediente.'); return; }
        if (nm.length < 2 || !/[a-záéíóúñ]/i.test(nm)) { showToast('Escribe un nombre de alimento válido.', 'warning'); return; }
        if (aiLoading) { showToast('Espera un momento, estamos verificando el alimento…', 'info'); return; }
        // Item 5: no dejar agregar cosas que no son alimentos (la IA lo marcó).
        if (newIngredient.is_food === false) { showToast(`"${nm}" no parece un alimento. Escribe un ingrediente comestible.`, 'error'); return; }
        try {
            const created = await ingredientsService.create({
                name: nm,
                unit: newIngredient.unit,
                category: newIngredient.category,
                average_expiry_days: newIngredient.average_expiry_days,
            });
            if (created.already_existed) {
                showToast(`"${created.name}" ya existe. Lo hemos seleccionado automáticamente.`);
            } else {
                setIngredients(prev => [...prev, created]);
            }
            setSelectedIngredient(created);
            setSearchText(created.name);
            setCreatingNew(false);
            setNewIngredient({ name: '', unit: 'g', category: 'otro' });
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Error al crear el ingrediente.', 'error');
        }
    };

    // ---------- Congelar / Descongelar ----------
    const handleToggleFrozen = async (item) => {
        try {
            const newValue = item.is_frozen ? 0 : 1;
            const updatedItem = await inventoryService.update(item.inventory_id, {
                ...item,
                is_frozen: newValue
            });
            setItems(prev => prev.map(i => i.inventory_id === item.inventory_id ? { 
                ...i, 
                is_frozen: newValue, 
                expiration_date: updatedItem.expiration_date,
                frozen_at: updatedItem.frozen_at
            } : i));
        } catch (err) {
            showToast('Error al actualizar el estado de congelación.');
            console.error(err);
        }
    };

    // ---------- Agregar al inventario ----------
    const handleAdd = async () => {
        if (!selectedIngredient) { showToast('Selecciona o crea un ingrediente primero.'); return; }
        if (!quantity || Number(quantity) <= 0) { showToast('Indica una cantidad válida (mayor a 0).'); return; }
        if (!isReasonableQty(quantity, selectedIngredient.unit)) {
            showToast(`Esa cantidad es demasiado alta para "${selectedIngredient.unit}". Máximo razonable: ${maxReasonable(selectedIngredient.unit)} ${selectedIngredient.unit}.`, 'warning');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                family_id: currentFamily?.family_id || currentFamily?.id || null,
                ingredient_id: selectedIngredient.ingredient_id,
                quantity: Number(quantity),
                expiration_date: expirationDate || null,
            };
            const created = await inventoryService.create(payload);
            setItems(prev => [...prev, { ...created, name: selectedIngredient.name, unit: selectedIngredient.unit }]);
            setShowModal(false);
            resetModal();
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Error al agregar el producto.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ---------- Render ----------
    return (
        <div className="main-content">
            <header>
                <div className="header-title">
                    <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <span className="nv-title-ic"><Snowflake size={22} weight="fill" /></span>
                        Mi Inventario
                    </h1>
                    <p>Gestiona lo que tienes en tu nevera
                        {currentFamily && <span style={{ color: '#FF9F43', fontWeight: 600 }}> — {currentFamily.name}</span>}
                    </p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {!loading && !error && items.length > 0 && (
                        selectionMode ? (
                            <button className="btn-secondary" onClick={exitSelection}>
                                <X size={18} weight="bold" /> Cancelar
                            </button>
                        ) : (
                            <button className="btn-secondary" onClick={() => setSelectionMode(true)}>
                                <ListChecks size={18} weight="bold" /> Seleccionar
                            </button>
                        )
                    )}
                    <button className="btn-primary" onClick={() => { resetModal(); setShowModal(true); }}>
                        <PlusCircle size={20} weight="bold" /> Agregar Producto
                    </button>
                </div>
            </header>

            <div className="calendar-wrapper">
                {selectionMode && !loading && !error && items.length > 0 && (
                    <div className="inv-select-bar">
                        <label className="inv-select-all">
                            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                            <span>Seleccionar todo</span>
                        </label>
                        <span className="inv-select-count">{selectedIds.length} seleccionado(s)</span>
                        <button
                            className="inv-select-del"
                            disabled={selectedIds.length === 0}
                            onClick={() => setConfirmBulk(true)}
                        >
                            <Trash size={18} weight="bold" /> Eliminar seleccionados ({selectedIds.length})
                        </button>
                    </div>
                )}
                {loading && <div className="nv-loading"><div className="nv-spinner" /><span>Cargando inventario…</span></div>}
                {error && <p style={{ color: '#e74c3c', textAlign: 'center', padding: '2rem' }}>{error}</p>}

                {!loading && !error && (
                    <>
                        {/* VISTA DESKTOP: Tabla */}
                        <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    {selectionMode && (
                                        <th style={{ padding: '1rem', width: 44 }}>
                                            <input type="checkbox" className="inv-check" checked={allSelected} onChange={toggleSelectAll} />
                                        </th>
                                    )}
                                    <th style={{ padding: '1rem' }}>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Vencimiento</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={selectionMode ? 5 : 4} style={{ padding: 0 }}>
                                            <div className="nv-empty">
                                                <div className="nv-empty-ic"><Snowflake size={40} weight="fill" /></div>
                                                <h3>Tu nevera está vacía</h3>
                                                <p>Agrega tu primer producto para empezar a controlar tu inventario.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => {
                                        const status = getExpiryStatus(item.expiration_date, item.is_frozen);
                                        const style = EXPIRY_STYLES[status];
                                        return (
                                        <tr key={item.inventory_id} style={{ borderBottom: '1px solid #eee', background: selectedIds.includes(item.inventory_id) ? '#FFF1E0' : style.bg, transition: 'background 0.3s' }}>
                                            {selectionMode && (
                                                <td style={{ padding: '1rem', width: 44 }}>
                                                    <input type="checkbox" className="inv-check" checked={selectedIds.includes(item.inventory_id)} onChange={() => toggleSelected(item.inventory_id)} />
                                                </td>
                                            )}
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
                                                {item.is_leftover === 1 && (
                                                    <span style={{ background: '#F3E8FF', color: '#9333EA', fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                                                        Sobras 🥡
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: status === 'expired' ? '#9b8d7c' : 'inherit' }}>{formatQty(item.quantity, item.unit)}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{
                                                        backgroundColor: style.badgeBg,
                                                        color: style.badgeColor,
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: status !== 'ok' && status !== 'none' ? 700 : 400,
                                                        textDecoration: status === 'frozen' ? 'line-through' : 'none',
                                                        opacity: status === 'frozen' ? 0.6 : 1,
                                                        width: 'fit-content'
                                                    }}>
                                                        {item.expiration_date
                                                            ? new Date((item.expiration_date.includes('T') ? item.expiration_date.split('T')[0] : item.expiration_date) + 'T12:00:00').toLocaleDateString()
                                                            : '—'}
                                                    </span>
                                                    {status === 'frozen' && item.frozen_at && (
                                                        <span style={{ fontSize: '0.75rem', color: '#0EA5E9', fontWeight: 600 }}>
                                                            Desde: {new Date(item.frozen_at).toLocaleDateString()}
                                                            <br/>
                                                            ({Math.floor(Math.abs(new Date() - new Date(item.frozen_at)) / (1000 * 60 * 60 * 24))} días congelado)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ display: 'flex', gap: 10 }}>
                                                <button
                                                    onClick={() => handleToggleFrozen(item)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_frozen ? '#0EA5E9' : '#9b8d7c' }}
                                                    title={item.is_frozen ? "Descongelar" : "Congelar"}
                                                >
                                                    <Snowflake size={20} weight={item.is_frozen ? "fill" : "regular"} />
                                                </button>
                                                <button
                                                    onClick={() => setPendingDelete(item)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FA7070' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash size={20} />
                                                </button>
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
                                <div className="nv-empty">
                                    <div className="nv-empty-ic"><Snowflake size={40} weight="fill" /></div>
                                    <h3>Tu nevera está vacía</h3>
                                    <p>Agrega tu primer producto para empezar.</p>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const status = getExpiryStatus(item.expiration_date, item.is_frozen);
                                    const style = EXPIRY_STYLES[status];
                                    return (
                                    <div key={item.inventory_id} className="inv-card" style={{ background: selectedIds.includes(item.inventory_id) ? '#FFF1E0' : style.bg, borderLeft: status !== 'ok' && status !== 'none' ? `3px solid ${style.color}` : undefined }}>
                                        {selectionMode && (
                                            <input type="checkbox" className="inv-check" checked={selectedIds.includes(item.inventory_id)} onChange={() => toggleSelected(item.inventory_id)} style={{ alignSelf: 'center', marginRight: 4 }} />
                                        )}
                                        <div className="inv-card-icon">{status === 'frozen' ? <Snowflake size={24} weight="fill" color="#0EA5E9" /> : status === 'expired' ? <Trash size={24} weight="fill" color="#DC2626" /> : status === 'critical' ? <Warning size={24} weight="fill" color="#EF4444" /> : status === 'warning' ? <WarningOctagon size={24} weight="fill" color="#F59E0B" /> : <Package size={24} weight="fill" color="#9b8d7c" />}</div>
                                        <div className="inv-card-info">
                                            <h4 style={{ color: status === 'expired' ? '#DC2626' : 'inherit', textDecoration: status === 'expired' ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {item.name}
                                                {style.label && (
                                                    <span style={{ background: style.badgeBg, color: style.badgeColor, fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>
                                                        {style.label}
                                                    </span>
                                                )}
                                                {item.is_leftover === 1 && (
                                                    <span style={{ background: '#F3E8FF', color: '#9333EA', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>
                                                        Sobras 🥡
                                                    </span>
                                                )}
                                            </h4>
                                            <p style={{ color: status === 'expired' ? '#9b8d7c' : 'inherit' }}>{formatQty(item.quantity, item.unit)}</p>
                                            {item.expiration_date && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                                    <span className="inv-card-expiry" style={{ 
                                                        color: style.badgeColor, 
                                                        fontWeight: status !== 'ok' && status !== 'none' ? 700 : 400,
                                                        textDecoration: status === 'frozen' ? 'line-through' : 'none',
                                                        opacity: status === 'frozen' ? 0.6 : 1
                                                    }}>
                                                        {status === 'expired' ? 'Venció: ' : 'Vence: '}{new Date((item.expiration_date.includes('T') ? item.expiration_date.split('T')[0] : item.expiration_date) + 'T12:00:00').toLocaleDateString()}
                                                    </span>
                                                    {status === 'frozen' && item.frozen_at && (
                                                        <span style={{ fontSize: '0.75rem', color: '#0EA5E9', fontWeight: 600 }}>
                                                            ❄️ Desde: {new Date(item.frozen_at).toLocaleDateString()} ({Math.floor(Math.abs(new Date() - new Date(item.frozen_at)) / (1000 * 60 * 60 * 24))} d)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <button
                                                className="inv-card-delete"
                                                onClick={() => handleToggleFrozen(item)}
                                                title={item.is_frozen ? "Descongelar" : "Congelar"}
                                                style={{ color: item.is_frozen ? '#0EA5E9' : '#9b8d7c' }}
                                            >
                                                <Snowflake size={18} weight={item.is_frozen ? "fill" : "regular"} />
                                            </button>
                                            <button
                                                className="inv-card-delete"
                                                onClick={() => setPendingDelete(item)}
                                                title="Eliminar"
                                                style={{ color: '#FA7070' }}
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
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
                <div className="modal-overlay" onClick={() => { setShowModal(false); resetModal(); }}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <h3 style={{ margin: 0, fontWeight: 800 }}>Agregar Producto</h3>
                            <button onClick={() => { setShowModal(false); resetModal(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10 }}>
                                <X size={22} color="#9b8d7c" />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>

                            {/* ---- BUSCADOR AUTOCOMPLETE ---- */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555' }}>Ingrediente</label>
                                    <button
                                        onClick={() => { setCreatingNew(!creatingNew); setSelectedIngredient(null); setSearchText(''); }}
                                        style={{ background: creatingNew ? '#FEF2F2' : '#FFF7ED', color: creatingNew ? '#DC2626' : '#FF9F43', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {creatingNew ? '✕ Cancelar' : '+ Nuevo Producto'}
                                    </button>
                                </div>

                                {!creatingNew && (
                                    <div className="nv-searchbar" style={{ position: 'relative' }}>
                                        <MagnifyingGlass size={18} className="nv-search-ic" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9b8d7c' }} />
                                        <input
                                            type="text"
                                            placeholder="Busca un ingrediente... (ej: Arroz)"
                                            value={searchText}
                                            onChange={e => { setSearchText(e.target.value); setSelectedIngredient(null); setShowSuggestions(true); }}
                                            onFocus={() => setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                            style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 12, border: selectedIngredient ? '2px solid #22C55E' : '2px solid #EADBC7', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', background: selectedIngredient ? '#F0FFF4' : 'white' }}
                                        />
                                        {selectedIngredient && (
                                            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#22C55E', fontWeight: 700 }}>
                                                ✓ {selectedIngredient.unit}
                                            </span>
                                        )}

                                        {/* Lista de sugerencias */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 999, background: 'white', border: '2px solid #EADBC7', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto' }}>
                                                {suggestions.map(ing => (
                                                    <div
                                                        key={ing.ingredient_id}
                                                        onMouseDown={() => handleSelectSuggestion(ing)}
                                                        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FFF6EC', fontSize: '0.95rem' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                    >
                                                        <span style={{ fontWeight: 600 }}>{ing.name}</span>
                                                        <span style={{ fontSize: '0.78rem', color: '#9b8d7c', background: '#FFF6EC', padding: '2px 8px', borderRadius: 20 }}>{ing.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sin resultados: sugerir crear */}
                                        {showSuggestions && searchText.trim().length >= 1 && suggestions.length === 0 && (
                                            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 999, background: 'white', border: '2px dashed #FFD9A0', borderRadius: 12, padding: '12px 14px', fontSize: '0.9rem', color: '#92400E' }}>
                                                No encontrado.{' '}
                                                <button onMouseDown={() => { setCreatingNew(true); setNewIngredient(p => ({ ...p, name: searchText })); setShowSuggestions(false); }} style={{ background: 'none', border: 'none', color: '#FF9F43', fontWeight: 700, cursor: 'pointer' }}>
                                                    ¿Crear "{searchText}"?
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ---- FORMULARIO CREAR NUEVO ---- */}
                                {creatingNew && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#FFFBF5', border: '2px dashed #FFD9A0', borderRadius: 12, padding: 14 }}>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                placeholder="Nombre del ingrediente (Ej: Harina Pan)"
                                                value={newIngredient.name}
                                                onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #EADBC7', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                                            />
                                            {aiLoading && (
                                                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#FF9F43', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    ✨ IA...
                                                </span>
                                            )}
                                        </div>

                                        {/* Sugerencia de la IA */}
                                        {!aiLoading && newIngredient.average_expiry_days > 0 && newIngredient.name.trim().length >= 3 && (
                                            <div style={{ background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <CheckCircle size={14} weight="fill" color="#22C55E" />
                                                IA sugiere: <strong>{newIngredient.unit}</strong> · <strong>{newIngredient.category}</strong> · dura <strong>{newIngredient.average_expiry_days} días</strong>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <NvSelect value={newIngredient.unit} onChange={v => setNewIngredient({ ...newIngredient, unit: v })} options={UNIT_OPTS} placeholder="Unidad" style={{ flex: 1 }} />
                                            <NvSelect value={newIngredient.category} onChange={v => setNewIngredient({ ...newIngredient, category: v })} options={CAT_OPTS} placeholder="Categoría" style={{ flex: 1 }} />
                                        </div>
                                        <button onClick={handleCreateIngredient} disabled={aiLoading} style={{ background: aiLoading ? '#EADBC7' : '#FF9F43', color: aiLoading ? '#9b8d7c' : 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                                            {aiLoading ? '✨ Consultando IA...' : 'Crear y seleccionar'}
                                        </button>
                                    </div>
                                )}

                            </div>

                            {/* ---- CANTIDAD ---- */}
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', display: 'block', marginBottom: 6 }}>Cantidad</label>
                                    {(() => {
                                        const qOk = quantity !== '' && selectedIngredient && isReasonableQty(quantity, selectedIngredient.unit);
                                        const qBad = quantity !== '' && (!(Number(quantity) > 0) || (selectedIngredient && !isReasonableQty(quantity, selectedIngredient.unit)));
                                        const border = quantity === '' ? '#EADBC7' : (qBad ? '#FCA5A5' : '#86EFAC');
                                        return (
                                            <>
                                                <input
                                                    type="number" min="0" step="any"
                                                    value={quantity}
                                                    onChange={e => setQuantity(e.target.value)}
                                                    placeholder="Ej: 500"
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `2px solid ${border}`, fontSize: '1rem', outline: 'none', boxSizing: 'border-box', background: quantity === '' ? '#fff' : (qBad ? '#FEF2F2' : '#F0FFF4'), transition: 'border-color .15s, background .15s' }}
                                                />
                                                {qBad && <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: 4, display: 'inline-block' }}>{Number(quantity) > 0 ? `Máximo razonable: ${maxReasonable(selectedIngredient.unit)} ${selectedIngredient.unit}` : 'Debe ser mayor que 0'}</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', display: 'block', marginBottom: 6 }}>Unidad</label>
                                    <div style={{ padding: '10px 14px', borderRadius: 12, border: '2px solid #EADBC7', fontSize: '1rem', background: '#FFF6EC', color: '#6B5E4F', textAlign: 'center' }}>
                                        {selectedIngredient ? selectedIngredient.unit : '—'}
                                    </div>
                                </div>
                            </div>

                            {/* ---- FECHA VENCIMIENTO ---- */}
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', display: 'block', marginBottom: 6 }}>
                                    Fecha de vencimiento <span style={{ fontWeight: 400, color: '#9b8d7c' }}>(opcional)</span>
                                </label>
                                <NvDatePicker value={expirationDate} onChange={v => setExpirationDate(v)} min={tomorrowStr()} placeholder="Debe vencer después de hoy" />
                                {estimatedExpiry && (
                                    <div style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#166534', background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', lineHeight: 1.4 }}>
                                        <CheckCircle size={15} color="#22C55E" weight="fill" style={{ flexShrink: 0 }} />
                                        <span>Fecha estimada: <strong>{new Date(estimatedExpiry + 'T12:00:00').toLocaleDateString()}</strong> · dura {selectedIngredient.average_expiry_days} días</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0 }}>
                            <button className="btn-secondary" onClick={() => { setShowModal(false); resetModal(); }}>Cancelar</button>
                            <button className="btn-primary" onClick={handleAdd} disabled={saving || !selectedIngredient}>
                                {saving ? 'Guardando...' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* -------- CONFIRMACIÓN: ELIMINAR UNO -------- */}
            {pendingDelete && (
                <div className="modal-overlay" onClick={() => !deleting && setPendingDelete(null)}>
                    <div className="nv-confirm-card" onClick={e => e.stopPropagation()}>
                        <div className="nv-confirm-icon"><Warning size={38} weight="fill" /></div>
                        <h3 className="nv-confirm-title">¿Eliminar ingrediente?</h3>
                        <p className="nv-confirm-text">
                            Vas a quitar <strong>{pendingDelete.name}</strong> de tu inventario.
                            <br />Esta acción no se puede deshacer.
                        </p>
                        <div className="nv-confirm-actions">
                            <button className="nv-confirm-cancel" disabled={deleting} onClick={() => setPendingDelete(null)}>Cancelar</button>
                            <button className="nv-confirm-del" disabled={deleting} onClick={confirmDelete}>
                                <Trash size={18} weight="bold" /> {deleting ? 'Eliminando…' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* -------- CONFIRMACIÓN: ELIMINAR VARIOS -------- */}
            {confirmBulk && (
                <div className="modal-overlay" onClick={() => !deleting && setConfirmBulk(false)}>
                    <div className="nv-confirm-card" onClick={e => e.stopPropagation()}>
                        <div className="nv-confirm-icon"><Warning size={38} weight="fill" /></div>
                        <h3 className="nv-confirm-title">¿Eliminar seleccionados?</h3>
                        <p className="nv-confirm-text">
                            Vas a quitar <strong>{selectedIds.length} ingrediente(s)</strong> de tu inventario.
                            <br />Esta acción no se puede deshacer.
                        </p>
                        <div className="nv-confirm-actions">
                            <button className="nv-confirm-cancel" disabled={deleting} onClick={() => setConfirmBulk(false)}>Cancelar</button>
                            <button className="nv-confirm-del" disabled={deleting} onClick={confirmBulkDelete}>
                                <Trash size={18} weight="bold" /> {deleting ? 'Eliminando…' : `Eliminar (${selectedIds.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;