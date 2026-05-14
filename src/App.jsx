import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sparkle, CircleNotch, ShoppingCart, Check, X, ChefHat, CalendarBlank, Coffee } from '@phosphor-icons/react';

// --- IMPORTACIÓN DE COMPONENTES ---
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import CalendarGrid from './components/CalendarGrid';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Auth from './components/Auth';
import FamilySelect from './components/FamilySelect';
import FamilyManager from './components/FamilyManager';
import ShoppingList from './components/ShoppingList';
import { familiesService, userFamilyService, menuPlansService, dailyMealsService, aiService, inventoryService, ingredientsService, recipesService } from './api';

// --- ESTILOS CSS INYECTADOS (MODAL MODERNO) ---
const modalStyles = `
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
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
  .chip-modern {
    padding: 10px 18px; border-radius: 50px; font-size: 0.95rem; font-weight: 500;
    cursor: pointer; transition: all 0.2s ease; 
    border: 1px solid #E5E7EB; background: #F9FAFB; color: #4B5563;
    display: flex; align-items: center; gap: 8px; user-select: none;
  }
  .chip-modern:hover { background: #F3F4F6; border-color: #D1D5DB; }
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

  /* =========================================
     AJUSTES RESPONSIVE PARA MÓVIL
     ========================================= */
  @media (max-width: 900px) {
    .modal-overlay {
      align-items: flex-end; /* Pega el modal abajo */
    }
    .modal-modern {
      width: 100%;
      max-width: none;
      border-radius: 28px 28px 0 0; /* Redondeado solo arriba */
      max-height: 92vh;
      animation: mobileSlideUp 0.4s cubic-bezier(0, 0, 0.2, 1);
    }
    .modal-footer-modern {
      padding-bottom: 30px; /* Espacio extra para pulgares */
      justify-content: space-between;
    }
    .btn-generate, .btn-cancel {
      flex: 1; /* Los botones ocupan el mismo ancho en móvil */
      justify-content: center;
    }
  }

  @keyframes slideUp { 
    from { opacity: 0; transform: translateY(20px) scale(0.95); } 
    to { opacity: 1; transform: translateY(0) scale(1); } 
  }
  @keyframes mobileSlideUp { 
    from { transform: translateY(100%); } 
    to { transform: translateY(0); } 
  }

  /* Animaciones de navegación entre semanas */
  @keyframes weekSlideInFromRight {
    from { opacity: 0; transform: translateX(60px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes weekSlideInFromLeft {
    from { opacity: 0; transform: translateX(-60px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .week-slide-right {
    animation: weekSlideInFromRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }
  .week-slide-left {
    animation: weekSlideInFromLeft 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }
`;

