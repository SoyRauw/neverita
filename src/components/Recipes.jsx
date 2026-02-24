import React, { useState, useEffect } from 'react';
import {
    Plus, Fire, Clock, X, MagnifyingGlass,
    ChefHat, ListNumbers, Check, ArrowRight, Trash
} from '@phosphor-icons/react';
import { recipesService } from '../api';

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
// La BD no tiene columna 'category', así que usamos 'Almuerzo' por defecto
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
});

const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const Recipes = ({ onAddToPlanner, currentFamily, userProfile }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [viewRecipe, setViewRecipe] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [planRecipe, setPlanRecipe] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);

    const [newRecipe, setNewRecipe] = useState({
        name: "", cal: "", time: "", category: [],
        img: "", imgType: "url", ingredients: "", steps: "",
        description: ""
    });
    const [saving, setSaving] = useState(false);

    // ---------- Cargar recetas ----------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await recipesService.getAll();
                setRecipes(data.map(mapRecipe));
            } catch (err) {
                setError('No se pudo cargar las recetas. ¿Está el backend corriendo?');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ---------- Eliminar ----------
    const handleDelete = async (recipeId, e) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar esta receta?')) return;
        try {
            await recipesService.delete(recipeId);
            setRecipes(prev => prev.filter(r => r.id !== recipeId));
            if (viewRecipe?.id === recipeId) setViewRecipe(null);
        } catch (err) {
            alert('Error al eliminar la receta.');
            console.error(err);
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

    const handleConfirmPlan = () => {
        if (selectedSlots.length === 0) return alert("Selecciona al menos un espacio.");
        selectedSlots.forEach(slot => {
            const [dayIndexStr, meal] = slot.split('-');
            onAddToPlanner(planRecipe, parseInt(dayIndexStr, 10), meal);
        });
        setPlanRecipe(null);
        setViewRecipe(null);
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
                            style={{ paddingLeft: 40, width: 250 }}
                            placeholder="Buscar plato..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={20} weight="bold" /> Nueva Receta
                    </button>
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

                                <button
                                    onClick={(e) => handleDelete(recipe.id, e)}
                                    style={{
                                        position: 'absolute', top: 8, right: 8,
                                        background: 'rgba(255,255,255,0.9)', border: 'none',
                                        borderRadius: '50%', width: 32, height: 32,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#e74c3c',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                    }}
                                    title="Eliminar receta"
                                >
                                    <Trash size={16} />
                                </button>

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

            {/* MODAL 1: DETALLE */}
            {viewRecipe && (
                <div className="modal-overlay" onClick={() => setViewRecipe(null)}>
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
                            </div>
                            {viewRecipe.description && (
                                <p style={{ color: '#555', marginBottom: 20, fontStyle: 'italic' }}>{viewRecipe.description}</p>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
                                                    <span style={{ fontWeight: '800', color: '#F7B27B', marginRight: 5 }}>{i + 1}.</span> {step}
                                                </li>
                                            ))
                                            : <li style={{ color: '#aaa' }}>Sin instrucciones registradas</li>}
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setViewRecipe(null)}>Cerrar</button>
                            <button className="btn-primary" onClick={() => { setPlanRecipe(viewRecipe); setSelectedSlots([]); }}>
                                Planificar <ArrowRight weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 15, marginBottom: 20 }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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

            {/* MODAL 3: PLANIFICAR */}
            {planRecipe && (
                <div className="modal-overlay" onClick={() => setPlanRecipe(null)}>
                    <div className="modal-modern" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                <img src={planRecipe.img} alt={planRecipe.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#2d3436' }}>Planificar Plato</h3>
                                    <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Toca donde quieres comer <span style={{ color: '#F7B27B', fontWeight: 600 }}>{planRecipe.name}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setPlanRecipe(null)} className="btn-secondary" style={{ padding: 8, border: 'none', alignSelf: 'flex-start' }}><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 8, minWidth: '450px' }}>
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
        </div>
    );
};

export default Recipes;