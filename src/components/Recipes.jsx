import React, { useState, useEffect } from 'react';
import {
    Plus, Fire, Clock, X, MagnifyingGlass,
    ChefHat, ListNumbers, Check, ArrowRight, Trash, LockSimple, UsersThree
} from '@phosphor-icons/react';
import { recipesService, familyRecipesService, inventoryService } from '../api';

// Permisos por rol
// creador: todo
// chef: todo menos gestionar miembros
// ayudante: solo ver + agregar/quitar ingredientes
const canDo = (role, action) => {
    if (role === 'creador' || role === 'chef') return true;
    // ayudante: no puede crear/editar/planificar recetas
    return false;
};

// --- COLORES SEGÚN COMIDA ---
const getMealColor = (type) => {
    switch (type) {
        case 'Desayuno': return '#f6b93b';
        case 'Almuerzo': return '#e55039';
        case 'Cena': return '#4a69bd';
        default: return '#95a5a6';
    }
};

// Mapea una receta del backend al formato del frontend
const mapRecipe = (r) => ({
    id: r.recipe_id,
    recipe_id: r.recipe_id,
    name: r.title,
    cal: r.calories_per_serving,
    time: r.preparation_time ? `${r.preparation_time} min` : 'N/A',
    category: ['Almuerzo'],
    img: r.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400',
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    steps: r.instructions ? r.instructions.split('\n').filter(Boolean) : [],
    description: r.description || '',
    servings: r.servings || 2,
});

