import React, { useState, useEffect } from 'react';
import { showToast } from '../Toast';
import { CheckCircle, Circle, Trash, MagicWand, X, Plus, ShoppingCart, Carrot, Fish, Drop, Coffee, Package, Pepper, Cherries, BowlFood, MagnifyingGlass } from '@phosphor-icons/react';

// Secciones de la lista de compras (agrupadas por categoría del ingrediente).
const SHOP_SECTIONS = [
    { key: 'proteína', label: 'Proteínas', Icon: Fish, color: '#DC2626', bg: '#FEE2E2' },
    { key: 'vegetal', label: 'Vegetales', Icon: Carrot, color: '#16A34A', bg: '#DCFCE7' },
    { key: 'fruta', label: 'Frutas', Icon: Cherries, color: '#DB2777', bg: '#FCE7F3' },
    { key: 'lácteo', label: 'Lácteos', Icon: Drop, color: '#0EA5E9', bg: '#E0F2FE' },
    { key: 'grano', label: 'Granos y cereales', Icon: BowlFood, color: '#CA8A04', bg: '#FEF9C3' },
    { key: 'condimento', label: 'Condimentos', Icon: Pepper, color: '#9333EA', bg: '#F3E8FF' },
    { key: 'grasa', label: 'Grasas y aceites', Icon: Drop, color: '#0891B2', bg: '#CFFAFE' },
    { key: 'bebida', label: 'Bebidas', Icon: Coffee, color: '#2563EB', bg: '#DBEAFE' },
    { key: 'otro', label: 'Otros', Icon: Package, color: '#6B7280', bg: '#F3F4F6' },
];
import NvSelect from './NvSelect';
import NvDatePicker from './NvDatePicker';

const UNIT_OPTIONS = [
    { value: 'unidad', label: 'unidad' },
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
    { value: 'ml', label: 'ml' },
    { value: 'l', label: 'l' },
];
import { shoppingListService, aiService, ingredientsService, inventoryService, menuPlansService, dailyMealsService } from '../api';
import { formatQty, isReasonableQty } from '../units';

