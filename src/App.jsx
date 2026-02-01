import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sparkle, CircleNotch } from '@phosphor-icons/react';

// --- IMPORTACIÓN DE COMPONENTES ---
import Sidebar from './components/Sidebar';
import CalendarGrid from './components/CalendarGrid'; 
import Inventory from './components/Inventory'; 
import Recipes from './components/Recipes'; // ESTE AHORA RECIBIRÁ PROPS
import Auth from './components/Auth';           
import FamilySelect from './components/FamilySelect'; 
import FamilyManager from './components/FamilyManager'; 

// ==========================================
// 1. PLANIFICADOR
// ==========================================
const PlannerPage = ({ userProfile, plannerData, setPlannerData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedDays, setSelectedDays] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  
  const myInventory = ['Huevos', 'Pechuga de Pollo', 'Leche', 'Arroz', 'Aguacate', 'Pasta'];
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const toggleIngredient = (item) => {
    if (selectedIngredients.includes(item)) setSelectedIngredients(selectedIngredients.filter(i => i !== item));
    else setSelectedIngredients([...selectedIngredients, item]);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) setSelectedDays(selectedDays.filter(d => d !== day));
    else setSelectedDays([...selectedDays, day]);
  };

  const handleAIGenerate = () => {
    setShowModal(false);
    setIsGenerating(true);
    setTimeout(() => {
      const newMenu = { ...plannerData }; // Mantener lo que ya existe
      const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
      const demoRecipes = [
        { name: "Bowl de Pollo", cal: 450, img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400" },
        { name: "Tostadas Avocado", cal: 320, img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400" },
        { name: "Pasta Carbonara", cal: 550, img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400" },
      ];
      mealTypes.forEach(type => {
        weekDays.forEach((dayName, index) => {
            if(selectedDays.includes(dayName) && Math.random() > 0.3) {
                const randomRecipe = demoRecipes[Math.floor(Math.random() * demoRecipes.length)];
                newMenu[`${index}-${type}`] = randomRecipe;
            }
        });
      });
      setPlannerData(newMenu);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="main-content">
        <header>
            <div className="header-title">
                <h1>Plan Semanal</h1>
                <p>Hola, <strong>{userProfile.name}</strong> 👋</p>
            </div>
            <div className="header-actions">
                <div className="avatars">
                    <img src={userProfile.avatar} alt="Me" style={{border: '2px solid var(--color-primary)', objectFit:'cover'}} />
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)} disabled={isGenerating}>
                    {isGenerating ? <><CircleNotch size={20} className="ph-spin" /> Creando...</> : <><Sparkle size={20} weight="fill" /> IA: Sugerir Menú</>}
                </button>
            </div>
        </header>

        {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>✨ Asistente de Menú</h2>
                    </div>
                    {/* ... Inputs de IA ... */}
                    <div className="form-group">
                        <label>Ingredientes:</label>
                        <div className="tags-container">
                            {myInventory.map(item => (
                                <div key={item} className={`tag-chip ${selectedIngredients.includes(item) ? 'selected' : ''}`} onClick={() => toggleIngredient(item)}>{item}</div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleAIGenerate}>Generar Plan</button>
                    </div>
                </div>
            </div>
        )}
        
        <div className="calendar-wrapper">
            <div className="calendar-header">
                <div style={{width: '100px'}}></div> 
                {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => <div key={d} className="day-label">{d}</div>)}
            </div>
            <CalendarGrid data={plannerData} />
        </div>
    </div>
  );
};

// ==========================================
// 2. APP PRINCIPAL
// ==========================================
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [userFamilies, setUserFamilies] = useState([]); 
  const [currentFamily, setCurrentFamily] = useState(null);
  const [showFamilyManager, setShowFamilyManager] = useState(false);

  // ESTADO GLOBAL DEL PLANIFICADOR
  // Lo elevamos aquí para poder modificarlo desde Recetas
  const [plannerData, setPlannerData] = useState({});

  const [userProfile, setUserProfile] = useState({
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
  });

  // --- FUNCIÓN PARA AGREGAR DESDE RECETAS ---
  const handleAddToPlanner = (dayIndex, mealType, recipe) => {
    setPlannerData(prevData => ({
        ...prevData,
        [`${dayIndex}-${mealType}`]: recipe
    }));
  };

  const handleLogin = () => {
    const isNewUserSimulation = false; 
    if (isNewUserSimulation) setUserFamilies([]);
    else setUserFamilies([
        { id: 1, name: "Rauw Family", role: "Papá", members: 4 },
        { id: 2, name: "Casa de Playa", role: "Tío", members: 8 }
    ]);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentFamily(null);
    setUserFamilies([]);
  };

  const handleCreateFamily = (newFamilyData) => {
    const newFam = { ...newFamilyData, id: Date.now() }; 
    const updatedList = [...userFamilies, newFam];
    setUserFamilies(updatedList);
    setCurrentFamily(newFam); 
    setShowFamilyManager(false); 
  };

  const handleSwitchFamily = (family) => {
    setCurrentFamily(family);
    setShowFamilyManager(false);
  };

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;
  if (!currentFamily) return <FamilySelect families={userFamilies} onSelectFamily={setCurrentFamily} onCreateFamily={handleCreateFamily} />;

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar activeFamily={currentFamily} onOpenManager={() => setShowFamilyManager(true)} />

        {showFamilyManager && (
            <FamilyManager 
                activeFamily={currentFamily}
                userFamilies={userFamilies}
                currentUser={userProfile}       
                onUpdateUser={setUserProfile}    
                onClose={() => setShowFamilyManager(false)}
                onSwitchFamily={handleSwitchFamily}
                onCreateNew={() => { setShowFamilyManager(false); setCurrentFamily(null); }}
                onLogout={handleLogout}
            />
        )}
        
        <Routes>
          <Route path="/" element={
            <PlannerPage 
                userProfile={userProfile} 
                plannerData={plannerData} 
                setPlannerData={setPlannerData} 
            />
          } />
          
          {/* PASAMOS LA FUNCIÓN DE AGREGAR AL COMPONENTE RECETAS */}
          <Route path="/recipes" element={<Recipes onAddToPlanner={handleAddToPlanner} />} />
          
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/shopping-list" element={<div className="main-content"><h1>🛒 Lista de Compras</h1></div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;