const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const Recipes = ({ onAddToPlanner, currentFamily, userProfile, userRole }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [viewRecipe, setViewRecipe] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingExisting, setIsAddingExisting] = useState(false);
    const [availableRecipes, setAvailableRecipes] = useState([]);
    const [planRecipe, setPlanRecipe] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [missingIngredients, setMissingIngredients] = useState(null);
    const [isCheckingIngredients, setIsCheckingIngredients] = useState(false);
    // Paso intermedio: elegir cuántas personas comerán
    const [showServingsStep, setShowServingsStep] = useState(false);
    const [pendingRecipe, setPendingRecipe] = useState(null); // receta que espera confirmación
    const [planServings, setPlanServings] = useState(2);     // personas elegidas
    const [planBaseServings, setPlanBaseServings] = useState(2); // servings base de la receta

    const [newRecipe, setNewRecipe] = useState({
        name: "", cal: "", time: "", category: [],
        img: "", imgType: "url", ingredients: "", steps: "",
        description: ""
    });
    const [saving, setSaving] = useState(false);

    // ---------- Cargar recetas ----------
    useEffect(() => {
        const load = async () => {
            const fid = currentFamily?.family_id || currentFamily?.id;
            if (!fid) return;
            
            setLoading(true);
            setError(null);
            try {
                const data = await familyRecipesService.getByFamily(fid);
                setRecipes(data.map(mapRecipe));
            } catch (err) {
                setError('No se pudo cargar las recetas. ¿Está el backend corriendo?');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentFamily]);

    // ---------- Eliminar ----------
    const handleDelete = async (recipeId, e) => {
        e.stopPropagation();
        if (!window.confirm('¿Remover esta receta de tu familia? (No se borrará del sistema)')) return;
        try {
            const fid = currentFamily?.family_id || currentFamily?.id;
            await familyRecipesService.remove(fid, recipeId);
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
            if (viewRecipe?.id === recipeId) setViewRecipe(null);
        } catch (err) {
            alert('Error al remover la receta.');
            console.error(err);
        }
    };
    
    // ---------- Importar Existente ----------
    const handleOpenAddExisting = async () => {
        const fid = currentFamily?.family_id || currentFamily?.id;
        if (!fid) return;
        setIsAddingExisting(true);
        try {
            const data = await familyRecipesService.getAvailable(fid);
            setAvailableRecipes(data.map(mapRecipe));
        } catch (error) {
            console.error('Error al obtener recetas disponibles:', error);
        }
    };

    const handleAddExistingRecipe = async (recipeId) => {
        const fid = currentFamily?.family_id || currentFamily?.id;
        if (!fid) return;
        try {
            await familyRecipesService.add(fid, recipeId);
            const addedRecipe = availableRecipes.find(r => r.id === recipeId);
            if (addedRecipe) {
                setRecipes(prev => [...prev, addedRecipe]);
                setAvailableRecipes(prev => prev.filter(r => r.id !== recipeId));
            }
        } catch (error) {
            console.error('Error al vincular receta:', error);
            alert('Error al agregar receta a la familia');
        }
    };

    // ---------- Crear ----------
    const toggleNewRecipeCategory = (type) => {
        const currentCats = newRecipe.category;
        setNewRecipe({
            ...newRecipe,
            category: currentCats.includes(type)
                ? currentCats.filter(c => c !== type)
                : [...currentCats, type]
        });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) setNewRecipe({ ...newRecipe, img: URL.createObjectURL(file) });
    };

    const handleCreateRecipe = async () => {
        if (!newRecipe.name || !newRecipe.cal) {
            alert("Por favor completa el nombre y las calorías.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                title: newRecipe.name,
                description: newRecipe.description || '',
                instructions: newRecipe.steps || '',
                difficulty: 'regular',
                preparation_time: parseInt(newRecipe.time) || 0,
                servings: 2,
                image_url: newRecipe.img || '',
                calories_per_serving: parseInt(newRecipe.cal) || null,
                created_by: userProfile?.user_id || null,
                family_id: currentFamily?.family_id || currentFamily?.id || null,
            };
            const created = await recipesService.create(payload);
            // Usar las categorías del formulario solo en el estado local del frontend
            const localRecipe = {
                ...mapRecipe(created),
                category: newRecipe.category.length > 0 ? newRecipe.category : ['Otro'],
                steps: newRecipe.steps ? newRecipe.steps.split('\n').filter(Boolean) : [],
                ingredients: newRecipe.ingredients ? newRecipe.ingredients.split('\n').filter(Boolean) : [],
            };
            setRecipes(prev => [...prev, localRecipe]);
            setIsAdding(false);
            setNewRecipe({ name: "", cal: "", time: "", category: [], img: "", imgType: "url", ingredients: "", steps: "", description: "" });
        } catch (err) {
            alert('Error al guardar la receta.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // ---------- Planificador ----------
    const toggleSlot = (dayIndex, meal) => {
        const slotKey = `${dayIndex}-${meal}`;
        setSelectedSlots(prev =>
            prev.includes(slotKey) ? prev.filter(k => k !== slotKey) : [...prev, slotKey]
        );
    };

    // Calcula ingredientes escalados al número de personas
    const getScaledIngredients = (recipe, persons) => {
        const base = recipe.servings || 2;
        const factor = persons / base;
        if (factor === 1 || !recipe.ingredients || recipe.ingredients.length === 0) return recipe.ingredients || [];
        return recipe.ingredients.map(ing => {
            // Formato: "Nombre (cantidad unidad)" o solo "Nombre"
            const match = ing.match(/^(.+?)\s*\(([\d.]+)\s*(.+?)\)$/);
            if (!match) return ing;
            const name = match[1].trim();
            const qty = parseFloat(match[2]);
            const unit = match[3].trim();
            const scaled = Math.round(qty * factor * 100) / 100;
            return `${name} (${scaled} ${unit})`;
        });
    };

    const handleConfirmPlan = async () => {
        if (selectedSlots.length === 0) return alert("Selecciona al menos un espacio.");
        const multiplier = planBaseServings > 0 ? planServings / planBaseServings : 1;
        selectedSlots.forEach(slot => {
            const [dayIndexStr, meal] = slot.split('-');
            onAddToPlanner(planRecipe, parseInt(dayIndexStr, 10), meal, multiplier);
        });
        // Descontar inventario escalado por personas
        const fid = currentFamily?.family_id || currentFamily?.id;
        if (planRecipe?.recipe_id && fid && multiplier !== 1) {
            try {
                await inventoryService.deduct(planRecipe.recipe_id, fid, multiplier);
            } catch (err) {
                console.error('Error al descontar inventario escalado:', err);
            }
        }
        setPlanRecipe(null);
        setShowServingsStep(false);
        setViewRecipe(null);
    };

    const handlePlanClick = async (recipe) => {
        setIsCheckingIngredients(true);
        try {
            const fid = currentFamily?.family_id || currentFamily?.id;
            const ingCheck = await recipesService.validateIngredients({
                recipe_id: recipe.recipe_id || recipe.id,
                family_id: fid,
            });

            if (!ingCheck.valid) {
                setMissingIngredients(ingCheck.missingIngredients);
            } else {
                // Mostrar el paso intermedio de personas
                setPendingRecipe(recipe);
                setPlanServings(recipe.servings || 2);
                setPlanBaseServings(recipe.servings || 2);
                setShowServingsStep(true);
            }
        } catch (err) {
            console.error("Error al validar ingredientes:", err);
            setPendingRecipe(recipe);
            setPlanServings(recipe.servings || 2);
            setPlanBaseServings(recipe.servings || 2);
            setShowServingsStep(true);
        } finally {
            setIsCheckingIngredients(false);
        }
    };

    const handleConfirmServings = () => {
        setPlanRecipe(pendingRecipe);
        setSelectedSlots([]);
        setShowServingsStep(false);
        setPendingRecipe(null);
    };

    const filtered = recipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="main-content">
            <header>
                <div className="header-title">
                    <h1>Mis Recetas</h1>
                    <p>Explora y gestiona tu colección culinaria</p>
                </div>
                <div className="header-actions">
                    <div className="search-wrapper" style={{ position: 'relative' }}>
                        <MagnifyingGlass size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                        <input
                            className="form-input"
                            style={{ paddingLeft: 40, width: '100%', maxWidth: 250 }}
                            placeholder="Buscar plato..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div className="btn-locked-wrapper" data-tooltip={!canDo(userRole) ? '🔒 Sin permiso' : undefined}>
                            <button className={`btn-secondary${!canDo(userRole) ? ' btn-locked' : ''}`} style={{ flex: 1, minWidth: '140px' }} onClick={canDo(userRole) ? handleOpenAddExisting : undefined}>
                                Importar Existente
                            </button>
                        </div>
                        <div className="btn-locked-wrapper" data-tooltip={!canDo(userRole) ? '🔒 Sin permiso' : undefined}>
                            <button className={`btn-primary${!canDo(userRole) ? ' btn-locked' : ''}`} style={{ flex: 1, minWidth: '140px' }} onClick={canDo(userRole) ? () => setIsAdding(true) : undefined}>
                                <Plus size={20} weight="bold" /> Nueva Receta
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {loading && <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>Cargando recetas...</p>}
            {error && <p style={{ color: '#e74c3c', textAlign: 'center', padding: '3rem' }}>{error}</p>}

            {!loading && !error && (
                <div className="recipes-grid">
                    {filtered.length === 0 ? (
                        <p style={{ color: '#999', padding: '2rem' }}>No hay recetas. ¡Crea la primera!</p>
                    ) : (
                        filtered.map(recipe => (
                            <div key={recipe.id} className="recipe-card" onClick={() => setViewRecipe(recipe)} style={{ position: 'relative' }}>
                                <img src={recipe.img} alt={recipe.name} className="recipe-img" />

                                <div className="btn-locked-wrapper" style={{ position: 'absolute', top: 8, right: 8 }} data-tooltip={!canDo(userRole) ? '🔒 Sin permiso' : undefined}>
                                    <button
                                        onClick={canDo(userRole) ? (e) => handleDelete(recipe.id, e) : undefined}
                                        className={!canDo(userRole) ? 'btn-locked' : ''}
                                        style={{
                                            background: 'rgba(255,255,255,0.9)', border: 'none',
                                            borderRadius: '50%', width: 32, height: 32,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: canDo(userRole) ? 'pointer' : 'not-allowed', color: '#e74c3c',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                        }}
                                        title={canDo(userRole) ? 'Eliminar receta' : '🔒 Sin permiso'}
                                    >
                                        {canDo(userRole) ? <Trash size={16} /> : <LockSimple size={16} />}
                                    </button>
                                </div>

                                <div className="recipe-content">
                                    <div className="recipe-badges">
                                        {recipe.category.map(cat => (
                                            <span key={cat} className="mini-badge" style={{ background: getMealColor(cat) }}>{cat}</span>
                                        ))}
                                    </div>
                                    <h3 className="recipe-title">{recipe.name}</h3>
                                    <div className="recipe-stats">
                                        <div className="stat-item"><Fire weight="fill" color="#F7B27B" /> {recipe.cal || '—'} kcal</div>
                                        <div className="stat-item"><Clock weight="fill" color="#F7B27B" /> {recipe.time}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODAL MUEVE ABAJO PARA PERMITIR Z-INDEX CORRECTO SOBRE EL PREVIO */}

            {/* MODAL 2: CREAR */}
            {isAdding && (
                <div className="modal-overlay" onClick={() => setIsAdding(false)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>Nueva Receta</h3>
                                <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>Comparte tu talento culinario</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="btn-secondary" style={{ padding: 8, border: 'none' }}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="create-recipe-top-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 15, marginBottom: 20 }}>
                                <div>
                                    <label className="ia-label">Nombre del plato</label>
                                    <input className="form-input" placeholder="Ej. Lasaña" value={newRecipe.name} onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="ia-label">Calorías</label>
                                    <input type="number" className="form-input" placeholder="400" value={newRecipe.cal} onChange={e => setNewRecipe({ ...newRecipe, cal: e.target.value })} />
                                </div>
                                <div>
                                    <label className="ia-label">Tiempo (min)</label>
                                    <input className="form-input" placeholder="30" value={newRecipe.time} onChange={e => setNewRecipe({ ...newRecipe, time: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label className="ia-label">Descripción (opcional)</label>
                                <input className="form-input" placeholder="Breve descripción..." value={newRecipe.description} onChange={e => setNewRecipe({ ...newRecipe, description: e.target.value })} />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label className="ia-label">Categoría (visual, no se guarda en BD aún)</label>
                                <div className="chips-wrap">
                                    {mealTypes.map(type => (
                                        <div key={type} className={`chip ${newRecipe.category.includes(type) ? 'active' : ''}`} onClick={() => toggleNewRecipeCategory(type)}>
                                            {type} {newRecipe.category.includes(type) && <Check weight="bold" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label className="ia-label">Imagen</label>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                    <button className={`btn-secondary ${newRecipe.imgType === 'url' ? 'active' : ''}`} style={{ flex: 1, borderColor: newRecipe.imgType === 'url' ? '#F7B27B' : '#ddd' }} onClick={() => setNewRecipe({ ...newRecipe, imgType: 'url' })}>Enlace URL</button>
                                    <button className={`btn-secondary ${newRecipe.imgType === 'upload' ? 'active' : ''}`} style={{ flex: 1, borderColor: newRecipe.imgType === 'upload' ? '#F7B27B' : '#ddd' }} onClick={() => setNewRecipe({ ...newRecipe, imgType: 'upload' })}>Subir Archivo</button>
                                </div>
                                {newRecipe.imgType === 'url' ? (
                                    <input className="form-input" placeholder="https://..." value={newRecipe.img} onChange={e => setNewRecipe({ ...newRecipe, img: e.target.value })} />
                                ) : (
                                    <input type="file" className="form-input" accept="image/*" onChange={handleFileUpload} />
                                )}
                            </div>

                            <div className="create-recipe-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label className="ia-label">Ingredientes (Uno por línea)</label>
                                    <textarea className="form-textarea" rows="4" placeholder="Tomate&#10;Cebolla..." value={newRecipe.ingredients} onChange={e => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}></textarea>
                                </div>
                                <div>
                                    <label className="ia-label">Pasos (Uno por línea)</label>
                                    <textarea className="form-textarea" rows="4" placeholder="Paso 1...&#10;Paso 2..." value={newRecipe.steps} onChange={e => setNewRecipe({ ...newRecipe, steps: e.target.value })}></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleCreateRecipe} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Receta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MINI-MODAL: ¿PARA CUÁNTAS PERSONAS? (paso previo al planificador) */}
            {showServingsStep && pendingRecipe && (
                <div className="modal-overlay" style={{ zIndex: 7500 }} onClick={() => { setShowServingsStep(false); setPendingRecipe(null); }}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center', padding: '30px 24px' }}>
                        <div style={{ width: 60, height: 60, background: '#FFF7ED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                            <UsersThree size={30} weight="fill" color="#FF9F43" />
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800, color: '#1F2937' }}>¿Para cuántas personas?</h3>
                        <p style={{ margin: '0 0 24px', color: '#6B7280', fontSize: '0.9rem' }}>Los ingredientes se escalarán automáticamente.</p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                            <button
                                onClick={() => setPlanServings(p => Math.max(1, p - 1))}
                                style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.borderColor = '#FF9F43'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                            >&minus;</button>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: 900, color: '#1F2937', lineHeight: 1 }}>{planServings}</span>
                                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{planServings === 1 ? 'persona' : 'personas'}</span>
                            </div>
                            <button
                                onClick={() => setPlanServings(p => Math.min(20, p + 1))}
                                style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.borderColor = '#FF9F43'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                            >+</button>
                        </div>

                        {/* Preview de ingredientes escalados */}
                        {pendingRecipe.ingredients && pendingRecipe.ingredients.length > 0 && (
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', marginBottom: 20, textAlign: 'left', maxHeight: 130, overflowY: 'auto' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingredientes escalados</p>
                                {getScaledIngredients(pendingRecipe, planServings).map((ing, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', color: '#374151', padding: '2px 0', borderBottom: i < pendingRecipe.ingredients.length - 1 ? '1px dashed #E5E7EB' : 'none' }}>
                                        🥄 {ing}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowServingsStep(false); setPendingRecipe(null); }}>Cancelar</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirmServings}>
                                Continuar <ArrowRight weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: PLANIFICAR */}
            {planRecipe && (
                <div className="modal-overlay" style={{ zIndex: 6500 }} onClick={() => setPlanRecipe(null)}>
                    <div className="modal-modern" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                <img src={planRecipe.img} alt={planRecipe.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#2d3436' }}>Planificar Plato</h3>
                                    <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Toca donde quieres comer <span style={{ color: '#F7B27B', fontWeight: 600 }}>{planRecipe.name}</span></p>
                                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>
                                        <UsersThree size={13} weight="fill" style={{ verticalAlign: 'middle', marginRight: 3 }} />
                                        Para {planServings} {planServings === 1 ? 'persona' : 'personas'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setPlanRecipe(null)} className="btn-secondary" style={{ padding: 8, border: 'none', alignSelf: 'flex-start' }}><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                            <div className="plan-mini-grid" style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 8, minWidth: '450px' }}>
                                <div></div>
                                {weekDays.map(d => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#a0aec0', textTransform: 'uppercase' }}>
                                        {d.substring(0, 3)}
                                    </div>
                                ))}
                                {mealTypes.map(meal => (
                                    <React.Fragment key={meal}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', paddingRight: 8 }}>
                                            {meal}
                                        </div>
                                        {weekDays.map((_, dayIndex) => {
                                            const slotKey = `${dayIndex}-${meal}`;
                                            const isSelected = selectedSlots.includes(slotKey);
                                            return (
                                                <div key={slotKey} onClick={() => toggleSlot(dayIndex, meal)} style={{
                                                    aspectRatio: '1', borderRadius: '8px',
                                                    border: isSelected ? '2px solid #F7B27B' : '2px dashed #cbd5e1',
                                                    backgroundColor: isSelected ? '#fffaf5' : '#f8fafc',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s ease', transform: isSelected ? 'scale(0.95)' : 'scale(1)'
                                                }}>
                                                    {isSelected ? <Check weight="bold" color="#F7B27B" size={20} /> : <Plus weight="bold" color="#cbd5e1" size={16} />}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: 20, marginTop: 10 }}>
                            <button className="btn-secondary" onClick={() => setPlanRecipe(null)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleConfirmPlan} style={{ opacity: selectedSlots.length === 0 ? 0.5 : 1, cursor: selectedSlots.length === 0 ? 'not-allowed' : 'pointer' }} disabled={selectedSlots.length === 0}>
                                Confirmar <Check weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL 4: AGREGAR EXISTENTE */}
            {isAddingExisting && (
                <div className="modal-overlay" onClick={() => setIsAddingExisting(false)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>Importar Receta</h3>
                                <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>Agrega recetas del sistema a tu familia</p>
                            </div>
                            <button onClick={() => setIsAddingExisting(false)} className="btn-secondary" style={{ padding: 8, border: 'none' }}><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {availableRecipes.length === 0 ? (
                                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No hay recetas adicionales disponibles en el sistema.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {availableRecipes.map(recipe => (
                                        <div key={recipe.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, border: '1px solid #eee', borderRadius: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <img src={recipe.img} alt={recipe.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                <div>
                                                    <span style={{ fontWeight: 600, display: 'block' }}>{recipe.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#888' }}><Fire size={12} style={{verticalAlign: 'middle'}}/> {recipe.cal || '—'} kcal | <Clock size={12} style={{verticalAlign: 'middle'}}/> {recipe.time}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button className="btn-secondary" style={{ padding: '5px 15px', fontSize: '0.85rem' }} onClick={() => setViewRecipe(recipe)}>
                                                    Ver
                                                </button>
                                                <button className="btn-primary" style={{ padding: '5px 15px', fontSize: '0.85rem' }} onClick={() => handleAddExistingRecipe(recipe.id)}>
                                                    Añadir
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: DETALLE (MOVIDO AL FINAL PARA QUE APAREZCA POR ENCIMA CUANDO ESTÁ IMPORTANDO) */}
            {viewRecipe && (
                <div className="modal-overlay" style={{ zIndex: 6000 }} onClick={() => setViewRecipe(null)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#2d3436' }}>{viewRecipe.name}</h3>
                            <button onClick={() => setViewRecipe(null)} className="btn-secondary" style={{ padding: 8, border: 'none' }}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="recipe-hero-wrapper">
                                <img src={viewRecipe.img} className="recipe-hero-img" alt={viewRecipe.name} />
                                <div className="hero-badges-overlay">
                                    {viewRecipe.category.map(cat => (
                                        <span key={cat} className="mini-badge" style={{ background: 'rgba(255,255,255,0.95)', color: getMealColor(cat), boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{cat}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginBottom: 30, padding: '10px 0', borderBottom: '1px dashed #eee' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: '#555', fontWeight: 700 }}>
                                    <Fire weight="fill" color="#F7B27B" size={22} /> {viewRecipe.cal || '—'} kcal
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: '#555', fontWeight: 700 }}>
                                    <Clock weight="fill" color="#F7B27B" size={22} /> {viewRecipe.time}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: '#555', fontWeight: 700 }}>
                                    <UsersThree weight="fill" color="#F7B27B" size={22} /> {viewRecipe.servings || 2} personas
                                </span>
                            </div>
                            {viewRecipe.description && (
                                <p style={{ color: '#555', marginBottom: 20, fontStyle: 'italic' }}>{viewRecipe.description}</p>
                            )}
                            <div className="detail-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div className="detail-card-section">
                                    <h4><ChefHat size={24} weight="duotone" /> Ingredientes</h4>
                                    <ul className="detail-list">
                                        {viewRecipe.ingredients && viewRecipe.ingredients.length > 0
                                            ? viewRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                                            : <li style={{ color: '#aaa' }}>Sin ingredientes registrados</li>}
                                    </ul>
                                </div>
                                <div className="detail-card-section">
                                    <h4><ListNumbers size={24} weight="duotone" /> Pasos</h4>
                                    <ol className="detail-list" style={{ listStyle: 'none', padding: 0 }}>
                                        {viewRecipe.steps && viewRecipe.steps.length > 0
                                            ? viewRecipe.steps.map((step, i) => (
                                                <li key={i} style={{ marginBottom: 15 }}>
                                                    <span style={{ fontWeight: '800', color: '#F7B27B', marginRight: 5 }}>{i + 1}.</span> {step.replace(/^\d+[\.\-]?\s*/, '')}
                                                </li>
                                            ))
                                            : <li style={{ color: '#aaa' }}>Sin instrucciones registradas</li>}
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setViewRecipe(null)}>Cerrar</button>
                            {availableRecipes.some(r => r.id === viewRecipe.id) ? (
                                <div className="btn-locked-wrapper" data-tooltip={!canDo(userRole) ? '🔒 Sin permiso' : undefined}>
                                    <button
                                        className={`btn-primary${!canDo(userRole) ? ' btn-locked' : ''}`}
                                        onClick={canDo(userRole) ? () => { handleAddExistingRecipe(viewRecipe.id); setViewRecipe(null); } : undefined}
                                    >
                                        Importar Receta <Plus weight="bold" />
                                    </button>
                                </div>
                            ) : (
                                <div className="btn-locked-wrapper" data-tooltip={!canDo(userRole) ? '🔒 Sin permiso' : undefined}>
                                    <button
                                        className={`btn-primary${!canDo(userRole) ? ' btn-locked' : ''}`}
                                        onClick={canDo(userRole) ? () => handlePlanClick(viewRecipe) : undefined}
                                        disabled={isCheckingIngredients}
                                    >
                                        {isCheckingIngredients ? "Revisando despensa..." : "Planificar"} {!isCheckingIngredients && <ArrowRight weight="bold" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FALTAN INGREDIENTES */}
            {missingIngredients && (
                <div className="modal-overlay" style={{ zIndex: 7000 }} onClick={() => setMissingIngredients(null)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center', padding: '30px 20px' }}>
                        <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#EF4444' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M236.8 188.09L149.35 36.22a24.76 24.76 0 0 0-42.7 0L19.2 188.09a23.51 23.51 0 0 0 0 23.72A24.35 24.35 0 0 0 40.55 224h174.9a24.35 24.35 0 0 0 21.35-12.19a23.51 23.51 0 0 0 0-23.72Zm-13.6 15.68A8.32 8.32 0 0 1 215.45 208H40.55a8.32 8.32 0 0 1-7.75-4.23a7.51 7.51 0 0 1 0-7.86l87.45-151.87a8.75 8.75 0 0 1 15.5 0l87.45 151.87a7.51 7.51 0 0 1 0 7.86ZM128 136a8 8 0 0 1-8-8v-32a8 8 0 0 1 16 0v32a8 8 0 0 1-8 8Zm0 48a12 12 0 1 1 12-12a12 12 0 0 1-12 12Z"/></svg>
                        </div>
                        <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', color: '#1F2937' }}>Faltan ingredientes</h3>
                        <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '0.95rem' }}>Para preparar esta receta, necesitas agregar lo siguiente a tu inventario:</p>
                        
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '15px', textAlign: 'left', marginBottom: 25, maxHeight: 150, overflowY: 'auto' }}>
                            <ul style={{ margin: 0, paddingLeft: 20, color: '#4B5563', lineHeight: 1.6 }}>
                                {missingIngredients.map((ing, i) => (
                                    <li key={i}>{ing}</li>
                                ))}
                            </ul>
                        </div>

                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMissingIngredients(null)}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recipes;