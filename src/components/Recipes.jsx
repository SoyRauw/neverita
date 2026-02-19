import React, { useState } from 'react';
import { 
    Plus, Fire, Clock, X, MagnifyingGlass, 
    ChefHat, ListNumbers, Check, ArrowRight
} from '@phosphor-icons/react';

// --- DATOS INICIALES ---
const initialRecipes = [
  { id: 1, name: "Tacos de Pollo", cal: 350, time: "20 min", category: ["Cena", "Almuerzo"], img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400", ingredients: ["Tortillas", "Pollo"], steps: ["Cocinar el pollo", "Calentar tortillas", "Servir con salsa"] },
  { id: 2, name: "Ensalada Caprese", cal: 280, time: "10 min", category: ["Almuerzo"], img: "https://images.unsplash.com/photo-1529312266912-b33cf6227e24?w=400", ingredients: ["Tomate", "Queso Mozzarella", "Albahaca"], steps: ["Cortar rodajas", "Alternar tomate y queso", "Aliñar"] },
  { id: 3, name: "Pancakes de Avena", cal: 320, time: "15 min", category: ["Desayuno"], img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400", ingredients: ["Avena", "Huevo", "Leche"], steps: ["Mezclar ingredientes", "Cocinar en sartén", "Servir con miel"] },
  { id: 4, name: "Sandwich Club", cal: 450, time: "10 min", category: ["Desayuno", "Cena"], img: "https://images.unsplash.com/photo-1567234669003-dce7a7a88893?w=400", ingredients: ["Pan integral", "Jamón", "Queso", "Lechuga"], steps: ["Tostar pan", "Armar capas", "Cortar en triángulos"] },
];

// --- COLORES SEGÚN COMIDA ---
const getMealColor = (type) => {
    switch(type) {
        case 'Desayuno': return '#f6b93b'; 
        case 'Almuerzo': return '#e55039'; 
        case 'Cena': return '#4a69bd';     
        default: return '#95a5a6';
    }
};

const Recipes = ({ onAddToPlanner }) => {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [searchTerm, setSearchTerm] = useState("");
  
  // MODALES
  const [viewRecipe, setViewRecipe] = useState(null); 
  const [isAdding, setIsAdding] = useState(false);    
  const [planRecipe, setPlanRecipe] = useState(null); 

  // --- ESTADO NUEVA RECETA ---
  const [newRecipe, setNewRecipe] = useState({
    name: "", cal: "", time: "", category: [], 
    img: "", imgType: "url", ingredients: "", steps: ""
  });

  // --- HANDLERS ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setNewRecipe({ ...newRecipe, img: URL.createObjectURL(file) });
  };

  const toggleNewRecipeCategory = (type) => {
    const currentCats = newRecipe.category;
    if (currentCats.includes(type)) {
        setNewRecipe({ ...newRecipe, category: currentCats.filter(c => c !== type) });
    } else {
        setNewRecipe({ ...newRecipe, category: [...currentCats, type] });
    }
  };

  const handleCreateRecipe = () => {
    if (!newRecipe.name || !newRecipe.cal || !newRecipe.time || newRecipe.category.length === 0) {
        alert("Por favor completa los campos y selecciona al menos una comida.");
        return;
    }

    const recipeToAdd = {
        id: Date.now(),
        ...newRecipe,
        ingredients: newRecipe.ingredients.split('\n'),
        steps: newRecipe.steps.split('\n')
    };

    setRecipes([...recipes, recipeToAdd]);
    setIsAdding(false);
    setNewRecipe({ name: "", cal: "", time: "", category: [], img: "", imgType: "url", ingredients: "", steps: "" });
  };

  // --- LÓGICA DEL MINI-CALENDARIO (MODAL 3) ---
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
  
  // Guardará strings con el formato "dayIndex-mealType", ej: "0-Desayuno"
  const [selectedSlots, setSelectedSlots] = useState([]);

  const toggleSlot = (dayIndex, meal) => {
      const slotKey = `${dayIndex}-${meal}`;
      if (selectedSlots.includes(slotKey)) {
          setSelectedSlots(selectedSlots.filter(key => key !== slotKey)); // Lo quita si ya estaba
      } else {
          setSelectedSlots([...selectedSlots, slotKey]); // Lo agrega si no estaba
      }
  };

  const handleConfirmPlan = () => {
    if (selectedSlots.length === 0) return alert("Selecciona al menos un espacio en el calendario.");
    
    // Iteramos sobre cada cuadrito seleccionado y lo mandamos al planificador principal
    selectedSlots.forEach(slot => {
        const [dayIndexStr, meal] = slot.split('-'); // Separa "0-Desayuno" en "0" y "Desayuno"
        onAddToPlanner(planRecipe, parseInt(dayIndexStr, 10), meal);
    });
    
    setPlanRecipe(null); 
    setViewRecipe(null);
  };

  const filtered = recipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="main-content">
      {/* HEADER */}
      <header>
        <div className="header-title">
            <h1>Mis Recetas</h1>
            <p>Explora y gestiona tu colección culinaria</p>
        </div>
        
        <div className="header-actions">
            <div className="search-wrapper" style={{position: 'relative'}}>
                <MagnifyingGlass size={18} style={{position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999'}}/>
                <input 
                    className="form-input" 
                    style={{paddingLeft: 40, width: 250}}
                    placeholder="Buscar plato..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="btn-primary" onClick={() => setIsAdding(true)}>
                <Plus size={20} weight="bold"/> Nueva Receta
            </button>
        </div>
      </header>

      {/* GRID DE RECETAS */}
      <div className="recipes-grid">
        {filtered.map(recipe => (
          <div key={recipe.id} className="recipe-card" onClick={() => setViewRecipe(recipe)}>
            <img src={recipe.img || 'https://via.placeholder.com/400x200'} alt={recipe.name} className="recipe-img" />
            
            <div className="recipe-content">
                <div className="recipe-badges">
                    {recipe.category.map(cat => (
                        <span key={cat} className="mini-badge" style={{background: getMealColor(cat)}}>
                            {cat}
                        </span>
                    ))}
                </div>
                <h3 className="recipe-title">{recipe.name}</h3>
                <div className="recipe-stats">
                    <div className="stat-item"><Fire weight="fill" color="#F7B27B"/> {recipe.cal} kcal</div>
                    <div className="stat-item"><Clock weight="fill" color="#F7B27B"/> {recipe.time}</div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: DETALLE DE RECETA --- */}
      {viewRecipe && (
        <div className="modal-overlay" onClick={() => setViewRecipe(null)}>
            <div className="modal-modern" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <h3 style={{margin:0, fontSize:'1.6rem', fontWeight:800, color: '#2d3436'}}>{viewRecipe.name}</h3>
                    <button onClick={() => setViewRecipe(null)} className="btn-secondary" style={{padding:8, border:'none'}}><X size={24}/></button>
                </div>
                
                <div className="modal-body">
                    <div className="recipe-hero-wrapper">
                        <img src={viewRecipe.img} className="recipe-hero-img" alt={viewRecipe.name}/>
                        <div className="hero-badges-overlay">
                            {viewRecipe.category.map(cat => (
                                <span key={cat} className="mini-badge" style={{background: 'rgba(255,255,255,0.95)', color: getMealColor(cat), boxShadow: '0 4px 10px rgba(0,0,0,0.2)'}}>
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    <div style={{display:'flex', justifyContent: 'center', gap:30, marginBottom:30, padding: '10px 0', borderBottom: '1px dashed #eee'}}>
                        <span style={{display:'flex', alignItems:'center', gap:8, fontSize:'1rem', color:'#555', fontWeight:700}}>
                           <Fire weight="fill" color="#F7B27B" size={22}/> {viewRecipe.cal} kcal
                        </span>
                        <span style={{display:'flex', alignItems:'center', gap:8, fontSize:'1rem', color:'#555', fontWeight:700}}>
                           <Clock weight="fill" color="#F7B27B" size={22}/> {viewRecipe.time}
                        </span>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
                        <div className="detail-card-section">
                            <h4><ChefHat size={24} weight="duotone"/> Ingredientes</h4>
                            <ul className="detail-list">
                                {viewRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                        </div>
                        
                        <div className="detail-card-section">
                            <h4><ListNumbers size={24} weight="duotone"/> Pasos</h4>
                            <ol className="detail-list" style={{listStyle:'none', padding:0}}>
                                {viewRecipe.steps.map((step, i) => (
                                    <li key={i} style={{marginBottom:15}}>
                                        <span style={{fontWeight:'800', color:'#F7B27B', marginRight:5}}>{i+1}.</span> {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setViewRecipe(null)}>Cerrar</button>
                    <button className="btn-primary" onClick={() => { 
                        setPlanRecipe(viewRecipe); 
                        setSelectedSlots([]); // Limpiamos la selección al abrir
                    }}>
                        Planificar <ArrowRight weight="bold"/>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: CREAR NUEVA RECETA --- */}
      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
            <div className="modal-modern" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3 style={{margin:0, fontWeight:800}}>Nueva Receta</h3>
                        <p style={{margin:0, color:'#999', fontSize:'0.9rem'}}>Comparte tu talento culinario</p>
                    </div>
                    <button onClick={() => setIsAdding(false)} className="btn-secondary" style={{padding:8, border:'none'}}><X size={24}/></button>
                </div>
                
                <div className="modal-body">
                    {/* ... (Todo el contenido de crear receta se mantiene igual) ... */}
                    <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 15, marginBottom: 20}}>
                        <div>
                            <label className="ia-label">Nombre del plato</label>
                            <input className="form-input" placeholder="Ej. Lasaña" value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}/>
                        </div>
                        <div>
                            <label className="ia-label">Calorías</label>
                            <input type="number" className="form-input" placeholder="400" value={newRecipe.cal} onChange={e => setNewRecipe({...newRecipe, cal: e.target.value})}/>
                        </div>
                        <div>
                            <label className="ia-label">Tiempo</label>
                            <input className="form-input" placeholder="30 min" value={newRecipe.time} onChange={e => setNewRecipe({...newRecipe, time: e.target.value})}/>
                        </div>
                    </div>

                    <div style={{marginBottom: 20}}>
                        <label className="ia-label">Categoría (Selección múltiple)</label>
                        <div className="chips-wrap">
                            {mealTypes.map(type => (
                                <div key={type} className={`chip ${newRecipe.category.includes(type) ? 'active' : ''}`} onClick={() => toggleNewRecipeCategory(type)}>
                                    {type} {newRecipe.category.includes(type) && <Check weight="bold"/>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{marginBottom: 20}}>
                        <label className="ia-label">Imagen</label>
                        <div style={{display:'flex', gap:10, marginBottom:10}}>
                             <button className={`btn-secondary ${newRecipe.imgType === 'url' ? 'active' : ''}`} style={{flex:1, borderColor: newRecipe.imgType === 'url' ? '#F7B27B' : '#ddd'}} onClick={() => setNewRecipe({...newRecipe, imgType: 'url'})}>Enlace URL</button>
                             <button className={`btn-secondary ${newRecipe.imgType === 'upload' ? 'active' : ''}`} style={{flex:1, borderColor: newRecipe.imgType === 'upload' ? '#F7B27B' : '#ddd'}} onClick={() => setNewRecipe({...newRecipe, imgType: 'upload'})}>Subir Archivo</button>
                        </div>
                        {newRecipe.imgType === 'url' ? (
                            <input className="form-input" placeholder="https://..." value={newRecipe.img} onChange={e => setNewRecipe({...newRecipe, img: e.target.value})} />
                        ) : (
                            <input type="file" className="form-input" accept="image/*" onChange={handleFileUpload} />
                        )}
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
                        <div>
                            <label className="ia-label">Ingredientes (Uno por línea)</label>
                            <textarea className="form-textarea" rows="4" placeholder="Lista..." value={newRecipe.ingredients} onChange={e => setNewRecipe({...newRecipe, ingredients: e.target.value})}></textarea>
                        </div>
                        <div>
                            <label className="ia-label">Pasos (Uno por línea)</label>
                            <textarea className="form-textarea" rows="4" placeholder="Instrucciones..." value={newRecipe.steps} onChange={e => setNewRecipe({...newRecipe, steps: e.target.value})}></textarea>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={handleCreateRecipe}>Guardar Receta</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 3: PLANIFICAR TIPO CINE (MINI-GRID) --- */}
      {planRecipe && (
        <div className="modal-overlay" onClick={() => setPlanRecipe(null)}>
            <div className="modal-modern" style={{maxWidth: 600}} onClick={e => e.stopPropagation()}>
                
                <div className="modal-header" style={{ borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <img src={planRecipe.img} alt={planRecipe.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} />
                        <div>
                            <h3 style={{margin:0, fontSize:'1.3rem', fontWeight:800, color: '#2d3436'}}>Planificar Plato</h3>
                            <p style={{margin:0, color:'#888', fontSize:'0.9rem'}}>Toca las casillas donde quieres comer <span style={{color: '#F7B27B', fontWeight: 600}}>{planRecipe.name}</span></p>
                        </div>
                    </div>
                    <button onClick={() => setPlanRecipe(null)} className="btn-secondary" style={{padding:8, border:'none', alignSelf: 'flex-start'}}><X size={24}/></button>
                </div>
                
                <div className="modal-body" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                    {/* MINI CALENDARIO */}
                    <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 8, minWidth: '450px' }}>
                        
                        {/* Esquina superior izquierda vacía */}
                        <div></div>
                        
                        {/* Cabecera de Días */}
                        {weekDays.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#a0aec0', textTransform: 'uppercase' }}>
                                {d.substring(0, 3)}
                            </div>
                        ))}

                        {/* Filas del Calendario */}
                        {mealTypes.map(meal => (
                            <React.Fragment key={meal}>
                                {/* Nombre de la comida (Columna izquierda) */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', paddingRight: 8 }}>
                                    {meal}
                                </div>
                                
                                {/* Casillas (Asientos) */}
                                {weekDays.map((_, dayIndex) => {
                                    const slotKey = `${dayIndex}-${meal}`;
                                    const isSelected = selectedSlots.includes(slotKey);
                                    
                                    return (
                                        <div 
                                            key={slotKey}
                                            onClick={() => toggleSlot(dayIndex, meal)}
                                            style={{
                                                aspectRatio: '1',
                                                borderRadius: '8px',
                                                border: isSelected ? '2px solid #F7B27B' : '2px dashed #cbd5e1',
                                                backgroundColor: isSelected ? '#fffaf5' : '#f8fafc',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.15s ease',
                                                transform: isSelected ? 'scale(0.95)' : 'scale(1)'
                                            }}
                                        >
                                            {isSelected ? (
                                                <Check weight="bold" color="#F7B27B" size={20}/>
                                            ) : (
                                                <Plus weight="bold" color="#cbd5e1" size={16}/>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                
                <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: 20, marginTop: 10 }}>
                    <button className="btn-secondary" onClick={() => setPlanRecipe(null)}>Cancelar</button>
                    <button 
                        className="btn-primary" 
                        onClick={handleConfirmPlan} 
                        style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: selectedSlots.length === 0 ? 0.5 : 1, cursor: selectedSlots.length === 0 ? 'not-allowed' : 'pointer' }}
                        disabled={selectedSlots.length === 0}
                    >
                        Confirmar Ubicaciones <Check weight="bold"/>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;