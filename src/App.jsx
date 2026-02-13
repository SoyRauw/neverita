import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sparkle, CircleNotch, ShoppingCart, Check, X, ChefHat, CalendarBlank, Coffee } from '@phosphor-icons/react';

// --- IMPORTACIÓN DE COMPONENTES ---
import Sidebar from './components/Sidebar';
import CalendarGrid from './components/CalendarGrid'; 
import Inventory from './components/Inventory'; 
import Recipes from './components/Recipes'; 
import Auth from './components/Auth';           
import FamilySelect from './components/FamilySelect'; 
import FamilyManager from './components/FamilyManager'; 

// --- ESTILOS CSS INYECTADOS (MODAL MODERNO) ---
const modalStyles = `
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .modal-modern {
    background: white; width: 90%; max-width: 550px;
    border-radius: 24px; padding: 0;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideUp 0.3s ease-out;
    overflow: hidden; display: flex; flex-direction: column;
    max-height: 85vh;
  }
  .modal-header-modern {
    padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: start;
    background: white; z-index: 2;
  }
  .modal-scroll-content {
    padding: 0 24px 24px; overflow-y: auto;
  }
  .section-title {
    font-size: 0.85rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase;
    margin: 24px 0 12px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;
  }
  .chips-container {
    display: flex; flex-wrap: wrap; gap: 10px;
  }
  /* Estilo base del Chip */
  .chip-modern {
    padding: 10px 18px; border-radius: 50px; font-size: 0.95rem; font-weight: 500;
    cursor: pointer; transition: all 0.2s ease; 
    border: 1px solid #E5E7EB; background: #F9FAFB; color: #4B5563;
    display: flex; align-items: center; gap: 8px; user-select: none;
  }
  .chip-modern:hover { background: #F3F4F6; border-color: #D1D5DB; }
  
  /* Estilo Chip SELECCIONADO (Naranja Vibrante) */
  .chip-modern.active {
    background: #FF9F43; color: white; border-color: #FF9F43;
    box-shadow: 0 4px 12px rgba(255, 159, 67, 0.35); transform: translateY(-1px);
  }
  
  .modern-input {
    width: 100%; padding: 16px; border-radius: 16px; border: 2px solid #E5E7EB;
    font-size: 1rem; transition: all 0.2s; outline: none; background: #FCFCFC; color: #1F2937;
  }
  .modern-input:focus { border-color: #FF9F43; background: white; box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.1); }
  
  .modal-footer-modern {
    padding: 20px 24px; border-top: 1px solid #F3F4F6; background: white;
    display: flex; gap: 12px; justify-content: flex-end;
  }
  .btn-cancel {
    padding: 12px 20px; border-radius: 14px; border: none; background: #F3F4F6;
    color: #4B5563; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .btn-cancel:hover { background: #E5E7EB; color: #1F2937; }
  
  .btn-generate {
    padding: 12px 28px; border-radius: 14px; border: none; background: #FF9F43;
    color: white; font-weight: 600; cursor: pointer; 
    box-shadow: 0 10px 15px -3px rgba(255, 159, 67, 0.3);
    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
  }
  .btn-generate:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(255, 159, 67, 0.4); }
  
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
`;

// --- COMPONENTE DUMMY SHOPPING LIST ---
const ShoppingList = () => (
    <div className="main-content">
        <header><h1><ShoppingCart size={32}/> Lista de Compras</h1></header>
        <div style={{padding: '20px', color: '#666'}}>Tu lista de compras aparecerá aquí.</div>
    </div>
);