const ShoppingList = ({ currentFamily }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiGenerating, setAiGenerating] = useState(false);

    // Autocomplete state
    const [ingredients, setIngredients] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('unidad');

    // Create New Ingredient
    const [creatingNew, setCreatingNew] = useState(false);
    const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'g', category: 'otro', average_expiry_days: 7 });
    const [aiLoading, setAiLoading] = useState(false);

    // Modal Add to Inventory
    const [showModal, setShowModal] = useState(false);
    const [modalItem, setModalItem] = useState(null);
    const [modalQty, setModalQty] = useState('');
    const [modalExpDate, setModalExpDate] = useState('');
    const [modalSaving, setModalSaving] = useState(false);

    useEffect(() => {
        if (!currentFamily) return;
        loadData();
    }, [currentFamily]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopList, ingList] = await Promise.all([
                shoppingListService.getByFamily(currentFamily.family_id || currentFamily.id),
                ingredientsService.getAll()
            ]);
            setItems(shopList);
            setIngredients(ingList);
        } catch (error) {
            console.error("Error loading shopping list data", error);
            showToast('No se pudo cargar la lista de compras. Revisa tu conexión.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- AI Suggestions for New Ingredient ---
    useEffect(() => {
        const name = newIngredient.name.trim();
        if (!creatingNew || name.length < 3) return;
        setAiLoading(true);
        const timer = setTimeout(async () => {
            try {
                const info = await aiService.ingredientInfo(name);
                setNewIngredient(prev => ({ ...prev, ...info }));
            } catch (e) {} finally { setAiLoading(false); }
        }, 700);
        return () => clearTimeout(timer);
    }, [newIngredient.name, creatingNew]);

    // --- Autocomplete ---
    const suggestions = searchText.trim().length >= 1
        ? ingredients.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase())).slice(0, 8)
        : [];

    const handleSelectSuggestion = (ing) => {
        setSelectedIngredient(ing);
        setSearchText(ing.name);
        setUnit(ing.unit);
        setShowSuggestions(false);
        setCreatingNew(false);
    };

    const handleCreateIngredient = async () => {
        const nm = newIngredient.name.trim();
        if (!nm) return showToast('Escribe el nombre.');
        if (nm.length < 2 || !/[a-záéíóúñ]/i.test(nm)) return showToast('Escribe un nombre de alimento válido.', 'warning');
        if (aiLoading) return showToast('Espera un momento, estamos verificando el alimento…', 'info');
        if (newIngredient.is_food === false) return showToast(`"${nm}" no parece un alimento. Escribe un ingrediente comestible.`, 'error');
        try {
            const created = await ingredientsService.create({
                name: nm,
                unit: newIngredient.unit,
                category: newIngredient.category,
                average_expiry_days: newIngredient.average_expiry_days,
            });
            setIngredients(prev => [...prev, created]);
            handleSelectSuggestion(created);
        } catch (err) {
            console.error(err);
            showToast(err?.message || 'Error al crear ingrediente.', 'error');
        }
    };

    // --- Add Manual Item ---
    const handleAddManual = async () => {
        const name = selectedIngredient ? selectedIngredient.name : searchText.trim();
        if (!name) { showToast('Escribe o elige un ingrediente.', 'warning'); return; }
        const q = Number(quantity);
        if (quantity === '' || !Number.isFinite(q) || q <= 0) { showToast('Ingresa una cantidad válida mayor que 0.', 'warning'); return; }
        const u = selectedIngredient ? selectedIngredient.unit : unit;
        if (!isReasonableQty(q, u)) { showToast(`Esa cantidad es demasiado alta para "${u}". Revisa el número.`, 'warning'); return; }
        try {
            const payload = {
                family_id: currentFamily.family_id || currentFamily.id,
                name,
                quantity: q,
                unit: u,
                source: 'manual'
            };
            const created = await shoppingListService.create(payload);
            setItems([created, ...items]);
            setSearchText('');
            setSelectedIngredient(null);
            setQuantity('');
            setUnit('unidad');
        } catch (error) {
            console.error(error);
            showToast(error?.message || "Error al agregar.", 'error');
        }
    };

    // --- Delete & Clear ---
    const handleDelete = async (id) => {
        try {
            await shoppingListService.delete(id);
            setItems(items.filter(i => i.item_id !== id));
        } catch (error) { showToast("Error eliminando item"); }
    };

    const handleClearChecked = async () => {
        if (!window.confirm("¿Limpiar todos los comprados?")) return;
        try {
            await shoppingListService.clearChecked(currentFamily.family_id || currentFamily.id);
            setItems(items.filter(i => !i.checked));
        } catch (error) { showToast("Error limpiando items"); }
    };

    // --- AI Smart Generation ---
    const handleAiGenerate = async () => {
        setAiGenerating(true);
        try {
            const familyId = currentFamily.family_id || currentFamily.id;

            // Obtener inventario Y lista de ingredientes en paralelo
            const [rawInv, plans] = await Promise.all([
                inventoryService.getByFamily(familyId),
                menuPlansService.getByFamily(familyId)
            ]);

            // Enriquecer el inventario con nombres reales usando la lista de ingredientes ya cargada
            const enrichedInventory = rawInv.map(invItem => {
                const ing = ingredients.find(i => i.ingredient_id === invItem.ingredient_id);
                return {
                    name: ing ? ing.name : null,
                    quantity: invItem.quantity,
                    unit: ing ? ing.unit : invItem.unit,
                    expiration_date: invItem.expiration_date,
                };
            }).filter(i => i.name !== null); // descartar los que no tienen nombre en DB

            const now = new Date();
            now.setHours(12, 0, 0, 0);
            const activePlan = plans.find(p => {
                const start = new Date((p.start_date.includes('T') ? p.start_date.split('T')[0] : p.start_date) + 'T12:00:00');
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                return now >= start && now <= end;
            });

            let weekly_plan_ingredients = [];
            if (activePlan) {
                try {
                    const meals = await dailyMealsService.getByPlan(activePlan.menu_plan_id);
                    meals.forEach(m => {
                        let ings = m.ingredients_list;
                        if (typeof ings === 'string') {
                            try { ings = JSON.parse(ings); } catch (e) { ings = []; }
                        }
                        if (Array.isArray(ings)) {
                            weekly_plan_ingredients = weekly_plan_ingredients.concat(ings);
                        }
                    });
                } catch (err) {
                    console.error("Error fetching daily meals for active plan", err);
                }
            }

            // Lista de compras actual (sin marcar como comprados) para evitar duplicados
            const currentShoppingList = items
                .filter(i => !i.checked)
                .map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit }));

            const payload = {
                family_id: familyId,
                member_count: currentFamily.members || 1,
                current_inventory: enrichedInventory,
                weekly_plan_ingredients: weekly_plan_ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
                current_shopping_list: currentShoppingList,
            };

            const response = await aiService.generateShoppingList(payload);

            if (response.items && response.items.length > 0) {
                const newItems = [];
                for (const item of response.items) {
                    // Si el ingrediente existe en DB, usar su nombre y unidad exactos
                    const dbIng = ingredients.find(i => i.name.toLowerCase() === item.name.toLowerCase());
                    const created = await shoppingListService.create({
                        family_id: familyId,
                        name: dbIng ? dbIng.name : item.name,
                        quantity: item.quantity,
                        unit: dbIng ? dbIng.unit : item.unit,
                        source: 'ai'
                    });
                    newItems.push(created);
                }
                setItems([...newItems, ...items]);
            } else {
                showToast("La IA determinó que tienes todo lo necesario para esta semana.");
            }

        } catch (error) {
            showToast("Error generando lista con IA.");
            console.error(error);
        } finally {
            setAiGenerating(false);
        }
    };

    // --- Add to Inventory Modal Flow ---
    const openInventoryModal = (item) => {
        if (item.checked) {
            toggleCheckStatus(item.item_id, false);
            return;
        }
        setModalItem(item);
        setModalQty(item.quantity);
        const ing = ingredients.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (ing && ing.average_expiry_days) {
            const d = new Date();
            d.setDate(d.getDate() + ing.average_expiry_days);
            setModalExpDate(d.toISOString().split('T')[0]);
        } else {
            setModalExpDate('');
        }
        setShowModal(true);
    };

    const toggleCheckStatus = async (id, status) => {
        try {
            await shoppingListService.update(id, { checked: status });
            setItems(items.map(i => i.item_id === id ? { ...i, checked: status } : i));
        } catch (error) { showToast("Error actualizando item."); }
    };

    const confirmInventoryAdd = async () => {
        if (!modalItem) return;
        setModalSaving(true);
        try {
            let ing = ingredients.find(i => i.name.toLowerCase() === modalItem.name.toLowerCase());
            if (!ing) {
                ing = await ingredientsService.create({
                    name: modalItem.name,
                    unit: modalItem.unit,
                    category: 'otro',
                    average_expiry_days: 7
                });
                setIngredients([...ingredients, ing]);
            }
            await inventoryService.create({
                family_id: currentFamily.family_id || currentFamily.id,
                ingredient_id: ing.ingredient_id,
                quantity: Number(modalQty),
                expiration_date: modalExpDate || null
            });
            await shoppingListService.update(modalItem.item_id, { checked: true, quantity: Number(modalQty) });
            setItems(items.map(i => i.item_id === modalItem.item_id ? { ...i, checked: 1, quantity: Number(modalQty) } : i));
            setShowModal(false);
        } catch (error) {
            showToast("Error agregando al inventario.");
        } finally {
            setModalSaving(false);
        }
    };

    const toBuy = items.filter(i => !i.checked);
    const bought = items.filter(i => i.checked);

    // Categoría de un producto (por su nombre, buscando en el catálogo de ingredientes).
    const catOf = (name) => {
        if (!name) return 'otro';
        const ing = ingredients.find(i => i.name && i.name.toLowerCase() === name.toLowerCase());
        const c = ing && ing.category ? ing.category.toLowerCase() : 'otro';
        return SHOP_SECTIONS.some(s => s.key === c) ? c : 'otro';
    };

    return (
        <div className="main-content">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div className="header-title">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShoppingCart size={26} weight="fill" color="#FF7F50" /> Lista de Compras</h1>
                    <p>
                        Organiza tu semana
                        {currentFamily && <span style={{ color: '#FF9F43', fontWeight: 600 }}> — {currentFamily.name}</span>}
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%)', boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)' }}
                >
                    <MagicWand size={20} weight={aiGenerating ? "regular" : "fill"} className={aiGenerating ? "spin-animation" : ""} />
                    {aiGenerating ? 'Analizando...' : 'Generar con IA'}
                </button>
            </header>

            <div className="shopping-card-container" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', padding: '26px', borderRadius: '22px', boxShadow: '0 24px 60px rgba(180,100,30,0.12)', border: '1px solid rgba(255,159,67,0.16)', maxWidth: '800px', marginBottom: 40 }}>

                {/* --- AÑADIR MANUAL --- */}
                <div className="shopping-form-row" style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '30px', flexWrap: 'wrap', borderBottom: '2px solid rgba(255,159,67,0.16)', paddingBottom: '24px' }}>

                    <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
                        <label className="shop-field-label">Ingrediente</label>
                        <div className="nv-searchbar" style={{ position: 'relative' }}>
                            <MagnifyingGlass size={18} className="nv-search-ic" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9b8d7c' }} />
                            <input
                                type="text"
                                className="nv-field"
                                placeholder="Buscar ingrediente..."
                                value={searchText}
                                onChange={(e) => { setSearchText(e.target.value); setSelectedIngredient(null); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                                style={{ width: '100%', paddingLeft: 40, ...(selectedIngredient ? { borderColor: '#22C55E', background: '#F0FFF4' } : {}) }}
                            />
                        </div>
                        {selectedIngredient && (
                            <span style={{ position: 'absolute', right: 12, top: 12, fontSize: '0.8rem', color: '#22C55E', fontWeight: 700 }}>✓ {selectedIngredient.unit}</span>
                        )}

                        {showSuggestions && suggestions.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: 'white', border: '2px solid rgba(230,126,34,0.18)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
                                {suggestions.map(ing => (
                                    <div key={ing.ingredient_id} onMouseDown={() => handleSelectSuggestion(ing)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #FFF6EC' }}>
                                        <span style={{ fontWeight: 600 }}>{ing.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#9b8d7c' }}>{ing.unit}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showSuggestions && searchText.trim() && suggestions.length === 0 && !creatingNew && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: 'white', border: '2px dashed #FFD9A0', borderRadius: 8, padding: '12px', marginTop: 4 }}>
                                <button onMouseDown={() => { setCreatingNew(true); setNewIngredient(p => ({ ...p, name: searchText })); setShowSuggestions(false); }} style={{ background: 'none', border: 'none', color: '#FF9F43', fontWeight: 700, cursor: 'pointer' }}>
                                    + Crear "{searchText}"
                                </button>
                            </div>
                        )}

                        {creatingNew && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#FFFBF5', border: '2px dashed #FFD9A0', borderRadius: 8, padding: 12, marginTop: 4, display: 'flex', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <NvSelect value={newIngredient.unit} onChange={(v) => setNewIngredient({ ...newIngredient, unit: v })} options={UNIT_OPTIONS} />
                                </div>
                                <button onClick={handleCreateIngredient} disabled={aiLoading} style={{ background: '#FF9F43', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                                    {aiLoading ? 'IA...' : 'Crear'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ width: '92px' }}>
                        <label className="shop-field-label">Cantidad</label>
                        <input
                            type="number" min="0.1" step="any" placeholder="Ej. 500" value={quantity} onChange={e => setQuantity(e.target.value)}
                            className="nv-field"
                            style={{ width: '100%' }}
                        />
                    </div>

                    {!selectedIngredient ? (
                        <div style={{ width: '110px' }}>
                            <label className="shop-field-label">Unidad</label>
                            <NvSelect value={unit || 'unidad'} onChange={setUnit} options={UNIT_OPTIONS} />
                        </div>
                    ) : (
                        <div style={{ width: '110px' }}>
                            <label className="shop-field-label">Unidad</label>
                            <div className="nv-field" style={{ width: '100%', background: '#FFF6EC', color: '#9b8d7c', textAlign: 'center', cursor: 'default' }}>{selectedIngredient.unit}</div>
                        </div>
                    )}

                    <button onClick={handleAddManual} className="btn-primary" style={{ flexShrink: 0 }}>
                        <Plus size={18} weight="bold" /> Añadir
                    </button>
                </div>

                {/* --- LISTA POR COMPRAR --- */}
                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: '#2A2118', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Por Comprar
                    <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 }}>{toBuy.length}</span>
                </h3>
                {loading ? (
                    <p style={{ color: '#9b8d7c', marginBottom: 30 }}>Cargando...</p>
                ) : toBuy.length === 0 ? (
                    <p style={{ color: '#9b8d7c', fontSize: '0.9rem', marginBottom: 30 }}>Todo al día.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 30 }}>
                        {SHOP_SECTIONS.map((sec, si) => {
                            const its = toBuy.filter(it => catOf(it.name) === sec.key);
                            if (!its.length) return null;
                            return (
                                <div key={sec.key} className="shop-section" style={{ animationDelay: `${si * 55}ms` }}>
                                    <div className="shop-section-head">
                                        <span className="shop-section-ic" style={{ background: sec.bg, color: sec.color }}><sec.Icon size={17} weight="fill" /></span>
                                        <span className="shop-section-label">{sec.label}</span>
                                        <span className="shop-section-count">{its.length}</span>
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {its.map(item => (
                                            <li key={item.item_id} className="shop-item">
                                                <div className="shop-item-main" onClick={() => openInventoryModal(item)} title="Marcar como comprado">
                                                    <Circle className="shop-check" size={28} weight="bold" />
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <span className="shop-name">
                                                            {item.name}
                                                            {item.source === 'ai' && <span className="shop-ai-tag">✨ IA</span>}
                                                        </span>
                                                        <span className="shop-qty">{formatQty(item.quantity, item.unit)}</span>
                                                    </div>
                                                </div>
                                                <button className="shop-del" onClick={() => handleDelete(item.item_id)} title="Eliminar">
                                                    <Trash size={20} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- LISTA COMPRADOS --- */}
                {bought.length > 0 && (
                    <>
                        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#9b8d7c', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed rgba(255,159,67,0.25)', paddingTop: 24 }}>
                            Ya en el carrito (Inventario)
                            <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 }}>{bought.length}</span>
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', opacity: 0.7 }}>
                            {bought.map(item => (
                                <li key={item.item_id} className="shop-item bought">
                                    <div className="shop-item-main" onClick={() => openInventoryModal(item)}>
                                        <CheckCircle size={28} color="#10B981" weight="fill" style={{ flex: 'none' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                            <span className="shop-name">{item.name}</span>
                                            <span className="shop-qty">{formatQty(item.quantity, item.unit)}</span>
                                        </div>
                                    </div>
                                    <button className="shop-del" onClick={() => handleDelete(item.item_id)} title="Eliminar">
                                        <Trash size={20} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button onClick={handleClearChecked} style={{ width: '100%', padding: '12px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                            Limpiar Comprados
                        </button>
                    </>
                )}
            </div>

            {/* --- MODAL CONFIRMAR INVENTARIO --- */}
            {showModal && modalItem && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,159,67,0.16)' }}>
                            <h3 style={{ margin: 0, fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: '#2A2118' }}>Confirmar Ingreso</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={22} color="#9b8d7c" />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: 'linear-gradient(180deg,#FFFBF6,#FFF5EB)', padding: '16px', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(255,159,67,0.18)' }}>
                                <h2 style={{ margin: 0, fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: '#2A2118' }}>{modalItem.name}</h2>
                                <p style={{ margin: '4px 0 0', color: '#6B5E4F', fontSize: '0.9rem' }}>Se guardará en la nevera</p>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B5E4F', marginBottom: 6, display: 'block' }}>Cantidad comprada</label>
                                    <input type="number" min="0" step="any" value={modalQty} onChange={e => setModalQty(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid rgba(230,126,34,0.18)', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ width: 80 }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B5E4F', marginBottom: 6, display: 'block' }}>Unidad</label>
                                    <input type="text" value={modalItem.unit} disabled style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid rgba(230,126,34,0.18)', background: '#FFF9F2', color: '#9b8d7c', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B5E4F', marginBottom: 6, display: 'block' }}>Fecha de vencimiento (Opcional)</label>
                                <NvDatePicker value={modalExpDate} onChange={v => setModalExpDate(v)} placeholder="Elige la fecha" />
                            </div>

                            <button onClick={confirmInventoryAdd} disabled={modalSaving} style={{ background: '#10B981', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: '1rem', marginTop: 10, cursor: modalSaving ? 'not-allowed' : 'pointer' }}>
                                {modalSaving ? 'Guardando...' : 'Marcar Comprado y Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}} />
        </div>
    );
};

export default ShoppingList;