// ==========================================
// PÁGINA DEL PLANIFICADOR
// ==========================================
const PlannerPage = ({ userProfile, plannerData, setPlannerData, currentMenuPlan, currentFamily, weekLabel, userRole, weekOffset, onNavigateWeek }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedMealDetails, setSelectedMealDetails] = useState(null);
    const [slideDir, setSlideDir] = useState(''); // '' | 'left' | 'right'

    const handleNavigate = (dir) => {
        setSlideDir(dir > 0 ? 'right' : 'left');
        onNavigateWeek(dir);
        // Limpiar clase después de la animación
        setTimeout(() => setSlideDir(''), 400);
    };

    // --- ESTADOS DE LA IA ---
    const [myInventory, setMyInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const mealTypesOptions = ['Desayuno', 'Almuerzo', 'Cena'];

    // Estados de selección
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [selectedSlots, setSelectedSlots] = useState([]);

    const toggleSlot = (dayIndex, meal) => {
        const slotKey = `${dayIndex}-${meal}`;
        // No permitir selección en días con ingredientes vencidos
        if (expiredDayIndexes.has(dayIndex)) return;
        setSelectedSlots(prev =>
            prev.includes(slotKey) ? prev.filter(k => k !== slotKey) : [...prev, slotKey]
        );
    };

    // Calcula qué días de la semana tienen al menos un ingrediente seleccionado vencido.
    // Devuelve un Set con los dayIndex (0=Lun ... 6=Dom) bloqueados.
    const expiredDayIndexes = React.useMemo(() => {
        const blocked = new Set();
        if (!currentMenuPlan?.start_date) return blocked;

        // Ingredientes seleccionados que tienen fecha de caducidad
        const selectedItems = myInventory.filter(i => selectedIngredients.includes(i.id) && i.expiration_date);
        if (selectedItems.length === 0) return blocked;

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const scheduledDate = new Date(currentMenuPlan.start_date);
            scheduledDate.setHours(12, 0, 0, 0);
            scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
            const scheduledStr = scheduledDate.toISOString().split('T')[0];

            // Agrupar por nombre de ingrediente para verificar si TODOS los lotes están vencidos
            const byName = {};
            for (const item of selectedItems) {
                if (!byName[item.name]) byName[item.name] = [];
                byName[item.name].push(item.expiration_date);
            }

            // Si para algún ingrediente, TODOS sus lotes vencen antes de ese día → bloquear
            const hasBlocker = Object.values(byName).some(dates =>
                dates.every(d => d.split('T')[0] < scheduledStr)
            );

            if (hasBlocker) blocked.add(dayIndex);
        }
        return blocked;
    }, [myInventory, selectedIngredients, currentMenuPlan]);


    // --- ESTADOS PARA FLUJO DE 2 PASOS ---
    const [aiStep, setAiStep] = useState('config'); // 'config' | 'suggestions' | 'generating'
    const [suggestions, setSuggestions] = useState([]);
    const [aiError, setAiError] = useState(null);

    // Cargar inventario real CADA VEZ que se abre el modal
    useEffect(() => {
        if (!showModal) return;
        const loadInventory = async () => {
            setLoadingInventory(true);
            setMyInventory([]); // limpiar datos previos
            try {
                const [inv, allIngredients] = await Promise.all([
                    inventoryService.getAll(),
                    ingredientsService.getAll(),
                ]);
                const familyId = currentFamily?.family_id || currentFamily?.id;
                const filtered = familyId ? inv.filter(i => i.family_id === familyId) : inv;

                // Map to individual items instead of grouping them
                const inventoryItems = filtered.map(item => {
                    const ing = allIngredients.find(i => i.ingredient_id === item.ingredient_id);
                    const name = ing ? ing.name : `Ingrediente #${item.ingredient_id}`;
                    const unit = ing ? ing.unit : '';
                    return {
                        id: item.inventory_id,
                        name,
                        quantity: Number(item.quantity) || 0,
                        unit,
                        expiration_date: item.expiration_date
                    };
                });
                
                setMyInventory(inventoryItems);
                setSelectedIngredients(inventoryItems.map(i => i.id)); // pre-seleccionar todos por ID
            } catch (err) {
                console.error('Error cargando inventario:', err);
                setMyInventory([]);
                setSelectedIngredients([]);
            } finally {
                setLoadingInventory(false);
            }
        };
        loadInventory();
    }, [showModal]);

    const toggleSelection = (item, list, setList) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    // PASO 1: Pedir sugerencias a la IA
    const handleAISuggest = async () => {
        if (selectedIngredients.length === 0) { alert("Selecciona al menos un ingrediente."); return; }
        if (selectedSlots.length === 0) { alert("Selecciona al menos un cuadro en el calendario."); return; }

        setAiStep('suggestions');
        setIsGenerating(true);
        setAiError(null);
        setSuggestions([]);

        try {
            // Enviar nombres con cantidades para que la IA sepa cuánto hay
            const ingredientsWithQty = myInventory
                .filter(i => selectedIngredients.includes(i.id))
                .map(i => `${i.name} (${i.quantity} ${i.unit})`);
            const data = await aiService.suggest(ingredientsWithQty);
            setSuggestions(data.suggestions || []);
        } catch (err) {
            console.error('Error en sugerencias IA:', err);
            setAiError('No se pudo conectar con la IA. Intenta de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    };

    // PASO 2: Generar receta completa y asignar al planificador
    const handlePickSuggestion = async (suggestion) => {
        setAiStep('generating');
        setIsGenerating(true);
        setAiError(null);

        try {
            // Enviar nombres con cantidades disponibles
            const ingredientsWithQty = myInventory
                .filter(i => selectedIngredients.includes(i.id))
                .map(i => `${i.name} (${i.quantity} ${i.unit})`);
            const data = await aiService.generate(suggestion.title, ingredientsWithQty);
            const recipe = data.recipe;
            const ingList = data.ingredients || [];

            const dish = {
                name: recipe.title,
                cal: recipe.calories_per_serving,
                time: recipe.preparation_time ? `${recipe.preparation_time} min` : 'N/A',
                img: recipe.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400',
                ingredients: ingList.map(i => `${i.name} (${i.quantity} ${i.unit})`),
                steps: recipe.instructions ? recipe.instructions.split('\n').filter(Boolean) : [],
                description: recipe.description || '',
                recipe_id: recipe.recipe_id,
            };

            const newMenu = { ...plannerData };
            const DAY_ENUM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
            const MEAL_ENUM = { 'Desayuno': 'desayuno', 'Almuerzo': 'almuerzo', 'Cena': 'cena' };

            // -- VALIDAR CADUCIDAD PARA LOS SLOTS --
            if (currentMenuPlan) {
                for (const slot of selectedSlots) {
                    const [dayIndexStr] = slot.split('-');
                    const dayIndex = parseInt(dayIndexStr, 10);
                    
                    const scheduledDate = new Date(currentMenuPlan.start_date);
                    scheduledDate.setHours(12, 0, 0, 0); 
                    scheduledDate.setDate(scheduledDate.getDate() + dayIndex);

                    try {
                        const validation = await recipesService.validateExpiration({
                            recipe_id: recipe.recipe_id,
                            family_id: currentFamily.family_id || currentFamily.id,
                            scheduled_date: scheduledDate.toISOString().split('T')[0]
                        });

                        if (!validation.valid) {
                            alert(`⚠️ No puedes planificar para el día ${DAY_ENUM[dayIndex]}.\n\nLos siguientes ingredientes estarán vencidos:\n- ${validation.expiredIngredients.join('\n- ')}`);
                            setAiStep('config');
                            setIsGenerating(false);
                            return; // Bloquear flujo
                        }
                    } catch (err) {
                        console.error('Error validando caducidad IA', err);
                    }
                }
            }

            selectedSlots.forEach(slot => {
                newMenu[slot] = { ...dish };
            });
            setPlannerData(newMenu);

            // --- PERSISTIR EN BASE DE DATOS ---
            if (currentMenuPlan) {
                for (const slot of selectedSlots) {
                    const [dayIndexStr, type] = slot.split('-');
                    const dayIndex = parseInt(dayIndexStr, 10);
                    try {
                        const saved = await dailyMealsService.save({
                            menu_plan_id: currentMenuPlan.menu_plan_id,
                            recipe_id: recipe.recipe_id,
                            meal_type: MEAL_ENUM[type] || type.toLowerCase(),
                            day_of_week: DAY_ENUM[dayIndex],
                        });
                        setPlannerData(prev => ({
                            ...prev,
                            [slot]: { ...prev[slot], daily_meal_id: saved.daily_meal_id },
                        }));
                    } catch (saveErr) {
                        console.error('Error guardando meal en BD:', saveErr);
                    }
                }
                console.log('✅ Receta IA guardada en el planificador (BD)');
            }

            // --- DESCONTAR INGREDIENTES DEL INVENTARIO ---
            const familyId = currentFamily?.family_id || currentFamily?.id;
            if (recipe.recipe_id && familyId) {
                try {
                    await inventoryService.deduct(recipe.recipe_id, familyId);
                    console.log('📦 Inventario descontado correctamente');
                } catch (deductErr) {
                    console.error('Error al descontar inventario:', deductErr);
                    // No bloquear la experiencia si falla el descuento
                }
            }

            // Cerrar modal y resetear
            setShowModal(false);
            setAiStep('config');
            setSuggestions([]);
        } catch (err) {
            console.error('Error generando receta:', err);
            setAiError('Error al generar la receta. Intenta con otra opción.');
            setAiStep('suggestions');
        } finally {
            setIsGenerating(false);
        }
    };

    // Resetear al cerrar modal
    const handleCloseModal = () => {
        setShowModal(false);
        setAiStep('config');
        setSuggestions([]);
        setAiError(null);
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
                    {userRole !== 'ayudante' && weekOffset === 0 && (
                        <button className="btn-primary" onClick={() => setShowModal(true)} disabled={isGenerating}>
                            {isGenerating ? <CircleNotch size={20} className="ph-spin" /> : <Sparkle size={20} weight="fill" />}
                            {isGenerating ? "Cocinando..." : "Asistente IA"}
                        </button>
                    )}
                </div>
            </header>

            {/* Navegador de semanas */}
            {weekLabel && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10, padding: '10px 16px', margin: '0 0 16px',
                    background: weekOffset < 0 ? 'linear-gradient(135deg, #F0F4FF, #E8EFFE)' : weekOffset > 0 ? 'linear-gradient(135deg, #F0FFF4, #E8FEEF)' : 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
                    borderRadius: 14,
                    border: weekOffset < 0 ? '1px solid #C7D7FE' : weekOffset > 0 ? '1px solid #BBF7D0' : '1px solid #FFE4B5',
                }}>
                    <button
                    onClick={() => handleNavigate(-1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontSize: '1.3rem', color: weekOffset < 0 ? '#4F46E5' : '#92400E', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        title="Semana anterior"
                    >
                        ‹
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarBlank size={18} weight="fill" color={weekOffset < 0 ? '#4F46E5' : weekOffset > 0 ? '#16A34A' : '#FF9F43'} />
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: weekOffset < 0 ? '#3730A3' : weekOffset > 0 ? '#15803D' : '#92400E' }}>{weekLabel}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: weekOffset < 0 ? '#6366F1' : weekOffset > 0 ? '#22C55E' : '#D97706' }}>
                            {weekOffset === 0 ? '✅ Esta semana' : weekOffset === -1 ? '📜 Semana pasada' : weekOffset < 0 ? `📜 Hace ${Math.abs(weekOffset)} semanas` : weekOffset === 1 ? '🔮 Próxima semana' : `🔮 En ${weekOffset} semanas`}
                        </span>
                    </div>

                    <button
                    onClick={() => handleNavigate(1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontSize: '1.3rem', color: weekOffset > 0 ? '#15803D' : '#92400E', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        title="Semana siguiente"
                    >
                        ›
                    </button>
                </div>
            )}



            {/* --- MODAL MODERNO DE GENERACIÓN IA --- */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="modal-header-modern">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827', fontWeight: '800' }}>
                                    {aiStep === 'config' ? 'Chef Inteligente' : aiStep === 'suggestions' ? '🍽️ Elige una Receta' : '🍳 Generando...'}
                                </h2>
                                <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.95rem' }}>
                                    {aiStep === 'config' ? 'Personaliza tu menú con IA' : aiStep === 'suggestions' ? 'La IA sugiere estos platos para ti' : 'Creando tu receta completa...'}
                                </p>
                            </div>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}>
                                <X size={24} color="#9CA3AF" />
                            </button>
                        </div>

                        {/* Contenido con Scroll */}
                        <div className="modal-scroll-content">

                            {/* Error */}
                            {aiError && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginTop: 16, color: '#DC2626', fontSize: '0.9rem' }}>
                                    ⚠️ {aiError}
                                </div>
                            )}

                            {/* ── PASO 1: CONFIGURACIÓN ── */}
                            {aiStep === 'config' && (
                                <>
                                    {/* 1. Ingredientes del inventario real */}
                                    <div className="section-title"><ChefHat weight="fill" color="#FF9F43" /> Ingredientes en tu inventario</div>
                                    {loadingInventory ? (
                                        <p style={{ color: '#999', fontSize: '0.9rem' }}>Cargando inventario...</p>
                                    ) : myInventory.length === 0 ? (
                                        <p style={{ color: '#999', fontSize: '0.9rem' }}>No tienes ingredientes en el inventario. Agrega algunos primero.</p>
                                    ) : (
                                        <div className="chips-container">
                                            {myInventory.map(item => {
                                                const isExpiring = item.expiration_date && (new Date(item.expiration_date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24) <= 3;
                                                return (
                                                <div
                                                    key={item.id}
                                                    className={`chip-modern ${selectedIngredients.includes(item.id) ? 'active' : ''}`}
                                                    onClick={() => toggleSelection(item.id, selectedIngredients, setSelectedIngredients)}
                                                    title={item.expiration_date ? `Vence: ${new Date(item.expiration_date).toLocaleDateString()}` : 'Sin fecha de vencimiento'}
                                                >
                                                    {isExpiring && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', marginRight: 6, display: 'inline-block' }} title="Por vencer"></div>}
                                                    {item.name} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({item.quantity} {item.unit})</span>
                                                    {selectedIngredients.includes(item.id) && <Check size={14} weight="bold" style={{marginLeft: 4}} />}
                                                </div>
                                            )})}
                                        </div>
                                    )}

                                    {/* 3. Cuadrícula de Planificación */}
                                    <div className="section-title" style={{ marginTop: '20px' }}><CalendarBlank weight="fill" color="#FF9F43" /> ¿Dónde quieres agregar la receta?</div>
                                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '15px' }}>Toca los cuadros para elegir los días y comidas.</p>
                                    
                                    {expiredDayIndexes.size > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: '0.82rem', color: '#DC2626' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                                            Los días en rojo tienen ingredientes vencidos y no están disponibles.
                                        </div>
                                    )}

                                    <div className="plan-mini-grid" style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 8, overflowX: 'auto', paddingBottom: '10px' }}>
                                        <div></div>
                                        {weekDays.map((d, dayIndex) => {
                                            const isBlocked = expiredDayIndexes.has(dayIndex);
                                            return (
                                                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: isBlocked ? '#EF4444' : '#a0aec0', textTransform: 'uppercase' }} title={isBlocked ? 'Ingrediente vencido este día' : ''}>
                                                    {d.substring(0, 3)}{isBlocked && ' 🚫'}
                                                </div>
                                            );
                                        })}
                                        {mealTypesOptions.map(meal => (
                                            <React.Fragment key={meal}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', paddingRight: 8 }}>
                                                    {meal}
                                                </div>
                                                {weekDays.map((_, dayIndex) => {
                                                    const slotKey = `${dayIndex}-${meal}`;
                                                    const isSelected = selectedSlots.includes(slotKey);
                                                    const isBlocked = expiredDayIndexes.has(dayIndex);
                                                    return (
                                                        <div key={slotKey} onClick={() => toggleSlot(dayIndex, meal)} style={{
                                                            aspectRatio: '1', borderRadius: '8px',
                                                            border: isBlocked ? '2px solid #FECACA' : isSelected ? '2px solid #FF9F43' : '2px dashed #e2e8f0',
                                                            background: isBlocked ? '#FEF2F2' : isSelected ? '#fffaf0' : 'transparent',
                                                            cursor: isBlocked ? 'not-allowed' : 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s', minWidth: '40px',
                                                            opacity: isBlocked ? 0.6 : 1,
                                                        }} title={isBlocked ? 'Ingrediente vencido este día' : ''}>
                                                            {isBlocked && <span style={{ fontSize: '0.8rem' }}>✕</span>}
                                                            {!isBlocked && isSelected && <Check size={18} weight="bold" color="#FF9F43" />}
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* ── PASO 2: SUGERENCIAS DE LA IA ── */}
                            {aiStep === 'suggestions' && (
                                <>
                                    {isGenerating ? (
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <CircleNotch size={48} className="ph-spin" color="#FF9F43" />
                                            <p style={{ color: '#6B7280', marginTop: 16, fontWeight: 600 }}>Consultando al Chef IA...</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                                            {suggestions.map((sug, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => handlePickSuggestion(sug)}
                                                    style={{
                                                        background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 16,
                                                        padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF9F43'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,159,67,0.15)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                >
                                                    <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#1F2937' }}>
                                                        {sug.title}
                                                    </h4>
                                                    <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                                                        {sug.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── PASO 3: GENERANDO RECETA ── */}
                            {aiStep === 'generating' && (
                                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                                    <CircleNotch size={56} className="ph-spin" color="#FF9F43" />
                                    <p style={{ color: '#1F2937', marginTop: 20, fontWeight: 700, fontSize: '1.1rem' }}>Cocinando tu receta...</p>
                                    <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Gemini está generando ingredientes, pasos y calorías</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer-modern">
                            {aiStep === 'suggestions' && !isGenerating && (
                                <button className="btn-cancel" onClick={() => { setAiStep('config'); setSuggestions([]); }}>← Volver</button>
                            )}
                            <button className="btn-cancel" onClick={handleCloseModal}>Cancelar</button>
                            {aiStep === 'config' && (
                                <button className="btn-generate" onClick={handleAISuggest} disabled={isGenerating || selectedIngredients.length === 0}>
                                    {isGenerating ? <><CircleNotch size={18} className="ph-spin" /> Pensando...</> : <>Generar Menú <Sparkle weight="fill" /></>}
                                </button>
                            )}
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
                            <div className="planner-detail-pill" style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 24px', borderRadius: '50px', display: 'flex', gap: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: '700', color: '#4B5563', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>🔥 {selectedMealDetails.cal || 'N/A'} kcal</span>
                                <span style={{ fontWeight: '700', color: '#4B5563', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>⏱️ {selectedMealDetails.time || '30 min'}</span>
                            </div>
                        </div>

                        {/* Contenido: Ingredientes y Pasos */}
                        <div className="modal-scroll-content" style={{ padding: '45px 30px 30px', marginTop: '10px' }}>
                            <h2 style={{ textAlign: 'center', marginTop: 0, color: '#1F2937', fontSize: '1.8rem', fontWeight: '800' }}>{selectedMealDetails.name}</h2>

                            <div className="planner-detail-cols" style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>

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
                                        {selectedMealDetails.steps && selectedMealDetails.steps.length > 0 ?
                                            selectedMealDetails.steps.map((step, i) => (
                                                <li key={i} style={{ marginBottom: '8px' }}>
                                                    {step.replace(/^\d+[\.\-]?\s*/, '')}
                                                </li>
                                            ))
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

            <div
                key={weekOffset}
                className={slideDir === 'right' ? 'week-slide-right' : slideDir === 'left' ? 'week-slide-left' : ''}
                style={{ overflow: 'hidden' }}
            >
                <div className="calendar-wrapper">
                    <div className="calendar-header desktop-only">
                        <div style={{ width: 100 }}></div>
                        {weekDays.map(d => <div key={d} className="day-label">{d}</div>)}
                    </div>
                    {/* AQUÍ SE PASA LA FUNCIÓN AL CALENDARIO */}
                    <CalendarGrid data={plannerData} onMealClick={setSelectedMealDetails} />
                </div>
            </div>
        </div>
    );
};

// ==========================================
// APP PRINCIPAL
// ==========================================
function App() {
    // --- PERSISTENCIA DE SESIÓN: leer desde localStorage al iniciar ---
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('neverita_auth') === 'true';
    });
    const [currentFamily, setCurrentFamily] = useState(() => {
        try {
            const saved = localStorage.getItem('neverita_family');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [showFamilyManager, setShowFamilyManager] = useState(false);

    const [userProfile, setUserProfile] = useState(() => {
        try {
            const saved = localStorage.getItem('neverita_user');
            return saved ? JSON.parse(saved) : {
                name: "Usuario", email: "user@test.com", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", role: "Admin"
            };
        } catch {
            return { name: "Usuario", email: "user@test.com", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", role: "Admin" };
        }
    });

    const [userFamilies, setUserFamilies] = useState([]);
    const [userRole, setUserRole] = useState('ayudante');

    // Fetch families for the authenticated user
    useEffect(() => {
        const fetchFamilies = async () => {
            try {
                const data = await userFamilyService.getFamilies(userProfile.user_id);
                // Mapear los datos del backend al formato que espera el frontend
                const mappedFamilies = data.map(fam => ({
                    ...fam,
                    id: fam.family_id,
                    role: fam.role || 'ayudante',
                    members: fam.members || 1
                }));
                setUserFamilies(mappedFamilies);

                // Si hay una familia activa, actualizar el rol
                if (currentFamily) {
                    const match = mappedFamilies.find(f => f.family_id === (currentFamily.family_id || currentFamily.id));
                    if (match) setUserRole(match.role);
                }
            } catch (error) {
                console.error("Error al cargar familias:", error);
            }
        };

        if (isAuthenticated && userProfile.user_id) {
            fetchFamilies();
        }
    }, [isAuthenticated, userProfile.user_id]);

    const handleLogin = (user) => {
        const profile = {
            ...user,
            avatar: `https://i.pravatar.cc/150?u=${user.user_id || user.username}`,
            role: "Admin"
        };
        setUserProfile(profile);
        setIsAuthenticated(true);
        // Guardar sesión en localStorage
        localStorage.setItem('neverita_auth', 'true');
        localStorage.setItem('neverita_user', JSON.stringify(profile));
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentFamily(null);
        setShowFamilyManager(false);
        // Limpiar sesión de localStorage
        localStorage.removeItem('neverita_auth');
        localStorage.removeItem('neverita_user');
        localStorage.removeItem('neverita_family');
    };

    const handleCreateFamily = async (newFam) => {
        try {
            const response = await familiesService.create({
                name: newFam.name,
                created_by: userProfile.user_id,
                code: newFam.code || null,
            });

            const fam = {
                ...newFam,
                id: response.family_id,
                family_id: response.family_id,
                role: 'creador',
                members: 1
            };

            setUserFamilies(prev => [...prev, fam]);
            setCurrentFamily(fam);
            setUserRole('creador');
        } catch (error) {
            console.error("Error al crear familia:", error);
            alert("Ocurrió un error al crear la familia en el servidor.");
        }
    };

    const handleSwitchFamily = (fam) => {
        setCurrentFamily(fam);
        setUserRole(fam.role || 'ayudante');
        localStorage.setItem('neverita_family', JSON.stringify(fam));
        setShowFamilyManager(false);
    };

    const handleJoinByCode = async (code) => {
        const family = await userFamilyService.joinByCode(userProfile.user_id, code);
        // Añadir la familia a la lista local
        const mapped = { ...family, id: family.family_id, role: 'ayudante', members: 1 };
        setUserFamilies(prev => [...prev, mapped]);
        return family;
    };

    const [plannerData, setPlannerData] = useState({});
    const [currentMenuPlan, setCurrentMenuPlan] = useState(null);
    const [weekLabel, setWeekLabel] = useState('');
    const [weekOffset, setWeekOffset] = useState(0); // 0 = esta semana, -1 = semana anterior, +1 = próxima, etc.

    // Obtener el lunes de la semana actual
    const getMonday = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    };

    const formatWeekLabel = (monday) => {
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        return `Semana ${fmt(monday)} — ${fmt(sunday)}`;
    };

    // Mapeo entre índice de día (0=Lunes) y el enum de la BD
    const DAY_ENUM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const MEAL_ENUM = { 'Desayuno': 'desayuno', 'Almuerzo': 'almuerzo', 'Cena': 'cena' };
    const MEAL_ENUM_REV = { 'desayuno': 'Desayuno', 'almuerzo': 'Almuerzo', 'cena': 'Cena' };

    // Cargar o crear el menu_plan y sus daily_meals cuando se selecciona una familia
    useEffect(() => {
        if (!currentFamily || !userProfile?.user_id) return;

        const loadMenuPlan = async (offset = 0) => {
            try {
                const baseMonday = getMonday(new Date());
                baseMonday.setHours(0, 0, 0, 0);
                baseMonday.setDate(baseMonday.getDate() + offset * 7);
                setWeekLabel(formatWeekLabel(baseMonday));

                // Formato YYYY-MM-DD para comparación sin timezone
                const targetMondayStr = baseMonday.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

                // 1. Buscar si ya existe un plan para esta familia
                const plans = await menuPlansService.getByFamily(currentFamily.family_id || currentFamily.id);
                
                // 2. Buscar un plan que sea de ESA semana
                let plan = plans.find(p => {
                    const pDate = new Date(p.start_date);
                    const pMonday = getMonday(pDate);
                    const pMondayStr = pMonday.toLocaleDateString('en-CA');
                    return pMondayStr === targetMondayStr;
                });

                // 3. Si no existe plan para esa semana Y es la semana actual o futura, crear uno nuevo
                if (!plan && offset >= 0) {
                    console.log('📅 No hay plan para esta semana. Creando nuevo...');
                    plan = await menuPlansService.create({
                        plan_name: `Menú de ${currentFamily.name}`,
                        start_date: targetMondayStr,
                        created_by: userProfile.user_id,
                        family_id: currentFamily.family_id || currentFamily.id,
                    });
                }

                // Si es semana pasada y no hay plan, no hay nada que mostrar
                setCurrentMenuPlan(plan || null);

                if (!plan) {
                    setPlannerData({});
                    return;
                }

                // 4. Cargar los daily_meals de ese plan
                const meals = await dailyMealsService.getByPlan(plan.menu_plan_id);

                // 5. Reconstruir plannerData a partir de los daily_meals
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
                        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
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

        loadMenuPlan(weekOffset);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFamily, weekOffset]);

    const handleNavigateWeek = (direction) => {
        setWeekOffset(prev => prev + direction);
        setPlannerData({});
        setCurrentMenuPlan(null);
    };

    // Guardar en BD cuando se asigna una receta al planificador
    const handleAddToPlanner = async (recipe, dayIndex, mealType) => {
        if (!currentMenuPlan) return;

        // Calcular la fecha exacta en la que se planifica
        const scheduledDate = new Date(currentMenuPlan.start_date);
        scheduledDate.setHours(12, 0, 0, 0); // Mitad del día para evitar problemas de zona horaria
        scheduledDate.setDate(scheduledDate.getDate() + dayIndex);

        try {
            // Validar que no haya ingredientes vencidos para esa fecha
            const validation = await recipesService.validateExpiration({
                recipe_id: recipe.recipe_id || recipe.id,
                family_id: currentFamily.family_id || currentFamily.id,
                scheduled_date: scheduledDate.toISOString().split('T')[0]
            });

            if (!validation.valid) {
                alert(`⚠️ No puedes planificar esta receta para ese día.\n\nLos siguientes ingredientes estarán vencidos:\n- ${validation.expiredIngredients.join('\n- ')}`);
                return; // Bloquear flujo
            }
        } catch (err) {
            console.error('Error validando caducidad', err);
        }

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
    if (!currentFamily) return <FamilySelect families={userFamilies} onSelectFamily={(fam) => { setCurrentFamily(fam); localStorage.setItem('neverita_family', JSON.stringify(fam)); }} onCreateFamily={handleCreateFamily} onJoinByCode={handleJoinByCode} />;

    return (
        <HashRouter>
            <div className="app-container">
                <Sidebar 
                    activeFamily={currentFamily}
                    onOpenManager={() => setShowFamilyManager(true)}
                    onLogout={handleLogout}
                />

                {/* Esta es la línea que acabas de agregar */}
                <MobileNav onOpenManager={() => setShowFamilyManager(true)} />

                {showFamilyManager && (
                    <FamilyManager
                        activeFamily={currentFamily}
                        userFamilies={userFamilies}
                        currentUser={userProfile}
                        userRole={userRole}
                        onUpdateUser={setUserProfile}
                        onClose={() => setShowFamilyManager(false)}
                        onSwitchFamily={handleSwitchFamily}
                        onCreateNew={() => { setShowFamilyManager(false); setCurrentFamily(null); }}
                        onLogout={handleLogout}
                    />
                )}

                <Routes>
                    <Route path="/" element={<PlannerPage userProfile={userProfile} plannerData={plannerData} setPlannerData={setPlannerData} currentMenuPlan={currentMenuPlan} currentFamily={currentFamily} weekLabel={weekLabel} userRole={userRole} weekOffset={weekOffset} onNavigateWeek={handleNavigateWeek} />} />
                    <Route path="/recipes" element={<Recipes onAddToPlanner={handleAddToPlanner} currentFamily={currentFamily} userProfile={userProfile} userRole={userRole} />} />
                    <Route path="/inventory" element={<Inventory currentFamily={currentFamily} userRole={userRole} />} />
                    <Route path="/shopping-list" element={<ShoppingList />} />
                </Routes>
            </div>
        </HashRouter>
    );
}

export default App;