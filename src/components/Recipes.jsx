import React, { useState } from 'react';
import { Plus, Clock, Fire, CalendarPlus, X, Check, ChefHat } from '@phosphor-icons/react';

const Recipes = ({ onAddToPlanner }) => {
    // Datos iniciales con la nueva propiedad "tags"
    const initialRecipes = [
        { id: 1, name: "Pasta Carbonara", time: "25 min", cal: "550 kcal", img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500", tags: ['Almuerzo', 'Cena'] },
        { id: 2, name: "Ensalada César", time: "15 min", cal: "320 kcal", img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500", tags: ['Almuerzo'] },
        { id: 3, name: "Pancakes de Avena", time: "20 min", cal: "280 kcal", img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=500", tags: ['Desayuno'] },
    ];

    const [recipes, setRecipes] = useState(initialRecipes);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // --- ESTADOS PARA AGENDAR RECETA (MODAL PEQUEÑO) ---
    const [scheduleModal, setScheduleModal] = useState({ show: false, recipe: null });
    const [targetDay, setTargetDay] = useState(0); // 0 = Lunes
    const [targetMeal, setTargetMeal] = useState('Almuerzo');

    // --- ESTADOS PARA NUEVA RECETA ---
    const [newRecipe, setNewRecipe] = useState({ name: '', time: '', cal: '', img: '', tags: [] });

    // Lógica para crear receta
    const handleCreate = () => {
        if (newRecipe.name && newRecipe.time) {
            setRecipes([...recipes, { ...newRecipe, id: Date.now(), img: newRecipe.img || "https://images.unsplash.com/photo-1495521821378-860fd6e551f1?w=500" }]);
            setShowCreateModal(false);
            setNewRecipe({ name: '', time: '', cal: '', img: '', tags: [] });
        }
    };

    const toggleNewRecipeTag = (tag) => {
        if (newRecipe.tags.includes(tag)) {
            setNewRecipe({ ...newRecipe, tags: newRecipe.tags.filter(t => t !== tag) });
        } else {
            setNewRecipe({ ...newRecipe, tags: [...newRecipe.tags, tag] });
        }
    };

    // Lógica para enviar al planificador
    const confirmSchedule = () => {
        if (onAddToPlanner && scheduleModal.recipe) {
            onAddToPlanner(targetDay, targetMeal, scheduleModal.recipe);
            setScheduleModal({ show: false, recipe: null });
            // Feedback visual simple (alert o toast)
            alert(`✅ ${scheduleModal.recipe.name} agregada al ${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][targetDay]} para el/la ${targetMeal}`);
        }
    };

    // Función auxiliar para colores de etiquetas
    const getTagColor = (tag) => {
        switch(tag) {
            case 'Desayuno': return { bg: '#FFF9C4', color: '#FBC02D' }; // Amarillo
            case 'Almuerzo': return { bg: '#FFE0B2', color: '#F57C00' }; // Naranja
            case 'Cena': return { bg: '#E1F5FE', color: '#0288D1' };     // Azul
            default: return { bg: '#eee', color: '#666' };
        }
    };

    return (
        <div className="main-content">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1>Recetario Familiar</h1>
                    <p>Colección de favoritos</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} weight="bold" /> Nueva Receta
                </button>
            </header>

            <div className="recipes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {recipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative', transition: 'transform 0.2s' }}>
                        
                        {/* IMAGEN */}
                        <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                            <img src={recipe.img} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {/* Botón flotante para agendar */}
                            <button 
                                onClick={() => setScheduleModal({ show: true, recipe: recipe })}
                                style={{
                                    position: 'absolute', bottom: 10, right: 10,
                                    background: 'white', border: 'none', borderRadius: '50%',
                                    width: 40, height: 40, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)', color: 'var(--color-primary)'
                                }}
                                title="Agregar al Calendario"
                            >
                                <CalendarPlus size={20} weight="bold" />
                            </button>
                        </div>

                        {/* CONTENIDO */}
                        <div style={{ padding: '15px' }}>
                            <div style={{display:'flex', gap:'5px', marginBottom:'8px', flexWrap:'wrap'}}>
                                {recipe.tags?.map(tag => {
                                    const style = getTagColor(tag);
                                    return (
                                        <span key={tag} style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', background: style.bg, color: style.color, fontWeight: 'bold' }}>
                                            {tag}
                                        </span>
                                    );
                                })}
                            </div>

                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{recipe.name}</h3>
                            
                            <div style={{ display: 'flex', gap: '15px', color: '#666', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Clock size={16} /> {recipe.time}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Fire size={16} /> {recipe.cal}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL CREAR NUEVA RECETA --- */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:'500px'}}>
                        <div className="modal-header"><h2>🍳 Nueva Receta</h2></div>
                        
                        <div className="form-group">
                            <label>Nombre del plato</label>
                            <input className="form-input" value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})} placeholder="Ej. Lasaña de Berenjena" />
                        </div>

                        <div style={{display:'flex', gap:'10px'}}>
                            <div className="form-group" style={{flex:1}}>
                                <label>Tiempo</label>
                                <input className="form-input" value={newRecipe.time} onChange={e => setNewRecipe({...newRecipe, time: e.target.value})} placeholder="Ej. 40 min" />
                            </div>
                            <div className="form-group" style={{flex:1}}>
                                <label>Calorías</label>
                                <input className="form-input" value={newRecipe.cal} onChange={e => setNewRecipe({...newRecipe, cal: e.target.value})} placeholder="Ej. 400 kcal" />
                            </div>
                        </div>

                        {/* SELECCIÓN DE TAGS (Momentos) */}
                        <div className="form-group">
                            <label>¿Ideal para...?</label>
                            <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                                {['Desayuno', 'Almuerzo', 'Cena'].map(tag => (
                                    <div 
                                        key={tag}
                                        onClick={() => toggleNewRecipeTag(tag)}
                                        style={{
                                            padding:'8px 15px', borderRadius:'20px', cursor:'pointer', border:'1px solid #ddd',
                                            background: newRecipe.tags.includes(tag) ? 'var(--color-primary)' : 'white',
                                            color: newRecipe.tags.includes(tag) ? 'white' : '#666',
                                            fontSize: '0.9rem', transition:'all 0.2s'
                                        }}
                                    >
                                        {tag}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>URL Imagen (Opcional)</label>
                            <input className="form-input" value={newRecipe.img} onChange={e => setNewRecipe({...newRecipe, img: e.target.value})} placeholder="https://..." />
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleCreate}>Guardar Receta</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL AGENDAR (SCHEDULING) --- */}
            {scheduleModal.show && (
                <div className="modal-overlay" onClick={() => setScheduleModal({ show: false, recipe: null })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth:'400px'}}>
                        <div className="modal-header">
                            <h2>📅 Agendar Comida</h2>
                            <p>Agregando: <strong>{scheduleModal.recipe.name}</strong></p>
                        </div>

                        <div className="form-group">
                            <label>Día de la semana:</label>
                            <select className="form-input" value={targetDay} onChange={e => setTargetDay(e.target.value)}>
                                {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((day, index) => (
                                    <option key={index} value={index}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Horario:</label>
                            <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                                {['Desayuno', 'Almuerzo', 'Cena'].map(meal => (
                                    <div 
                                        key={meal}
                                        onClick={() => setTargetMeal(meal)}
                                        style={{
                                            flex:1, textAlign:'center', padding:'10px', borderRadius:'8px', cursor:'pointer',
                                            border: targetMeal === meal ? '2px solid var(--color-primary)' : '1px solid #ddd',
                                            background: targetMeal === meal ? '#FFF3E0' : 'white',
                                            color: targetMeal === meal ? 'var(--color-primary)' : '#666',
                                            fontWeight: targetMeal === meal ? 'bold' : 'normal'
                                        }}
                                    >
                                        {meal}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setScheduleModal({ show: false, recipe: null })}>Cancelar</button>
                            <button className="btn-primary" onClick={confirmSchedule}>
                                <Check size={20} weight="bold" /> Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recipes;