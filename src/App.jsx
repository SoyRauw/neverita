import { useState, useEffect } from 'react';
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
import ShoppingList from './components/ShoppingList';
import { familiesService, menuPlansService, dailyMealsService } from './api';

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

// ==========================================
// PÁGINA DEL PLANIFICADOR
// ==========================================
const PlannerPage = ({ userProfile, plannerData, setPlannerData }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedMealDetails, setSelectedMealDetails] = useState(null);

    // --- ESTADOS DE LA IA ---
    const [prompt, setPrompt] = useState("");
    const myInventory = ['Huevos', 'Pollo', 'Leche', 'Arroz', 'Aguacate', 'Pasta', 'Atún', 'Tomate', 'Queso', 'Espinacas'];
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const mealTypesOptions = ['Desayuno', 'Almuerzo', 'Cena'];

    // Estados de selección (Arrays para permitir múltiple selección)
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedDays, setSelectedDays] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    const [selectedMeals, setSelectedMeals] = useState(['Almuerzo', 'Cena']);

    // Función genérica para añadir/quitar elementos de una lista
    const toggleSelection = (item, list, setList) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
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

            // Platos de demo enriquecidos con ingredientes, pasos y tiempo
            const demoDishes = [
                { name: "Bowl de Pollo", cal: 450, time: "25 min", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400", ingredients: ["Pollo desmenuzado", "Arroz integral", "Aguacate", "Tomate cherry", "Maíz"], steps: ["Cocinar el arroz.", "Asar el pollo a la plancha.", "Cortar los vegetales.", "Mezclar todo en un bowl."] },
                { name: "Pasta Carbonara", cal: 550, time: "20 min", img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400", ingredients: ["Pasta (Spaghetti)", "Panceta o Bacon", "Huevos", "Queso Parmesano", "Pimienta negra"], steps: ["Hervir la pasta.", "Freír la panceta.", "Batir yemas con queso.", "Mezclar pasta caliente con huevo y panceta fuera del fuego."] },
                { name: "Ensalada César", cal: 300, time: "15 min", img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400", ingredients: ["Lechuga romana", "Pollo a la parrilla", "Crutones", "Queso Parmesano", "Aderezo César"], steps: ["Lavar y cortar lechuga.", "Añadir pollo troceado.", "Espolvorear queso y crutones.", "Bañar con aderezo."] },
                { name: "Tacos de Pescado", cal: 380, time: "30 min", img: "https://images.unsplash.com/photo-1512838243147-84b35363d3db?w=400", ingredients: ["Pescado blanco", "Tortillas de maíz", "Col picada", "Pico de gallo", "Salsa de yogur"], steps: ["Marinar el pescado.", "Cocinar a la plancha.", "Calentar tortillas.", "Servir el pescado con col y salsa."] },
                { name: "Salmón al Horno", cal: 420, time: "35 min", img: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=400", ingredients: ["Filete de salmón", "Espárragos", "Limón", "Aceite de oliva", "Ajo"], steps: ["Precalentar horno a 200°C.", "Colocar salmón y espárragos en bandeja.", "Aliñar con limón, aceite y ajo.", "Hornear por 20 min."] },
                { name: "Tortilla Francesa", cal: 250, time: "10 min", img: "https://images.unsplash.com/photo-1587339144367-f1cacbecac82?w=400", ingredients: ["3 Huevos", "Sal y pimienta", "Aceite o mantequilla", "Queso (opcional)"], steps: ["Batir los huevos con sal.", "Calentar sartén con aceite.", "Verter huevos y cocinar 2 min por lado.", "Rellenar con queso y doblar."] },
                { name: "Tostadas Aguacate", cal: 320, time: "5 min", img: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=400", ingredients: ["Pan integral", "1 Aguacate", "Salmón ahumado (opcional)", "Semillas de sésamo"], steps: ["Tostar el pan.", "Hacer puré el aguacate y untar.", "Colocar salmón encima.", "Espolvorear semillas."] },
                { name: "Pancakes de Avena", cal: 380, time: "15 min", img: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400", ingredients: ["Avena en hojuelas", "1 Banana", "1 Huevo", "Chorrito de leche", "Miel"], steps: ["Licuar avena, banana, huevo y leche.", "Verter porciones en sartén caliente.", "Cocinar 2 min por lado.", "Servir con miel."] }
            ];

            weekDays.forEach((d, dayIndex) => {
                if (selectedDays.includes(d)) {
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

            {/* --- MODAL MODERNO DE GENERACIÓN IA --- */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="modal-header-modern">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827', fontWeight: '800' }}>Chef Inteligente</h2>
                                <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.95rem' }}>Personaliza tu menú en segundos</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}>
                                <X size={24} color="#9CA3AF" />
                            </button>
                        </div>

                        {/* Contenido con Scroll */}
                        <div className="modal-scroll-content">

                            {/* 1. Antojo */}
                            <div className="section-title"><Sparkle weight="fill" color="#FF9F43" /> ¿Qué se te antoja?</div>
                            <input
                                className="modern-input"
                                placeholder="Ej: Comida italiana, algo ligero, sin gluten..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />

                            {/* 2. Ingredientes */}
                            <div className="section-title"><ChefHat weight="fill" color="#FF9F43" /> Ingredientes en casa</div>
                            <div className="chips-container">
                                {myInventory.map(item => (
                                    <div
                                        key={item}
                                        className={`chip-modern ${selectedIngredients.includes(item) ? 'active' : ''}`}
                                        onClick={() => toggleSelection(item, selectedIngredients, setSelectedIngredients)}
                                    >
                                        {item}
                                        {selectedIngredients.includes(item) && <Check size={14} weight="bold" />}
                                    </div>
                                ))}
                            </div>

                            {/* 3. Días */}
                            <div className="section-title"><CalendarBlank weight="fill" color="#FF9F43" /> Días a planificar</div>
                            <div className="chips-container">
                                {weekDays.map(d => (
                                    <div
                                        key={d}
                                        className={`chip-modern ${selectedDays.includes(d) ? 'active' : ''}`}
                                        onClick={() => toggleSelection(d, selectedDays, setSelectedDays)}
                                    >
                                        {d.substring(0, 3)}
                                        {selectedDays.includes(d) && <Check size={14} weight="bold" />}
                                    </div>
                                ))}
                            </div>

                            {/* 4. Tipos de Comida */}
                            <div className="section-title"><Coffee weight="fill" color="#FF9F43" /> ¿Qué comidas del día?</div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>Selecciona una, dos o las tres.</p>
                            <div className="chips-container">
                                {mealTypesOptions.map(type => (
                                    <div
                                        key={type}
                                        className={`chip-modern ${selectedMeals.includes(type) ? 'active' : ''}`}
                                        onClick={() => toggleSelection(type, selectedMeals, setSelectedMeals)}
                                    >
                                        {type}
                                        {selectedMeals.includes(type) && <Check size={14} weight="bold" />}
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

            {/* --- MODAL DETALLE DEL PLATO (SOLO LECTURA) --- */}
            {selectedMealDetails && (
                <div className="modal-overlay" onClick={() => setSelectedMealDetails(null)}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: '650px' }}>

                        {/* Cabecera con Imagen */}
                        <div style={{ position: 'relative', height: '220px' }}>
                            <img src={selectedMealDetails.img} alt={selectedMealDetails.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                            {/* Botón Cerrar Flotante */}
                            <button onClick={() => setSelectedMealDetails(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <X size={20} weight="bold" color="#4B5563" />
                            </button>

                            {/* Píldora de Kcal y Tiempo */}
                            <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 24px', borderRadius: '50px', display: 'flex', gap: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: '700', color: '#4B5563', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>🔥 {selectedMealDetails.cal || 'N/A'} kcal</span>
                                <span style={{ fontWeight: '700', color: '#4B5563', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>⏱️ {selectedMealDetails.time || '30 min'}</span>
                            </div>
                        </div>

                        {/* Contenido: Ingredientes y Pasos */}
                        <div className="modal-scroll-content" style={{ padding: '45px 30px 30px', marginTop: '10px' }}>
                            <h2 style={{ textAlign: 'center', marginTop: 0, color: '#1F2937', fontSize: '1.8rem', fontWeight: '800' }}>{selectedMealDetails.name}</h2>

                            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>

                                {/* Caja Ingredientes */}
                                <div style={{ flex: 1, minWidth: '220px', background: '#F9FAFB', padding: '24px', borderRadius: '20px', border: '1px solid #F3F4F6' }}>
                                    <h3 style={{ fontSize: '1.15rem', color: '#FF9F43', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '16px' }}>
                                        <ChefHat weight="fill" size={24} /> Ingredientes
                                    </h3>
                                    <ul style={{ paddingLeft: '20px', color: '#4B5563', lineHeight: '1.8', margin: 0, fontSize: '1rem' }}>
                                        {selectedMealDetails.ingredients ?
                                            selectedMealDetails.ingredients.map((ing, i) => <li key={i}>{ing}</li>)
                                            : <li style={{ color: '#9CA3AF' }}>No hay ingredientes detallados para este plato.</li>
                                        }
                                    </ul>
                                </div>

                                {/* Caja Pasos */}
                                <div style={{ flex: 1, minWidth: '220px', background: '#F9FAFB', padding: '24px', borderRadius: '20px', border: '1px solid #F3F4F6' }}>
                                    <h3 style={{ fontSize: '1.15rem', color: '#FF9F43', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '16px' }}>
                                        <Check weight="bold" size={24} /> Pasos
                                    </h3>
                                    <ol style={{ paddingLeft: '20px', color: '#4B5563', lineHeight: '1.8', margin: 0, fontSize: '1rem' }}>
                                        {selectedMealDetails.steps ?
                                            selectedMealDetails.steps.map((step, i) => <li key={i} style={{ marginBottom: '8px' }}>{step}</li>)
                                            : <li style={{ color: '#9CA3AF' }}>No hay instrucciones para este plato.</li>
                                        }
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Footer Solo de Cierre */}
                        <div className="modal-footer-modern" style={{ justifyContent: 'center', padding: '20px', background: '#F9FAFB' }}>
                            <button className="btn-cancel" onClick={() => setSelectedMealDetails(null)} style={{ width: '100%', maxWidth: '250px', background: 'white', border: '2px solid #E5E7EB' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="calendar-wrapper">
                <div className="calendar-header">
                    <div style={{ width: 100 }}></div>
                    {weekDays.map(d => <div key={d} className="day-label">{d}</div>)}
                </div>
                {/* AQUÍ SE PASA LA FUNCIÓN AL CALENDARIO */}
                <CalendarGrid data={plannerData} onMealClick={setSelectedMealDetails} />
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

    const [userFamilies, setUserFamilies] = useState([]);

    // Fetch from Backend when user is authenticated
    useEffect(() => {
        const fetchFamilies = async () => {
            try {
                const data = await familiesService.getAll();
                // Mapear los datos del backend al formato que espera el frontend
                const mappedFamilies = data.map(fam => ({
                    ...fam,
                    id: fam.family_id,
                    role: "Admin",
                    members: 1
                }));
                setUserFamilies(mappedFamilies);
            } catch (error) {
                console.error("Error al cargar familias:", error);
            }
        };

        if (isAuthenticated) {
            fetchFamilies();
        }
    }, [isAuthenticated]);

    const handleLogin = (user) => {
        setUserProfile({
            ...user,
            avatar: `https://i.pravatar.cc/150?u=${user.user_id || user.username}`,
            role: "Admin"
        });
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentFamily(null);
        setShowFamilyManager(false);
    };

    const handleCreateFamily = async (newFam) => {
        try {
            const response = await familiesService.create({ name: newFam.name, created_by: userProfile.user_id });

            const fam = {
                ...newFam,
                id: response.family_id,
                role: "Admin",
                members: 1
            };

            setUserFamilies(prev => [...prev, fam]);
            setCurrentFamily(fam);
        } catch (error) {
            console.error("Error al crear familia:", error);
            alert("Ocurrió un error al crear la familia en el servidor.");
        }
    };

    const handleSwitchFamily = (fam) => {
        setCurrentFamily(fam);
        setShowFamilyManager(false);
    };

    const [plannerData, setPlannerData] = useState({});
    const [currentMenuPlan, setCurrentMenuPlan] = useState(null);

    // Mapeo entre índice de día (0=Lunes) y el enum de la BD
    const DAY_ENUM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const MEAL_ENUM = { 'Desayuno': 'desayuno', 'Almuerzo': 'almuerzo', 'Cena': 'cena' };
    const MEAL_ENUM_REV = { 'desayuno': 'Desayuno', 'almuerzo': 'Almuerzo', 'cena': 'Cena' };

    // Cargar o crear el menu_plan y sus daily_meals cuando se selecciona una familia
    useEffect(() => {
        if (!currentFamily || !userProfile?.user_id) return;

        const loadMenuPlan = async () => {
            try {
                // 1. Buscar si ya existe un plan para este usuario
                const plans = await menuPlansService.getByUser(userProfile.user_id);
                let plan = plans[0]; // Tomar el más reciente

                // 2. Si no existe, crear uno nuevo
                if (!plan) {
                    plan = await menuPlansService.create({
                        plan_name: `Menú de ${currentFamily.name}`,
                        start_date: new Date().toISOString().split('T')[0],
                        created_by: userProfile.user_id,
                    });
                }
                setCurrentMenuPlan(plan);

                // 3. Cargar los daily_meals de ese plan
                const meals = await dailyMealsService.getByPlan(plan.menu_plan_id);

                // 4. Reconstruir plannerData a partir de los daily_meals
                const rebuilt = {};
                for (const meal of meals) {
                    const dayIndex = DAY_ENUM.indexOf(meal.day_of_week);
                    const mealType = MEAL_ENUM_REV[meal.meal_type];
                    if (dayIndex === -1 || !mealType) continue;
                    const key = `${dayIndex}-${mealType}`;
                    rebuilt[key] = {
                        daily_meal_id: meal.daily_meal_id,
                        recipe_id: meal.recipe_id,
                        name: meal.title,
                        cal: meal.calories_per_serving,
                        time: meal.preparation_time ? `${meal.preparation_time} min` : 'N/A',
                        img: meal.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400',
                        ingredients: [],
                        steps: meal.instructions ? meal.instructions.split('\n').filter(Boolean) : [],
                        description: meal.description || '',
                        category: ['Almuerzo'],
                    };
                }
                setPlannerData(rebuilt);
            } catch (err) {
                console.error('Error cargando el menú semanal:', err);
            }
        };

        loadMenuPlan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFamily]);

    // Guardar en BD cuando se asigna una receta al planificador
    const handleAddToPlanner = async (recipe, dayIndex, mealType) => {
        const key = `${dayIndex}-${mealType}`;
        // Actualizar UI inmediatamente (optimistic update)
        setPlannerData(prev => ({ ...prev, [key]: recipe }));

        // Guardar en BD si hay un plan activo
        if (currentMenuPlan) {
            try {
                const saved = await dailyMealsService.save({
                    menu_plan_id: currentMenuPlan.menu_plan_id,
                    recipe_id: recipe.recipe_id || recipe.id,
                    meal_type: MEAL_ENUM[mealType] || mealType.toLowerCase(),
                    day_of_week: DAY_ENUM[dayIndex],
                });
                // Guardar el daily_meal_id para poder eliminar después si se necesita
                setPlannerData(prev => ({
                    ...prev,
                    [key]: { ...prev[key], daily_meal_id: saved.daily_meal_id },
                }));
            } catch (err) {
                console.error('Error guardando en el menú:', err);
            }
        }
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
                    <Route path="/" element={<PlannerPage userProfile={userProfile} plannerData={plannerData} setPlannerData={setPlannerData} currentMenuPlan={currentMenuPlan} />} />
                    <Route path="/recipes" element={<Recipes onAddToPlanner={handleAddToPlanner} currentFamily={currentFamily} userProfile={userProfile} />} />
                    <Route path="/inventory" element={<Inventory currentFamily={currentFamily} />} />
                    <Route path="/shopping-list" element={<ShoppingList />} />
                </Routes>
            </div>
        </HashRouter>
    );
}

export default App;