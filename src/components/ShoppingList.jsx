import React, { useState, useEffect } from 'react';
import { showToast } from '../Toast';
import { ShoppingCart, CheckCircle, Circle, Trash, MagicWand, X, Check, Snowflake } from '@phosphor-icons/react';
import { shoppingListService, aiService, ingredientsService, inventoryService, menuPlansService, dailyMealsService } from '../api';

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
        if (!newIngredient.name.trim()) return showToast('Escribe el nombre.');
        try {
            const created = await ingredientsService.create({
                name: newIngredient.name.trim(),
                unit: newIngredient.unit,
                category: newIngredient.category,
                average_expiry_days: newIngredient.average_expiry_days,
            });
            setIngredients(prev => [...prev, created]);
            handleSelectSuggestion(created);
        } catch (err) {
            showToast('Error al crear ingrediente.');
        }
    };

    // --- Add Manual Item ---
    const handleAddManual = async () => {
        if (!searchText.trim()) return;
        try {
            const payload = {
                family_id: currentFamily.family_id || currentFamily.id,
                name: selectedIngredient ? selectedIngredient.name : searchText.trim(),
                quantity: Number(quantity) || 1,
                unit: selectedIngredient ? selectedIngredient.unit : unit,
                source: 'manual'
            };
            const created = await shoppingListService.create(payload);
            setItems([created, ...items]);
            setSearchText('');
            setSelectedIngredient(null);
            setQuantity('');
            setUnit('unidad');
        } catch (error) {
            showToast("Error al agregar.");
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
            const [inv, plans] = await Promise.all([
                inventoryService.getAll(familyId),
                menuPlansService.getByFamily(familyId)
            ]);

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
                    // 'meals' es un array de { ...datos de comida, recipe_id, recipe_name, ingredients_list }
                    // ingredients_list suele venir como string JSON desde la BD en algunas rutas, o ya parseado.
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
            
            const payload = {
                family_id: familyId,
                member_count: currentFamily.members || 1,
                current_inventory: inv.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit, expiration_date: i.expiration_date })),
                weekly_plan_ingredients: weekly_plan_ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit }))
            };

            const response = await aiService.generateShoppingList(payload);
            
            if (response.items && response.items.length > 0) {
                // Add all to DB
                const newItems = [];
                for (const item of response.items) {
                    const created = await shoppingListService.create({
                        family_id: familyId,
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
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
            // Si ya estaba checked, lo destachamos sin abrir modal
            toggleCheckStatus(item.item_id, false);
            return;
        }

        // Abrir modal para confirmar ingreso a inventario
        setModalItem(item);
        setModalQty(item.quantity);
        
        // Find matching ingredient to get expiry days
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
            // 1. Buscar si el ingrediente existe
            let ingredientId = null;
            let ing = ingredients.find(i => i.name.toLowerCase() === modalItem.name.toLowerCase());
            
            if (!ing) {
                // Si la IA recomendó algo que no existe en DB, crearlo
                ing = await ingredientsService.create({
                    name: modalItem.name,
                    unit: modalItem.unit,
                    category: 'otro',
                    average_expiry_days: 7
                });
                setIngredients([...ingredients, ing]);
            }
            ingredientId = ing.ingredient_id;

            // 2. Agregar al inventario real
            await inventoryService.create({
                family_id: currentFamily.family_id || currentFamily.id,
                ingredient_id: ingredientId,
                quantity: Number(modalQty),
                expiration_date: modalExpDate || null
            });

            // 3. Marcar como checkeado en la lista de compras
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

    return (
        <div className="main-content">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div className="header-title">
                    <h1>🛒 Lista de Compras</h1>
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
                <div className="shopping-form-row" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', borderBottom: '2px solid rgba(255,159,67,0.16)', paddingBottom: '24px' }}>
                    
                    <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder="Buscar ingrediente..." 
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setSelectedIngredient(null); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            style={{ width: '100%', border: selectedIngredient ? '2px solid #22C55E' : '2px solid rgba(230,126,34,0.18)', borderRadius: '12px', padding: '11px 14px', fontSize: '1rem', outline: 'none', background: selectedIngredient ? '#F0FFF4' : 'rgba(255,250,244,0.85)', boxSizing: 'border-box', fontWeight: 600 }}
                        />
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
                                <select value={newIngredient.unit} onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})} style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid rgba(230,126,34,0.25)' }}>
                                    <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option><option value="unidad">unidad</option>
                                </select>
                                <button onClick={handleCreateIngredient} disabled={aiLoading} style={{ background: '#FF9F43', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                                    {aiLoading ? 'IA...' : 'Crear'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <input 
                        type="number" min="0.1" step="any" placeholder="Cant." value={quantity} onChange={e => setQuantity(e.target.value)}
                        style={{ width: '80px', border: '2px solid rgba(230,126,34,0.18)', borderRadius: '12px', padding: '11px', fontSize: '1rem', outline: 'none', background: 'rgba(255,250,244,0.85)', fontWeight: 600 }}
                    />
                    
                    {!selectedIngredient && (
                        <input type="text" placeholder="Unidad" value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '80px', border: '2px solid rgba(230,126,34,0.18)', borderRadius: '12px', padding: '11px', fontSize: '1rem', outline: 'none', background: 'rgba(255,250,244,0.85)', fontWeight: 600 }} />
                    )}

                    <button onClick={handleAddManual} style={{ background: 'linear-gradient(135deg, #FF9F43, #FF7F50)', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', flexShrink: 0, boxShadow: '0 8px 18px rgba(255,127,80,0.32)' }}>
                        Añadir
                    </button>
                </div>

                {/* --- LISTA POR COMPRAR --- */}
                <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.35rem', fontWeight: 600, color: '#2A2118', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Por Comprar
                    <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 }}>{toBuy.length}</span>
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0' }}>
                    {loading ? <p style={{ color: '#9b8d7c' }}>Cargando...</p> : toBuy.length === 0 ? <p style={{ color: '#9b8d7c', fontSize: '0.9rem' }}>Todo al día.</p> : toBuy.map(item => (
                        <li key={item.item_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px', borderBottom: '1px solid rgba(255,159,67,0.12)', transition: 'background 0.2s', borderRadius: 10 }} onMouseEnter={e => e.currentTarget.style.background = '#FFF6EC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', flex: 1 }} onClick={() => openInventoryModal(item)}>
                                <Circle size={28} color="#FFC48A" />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1.05rem', color: '#2A2118', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {item.name}
                                        {item.source === 'ai' && <span style={{ background: '#FFF1F2', color: '#E11D48', fontSize: '0.7rem', padding: '2px 6px', borderRadius: 12, fontWeight: 800 }}>✨ IA</span>}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#6B5E4F', fontWeight: '600' }}>{item.quantity} {item.unit}</span>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(item.item_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', opacity: 0.5, padding: 8 }}>
                                <Trash size={20} />
                            </button>
                        </li>
                    ))}
                </ul>

                {/* --- LISTA COMPRADOS --- */}
                {bought.length > 0 && (
                    <>
                        <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, color: '#9b8d7c', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed rgba(255,159,67,0.25)', paddingTop: 24 }}>
                            Ya en el carrito (Inventario)
                            <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800 }}>{bought.length}</span>
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', opacity: 0.7 }}>
                            {bought.map(item => (
                                <li key={item.item_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(255,159,67,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', flex: 1 }} onClick={() => openInventoryModal(item)}>
                                        <CheckCircle size={28} color="#10B981" weight="fill" />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '1.05rem', color: '#9b8d7c', fontWeight: 600, textDecoration: 'line-through' }}>{item.name}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#D1D5DB' }}>{item.quantity} {item.unit}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(item.item_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', opacity: 0.5 }}>
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
                            <h3 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, color: '#2A2118' }}>Confirmar Ingreso</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={22} color="#9b8d7c" />
                            </button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ background: 'linear-gradient(180deg,#FFFBF6,#FFF5EB)', padding: '16px', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(255,159,67,0.18)' }}>
                                <h2 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, color: '#2A2118' }}>{modalItem.name}</h2>
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
                                <input type="date" value={modalExpDate} onChange={e => setModalExpDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid rgba(230,126,34,0.18)', boxSizing: 'border-box' }} />
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