// ==========================================
// PÁGINA DEL PLANIFICADOR
// ==========================================
const PlannerPage = ({ userProfile, plannerData, setPlannerData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // --- ESTADOS DE LA IA ---
  const [prompt, setPrompt] = useState("");
  const myInventory = ['Huevos', 'Pollo', 'Leche', 'Arroz', 'Aguacate', 'Pasta', 'Atún', 'Tomate', 'Queso', 'Espinacas'];
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const mealTypesOptions = ['Desayuno', 'Almuerzo', 'Cena'];

  // Estados de selección (Arrays para permitir múltiple selección)
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedDays, setSelectedDays] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  const [selectedMeals, setSelectedMeals] = useState(['Almuerzo', 'Cena']); // Por defecto 2, pero puedes elegir 1, 2 o 3.

  // Función genérica para añadir/quitar elementos de una lista (Multi-select)
  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
        setList(list.filter(i => i !== item)); // Si ya está, lo quita
    } else {
        setList([...list, item]); // Si no está, lo añade
    }
  };

  const handleAIGenerate = () => {
    // Validaciones
    if (selectedDays.length === 0) { alert("Selecciona al menos un día."); return; }
    if (selectedMeals.length === 0) { alert("Selecciona al menos una comida (Desayuno, Almuerzo o Cena)."); return; }

    setShowModal(false);
    setIsGenerating(true);

    setTimeout(() => {
      const newMenu = { ...plannerData }; 
      
      const demoDishes = [
        { name: "Bowl de Pollo", cal: 450, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400" },
        { name: "Pasta Carbonara", cal: 550, img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400" },
        { name: "Ensalada César", cal: 300, img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400" },
        { name: "Tacos de Pescado", cal: 380, img: "https://images.unsplash.com/photo-1512838243147-84b35363d3db?w=400" },
        { name: "Salmón al Horno", cal: 420, img: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=400" },
        { name: "Tortilla Francesa", cal: 250, img: "https://images.unsplash.com/photo-1587339144367-f1cacbecac82?w=400" },
        { name: "Tostadas Aguacate", cal: 320, img: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=400" },
        { name: "Pancakes de Avena", cal: 380, img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400" }
      ];

      // BUCLE DE GENERACIÓN: 
      // Recorre CADA día seleccionado Y CADA tipo de comida seleccionado.
      weekDays.forEach((d, dayIndex) => {
          if (selectedDays.includes(d)) {
              // Aquí ocurre la magia: si elegiste las 3, entra 3 veces. Si elegiste 1, entra 1 vez.
              selectedMeals.forEach(type => {
                  const key = `${dayIndex}-${type}`;
                  newMenu[key] = demoDishes[Math.floor(Math.random() * demoDishes.length)];
              });
          }
      });
      
      setPlannerData(newMenu);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="main-content">
        <style>{modalStyles}</style>
        
        <header>
            <div className="header-title">
                <h1>Plan Semanal</h1>
                <p>Hola, <strong>{userProfile.name}</strong> 👋 Organiza tu semana.</p>
            </div>
            <div className="header-actions">
                <button className="btn-primary" onClick={() => setShowModal(true)} disabled={isGenerating}>
                    {isGenerating ? <CircleNotch size={20} className="ph-spin" /> : <Sparkle size={20} weight="fill" />} 
                    {isGenerating ? "Cocinando..." : "Asistente IA"}
                </button>
            </div>
        </header>

        {/* --- MODAL MODERNO --- */}
        {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-modern" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="modal-header-modern">
                        <div>
                            <h2 style={{margin:0, fontSize:'1.5rem', color:'#111827', fontWeight:'800'}}>Chef Inteligente</h2>
                            <p style={{margin:'4px 0 0', color:'#6B7280', fontSize:'0.95rem'}}>Personaliza tu menú en segundos</p>
                        </div>
                        <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', cursor:'pointer', padding:5}}>
                            <X size={24} color="#9CA3AF" />
                        </button>
                    </div>

                    {/* Contenido con Scroll */}
                    <div className="modal-scroll-content">
                        
                        {/* 1. Antojo */}
                        <div className="section-title"><Sparkle weight="fill" color="#FF9F43"/> ¿Qué se te antoja?</div>
                        <input 
                            className="modern-input" 
                            placeholder="Ej: Comida italiana, algo ligero, sin gluten..." 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />

                        {/* 2. Ingredientes */}
                        <div className="section-title"><ChefHat weight="fill" color="#FF9F43"/> Ingredientes en casa</div>
                        <div className="chips-container">
                            {myInventory.map(item => (
                                <div 
                                    key={item} 
                                    className={`chip-modern ${selectedIngredients.includes(item) ? 'active' : ''}`}
                                    onClick={() => toggleSelection(item, selectedIngredients, setSelectedIngredients)}
                                >
                                    {item}
                                    {selectedIngredients.includes(item) && <Check size={14} weight="bold"/>}
                                </div>
                            ))}
                        </div>

                        {/* 3. Días */}
                        <div className="section-title"><CalendarBlank weight="fill" color="#FF9F43"/> Días a planificar</div>
                        <div className="chips-container">
                            {weekDays.map(d => (
                                <div 
                                    key={d} 
                                    className={`chip-modern ${selectedDays.includes(d) ? 'active' : ''}`}
                                    onClick={() => toggleSelection(d, selectedDays, setSelectedDays)}
                                >
                                    {d.substring(0, 3)}
                                    {selectedDays.includes(d) && <Check size={14} weight="bold"/>}
                                </div>
                            ))}
                        </div>

                        {/* 4. Tipos de Comida (AQUÍ ESTÁ LA LÓGICA FLEXIBLE) */}
                        <div className="section-title"><Coffee weight="fill" color="#FF9F43"/> ¿Qué comidas del día?</div>
                        <p style={{fontSize:'0.8rem', color:'#888', marginBottom:'10px'}}>Selecciona una, dos o las tres.</p>
                        <div className="chips-container">
                            {mealTypesOptions.map(type => (
                                <div 
                                    key={type} 
                                    className={`chip-modern ${selectedMeals.includes(type) ? 'active' : ''}`}
                                    onClick={() => toggleSelection(type, selectedMeals, setSelectedMeals)}
                                >
                                    {type}
                                    {/* El check visual confirma que está seleccionado */}
                                    {selectedMeals.includes(type) && <Check size={14} weight="bold"/>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer-modern">
                        <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                        <button className="btn-generate" onClick={handleAIGenerate}>
                            Generar Menú <Sparkle weight="fill" />
                        </button>
                    </div>

                </div>
            </div>
        )}

        <div className="calendar-wrapper">
            <div className="calendar-header">
                <div style={{width:100}}></div>
                {weekDays.map(d => <div key={d} className="day-label">{d}</div>)}
            </div>
            <CalendarGrid data={plannerData} />
        </div>
    </div>
  );
};

// ==========================================
// APP PRINCIPAL
// ==========================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentFamily, setCurrentFamily] = useState(null);
  const [showFamilyManager, setShowFamilyManager] = useState(false);
  
  const [userProfile, setUserProfile] = useState({ 
    name: "Usuario", email: "user@test.com", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", role: "Admin" 
  });
  
  const [userFamilies, setUserFamilies] = useState([
      { id: 1, name: "Casa Playa", role: "Admin", members: 4 },
      { id: 2, name: "Familia Pérez", role: "Invitado", members: 2 }
  ]);

  const [plannerData, setPlannerData] = useState({});

  const handleLogin = () => setIsAuthenticated(true);
  
  const handleLogout = () => { 
      setIsAuthenticated(false); 
      setCurrentFamily(null); 
      setShowFamilyManager(false);
  };
  
  const handleCreateFamily = (newFam) => { 
      const fam = { ...newFam, id: Date.now() }; 
      setUserFamilies([...userFamilies, fam]); 
      setCurrentFamily(fam); 
  };

  const handleSwitchFamily = (fam) => {
      setCurrentFamily(fam);
      setShowFamilyManager(false);
  };

  const handleAddToPlanner = (recipe, dayIndex, mealType) => {
      setPlannerData(prev => ({ ...prev, [`${dayIndex}-${mealType}`]: { name: recipe.name, cal: recipe.cal || 0, img: recipe.img } }));
      alert(`¡${recipe.name} añadido!`);
  };

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;
  if (!currentFamily) return <FamilySelect families={userFamilies} onSelectFamily={setCurrentFamily} onCreateFamily={handleCreateFamily} />;

  return (
    <HashRouter>
      <div className="app-container">
        <Sidebar 
            activeFamily={currentFamily} 
            onOpenManager={() => setShowFamilyManager(true)}
            onLogout={handleLogout} 
        />

        {showFamilyManager && (
            <FamilyManager 
                activeFamily={currentFamily}
                userFamilies={userFamilies}
                currentUser={userProfile}       
                onUpdateUser={setUserProfile}    
                onClose={() => setShowFamilyManager(false)}
                onSwitchFamily={handleSwitchFamily}
                onCreateNew={() => { setShowFamilyManager(false); setCurrentFamily(null); }}
            />
        )}
        
        <Routes>
          <Route path="/" element={<PlannerPage userProfile={userProfile} plannerData={plannerData} setPlannerData={setPlannerData} />} />
          <Route path="/recipes" element={<Recipes onAddToPlanner={handleAddToPlanner} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/shopping-list" element={<ShoppingList />} /> 
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;