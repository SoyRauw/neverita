import React, { useState, useEffect, useRef, useMemo } from 'react';
import { showToast } from './Toast';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sparkle, CircleNotch, ShoppingCart, Check, X, ChefHat, CalendarBlank, Coffee, UsersThree, Plus, Sun, Warning, BookOpen, MagnifyingGlass, Trash, ArrowsClockwise, Fire, Clock, ListNumbers, SpeakerHigh, Pause, Play, Leaf, Heartbeat, Lightbulb, CheckSquare, PencilSimple } from '@phosphor-icons/react';

// --- IMPORTACIÓN DE COMPONENTES ---
import Sidebar from './components/Sidebar';
import SuggestionsPanel from './components/SuggestionsPanel';
import MobileNav from './components/MobileNav';
import CalendarGrid from './components/CalendarGrid';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Auth from './components/Auth';
import LandingPage from './components/Landingpage';
import FamilySelect from './components/FamilySelect';
import FamilyManager from './components/FamilyManager';
import ShoppingList from './components/ShoppingList';
import Stats from './components/Stats';
import Avatar from './components/Avatar';
import NvSelect from './components/NvSelect';
import { familiesService, userFamilyService, menuPlansService, dailyMealsService, aiService, inventoryService, ingredientsService, recipesService, familyRecipesService, shoppingListService, imgProxy } from './api';
import { portionFactor, totalPortions, roundQty, portionsLabel } from './nutrition';
import { goalLabel } from './profileOptions';
import { buildSuggestions } from './suggestions';
import { plateAmount } from './plating';
import { formatQty } from './units';
import { computeReserved, aggregateAvailable, computeShortfalls, normName } from './reservation';

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
    max-height: 85vh; max-height: 85dvh;
  }
  .modal-header-modern {
    padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: start;
    background: white; z-index: 2;
  }
  .modal-scroll-content {
    padding: 0 24px 24px; overflow-y: auto;
  }
  .section-title {
    font-size: 0.85rem; font-weight: 700; color: #9b8d7c; text-transform: uppercase;
    margin: 24px 0 12px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;
  }
  .chips-container {
    display: flex; flex-wrap: wrap; gap: 10px;
  }
  .chip-modern {
    padding: 10px 18px; border-radius: 50px; font-size: 0.95rem; font-weight: 700;
    cursor: pointer; transition: all 0.2s ease; 
    border: 1.5px solid rgba(230,126,34,0.18); background: #FFF9F2; color: #6B5E4F;
    display: flex; align-items: center; gap: 8px; user-select: none;
  }
  .chip-modern:hover { background: #FFF1E0; border-color: #FF9F43; color: #e67e22; }
  .chip-modern.active {
    background: linear-gradient(135deg, #FF9F43, #FF7F50); color: white; border-color: transparent;
    box-shadow: 0 8px 18px rgba(255, 127, 80, 0.35); transform: translateY(-2px);
  }
  .modern-input {
    width: 100%; padding: 15px; border-radius: 14px; border: 1.5px solid rgba(230,126,34,0.18);
    font-size: 1rem; font-weight: 600; transition: all 0.2s; outline: none; background: rgba(255,250,244,0.85); color: #2A2118;
  }
  .modern-input:focus { border-color: #FF9F43; background: white; box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.14); }
  .modal-footer-modern {
    padding: 20px 24px; border-top: 1px solid rgba(255,159,67,0.16); background: #FFFAF4;
    display: flex; gap: 12px; justify-content: flex-end;
  }
  .btn-cancel {
    padding: 12px 20px; border-radius: 14px; border: 1.5px solid rgba(230,126,34,0.2); background: rgba(255,255,255,0.6);
    color: #6B5E4F; font-weight: 800; cursor: pointer; transition: 0.2s;
  }
  .btn-cancel:hover { background: #FFF1E0; color: #e67e22; border-color: #FF9F43; }
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
      max-height: 92vh; max-height: 92dvh;
      animation: mobileSlideUp 0.4s cubic-bezier(0, 0, 0.2, 1);
    }
    .modal-footer-modern {
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
      justify-content: space-between;
      flex-wrap: wrap; /* que los botones bajen a otra fila en vez de aplastar el texto */
    }
    .btn-generate, .btn-cancel {
      flex: 1 1 auto;
      justify-content: center;
      padding-left: 14px; padding-right: 14px;
    }
    .modal-footer-modern .btn-generate { flex-basis: 100%; order: -1; } /* acción principal, fila propia arriba */
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

  /* =========================================
     AVISO DE BALANCE NUTRICIONAL (no bloqueante)
     ========================================= */
  @keyframes balanceIn {
    0%   { opacity: 0; transform: translateY(-12px) scale(0.97); }
    60%  { opacity: 1; transform: translateY(2px) scale(1.005); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes balancePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(29,158,117,0.35); }
    50%      { transform: scale(1.06); box-shadow: 0 0 0 7px rgba(29,158,117,0); }
  }
  @keyframes balanceChipIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .balance-notice {
    position: relative;
    display: flex; align-items: flex-start; gap: 14px;
    background: linear-gradient(135deg, #F0FBF6 0%, #FFF6EC 100%);
    border: 1px solid rgba(29,158,117,0.22);
    border-left: 4px solid #1D9E75;
    border-radius: 16px;
    padding: 16px 18px;
    margin: 4px 0 18px;
    box-shadow: 0 10px 26px -12px rgba(15,110,86,0.35);
    animation: balanceIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    overflow: hidden;
  }
  .balance-notice__icon {
    flex-shrink: 0;
    width: 40px; height: 40px; border-radius: 12px;
    display: grid; place-items: center;
    background: linear-gradient(135deg, #1D9E75, #0F6E56);
    color: #fff;
    animation: balancePulse 2.4s ease-in-out infinite;
  }
  .balance-notice__title {
    margin: 0 0 3px; font-size: 1rem; font-weight: 800; color: #0F6E56;
    display: flex; align-items: center; gap: 6px;
  }
  .balance-notice__text { margin: 0; font-size: 0.9rem; line-height: 1.45; color: #3f6b5c; }
  .balance-notice__chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
  .balance-notice__chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.8rem; font-weight: 800; color: #0F6E56;
    background: rgba(29,158,117,0.12);
    border: 1px solid rgba(29,158,117,0.25);
    padding: 5px 11px; border-radius: 999px;
    animation: balanceChipIn 0.4s ease both;
  }
  .balance-notice__chip:nth-child(1) { animation-delay: 0.12s; }
  .balance-notice__chip:nth-child(2) { animation-delay: 0.20s; }
  .balance-notice__chip:nth-child(3) { animation-delay: 0.28s; }
  .balance-notice__close {
    position: absolute; top: 10px; right: 10px;
    width: 26px; height: 26px; border-radius: 8px; border: none; cursor: pointer;
    background: rgba(15,110,86,0.08); color: #0F6E56;
    display: grid; place-items: center; transition: background 0.18s, transform 0.18s;
  }
  .balance-notice__close:hover { background: rgba(15,110,86,0.16); transform: scale(1.08); }
  @media (prefers-reduced-motion: reduce) {
    .balance-notice, .balance-notice__icon, .balance-notice__chip { animation: none !important; }
  }

  /* =========================================
     BOTONES BLOQUEADOS POR ROL
     ========================================= */
  .btn-locked {
    opacity: 0.35 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
    filter: grayscale(0.4);
    position: relative;
  }
  .btn-locked-wrapper {
    position: relative;
    display: inline-flex;
  }
  .btn-locked-wrapper[data-tooltip] {
    cursor: not-allowed;
  }
  .btn-locked-wrapper[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(17,24,39,0.9);
    color: white;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 9999;
    font-weight: 600;
  }
`;


// ==========================================
// Pluraliza unidades contables cuando la cantidad ≠ 1
// "2 unidad" -> "2 unidades", "3 diente" -> "3 dientes". No toca g/ml/kg/l.
// ==========================================
const PLURAL_UNITS = ['unidad', 'diente', 'taza', 'cucharada', 'cucharadita', 'rebanada', 'pizca', 'lata', 'hoja', 'rama', 'rodaja', 'porcion', 'porción', 'trozo', 'manojo', 'vaso', 'sobre', 'paquete'];
const pluralizeUnits = (txt) => {
    if (typeof txt !== 'string') return txt;
    return txt.replace(/(\d+(?:[.,]\d+)?)\s+([a-záéíóúñ]+)/gi, (full, num, unit) => {
        const n = parseFloat(String(num).replace(',', '.'));
        if (n === 1) return full;
        if (!PLURAL_UNITS.includes(unit.toLowerCase())) return full;
        const plural = /[aeiouáéíóú]$/i.test(unit) ? unit + 's' : unit + 'es';
        return `${num} ${plural}`;
    });
};

// Color por turno (para el badge del detalle)
const getMealColor = (type) => {
    switch (type) {
        case 'Desayuno': return '#f6b93b';
        case 'Almuerzo': return '#e55039';
        case 'Cena': return '#4a69bd';
        default: return '#e67e22';
    }
};

// ==========================================
// PÁGINA DEL PLANIFICADOR
// ==========================================
const PlannerPage = ({ userProfile, plannerData, setPlannerData, currentMenuPlan, currentFamily, weekLabel, userRole, weekOffset, onNavigateWeek }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedMealDetails, setSelectedMealDetails] = useState(null);
    const [detailEaters, setDetailEaters] = useState(null); // comensales editables de la comida abierta (array de user_id)
    const [savingEaters, setSavingEaters] = useState(false);
    const [selectedMealSlot, setSelectedMealSlot] = useState(null); // { dayIndex, type } del cuadro abierto
    const [slideDir, setSlideDir] = useState(''); // '' | 'left' | 'right'

    // --- TTS (Texto a Voz) ---
    const [speechState, setSpeechState] = useState('idle'); // idle, speaking, paused
    const utteranceRef = React.useRef(null);

    const stopSpeech = React.useCallback(() => {
        window.speechSynthesis.cancel();
        setSpeechState('idle');
    }, []);

    const startSpeech = React.useCallback((recipe) => {
        stopSpeech();
        if (!recipe) return;

        let textToRead = `Receta: ${recipe.name}. `;
        if (recipe.servings) {
            textToRead += `Para ${recipe.servings} ${Number(recipe.servings) === 1 ? 'persona' : 'personas'}. `;
        }
        if (recipe.cal) {
            textToRead += `Aproximadamente ${recipe.cal} calorías en total. `;
        }
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            textToRead += `Ingredientes: ${recipe.ingredients.map(pluralizeUnits).join(', ')}. `;
        }
        if (recipe.steps && recipe.steps.length > 0) {
            textToRead += `Pasos a seguir: ${recipe.steps.map(s => s.replace(/^\\d+[\\.\\-]?\\s*/, '')).join('. ')}.`;
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.pitch = 1.05;  // ligeramente más agudo = menos robótico

        // Seleccionar la mejor voz disponible en español
        const pickBestVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            const esVoices = voices.filter(v =>
                v.lang.startsWith('es') || v.lang.startsWith('ES')
            );

            // Prioridad: Google (Chrome) > Microsoft Online Natural (Edge) > cualquier español
            const preferred = [
                esVoices.find(v => /Google.*español|Google.*Spanish/i.test(v.name)),
                esVoices.find(v => /Microsoft.*Natural/i.test(v.name)),
                esVoices.find(v => /Microsoft/i.test(v.name)),
                esVoices.find(v => v.lang === 'es-ES'),
                esVoices.find(v => v.lang.startsWith('es')),
                esVoices[0],
            ].find(Boolean);

            if (preferred) utterance.voice = preferred;
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            pickBestVoice();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                pickBestVoice();
                window.speechSynthesis.onvoiceschanged = null;
            };
        }

        utterance.onend = () => setSpeechState('idle');
        utterance.onerror = () => setSpeechState('idle');

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setSpeechState('speaking');
    }, [stopSpeech]);

    const togglePause = React.useCallback(() => {
        if (speechState === 'speaking') {
            window.speechSynthesis.pause();
            setSpeechState('paused');
        } else if (speechState === 'paused') {
            window.speechSynthesis.resume();
            setSpeechState('speaking');
        }
    }, [speechState]);

    const openMealDetails = (meal, dayIndex, type) => {
        setSelectedMealSlot((dayIndex !== undefined && type) ? { dayIndex, type } : null);
        setSelectedMealDetails(meal);
        // Comensales editables: los guardados, o toda la familia si no hay dato.
        setDetailEaters((Array.isArray(meal?.eaters) && meal.eaters.length) ? meal.eaters : familyMembers.map(m => m.user_id));
    };

    // Editar comensales desde el detalle: recalcula (vía estado) y guarda automáticamente.
    const handleToggleDetailEater = async (userId) => {
        if (!selectedMealDetails) return;
        const cur = Array.isArray(detailEaters) ? detailEaters : familyMembers.map(m => m.user_id);
        const next = cur.includes(userId) ? cur.filter(x => x !== userId) : [...cur, userId];
        // Validación: debe comer al menos una persona.
        if (next.length === 0 && familyMembers.length > 0) {
            showToast('Debe comer al menos una persona. No puedes quitar a todos.', 'error');
            return;
        }
        // Persistencia: subconjunto explícito; vacío o "todos" = toda la familia (null).
        const toPersist = (arr) => (arr.length && arr.length !== familyMembers.length) ? arr : null;
        const eatersToPersist = toPersist(next);
        const prevPersist = toPersist(cur);
        const slot = resolveMealSlot();
        const key = slot ? `${slot.dayIndex}-${slot.type}` : null;
        // Pintado optimista
        setDetailEaters(next);
        setSelectedMealDetails(prev => prev ? { ...prev, eaters: eatersToPersist } : prev);
        if (key) setPlannerData(prev => (prev[key] ? { ...prev, [key]: { ...prev[key], eaters: eatersToPersist } } : prev));
        const dmId = selectedMealDetails.daily_meal_id;
        if (dmId) {
            setSavingEaters(true);
            try {
                await dailyMealsService.updateEaters(dmId, eatersToPersist);
            } catch (e) {
                console.error('Error guardando comensales:', e);
                // Revertir el cambio optimista (no quedó guardado en BD).
                setDetailEaters(cur);
                setSelectedMealDetails(prev => prev ? { ...prev, eaters: prevPersist } : prev);
                if (key) setPlannerData(prev => (prev[key] ? { ...prev, [key]: { ...prev[key], eaters: prevPersist } } : prev));
                showToast('No se pudieron guardar los comensales. Intenta de nuevo.', 'error');
            } finally { setSavingEaters(false); }
        }
    };

    // Deduce el cuadro (día/turno) de la receta abierta. Usa el slot explícito si
    // existe; si no, lo busca en el plan por daily_meal_id (o por nombre como respaldo).
    // Así Cambiar/Eliminar funcionan en CUALQUIER semana y desde cualquier cuadro.
    const resolveMealSlot = () => {
        if (selectedMealSlot) return selectedMealSlot;
        if (!selectedMealDetails || !plannerData) return null;
        const id = selectedMealDetails.daily_meal_id;
        const name = selectedMealDetails.name;
        for (const [key, m] of Object.entries(plannerData)) {
            if (!m) continue;
            if ((id && m.daily_meal_id === id) || (!id && m.name === name)) {
                const [d, t] = key.split('-');
                return { dayIndex: parseInt(d, 10), type: t };
            }
        }
        return null;
    };

    const handleCloseMealDetails = () => {
        stopSpeech();
        setSelectedMealDetails(null);
        setSelectedMealSlot(null);
        setDetailEaters(null);
    };

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
    const [planMode, setPlanMode] = useState('plan'); // 'plan' = elegir varios cuadros | 'edit' = bloqueado a 1
    const [servingsView, setServingsView] = useState('total'); // vista del paso de porciones: 'total' | 'person'
    const [cookedPrompt, setCookedPrompt] = useState(null); // Bloque 8: aviso "¿cocinaste?" { meal, dayIndex, type, askKey }
    const [planItems, setPlanItems] = useState([]); // Bloque 7: [{ slot, title, recipe, status }]
    const [planGenerating, setPlanGenerating] = useState(false);
    const [slotAssignments, setSlotAssignments] = useState({}); // Bloque 7 (existentes): { slotKey: dish }
    const [slotEaters, setSlotEaters] = useState({}); // Bloque 7: { slotKey: [user_id...] } comensales por cuadro
    // Selección múltiple desde el calendario (CRUD desde afuera)
    const [calSelectMode, setCalSelectMode] = useState(false);
    const [calSelected, setCalSelected] = useState([]);
    const [calMode, setCalMode] = useState(null); // null hasta la 1ª selección; luego 'plan' | 'manage'
    const [editingExisting, setEditingExisting] = useState(false); // edición múltiple de recetas ya planificadas
    const [pendingBulkDelete, setPendingBulkDelete] = useState(null); // array de slots a eliminar (confirmación)

    // Recetas existentes (modo "agregar receta ya creada")
    const [existingRecipes, setExistingRecipes] = useState([]);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [recipeSearch, setRecipeSearch] = useState('');

    // Confirmación de borrado (capa con aviso)
    const [pendingDelete, setPendingDelete] = useState(null); // { dayIndex, type, name }

    // Modal de sobras
    const [pendingLeftovers, setPendingLeftovers] = useState(null); // { name, recipe_id }
    const [leftoversQty, setLeftoversQty] = useState(1);

    const toggleSlot = (dayIndex, meal) => {
        const slotKey = `${dayIndex}-${meal}`;
        // Si ya está seleccionado, permitir deseleccionarlo sin importar si está bloqueado
        if (selectedSlots.includes(slotKey)) {
            setSelectedSlots(prev => prev.filter(k => k !== slotKey));
            // Limpiar cualquier asignación/comensales de ese cuadro para que no "resucite" al reseleccionar.
            setSlotAssignments(prev => { if (prev[slotKey] === undefined) return prev; const n = { ...prev }; delete n[slotKey]; return n; });
            setSlotEaters(prev => { if (prev[slotKey] === undefined) return prev; const n = { ...prev }; delete n[slotKey]; return n; });
            return;
        }
        // No permitir selección nueva en días con ingredientes vencidos
        if (expiredDayIndexes.has(dayIndex)) return;
        
        setSelectedSlots(prev => [...prev, slotKey]);
    };

    // Calcula qué días de la semana tienen al menos un ingrediente seleccionado vencido.
    // Devuelve un Set con los dayIndex (0=Lun ... 6=Dom) bloqueados.
    const expiredDayIndexes = React.useMemo(() => {
        const blocked = new Set();
        if (!currentMenuPlan?.start_date) return blocked;

        // Ingredientes seleccionados que tienen fecha de caducidad
        const selectedItems = myInventory.filter(i => selectedIngredients.includes(i.id) && i.expiration_date);
        if (selectedItems.length === 0) return blocked;

        // Normaliza la fecha de vencimiento a string 'YYYY-MM-DD',
        // independientemente de si llega como string o como objeto Date de mysql2.
        const toDateStr = (val) => {
            if (!val) return null;
            if (typeof val === 'string') return val.split('T')[0];
            if (val instanceof Date) return val.toISOString().split('T')[0];
            return String(val).split('T')[0];
        };

        // Limpiar el start_date de cualquier sufijo T...
        const startDateStr = currentMenuPlan.start_date.split('T')[0];

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const scheduledDate = new Date(`${startDateStr}T12:00:00`);
            scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
            const scheduledStr = scheduledDate.toISOString().split('T')[0];

            // Agrupar por nombre de ingrediente para verificar si TODOS los lotes están vencidos
            const byName = {};
            for (const item of selectedItems) {
                if (!byName[item.name]) byName[item.name] = [];
                byName[item.name].push(toDateStr(item.expiration_date));
            }

            // Un ingrediente bloquea el día si TODOS sus lotes vencen ANTES de ese día.
            // Vence el mismo día que se planifica → aún válido (scheduledStr > expStr lo bloquea correctamente).
            const hasBlocker = Object.values(byName).some(dates =>
                dates.every(expStr => expStr !== null && scheduledStr > expStr)
            );

            if (hasBlocker) blocked.add(dayIndex);
        }
        return blocked;
    }, [myInventory, selectedIngredients, currentMenuPlan]);


    // --- ESTADOS PARA FLUJO DE 3 PASOS ---
    // 'config' → 'suggestions' → 'generating' → 'servings' → planner
    const [aiStep, setAiStep] = useState('config');
    const [suggestions, setSuggestions] = useState([]);
    const [aiError, setAiError] = useState(null);
    // Aviso (no bloqueante) de balance nutricional: grupos importantes ausentes
    const [balanceWarning, setBalanceWarning] = useState([]);
    // Popup animado con el MOTIVO por el que no se pudo planificar/generar (item 1)
    const [planNotice, setPlanNotice] = useState(null); // { title, reason, hint }
    // Aviso "no alcanza el inventario" al planificar: faltantes + acción de comprar
    const [shortfallNotice, setShortfallNotice] = useState(null); // { items: [{name, unit, missing}] }
    // Receta generada por IA esperando confirmación de personas
    const [aiDish, setAiDish] = useState(null);
    const [aiPlanServings, setAiPlanServings] = useState(1);
    const [aiChosenTurn, setAiChosenTurn] = useState(null);   // turno elegido en sugerencias

    // Bloque 3: integrantes que comerán → porciones balanceadas por persona
    const [familyMembers, setFamilyMembers] = useState([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [aiFromExisting, setAiFromExisting] = useState(false); // el paso de personas vino de "receta ya creada"
    const toggleMember = (id) => setSelectedMemberIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

    // ── Reserva de inventario ──
    // Los ingredientes de comidas PLANIFICADAS pero NO cocinadas quedan reservados,
    // para no contarlos como disponibles al planificar otra receta (misma fórmula de
    // escalado que el descuento real). disponible = inventario − reservado.
    const reservedMap = useMemo(
        () => computeReserved(Object.values(plannerData || {}), familyMembers),
        [plannerData, familyMembers]
    );
    const availableByName = useMemo(
        () => aggregateAvailable(myInventory, reservedMap),
        [myInventory, reservedMap]
    );
    // Líneas "Nombre (disponible unidad)" para pasar a la IA (solo lo realmente disponible).
    const availableLinesFor = (items) => {
        const names = [...new Set((items || []).map(i => normName(i.name)))];
        return names
            .map(n => availableByName[n])
            .filter(a => a && a.available > 0)
            .map(a => `${a.name} (${a.available} ${a.unit})`);
    };
    // Faltantes del plan: por cada receta escala por comensales (aún no elegidos → toda la
    // familia, igual que el descuento real) y compara contra lo disponible, reconciliando
    // unidades y acumulando el consumo entre recetas del mismo lote (computeShortfalls).
    const computePlanShortfalls = (dishes) => {
        const consumed = {};
        const acc = {};
        for (const dish of dishes || []) {
            const base = Number(dish?.servings) || 1;
            const mult = familyMembers.length ? totalPortions(familyMembers) / base : 1;
            const sf = computeShortfalls(dish?.ingredients || [], mult, availableByName, consumed);
            for (const s of sf) {
                const k = normName(s.name);
                if (!acc[k]) acc[k] = { name: s.name, unit: s.unit, missing: 0 };
                acc[k].missing = Math.round((acc[k].missing + s.missing) * 100) / 100;
            }
        }
        return Object.values(acc).filter(s => s.missing > 0.01);
    };
    // Agrega los faltantes a la lista de compras de la familia.
    const addShortfallsToShopping = async (list) => {
        const fid = currentFamily?.family_id || currentFamily?.id;
        if (!fid || !Array.isArray(list) || !list.length) { setShortfallNotice(null); return; }
        try {
            for (const it of list) {
                await shoppingListService.create({
                    family_id: fid,
                    name: it.name,
                    quantity: Math.max(1, Math.ceil(it.missing)),
                    unit: it.unit,
                    source: 'ai',
                });
            }
            showToast('🛒 Agregamos a tu lista de compras lo que falta.', 'success');
        } catch (e) {
            console.error('Error agregando faltantes a la compra:', e);
            showToast('No se pudo agregar a la lista de compras.', 'warning');
        } finally {
            setShortfallNotice(null);
        }
    };
    // Bloque 7: comensales por cuadro. Por defecto comen todos (editable por el usuario).
    const eatersFor = (slot) => (slotEaters[slot] !== undefined ? slotEaters[slot] : familyMembers.map(m => m.user_id));
    const toggleSlotEater = (slot, id) => setSlotEaters(prev => {
        const cur = prev[slot] !== undefined ? prev[slot] : familyMembers.map(m => m.user_id);
        const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
        return { ...prev, [slot]: next };
    });
    // Chips para elegir quiénes comen en un cuadro concreto (reutilizado por ambos planes múltiples).
    const renderSlotEaters = (slot) => {
        if (!familyMembers.length) return null;
        const chosen = eatersFor(slot);
        return (
            <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <UsersThree size={13} weight="fill" color="#F7B27B" /> ¿Quiénes comen?
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {familyMembers.map(m => {
                        const on = chosen.includes(m.user_id);
                        return (
                            <button type="button" key={m.user_id} onClick={() => toggleSlotEater(slot, m.user_id)} aria-pressed={on}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 12px', minHeight: 40, borderRadius: 999, cursor: 'pointer',
                                    border: on ? '1.5px solid #FF9F43' : '1.5px solid #e7dccb',
                                    background: on ? '#FFF3E6' : '#fff', transition: 'all 0.15s',
                                    fontSize: '0.78rem', fontWeight: 700, color: on ? '#2A2118' : '#b6a894',
                                }}>
                                {on && <Check size={12} weight="bold" color="#e67e22" />}
                                {m.name}
                            </button>
                        );
                    })}
                </div>
                {chosen.length === 0 && <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Warning size={12} weight="fill" /> Selecciona al menos una persona para este cuadro.</div>}
            </div>
        );
    };
    useEffect(() => {
        const fid = currentFamily?.family_id || currentFamily?.id;
        if (!fid) { setFamilyMembers([]); setSelectedMemberIds([]); return; }
        userFamilyService.getMembers(fid)
            .then(ms => { setFamilyMembers(ms || []); setSelectedMemberIds((ms || []).map(m => m.user_id)); })
            .catch(() => { setFamilyMembers([]); setSelectedMemberIds([]); });
    }, [currentFamily]);
    const [suggestionTurns, setSuggestionTurns] = useState({}); // turno por cada sugerencia (índice -> turno)

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
                const now = new Date();
                now.setHours(12, 0, 0, 0);
                
                const inventoryItems = filtered.map(item => {
                    const ing = allIngredients.find(i => i.ingredient_id === item.ingredient_id);
                    const name = ing ? ing.name : `Ingrediente #${item.ingredient_id}`;
                    const unit = ing ? ing.unit : '';
                    const category = ing && ing.category ? ing.category : 'otro';
                    
                    let isExpired = false;
                    if (item.expiration_date && !item.is_frozen) {
                        const dateStr = typeof item.expiration_date === 'string' && item.expiration_date.includes('T') ? item.expiration_date.split('T')[0] : item.expiration_date;
                        const exp = new Date(dateStr + 'T12:00:00');
                        exp.setHours(12, 0, 0, 0);
                        if (exp < now) isExpired = true;
                    }

                    return {
                        id: item.inventory_id,
                        name,
                        quantity: Number(item.quantity) || 0,
                        unit,
                        category,
                        expiration_date: item.expiration_date,
                        is_frozen: item.is_frozen,
                        frozen_at: item.frozen_at,
                        isExpired
                    };
                });
                
                setMyInventory(inventoryItems);
                setSelectedIngredients(inventoryItems.filter(i => !i.isExpired).map(i => i.id)); // pre-seleccionar solo los NO vencidos
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

    // Detecta grupos importantes ausentes entre los ingredientes seleccionados (no bloquea)
    const getMissingBalanceGroups = (items) => {
        const cats = new Set(items.map(i => (i.category || 'otro')));
        const missing = [];
        if (!cats.has('proteína')) missing.push('proteína');
        if (!cats.has('grano')) missing.push('carbohidratos');
        if (!(cats.has('vegetal') || cats.has('fruta'))) missing.push('vegetales');
        return missing;
    };

    // PASO 1: Pedir sugerencias a la IA
    const handleAISuggest = async () => {
        if (selectedIngredients.length === 0) { showToast("Selecciona al menos un ingrediente."); return; }
        if (selectedSlots.length === 0) { showToast("Selecciona al menos un cuadro en el calendario."); return; }

        const selectedItems = myInventory.filter(i => selectedIngredients.includes(i.id));
        // Aviso de balance (informativo, NO impide continuar)
        setBalanceWarning(getMissingBalanceGroups(selectedItems));

        setAiStep('suggestions');
        setIsGenerating(true);
        setAiError(null);
        setSuggestions([]);
        setSuggestionTurns({});
        setAiChosenTurn(null);

        try {
            // Solo lo realmente disponible (inventario − reservado por comidas ya planificadas).
            const ingredientsWithQty = availableLinesFor(selectedItems);
            if (ingredientsWithQty.length === 0) {
                setAiStep('config');
                setPlanNotice({ title: 'Todo está reservado', reason: 'Los ingredientes que elegiste ya están apartados por comidas que planificaste y aún no cocinas.', hint: 'Marca alguna comida como hecha, quítala del plan, o agrega más ingredientes al inventario.' });
                return;
            }
            const data = await aiService.suggest(ingredientsWithQty);

            if (data.suggestions && data.suggestions.length > 0) {
                setSuggestions(data.suggestions);
            } else if (data.error) {
                // Error real (conexión, API): avisar con el popup animado.
                setAiStep('config');
                setPlanNotice({ title: 'No se pudo generar', reason: data.error, hint: 'Revisa tu conexión e intenta de nuevo en un momento.' });
            } else {
                // La IA no devolvió recetas: NUNCA quedarse en blanco sin avisar.
                setSuggestions([]);
                setAiStep('config');
                setPlanNotice({
                    title: 'No encontramos un menú',
                    reason: 'La IA no pudo crear una receta viable con esos ingredientes.',
                    hint: 'Prueba seleccionando más ingredientes o combinándolos distinto. Un plato suele necesitar una base (arroz, pasta, papa…), una proteína y algo de vegetales.',
                });
            }
        } catch (err) {
            console.error('Error en sugerencias IA:', err);
            setAiStep('config');
            setPlanNotice({ title: 'Sin conexión con la IA', reason: 'No se pudo conectar con el Chef IA.', hint: 'Revisa tu internet e intenta de nuevo.' });
        } finally {
            setIsGenerating(false);
        }
    };

    // Bloque 7: generar un PLAN con una receta DISTINTA por cada cuadro seleccionado.
    const handleGeneratePlan = async () => {
        if (selectedIngredients.length === 0) { showToast('Selecciona al menos un ingrediente.'); return; }
        if (selectedSlots.length < 2) { showToast('Selecciona 2 o más cuadros para un plan variado.'); return; }
        const slots = [...selectedSlots];
        setAiStep('plan');
        setPlanGenerating(true);
        setPlanItems(slots.map(s => ({ slot: s, title: null, recipe: null, status: 'pending' })));
        try {
            const selectedItems = myInventory.filter(i => selectedIngredients.includes(i.id));
            // Solo lo realmente disponible (inventario − reservado por comidas ya planificadas).
            const ingredientsWithQty = availableLinesFor(selectedItems);
            const fid = currentFamily?.family_id || currentFamily?.id;
            if (ingredientsWithQty.length === 0) {
                setAiStep('config');
                setPlanNotice({ title: 'Todo está reservado', reason: 'Los ingredientes que elegiste ya están apartados por comidas que planificaste y aún no cocinas.', hint: 'Marca alguna comida como hecha, quítala del plan, o agrega más ingredientes al inventario.' });
                return;
            }
            const generatedDishes = [];
            const sugg = await aiService.suggest(ingredientsWithQty, slots.length + 2); // extra por si repite
            const titles = [...new Set((sugg.suggestions || []).map(s => s.title).filter(Boolean))];
            if (titles.length === 0) {
                setAiStep('config');
                setPlanNotice({ title: 'No encontramos recetas', reason: 'La IA no pudo proponer platos con esos ingredientes.', hint: 'Selecciona más ingredientes o combínalos distinto para armar el plan variado.' });
                return;
            }
            for (let i = 0; i < slots.length; i++) {
                const title = titles[i] || titles[i % Math.max(1, titles.length)] || `Plato ${i + 1}`;
                setPlanItems(prev => prev.map((p, idx) => idx === i ? { ...p, title, status: 'loading' } : p));
                try {
                    const data = await aiService.generate(title, ingredientsWithQty, fid);
                    const r = data.recipe;
                    const ingList = data.ingredients || [];
                    const dish = {
                        name: r.title, cal: r.calories_per_serving,
                        time: r.preparation_time ? `${r.preparation_time} min` : 'N/A',
                        img: r.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400',
                        ingredients: ingList.map(it => { const mp = it.measure_qty && it.measure_unit ? `${it.measure_qty} ${it.measure_unit} de ` : ''; const qp = it.quantity ? `(${it.quantity} ${it.unit})` : `(${it.unit})`; return pluralizeUnits(`${mp}${it.name} ${qp}`); }),
                        steps: r.instructions ? r.instructions.split('\n').filter(Boolean) : [],
                        description: r.description || '', recipe_id: r.recipe_id, servings: 1,
                    };
                    generatedDishes.push(dish);
                    setPlanItems(prev => prev.map((p, idx) => idx === i ? { ...p, recipe: dish, status: 'done' } : p));
                } catch (e) {
                    console.error('Error generando receta del plan:', e);
                    setPlanItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error' } : p));
                }
            }
            // Aviso "no alcanza": si las recetas del plan piden más de lo disponible.
            const shortfalls = computePlanShortfalls(generatedDishes);
            if (shortfalls.length) setShortfallNotice({ items: shortfalls });
        } catch (e) {
            console.error('Error en el plan variado:', e);
            setAiStep('config');
            setPlanNotice({ title: 'No se pudo generar el plan', reason: 'Hubo un problema al crear las recetas del plan.', hint: 'Revisa tu conexión e intenta de nuevo.' });
        } finally {
            setPlanGenerating(false);
        }
    };

    // Guarda una lista de { slot, dish } en sus cuadros (optimista, revierte por-cuadro si falla).
    // Compartido por el plan variado (IA) y el plan con recetas existentes.
    const savePlanEntries = async (entries) => {
        const DAY_ENUM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const MEAL_ENUM = { 'Desayuno': 'desayuno', 'Almuerzo': 'almuerzo', 'Cena': 'cena' };
        const valid = entries.filter(e => e.dish && e.dish.recipe_id);
        if (!valid.length) { showToast('No hay recetas para guardar.'); return; }
        // Sin plan activo no persistimos NADA (evita cuadros fantasma que desaparecen al recargar).
        if (!currentMenuPlan) { showToast('No hay un plan de menú activo. Recarga la página e intenta de nuevo.', 'error'); return; }
        // Validación: cada receta debe tener al menos una persona que la coma.
        if (familyMembers.length > 0) {
            const sinComensales = valid.filter(e => !(Array.isArray(e.eaters) && e.eaters.length));
            if (sinComensales.length) {
                const labels = sinComensales.map(e => { const [d, t] = e.slot.split('-'); return `${weekDays[parseInt(d, 10)] || ''} · ${t}`; }).join(', ');
                showToast(`Selecciona al menos una persona en: ${labels}.`, 'error');
                return;
            }
        }
        // eaters: array de user_id elegidos; vacío/undefined = toda la familia (null en BD).
        const eatersOf = (e) => (Array.isArray(e.eaters) && e.eaters.length ? e.eaters : null);
        const fid = currentFamily?.family_id || currentFamily?.id;
        const startDateStr = (currentMenuPlan.start_date || '').split('T')[0];

        // 1) Validar caducidad por cuadro (igual que el flujo de una receta): los vencidos se OMITEN.
        const toSave = [];
        let blockedCount = 0;
        const blockedDays = new Set();
        for (const e of valid) {
            const [dayIndexStr] = e.slot.split('-');
            const dayIndex = parseInt(dayIndexStr, 10);
            let ok = true;
            if (fid && startDateStr) {
                const scheduledDate = new Date(`${startDateStr}T12:00:00`);
                scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
                try {
                    const validation = await recipesService.validateExpiration({
                        recipe_id: e.dish.recipe_id,
                        family_id: fid,
                        scheduled_date: scheduledDate.toISOString().split('T')[0],
                    });
                    if (validation && validation.valid === false) { ok = false; blockedCount++; blockedDays.add(DAY_ENUM[dayIndex]); }
                } catch (err) { console.error('Error validando caducidad (plan):', err); /* error de red: no bloquear */ }
            }
            if (ok) toSave.push(e);
        }
        if (!toSave.length) {
            showToast(`No se pudo planificar: ingredientes vencidos (${[...blockedDays].join(', ')}).`, 'error');
            return;
        }

        // 2) Pintado optimista SOLO de los cuadros que sí se guardarán.
        setPlannerData(prev => { const n = { ...prev }; toSave.forEach((e) => { n[e.slot] = { ...e.dish, eaters: eatersOf(e) }; }); return n; });

        // 3) Persistir (revierte por-cuadro si un guardado falla).
        let savedCount = 0, failedCount = 0;
        for (const e of toSave) {
            const { slot, dish } = e;
            const [dayIndexStr, type] = slot.split('-');
            const dayIndex = parseInt(dayIndexStr, 10);
            try {
                const saved = await dailyMealsService.save({ menu_plan_id: currentMenuPlan.menu_plan_id, recipe_id: dish.recipe_id, meal_type: MEAL_ENUM[type] || type.toLowerCase(), day_of_week: DAY_ENUM[dayIndex], eaters: eatersOf(e) });
                setPlannerData(prev => ({ ...prev, [slot]: { ...prev[slot], daily_meal_id: saved.daily_meal_id } }));
                savedCount++;
            } catch (err) {
                failedCount++;
                console.error('Error guardando plan:', err);
                setPlannerData(prev => { const n = { ...prev }; delete n[slot]; return n; });
            }
        }

        // 4) Notificar SIEMPRE el resultado (guardados / vencidos omitidos / fallidos).
        const parts = [];
        if (savedCount > 0) parts.push(`${savedCount} ${savedCount === 1 ? 'agregada' : 'agregadas'}`);
        if (blockedCount > 0) parts.push(`${blockedCount} con ingredientes vencidos`);
        if (failedCount > 0) parts.push(`${failedCount} no se pudo guardar`);
        const tone = savedCount > 0 ? ((blockedCount || failedCount) ? 'warning' : 'success') : 'error';
        showToast(savedCount > 0 ? `Plan: ${parts.join(' · ')}.` : 'No se pudo guardar el plan.', tone);
        handleCloseModal();
    };

    // Confirmar el plan variado (IA): guarda cada receta generada en su cuadro.
    const handleConfirmPlanMulti = async () => {
        const done = planItems.filter(p => p.status === 'done' && p.recipe?.recipe_id);
        if (!done.length) { showToast('No hay recetas generadas para guardar.'); return; }
        await savePlanEntries(done.map(p => ({ slot: p.slot, dish: p.recipe, eaters: eatersFor(p.slot) })));
    };

    // Bloque 7 (existentes): asigna/quita una receta ya creada a un cuadro concreto.
    const assignRecipeToSlot = (slot, recipeIdStr) => {
        if (!recipeIdStr) { setSlotAssignments(prev => { const n = { ...prev }; delete n[slot]; return n; }); return; }
        const r = existingRecipes.find(x => String(x.recipe_id) === String(recipeIdStr));
        if (!r) return;
        const dish = {
            name: r.title,
            cal: r.calories_per_serving,
            time: r.preparation_time ? `${r.preparation_time} min` : 'N/A',
            img: r.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400',
            ingredients: (Array.isArray(r.ingredients) ? r.ingredients : []).map(pluralizeUnits),
            steps: r.instructions ? r.instructions.split('\n').filter(Boolean) : [],
            description: r.description || '',
            recipe_id: r.recipe_id,
            servings: r.servings || 2,
        };
        setSlotAssignments(prev => ({ ...prev, [slot]: dish }));
    };

    // Confirmar el plan con recetas existentes: guarda cada asignación en su cuadro.
    const handleConfirmExistingPlan = async () => {
        const entries = selectedSlots.filter(s => slotAssignments[s]).map(s => ({ slot: s, dish: slotAssignments[s], eaters: eatersFor(s) }));
        if (!entries.length) { showToast('Asigna al menos una receta a un cuadro.'); return; }
        await savePlanEntries(entries);
    };

    // PASO 2: Generar receta (para 1 persona) y pasar al paso de personas
    const handlePickSuggestion = async (suggestion, turn) => {
        setAiChosenTurn(turn || null);
        setAiStep('generating');
        setIsGenerating(true);
        setAiError(null);

        try {
            const ingredientsWithQty = myInventory
                .filter(i => selectedIngredients.includes(i.id))
                .map(i => `${i.name} (${i.quantity} ${i.unit})`);
            // La IA genera para 1 persona. El escalado ocurre en handleConfirmAIServings.
            const data = await aiService.generate(suggestion.title, ingredientsWithQty, currentFamily?.family_id || currentFamily?.id);
            const recipe = data.recipe;
            const ingList = data.ingredients || [];

            const dish = {
                name: recipe.title,
                cal: recipe.calories_per_serving,
                time: recipe.preparation_time ? `${recipe.preparation_time} min` : 'N/A',
                img: recipe.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400',
                // Ingredientes como strings para escalar en frontend
                ingredients: ingList.map(i => {
                    const measurePart = i.measure_qty && i.measure_unit ? `${i.measure_qty} ${i.measure_unit} de ` : '';
                    const qtyPart = i.quantity ? `(${i.quantity} ${i.unit})` : `(${i.unit})`;
                    return pluralizeUnits(`${measurePart}${i.name} ${qtyPart}`);
                }),
                steps: recipe.instructions ? recipe.instructions.split('\n').filter(Boolean) : [],
                description: recipe.description || '',
                recipe_id: recipe.recipe_id,
                servings: 1, // siempre 1, el escalado es responsabilidad del planificador
            };

            setAiDish(dish);
            setAiPlanServings(1);
            setAiStep('servings'); // paso intermedio: elegir cuántas personas
        } catch (err) {
            console.error('Error generando receta:', err);
            setAiError('Error al generar la receta. Intenta con otra opción.');
            setAiStep('suggestions');
        } finally {
            setIsGenerating(false);
        }
    };

    // Escalar ingredientes de una receta IA (formato "1 cucharada de Nombre (qty unit)" o "Nombre (qty unit)")
    const scaleAIDish = (dish, persons, plate = false) => {
        if (!dish.ingredients || dish.ingredients.length === 0) return dish.ingredients || [];
        if (persons === 1 && !plate) return dish.ingredients;
        return dish.ingredients.map(ing => {
            const match = ing.match(/^(?:([\d.]+)\s+(.+?)\s+de\s+)?(.+?)\s*\(([\d.]+)\s*(.+?)\)$/);
            if (!match) return ing;

            const mQty = match[1] ? parseFloat(match[1]) : null;
            const mUnit = match[2] || '';
            const name = match[3].trim();
            const bQty = parseFloat(match[4]);
            const bUnit = match[5].trim();

            // Cantidad base escalada. En modo "plate" (ya servido) convertimos a gramos lo que se pesa.
            let outQty = roundQty(bQty * persons, bUnit);
            let outUnit = bUnit;
            if (plate) {
                const p = plateAmount(name, bQty * persons, bUnit);
                outQty = p.qty; outUnit = p.unit;
            }
            if (mQty) {
                const scaledMQty = roundQty(mQty * persons, mUnit);
                return pluralizeUnits(`${scaledMQty} ${mUnit} de ${name} (${outQty} ${outUnit})`);
            } else {
                return pluralizeUnits(`${name} (${outQty} ${outUnit})`);
            }
        });
    };

    // PASO 3: Confirmar personas y agregar al planificador
    const handleConfirmAIServings = async () => {
        if (!aiDish) return;
        // Validación: debe comer al menos una persona.
        if (familyMembers.length > 0 && selectedMemberIds.length === 0) {
            showToast('Selecciona al menos una persona que comerá esta receta.', 'error');
            return;
        }
        // Sin plan activo NO pintamos nada (evita "fantasmas" que desaparecen al recargar).
        if (!currentMenuPlan) { showToast('No hay un plan de menú activo. Recarga la página e intenta de nuevo.', 'error'); return; }
        const DAY_ENUM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const MEAL_ENUM = { 'Desayuno': 'desayuno', 'Almuerzo': 'almuerzo', 'Cena': 'cena' };

        // La receta se guarda con sus servings BASE; el detalle del plato escala solo por familia.
        const base = aiDish.servings || 1;

        // Si se eligió un turno en el paso de sugerencias, se aplica a los DÍAS
        // seleccionados. En modo 'edit' se IGNORA el turno: se respeta SIEMPRE el cuadro exacto.
        let targetSlots = (aiChosenTurn && planMode !== 'edit')
            ? [...new Set(selectedSlots.map(s => parseInt(s.split('-')[0], 10)))].map(d => `${d}-${aiChosenTurn}`)
            : selectedSlots;

        // En modo 'plan' no pisamos cuadros ya planificados (editar sí reemplaza a propósito).
        if (planMode !== 'edit') {
            const before = targetSlots.length;
            targetSlots = targetSlots.filter(slot => !plannerData[slot]);
            if (targetSlots.length < before) {
                showToast('Omití los cuadros que ya estaban planificados. Para cambiarlos, edítalos desde el calendario.', 'info');
            }
            if (targetSlots.length === 0) { handleCloseModal(); return; }
        }

        // -- VALIDAR CADUCIDAD: se OMITEN (no abortan todo) los días con ingredientes vencidos --
        if (currentMenuPlan && aiDish.recipe_id) {
            const okSlots = [];
            const blockedDays = new Set();
            for (const slot of targetSlots) {
                const [dayIndexStr] = slot.split('-');
                const dayIndex = parseInt(dayIndexStr, 10);
                const startDateStr = currentMenuPlan.start_date.split('T')[0];
                const scheduledDate = new Date(`${startDateStr}T12:00:00`);
                scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
                let ok = true;
                try {
                    const validation = await recipesService.validateExpiration({
                        recipe_id: aiDish.recipe_id,
                        family_id: currentFamily.family_id || currentFamily.id,
                        scheduled_date: scheduledDate.toISOString().split('T')[0]
                    });
                    if (validation && !validation.valid) { ok = false; blockedDays.add(DAY_ENUM[dayIndex]); }
                } catch (err) { console.error('Error validando caducidad IA', err); }
                if (ok) okSlots.push(slot);
            }
            if (blockedDays.size) showToast(`Omití ${blockedDays.size} ${blockedDays.size === 1 ? 'día' : 'días'} con ingredientes vencidos: ${[...blockedDays].join(', ')}.`, 'warning');
            targetSlots = okSlots;
            if (targetSlots.length === 0) { handleCloseModal(); return; }
        }

        // Agregar al planner UI. Guardamos los ingredientes BASE + servings base de la
        // receta (no los ya escalados): así el detalle escala igual que al recargar.
        // Bloque 7: quiénes comen (los elegidos en el paso de personas). Vacío = toda la familia (null).
        const eatersVal = (Array.isArray(selectedMemberIds) && selectedMemberIds.length) ? selectedMemberIds : null;
        const baseDish = { ...aiDish, servings: base, eaters: eatersVal };
        const newMenu = { ...plannerData };
        targetSlots.forEach(slot => { newMenu[slot] = { ...baseDish }; });
        setPlannerData(newMenu);

        // Persistir en BD
        let savedCount = 0, failedCount = 0;
        if (currentMenuPlan && aiDish.recipe_id) {
            for (const slot of targetSlots) {
                const [dayIndexStr, type] = slot.split('-');
                const dayIndex = parseInt(dayIndexStr, 10);
                try {
                    const saved = await dailyMealsService.save({
                        menu_plan_id: currentMenuPlan.menu_plan_id,
                        recipe_id: aiDish.recipe_id,
                        meal_type: MEAL_ENUM[type] || type.toLowerCase(),
                        day_of_week: DAY_ENUM[dayIndex],
                        eaters: eatersVal,
                    });
                    setPlannerData(prev => ({
                        ...prev,
                        [slot]: { ...prev[slot], daily_meal_id: saved.daily_meal_id },
                    }));
                    savedCount++;
                } catch (saveErr) {
                    failedCount++;
                    console.error('Error guardando meal en BD:', saveErr);
                    // Revertir el pintado optimista de este cuadro (no se persistió en BD).
                    setPlannerData(prev => { const n = { ...prev }; delete n[slot]; return n; });
                }
            }
        }

        // Bloque 8: el inventario ya NO se descuenta al planificar (era un estimado).
        // Se descuenta en el momento REAL, al marcar la comida como cocinada.

        // Notificar el resultado del guardado (el sistema avisa siempre)
        if (currentMenuPlan && aiDish.recipe_id) {
            if (savedCount > 0 && failedCount === 0) showToast('Receta agregada al plan.', 'success');
            else if (savedCount > 0) showToast('Se agregó, pero algún cuadro no se pudo guardar.', 'warning');
            else showToast('No se pudo guardar en el plan. Revisa tu conexión e intenta de nuevo.', 'error');
        }

        // Cerrar modal y resetear todo
        setShowModal(false);
        setAiStep('config');
        setSuggestions([]);
        setAiDish(null);
        setAiPlanServings(1);
        setSelectedSlots([]);
        setAiChosenTurn(null);
        setSuggestionTurns({});
        setAiFromExisting(false);
        setPlanMode('plan');
        setSlotAssignments({});
        setSlotEaters({});
    };

    // Resetear al cerrar modal
    const handleCloseModal = () => {
        setShowModal(false);
        setAiStep('config');
        setSuggestions([]);
        setAiError(null);
        setBalanceWarning([]);
        setAiDish(null);
        setAiPlanServings(1);
        setSelectedSlots([]);
        setAiChosenTurn(null);
        setSuggestionTurns({});
        setAiFromExisting(false);
        setRecipeSearch('');
        setPlanMode('plan');
        setPlanItems([]);
        setPlanGenerating(false);
        setSlotAssignments({});
        setSlotEaters({});
        setEditingExisting(false);
        setCalSelectMode(false);
        setCalSelected([]);
        setCalMode(null);
    };

    // Abrir el planificador para un cuadro (día+turno) concreto.
    // mode='plan' (cuadro vacío) → va directo al modo IA. mode='edit' (Cambiar una receta ya
    // planificada) → pregunta primero si quiere IA o una receta existente (item 3).
    const handlePlanSlot = (dayIndex, type, mode = 'plan') => {
        if (userRole === 'ayudante') { showToast('No tienes permiso para planificar.'); return; }
        setPlanMode(mode);
        setSelectedSlots([`${dayIndex}-${type}`]);
        setAiChosenTurn(null);
        setAiFromExisting(false);
        setAiDish(null);
        setAiStep(mode === 'edit' ? 'choose' : 'config');
        setShowModal(true);
    };

    // ── Selección múltiple desde el calendario ──
    // La PRIMERA casilla decide el modo: vacía → 'plan' (solo vacías); con receta → 'manage'
    // (solo planificadas, para editar o eliminar).
    const exitCalSelect = () => { setCalSelectMode(false); setCalSelected([]); setCalMode(null); };
    const toggleCalSelect = (dayIndex, type, hasMeal) => {
        if (userRole === 'ayudante') { showToast('No tienes permiso para planificar.'); return; }
        const key = `${dayIndex}-${type}`;
        // Deseleccionar siempre permitido; si queda vacío, se libera el modo.
        if (calSelected.includes(key)) {
            const next = calSelected.filter(k => k !== key);
            setCalSelected(next);
            if (next.length === 0) setCalMode(null);
            return;
        }
        const mode = calMode || (hasMeal ? 'manage' : 'plan');
        if (mode === 'plan') {
            if (hasMeal) { showToast('Estás planificando cuadros vacíos. Para editar o eliminar recetas, sal y empieza tocando una ya planificada.', 'info'); return; }
            // Validaciones de fecha (solo al planificar cuadros nuevos).
            if (expiredDayIndexes.has(dayIndex)) { showToast('Ese día tiene ingredientes vencidos, no puedes planificar ahí.', 'warning'); return; }
            if (weekOffset === 0) {
                const now = new Date();
                const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
                const currentHour = now.getHours();
                if (dayIndex < currentDayIndex) { showToast('Ese día ya pasó, no puedes planificar ahí.', 'warning'); return; }
                if (dayIndex === currentDayIndex && ((type === 'Desayuno' && currentHour >= 11) || (type === 'Almuerzo' && currentHour >= 17) || (type === 'Cena' && currentHour >= 22))) {
                    showToast('Ese horario de hoy ya pasó.', 'warning'); return;
                }
            }
        } else { // manage
            if (!hasMeal) { showToast('Estás gestionando recetas planificadas. Toca solo cuadros que ya tengan receta.', 'info'); return; }
        }
        if (!calMode) setCalMode(mode);
        setCalSelected(prev => [...prev, key]);
    };
    // "Planificar (N)": abre el asistente con esos cuadros VACÍOS ya elegidos.
    const startPlanFromSelection = () => {
        if (calSelected.length === 0) { showToast('Toca al menos un cuadro vacío para planificar.', 'info'); return; }
        setPlanMode('plan');
        setSelectedSlots([...calSelected]);
        setAiChosenTurn(null);
        setAiFromExisting(false);
        setAiDish(null);
        setAiStep('config');
        setShowModal(true);
        exitCalSelect();
    };
    // "Editar (N)": abre la interfaz de asignación PRECARGADA con la receta y comensales
    // actuales de cada cuadro planificado; al guardar actualiza (no crea encima).
    const startEditSelection = () => {
        const slots = [...calSelected];
        if (slots.length === 0) { showToast('Toca al menos una receta planificada para editar.', 'info'); return; }
        const preAssign = {}, preEaters = {};
        slots.forEach(s => {
            const m = plannerData[s];
            if (!m) return;
            preAssign[s] = { ...m };
            preEaters[s] = (Array.isArray(m.eaters) && m.eaters.length) ? [...m.eaters] : familyMembers.map(x => x.user_id);
        });
        setSlotAssignments(preAssign);
        setSlotEaters(preEaters);
        setSelectedSlots(slots);
        setEditingExisting(true);
        setPlanMode('plan');
        setAiStep('existing');
        setAiChosenTurn(null);
        setAiFromExisting(false);
        setAiDish(null);
        setShowModal(true);
        loadExistingRecipes();
        setCalSelectMode(false); // conservamos calSelected por si se cancela; se limpia al cerrar
    };
    // Guardar la edición múltiple: por cada cuadro, si cambió la receta hace upsert (revalida
    // caducidad); si solo cambiaron los comensales, actualiza eaters (sin revalidar).
    const handleSaveEditMulti = async () => {
        if (!currentMenuPlan) { showToast('No hay un plan de menú activo. Recarga la página e intenta de nuevo.', 'error'); return; }
        const DAY_ENUM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const MEAL_ENUM = { 'Desayuno': 'desayuno', 'Almuerzo': 'almuerzo', 'Cena': 'cena' };
        // Validación: cada cuadro debe tener receta y al menos una persona.
        if (familyMembers.length > 0) {
            const sinPersonas = selectedSlots.filter(s => slotAssignments[s] && !(eatersFor(s) || []).length);
            if (sinPersonas.length) {
                const labels = sinPersonas.map(s => { const [d, t] = s.split('-'); return `${weekDays[parseInt(d, 10)] || ''} · ${t}`; }).join(', ');
                showToast(`Selecciona al menos una persona en: ${labels}.`, 'error');
                return;
            }
        }
        const fid = currentFamily?.family_id || currentFamily?.id;
        const startDateStr = (currentMenuPlan?.start_date || '').split('T')[0];
        let updated = 0, failed = 0, blocked = 0;
        const blockedDays = new Set();
        for (const slot of selectedSlots) {
            const dish = slotAssignments[slot];
            if (!dish || !dish.recipe_id) continue; // "Sin receta" en edición = sin cambio
            const original = plannerData[slot];
            const [dayIndexStr, type] = slot.split('-');
            const dayIndex = parseInt(dayIndexStr, 10);
            const eaters = (eatersFor(slot) || []);
            const eatersToPersist = eaters.length ? eaters : null;
            const recipeChanged = !original || String(original.recipe_id) !== String(dish.recipe_id);
            try {
                if (recipeChanged) {
                    // Revalidar caducidad para la nueva receta en ese día.
                    if (fid && startDateStr) {
                        const scheduledDate = new Date(`${startDateStr}T12:00:00`);
                        scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
                        try {
                            const v = await recipesService.validateExpiration({ recipe_id: dish.recipe_id, family_id: fid, scheduled_date: scheduledDate.toISOString().split('T')[0] });
                            if (v && v.valid === false) { blocked++; blockedDays.add(DAY_ENUM[dayIndex]); continue; }
                        } catch (e) { console.error('Error validando caducidad (editar):', e); }
                    }
                    const saved = await dailyMealsService.save({ menu_plan_id: currentMenuPlan.menu_plan_id, recipe_id: dish.recipe_id, meal_type: MEAL_ENUM[type] || type.toLowerCase(), day_of_week: DAY_ENUM[dayIndex], eaters: eatersToPersist });
                    setPlannerData(prev => ({ ...prev, [slot]: { ...dish, eaters: eatersToPersist, daily_meal_id: saved.daily_meal_id } }));
                    updated++;
                } else {
                    // Solo comensales: no revalida caducidad.
                    if (original.daily_meal_id) await dailyMealsService.updateEaters(original.daily_meal_id, eatersToPersist);
                    setPlannerData(prev => ({ ...prev, [slot]: { ...prev[slot], eaters: eatersToPersist } }));
                    updated++;
                }
            } catch (e) {
                failed++;
                console.error('Error guardando edición:', e);
            }
        }
        const parts = [];
        if (updated > 0) parts.push(`${updated} ${updated === 1 ? 'actualizada' : 'actualizadas'}`);
        if (blocked > 0) parts.push(`${blocked} con ingredientes vencidos (${[...blockedDays].join(', ')})`);
        if (failed > 0) parts.push(`${failed} con error`);
        const tone = updated > 0 ? ((blocked || failed) ? 'warning' : 'success') : 'error';
        showToast(updated > 0 ? `Cambios: ${parts.join(' · ')}.` : (blocked ? `No se guardó: ingredientes vencidos (${[...blockedDays].join(', ')}).` : 'No se pudo guardar.'), tone);
        handleCloseModal();
    };
    // "Eliminar (N)": pide confirmación para borrar las recetas planificadas seleccionadas.
    const requestBulkDelete = () => {
        if (calSelected.length === 0) { showToast('Toca al menos una receta planificada para eliminar.', 'info'); return; }
        setPendingBulkDelete([...calSelected]);
    };
    const confirmBulkDelete = async () => {
        const slots = pendingBulkDelete || [];
        setPendingBulkDelete(null);
        let deleted = 0, failed = 0;
        for (const slot of slots) {
            const meal = plannerData[slot];
            if (!meal) continue;
            setPlannerData(prev => { const n = { ...prev }; delete n[slot]; return n; });
            try {
                if (meal.daily_meal_id) await dailyMealsService.delete(meal.daily_meal_id);
                deleted++;
            } catch (e) {
                failed++;
                console.error('Error al eliminar (bulk):', e);
                setPlannerData(prev => ({ ...prev, [slot]: meal })); // revertir
            }
        }
        showToast(deleted > 0 ? `${deleted} ${deleted === 1 ? 'receta eliminada' : 'recetas eliminadas'}${failed ? ` · ${failed} con error` : ''}.` : 'No se pudo eliminar.', deleted > 0 ? (failed ? 'warning' : 'success') : 'error');
        exitCalSelect();
    };

    // Bloque 8: descuenta el inventario REAL cuando una comida se marca como cocinada (una sola vez).
    const deductForCooked = async (meal) => {
        const fid = currentFamily?.family_id || currentFamily?.id;
        if (!fid || !meal?.recipe_id || !meal?.daily_meal_id) return;
        const dedKey = `nv_ded_${meal.daily_meal_id}`;
        if (sessionStorage.getItem(dedKey)) return; // ya se descontó esta comida
        const base = Number(meal.servings) || 2;
        // Solo descuenta según quienes realmente comen (eaters); si no hay, toda la familia.
        const eaterMembers = (Array.isArray(meal.eaters) && meal.eaters.length)
            ? familyMembers.filter(m => meal.eaters.includes(m.user_id))
            : familyMembers;
        const factor = eaterMembers.length ? totalPortions(eaterMembers) : base;
        const mult = base > 0 ? factor / base : 1;
        try {
            await inventoryService.deduct(meal.recipe_id, fid, mult);
            sessionStorage.setItem(dedKey, '1');
            showToast('🧊 Inventario descontado por lo cocinado.', 'success');
        } catch (e) {
            console.error('Error al descontar inventario:', e);
            showToast('La comida se marcó como hecha, pero no se pudo descontar el inventario. Ajústalo a mano.', 'warning');
        }
    };

    // Bloque 8: aviso "¿cocinaste?" por franja horaria (una sola vez por sesión y por cuadro).
    // Desayuno tras 9h, almuerzo tras 16h, cena tras 22h; solo la semana actual.
    useEffect(() => {
        if (weekOffset !== 0) return;
        if (userRole === 'ayudante') return; // los ayudantes no marcan comidas ni descuentan inventario
        const now = new Date();
        const todayIndex = (now.getDay() + 6) % 7;
        const hour = now.getHours();
        const dateStr = now.toISOString().split('T')[0];
        const THRESHOLDS = [['Desayuno', 9], ['Almuerzo', 16], ['Cena', 22]];
        for (const [type, th] of THRESHOLDS) {
            if (hour < th) continue;
            const meal = plannerData[`${todayIndex}-${type}`];
            if (!meal || meal.is_completed) continue;
            const askKey = `nv_cookask_${dateStr}_${todayIndex}_${type}`;
            if (sessionStorage.getItem(askKey)) continue;
            setCookedPrompt({ meal, dayIndex: todayIndex, type, askKey });
            break; // uno a la vez
        }
    }, [plannerData, weekOffset]);

    const handleCookedYes = async () => {
        if (!cookedPrompt) return;
        if (userRole === 'ayudante') { setCookedPrompt(null); showToast('No tienes permiso para marcar comidas.'); return; }
        const { meal, dayIndex, type, askKey } = cookedPrompt;
        sessionStorage.setItem(askKey, '1');
        setCookedPrompt(null);
        try {
            await dailyMealsService.toggleComplete(meal.daily_meal_id, true);
            setPlannerData(prev => ({ ...prev, [`${dayIndex}-${type}`]: { ...prev[`${dayIndex}-${type}`], is_completed: 1 } }));
            await deductForCooked(meal);
        } catch (e) { showToast('No se pudo marcar la comida.'); }
    };
    const handleCookedNo = () => {
        if (!cookedPrompt) return;
        sessionStorage.setItem(cookedPrompt.askKey, '1');
        setCookedPrompt(null);
    };

    // Cargar las recetas que ya tiene la familia (modo "agregar receta existente")
    const loadExistingRecipes = async () => {
        const familyId = currentFamily?.family_id || currentFamily?.id;
        if (!familyId) return;
        setLoadingExisting(true);
        try {
            const data = await familyRecipesService.getByFamily(familyId);
            setExistingRecipes(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error cargando recetas existentes:', e);
            setExistingRecipes([]);
            showToast('No se pudieron cargar tus recetas.', 'error');
        } finally {
            setLoadingExisting(false);
        }
    };

    // Ir al paso de receta existente
    const goToExisting = () => {
        setAiStep('existing');
        loadExistingRecipes();
    };

    // Agregar una receta YA CREADA a los slots seleccionados
    const handleAddExistingToSlots = async (r) => {
        if (selectedSlots.length === 0) { showToast('Selecciona al menos un cuadro en el calendario.'); return; }
        const DAY_ENUM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const MEAL_ENUM = { 'Desayuno': 'desayuno', 'Almuerzo': 'almuerzo', 'Cena': 'cena' };

        const meal = {
            name: r.title,
            cal: r.calories_per_serving,
            time: r.preparation_time ? `${r.preparation_time} min` : 'N/A',
            img: r.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400',
            ingredients: (Array.isArray(r.ingredients) ? r.ingredients : []).map(pluralizeUnits),
            steps: r.instructions ? r.instructions.split('\n').filter(Boolean) : [],
            description: r.description || '',
            recipe_id: r.recipe_id,
            servings: r.servings || 2,
        };

        // Bloque 3: en vez de agregar directo, pasamos al paso "¿quiénes comerán?" para
        // escalar las porciones por integrante. El guardado + descuento ocurre en
        // handleConfirmAIServings (compartido con el flujo IA). `meal.servings` es la base.
        setAiDish(meal);
        setAiFromExisting(true);
        setAiStep('servings');
    };

    // ── BORRADO CON CONFIRMACIÓN ──
    // Lo que llama el botón de la papelera: abre la capa de confirmación.
    const requestDeleteMeal = (dayIndex, type) => {
        if (userRole === 'ayudante') { showToast('No tienes permiso para editar el plan.'); return; }
        const meal = plannerData[`${dayIndex}-${type}`];
        if (!meal) return;
        setPendingDelete({ dayIndex, type, name: meal.name });
    };

    // Borrado real (tras confirmar)
    const confirmDeleteMeal = async () => {
        if (!pendingDelete) return;
        const { dayIndex, type } = pendingDelete;
        const key = `${dayIndex}-${type}`;
        const meal = plannerData[key];
        setPendingDelete(null);
        if (!meal) return;
        setPlannerData(prev => { const n = { ...prev }; delete n[key]; return n; });
        try {
            if (meal.daily_meal_id) await dailyMealsService.delete(meal.daily_meal_id);
            showToast('Receta eliminada del plan.', 'success');
        } catch (e) {
            console.error('Error al eliminar la comida:', e);
            // Restaurar: no se borró en BD, no debe desaparecer de la vista.
            setPlannerData(prev => ({ ...prev, [key]: meal }));
            showToast('No se pudo eliminar. Intenta de nuevo.', 'error');
        }
    };

    // Cuadrícula de slots reutilizable (paso IA y paso receta existente)
    const renderSlotGrid = () => {
        // Modo EDITAR: bloqueado a un solo cuadro (no se puede cambiar día ni comida)
        if (planMode === 'edit' && selectedSlots.length === 1) {
            const [dStr, t] = selectedSlots[0].split('-');
            const dName = weekDays[parseInt(dStr, 10)] || '';
            return (
                <div style={{ marginTop: 20 }}>
                    <div className="section-title"><CalendarBlank weight="fill" color="#FF9F43" /> Estás cambiando esta comida</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '12px 18px', borderRadius: 14, border: '2px solid #FF9F43', background: '#FFF7ED', fontWeight: 800, color: '#2A2118' }}>
                        <Check size={18} weight="bold" color="#e67e22" /> {dName} · {t}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#9b8d7c', marginTop: 10 }}>Solo elige la nueva receta. Para moverla a otro día, elimínala y planifícala de nuevo.</p>
                </div>
            );
        }
        return (
        <>
            <div className="section-title" style={{ marginTop: '20px' }}><CalendarBlank weight="fill" color="#FF9F43" /> ¿Dónde quieres agregar la receta?</div>
            <p style={{ fontSize: '0.85rem', color: '#9b8d7c', marginBottom: '15px' }}>Toca los cuadros libres para elegir. Los que tienen foto ya están planificados.</p>

            {expiredDayIndexes.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: '0.82rem', color: '#DC2626' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                    Los días en rojo tienen ingredientes vencidos y no están disponibles.
                </div>
            )}

            {(() => {
                const now = new Date();
                const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
                const currentHour = now.getHours();
                const isSlotDisabled = (dayIndex, meal) => {
                    if (dayIndex < currentDayIndex) return true;
                    if (dayIndex === currentDayIndex) {
                        if (meal === 'Desayuno' && currentHour >= 11) return true;
                        if (meal === 'Almuerzo' && currentHour >= 17) return true;
                        if (meal === 'Cena' && currentHour >= 22) return true;
                    }
                    return false;
                };
                // Celda reutilizable (misma lógica) para la cuadrícula desktop y el layout móvil.
                const renderCell = (dayIndex, meal) => {
                    const slotKey = `${dayIndex}-${meal}`;
                    const isSelected = selectedSlots.includes(slotKey);
                    const isPlanned = !isSelected && !!(plannerData && plannerData[slotKey]); // ya tiene comida
                    const isExpiredBlocked = expiredDayIndexes.has(dayIndex);
                    const isTimeDisabled = isSlotDisabled(dayIndex, meal);
                    const isBlocked = isExpiredBlocked || isTimeDisabled || isPlanned;
                    // Toda acción bloqueada NOTIFICA el porqué al usuario.
                    const handleCell = () => {
                        if (isSelected) { toggleSlot(dayIndex, meal); return; } // permitir deseleccionar
                        if (isPlanned) { showToast('Ese cuadro ya tiene una comida planificada. Para cambiarla o quitarla, tócala en el calendario.', 'info'); return; }
                        if (isExpiredBlocked) { showToast('Ese día tiene ingredientes vencidos, no puedes planificar ahí.', 'warning'); return; }
                        if (isTimeDisabled) { showToast(dayIndex < currentDayIndex ? 'Ese día ya pasó, no puedes planificar ahí.' : 'Ese horario de hoy ya pasó.', 'warning'); return; }
                        toggleSlot(dayIndex, meal);
                    };
                    return (
                        <div key={slotKey} onClick={handleCell} title={isPlanned ? 'Ya planificado' : (isExpiredBlocked ? 'Ingrediente vencido este día' : (isTimeDisabled ? 'Horario pasado' : ''))} style={{
                            aspectRatio: '1', borderRadius: '8px', overflow: 'hidden',
                            border: isPlanned ? '2px solid #F7B27B' : (isExpiredBlocked ? '2px solid #FECACA' : (isTimeDisabled ? '2px solid #e2e8f0' : (isSelected ? '2px solid #FF9F43' : '2px dashed #e2e8f0'))),
                            background: isPlanned ? '#FFF3E6' : (isExpiredBlocked ? '#FEF2F2' : (isTimeDisabled ? '#f1f5f9' : (isSelected ? '#fffaf0' : 'transparent'))),
                            cursor: isBlocked ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', minWidth: '40px', width: '100%',
                            opacity: (isExpiredBlocked || isTimeDisabled) ? 0.6 : 1,
                        }}>
                            {isPlanned
                                ? <img src={imgProxy(plannerData[slotKey].img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : isExpiredBlocked
                                    ? <span style={{ fontSize: '0.8rem', color: '#DC2626' }}>🚫</span>
                                    : isTimeDisabled
                                        ? <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>✕</span>
                                        : isSelected
                                            ? <Check size={18} weight="bold" color="#FF9F43" />
                                            : null}
                        </div>
                    );
                };
                return (
                    <>
                        {/* DESKTOP: cuadrícula 7 días × 3 comidas */}
                        <div className="plan-mini-grid" style={{ gridTemplateColumns: '70px repeat(7, 1fr)', gap: 8, paddingBottom: '10px' }}>
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
                                    {weekDays.map((_, dayIndex) => renderCell(dayIndex, meal))}
                                </React.Fragment>
                            ))}
                        </div>
                        {/* MÓVIL: vertical por día (sin scroll horizontal, cabe en cualquier iPhone) */}
                        <div className="plan-mini-vertical">
                            {weekDays.map((d, dayIndex) => {
                                const isBlocked = expiredDayIndexes.has(dayIndex);
                                return (
                                    <div key={d} className="pmv-day">
                                        <div className={`pmv-day-h${isBlocked ? ' blocked' : ''}`}>{d}{isBlocked && ' 🚫'}</div>
                                        <div className="pmv-meals">
                                            {mealTypesOptions.map(meal => (
                                                <div key={meal} className="pmv-cell">
                                                    <span className="pmv-cell-label">{meal}</span>
                                                    {renderCell(dayIndex, meal)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                );
            })()}
        </>
        );
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
                    {weekOffset === 0 && userRole !== 'ayudante' && (
                        <button
                            type="button"
                            onClick={() => { if (calSelectMode) exitCalSelect(); else { setCalSelectMode(true); setCalSelected([]); } }}
                            disabled={isGenerating}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 14,
                                border: `2px solid ${calSelectMode ? '#e67e22' : 'rgba(230,126,34,0.35)'}`,
                                background: calSelectMode ? 'linear-gradient(135deg,#FF9F43,#FF7F50)' : '#fff',
                                color: calSelectMode ? '#fff' : '#e67e22', fontWeight: 800, fontFamily: 'inherit',
                                cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: '0.95rem', transition: 'all 0.18s',
                            }}
                        >
                            {calSelectMode ? <><X size={18} weight="bold" /> Salir</> : <><CheckSquare size={18} weight="fill" /> Seleccionar varios</>}
                        </button>
                    )}
                    {weekOffset === 0 && (
                        <div className="btn-locked-wrapper" data-tooltip={userRole === 'ayudante' ? '🔒 Sin permiso' : undefined}>
                            <button
                                className={`btn-primary${userRole === 'ayudante' ? ' btn-locked' : ''}`}
                                onClick={userRole !== 'ayudante' ? () => { setPlanMode('plan'); setSelectedSlots([]); setAiStep('config'); setShowModal(true); } : undefined}
                                disabled={isGenerating}
                            >
                                {isGenerating ? <CircleNotch size={20} className="ph-spin" /> : <Sparkle size={20} weight="fill" />}
                                {isGenerating ? "Cocinando..." : "Asistente IA"}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Navegador de semanas */}
            {weekLabel && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, padding: '12px 18px', margin: '0 0 18px',
                    background: weekOffset < 0 ? 'linear-gradient(135deg, #F0F4FF, #E8EFFE)' : weekOffset > 0 ? 'linear-gradient(135deg, #F0FFF4, #E8FEEF)' : 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
                    borderRadius: 18,
                    border: weekOffset < 0 ? '1px solid #C7D7FE' : weekOffset > 0 ? '1px solid #BBF7D0' : '1px solid #FFE4B5',
                    boxShadow: '0 6px 18px rgba(150, 80, 20, 0.08)',
                }}>
                    <button
                        className="wk-arrow"
                        onClick={() => handleNavigate(-1)}
                        title="Semana anterior"
                    >
                        ‹
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarBlank size={20} weight="fill" color={weekOffset < 0 ? '#4F46E5' : weekOffset > 0 ? '#16A34A' : '#FF9F43'} />
                            <span style={{ fontWeight: 800, fontSize: '1.18rem', letterSpacing: '-0.01em', color: weekOffset < 0 ? '#3730A3' : weekOffset > 0 ? '#15803D' : '#92400E' }}>{weekLabel}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: weekOffset < 0 ? '#6366F1' : weekOffset > 0 ? '#22C55E' : '#D97706' }}>
                            {weekOffset === 0 ? '✅ Esta semana' : weekOffset === -1 ? '📜 Semana pasada' : weekOffset < 0 ? `📜 Hace ${Math.abs(weekOffset)} semanas` : weekOffset === 1 ? '🔮 Próxima semana' : `🔮 En ${weekOffset} semanas`}
                        </span>
                    </div>

                    <button
                        className="wk-arrow"
                        onClick={() => handleNavigate(1)}
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
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.5rem', color: '#111827', fontWeight: 800 }}>
                                    {(() => {
                                        const M = { choose: [CalendarBlank, '¿Cómo quieres planificar?'], existing: [BookOpen, 'Tus recetas'], config: [ChefHat, 'Chef Inteligente'], suggestions: [Sparkle, 'Elige una Receta'], servings: [UsersThree, '¿Quiénes comerán?'], generating: [CircleNotch, 'Generando...'] };
                                        const [Ic, t] = (aiStep === 'existing' && editingExisting) ? [PencilSimple, 'Editar planificadas'] : (M[aiStep] || M.generating);
                                        return <><Ic size={24} weight="fill" color="#FF7F50" className={aiStep === 'generating' ? 'ph-spin' : ''} /> {t}</>;
                                    })()}
                                </h2>
                                <p style={{ margin: '4px 0 0', color: '#6B5E4F', fontSize: '0.95rem' }}>
                                    {aiStep === 'choose' ? 'Elige cómo agregar la receta' : aiStep === 'existing' ? (editingExisting ? 'Cambia la receta o los comensales de cada día' : 'Agrega una receta que ya tienes') : aiStep === 'config' ? 'Personaliza tu menú con IA' : aiStep === 'suggestions' ? 'La IA sugiere estos platos para ti' : aiStep === 'servings' ? 'Ajustamos las cantidades a cada persona según sus datos' : 'Creando tu receta completa...'}
                                </p>
                            </div>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10 }}>
                                <X size={24} color="#9b8d7c" />
                            </button>
                        </div>

                        {/* Contenido con Scroll */}
                        <div className="modal-scroll-content">

                            {/* Error / Válvula de Escape */}
                            {aiError && (
                                <div style={{ 
                                    background: '#FFFBEB', 
                                    border: '1px solid #FCD34D', 
                                    borderLeft: '4px solid #F59E0B',
                                    borderRadius: 12, 
                                    padding: '16px 20px', 
                                    marginTop: 16, 
                                    marginBottom: 16,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)'
                                }}>
                                    <div style={{ 
                                        background: '#FEF3C7', 
                                        borderRadius: '50%', 
                                        padding: 8, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#D97706" viewBox="0 0 256 256"><path d="M236.8,188.09L149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.35-12.19A23.51,23.51,0,0,0,236.8,188.09ZM223.2,196.1a8.32,8.32,0,0,1-7.75,4.23H40.55a8.32,8.32,0,0,1-7.75-4.23,7.51,7.51,0,0,1,0-7.86l87.45-151.87a8.75,8.75,0,0,1,15.5,0l87.45,151.87A7.51,7.51,0,0,1,223.2,196.1ZM128,136a8,8,0,0,1-8-8V96a8,8,0,0,1,16,0v32A8,8,0,0,1,128,136Zm0,48a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z"></path></svg>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', color: '#92400E', fontSize: '1.05rem', fontWeight: 800 }}>Atención</h4>
                                        <p style={{ margin: 0, color: '#B45309', fontSize: '0.95rem', lineHeight: 1.4 }}>
                                            {aiError}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── PASO 0: ELEGIR MODO ── */}
                            {aiStep === 'choose' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
                                    <button
                                        type="button"
                                        onClick={() => setAiStep('config')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                                            background: 'linear-gradient(135deg, #FFF3E6, #FFE7CF)',
                                            border: '2px solid rgba(255,159,67,0.35)', borderRadius: 18,
                                            padding: '20px 22px', cursor: 'pointer', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(255,159,67,0.25)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #FF9F43, #FF7F50)', color: '#fff' }}>
                                            <Sparkle size={26} weight="fill" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2A2118' }}>Generar con IA</div>
                                            <div style={{ fontSize: '0.88rem', color: '#6B5E4F' }}>La IA crea una receta con tus ingredientes</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={goToExisting}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                                            background: '#FFF9F2',
                                            border: '2px solid rgba(230,126,34,0.2)', borderRadius: 18,
                                            padding: '20px 22px', cursor: 'pointer', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(230,126,34,0.18)'; e.currentTarget.style.borderColor = '#FF9F43'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(230,126,34,0.2)'; }}
                                    >
                                        <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #FFB774, #FF9F43)', color: '#fff' }}>
                                            <BookOpen size={26} weight="fill" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2A2118' }}>Agregar receta existente</div>
                                            <div style={{ fontSize: '0.88rem', color: '#6B5E4F' }}>Elige una de las recetas que ya tienes</div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* ── PASO ALTERNATIVO: RECETA EXISTENTE ── */}
                            {aiStep === 'existing' && (
                                <>
                                    {!editingExisting && renderSlotGrid()}

                                    {(selectedSlots.length >= 2 || editingExisting) ? (
                                        /* ── MODO PLAN / EDICIÓN: una receta (puede ser distinta) por cada cuadro ── */
                                        (() => {
                                            const MEAL_ORDER = { 'Desayuno': 0, 'Almuerzo': 1, 'Cena': 2 };
                                            const orderedSlots = [...selectedSlots].sort((a, b) => {
                                                const [ad, am] = a.split('-'); const [bd, bm] = b.split('-');
                                                return (parseInt(ad, 10) - parseInt(bd, 10)) || ((MEAL_ORDER[am] ?? 0) - (MEAL_ORDER[bm] ?? 0));
                                            });
                                            const assignedCount = orderedSlots.filter(s => slotAssignments[s]).length;
                                            const recipeOpts = [{ value: '', label: 'Sin receta' }, ...existingRecipes.map(r => ({ value: String(r.recipe_id), label: `${r.title}${r.calories_per_serving ? ` · ${r.calories_per_serving} kcal` : ''}` }))];
                                            // En edición, asegurar que la receta ya planificada aparezca aunque no esté en la lista de la familia.
                                            if (editingExisting) {
                                                const have = new Set(recipeOpts.map(o => String(o.value)));
                                                orderedSlots.forEach(s => { const d = slotAssignments[s]; if (d && d.recipe_id && !have.has(String(d.recipe_id))) { have.add(String(d.recipe_id)); recipeOpts.push({ value: String(d.recipe_id), label: `${d.name}${d.cal ? ` · ${d.cal} kcal` : ''}` }); } });
                                            }
                                            return (
                                                <>
                                                    <div className="section-title" style={{ marginTop: 24 }}><BookOpen weight="fill" color="#FF9F43" /> {editingExisting ? 'Editar las recetas planificadas' : 'Asigna una receta a cada cuadro'}</div>
                                                    <p style={{ fontSize: '0.85rem', color: '#9b8d7c', marginBottom: 14 }}>{editingExisting ? 'Cambia la receta o los comensales de cada día. Se actualizará lo ya planificado (no se crea uno nuevo).' : 'Elige qué receta va en cada espacio. Pueden ser recetas distintas y puedes dejar alguno sin receta.'}</p>
                                                    {loadingExisting ? (
                                                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                                            <CircleNotch size={40} className="ph-spin" color="#FF9F43" />
                                                            <p style={{ color: '#6B5E4F', marginTop: 12, fontWeight: 600 }}>Cargando tus recetas...</p>
                                                        </div>
                                                    ) : existingRecipes.length === 0 ? (
                                                        <p style={{ color: '#9b8d7c', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No tienes recetas guardadas todavía. Créalas en la sección Recetas.</p>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                            {orderedSlots.map(slot => {
                                                                const [dStr, t] = slot.split('-');
                                                                const dName = weekDays[parseInt(dStr, 10)] || '';
                                                                const dish = slotAssignments[slot];
                                                                return (
                                                                    <div key={slot} style={{ background: '#FFF9F2', border: `1px solid ${dish ? 'rgba(255,159,67,0.5)' : 'rgba(230,126,34,0.18)'}`, borderRadius: 14, padding: 10 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                            <div style={{ flex: 'none', width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#F3EADF', display: 'grid', placeItems: 'center' }}>
                                                                                {dish ? <img src={imgProxy(dish.img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <CalendarBlank size={20} color="#c9b8a3" weight="fill" />}
                                                                            </div>
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 5 }}>{dName} · {t}</div>
                                                                                <NvSelect
                                                                                    value={dish ? String(dish.recipe_id) : ''}
                                                                                    onChange={val => assignRecipeToSlot(slot, val)}
                                                                                    placeholder="Elegir receta"
                                                                                    options={recipeOpts}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        {dish && renderSlotEaters(slot)}
                                                                    </div>
                                                                );
                                                            })}
                                                            <div style={{ fontSize: '0.82rem', color: '#6B5E4F', fontWeight: 700, textAlign: 'right', marginTop: 2 }}>{assignedCount} de {orderedSlots.length} asignadas</div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()
                                    ) : (
                                        /* ── MODO SIMPLE: una receta a los cuadros elegidos ── */
                                        <>
                                            <div className="section-title" style={{ marginTop: 24 }}><BookOpen weight="fill" color="#FF9F43" /> Elige una receta</div>

                                            <div style={{ position: 'relative', marginBottom: 14 }}>
                                                <MagnifyingGlass size={18} color="#9b8d7c" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="text"
                                                    value={recipeSearch}
                                                    onChange={e => setRecipeSearch(e.target.value)}
                                                    placeholder="Buscar receta..."
                                                    style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '2px solid rgba(230,126,34,0.2)', background: '#FFF9F2', fontSize: '0.95rem', color: '#2A2118', outline: 'none' }}
                                                />
                                            </div>

                                            {loadingExisting ? (
                                                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                                    <CircleNotch size={40} className="ph-spin" color="#FF9F43" />
                                                    <p style={{ color: '#6B5E4F', marginTop: 12, fontWeight: 600 }}>Cargando tus recetas...</p>
                                                </div>
                                            ) : (() => {
                                                const q = recipeSearch.trim().toLowerCase();
                                                const list = existingRecipes.filter(r => !q || (r.title || '').toLowerCase().includes(q));
                                                if (existingRecipes.length === 0) {
                                                    return <p style={{ color: '#9b8d7c', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No tienes recetas guardadas todavía. Créalas en la sección Recetas.</p>;
                                                }
                                                if (list.length === 0) {
                                                    return <p style={{ color: '#9b8d7c', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>Ninguna receta coincide con "{recipeSearch}".</p>;
                                                }
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {list.map(r => (
                                                            <div key={r.recipe_id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFF9F2', border: '1px solid rgba(230,126,34,0.18)', borderRadius: 14, padding: 10 }}>
                                                                <img src={imgProxy(r.image_url || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=200')} alt={r.title} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontWeight: 700, color: '#2A2118', fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: '#9b8d7c' }}>🔥 {r.calories_per_serving || '—'} kcal · ⏱️ {r.preparation_time ? `${r.preparation_time} min` : 'N/A'}</div>
                                                                </div>
                                                                <button
                                                                    className="btn-generate"
                                                                    style={{ flexShrink: 0, padding: '9px 14px' }}
                                                                    disabled={selectedSlots.length === 0}
                                                                    onClick={() => handleAddExistingToSlots(r)}
                                                                >
                                                                    Agregar <Check weight="bold" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </>
                            )}

                            {/* ── PASO 1: CONFIGURACIÓN ── */}
                            {aiStep === 'config' && (
                                <>
                                    {/* Enlace secundario: usar una receta que ya se tiene */}
                                    <button
                                        type="button"
                                        className="ia-existing-link"
                                        onClick={() => { setAiStep('existing'); loadExistingRecipes(); }}
                                    >
                                        <BookOpen size={16} weight="fill" /> ¿Prefieres una receta que ya tienes? Elígela aquí
                                    </button>

                                    {/* 1. Ingredientes del inventario real */}
                                    <div className="section-title"><ChefHat weight="fill" color="#FF9F43" /> Ingredientes en tu inventario</div>
                                    {loadingInventory ? (
                                        <p style={{ color: '#9b8d7c', fontSize: '0.9rem' }}>Cargando inventario...</p>
                                    ) : myInventory.length === 0 ? (
                                        <p style={{ color: '#9b8d7c', fontSize: '0.9rem' }}>No tienes ingredientes en el inventario. Agrega algunos primero.</p>
                                    ) : (
                                        <div className="chips-container">
                                            {myInventory.map(item => {
                                                const dateStr = item.expiration_date && (typeof item.expiration_date === 'string' && item.expiration_date.includes('T') ? item.expiration_date.split('T')[0] : item.expiration_date);
                                                const isExpiring = !item.isExpired && !item.is_frozen && item.expiration_date && (new Date(dateStr + 'T12:00:00').getTime() - new Date().setHours(12,0,0,0)) / (1000 * 60 * 60 * 24) <= 3;
                                                return (
                                                <div
                                                    key={item.id}
                                                    className={`chip-modern ${selectedIngredients.includes(item.id) ? 'active' : ''} ${item.isExpired ? 'btn-locked' : ''}`}
                                                    onClick={() => !item.isExpired && toggleSelection(item.id, selectedIngredients, setSelectedIngredients)}
                                                    title={item.isExpired ? 'Ingrediente vencido' : item.is_frozen ? 'Congelado' : item.expiration_date ? `Vence: ${new Date(dateStr + 'T12:00:00').toLocaleDateString()}` : 'Sin fecha de vencimiento'}
                                                >
                                                    {isExpiring && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', marginRight: 6, display: 'inline-block' }} title="Por vencer"></div>}
                                                    {item.isExpired && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9b8d7c', marginRight: 6, display: 'inline-block' }} title="Vencido"></div>}
                                                    {!!item.is_frozen && <span style={{ color: '#0EA5E9', marginRight: 4 }}>❄️</span>}
                                                    <span style={{ textDecoration: item.isExpired ? 'line-through' : 'none' }}>{item.name}</span>
                                                    {(() => {
                                                        const a = availableByName[normName(item.name)];
                                                        if (a && a.reserved > 0) {
                                                            return <span style={{ fontSize: '0.78rem', marginLeft: 4 }} title={`${formatQty(a.total, item.unit)} en total · ${formatQty(a.reserved, item.unit)} reservado por el plan`}>(<strong style={{ color: a.available > 0 ? 'inherit' : '#DC2626' }}>{formatQty(a.available, item.unit)} disp.</strong> · {formatQty(a.reserved, item.unit)} reserv.)</span>;
                                                        }
                                                        return <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: 4 }}>({item.quantity} {item.unit})</span>;
                                                    })()}
                                                    {item.isExpired && <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 10, marginLeft: 6, fontWeight: 800 }}>Vencido</span>}
                                                    {selectedIngredients.includes(item.id) && <Check size={14} weight="bold" style={{marginLeft: 4}} />}
                                                </div>
                                            )})}
                                        </div>
                                    )}

                                    {/* 2. Cuadrícula de Planificación */}
                                    {renderSlotGrid()}
                                </>
                            )}

                            {/* ── PASO 2: SUGERENCIAS DE LA IA ── */}
                            {aiStep === 'suggestions' && (
                                <>
                                    {!isGenerating && balanceWarning.length > 0 && (
                                        <div className="balance-notice" role="status">
                                            <button
                                                className="balance-notice__close"
                                                aria-label="Cerrar aviso"
                                                onClick={() => setBalanceWarning([])}
                                            >
                                                <X size={15} weight="bold" />
                                            </button>
                                            <div className="balance-notice__icon">
                                                <Heartbeat size={22} weight="fill" />
                                            </div>
                                            <div>
                                                <h4 className="balance-notice__title">
                                                    <Leaf size={16} weight="fill" /> Tip de alimentación balanceada
                                                </h4>
                                                <p className="balance-notice__text">
                                                    Puedes crear tu receta sin problema. Para que tu comida sea más
                                                    completa y sana, te recomendamos incluir también:
                                                </p>
                                                <div className="balance-notice__chips">
                                                    {balanceWarning.map(group => (
                                                        <span className="balance-notice__chip" key={group}>
                                                            <Check size={13} weight="bold" /> {group}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {isGenerating ? (
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <CircleNotch size={48} className="ph-spin" color="#FF9F43" />
                                            <p style={{ color: '#6B5E4F', marginTop: 16, fontWeight: 600 }}>Consultando al Chef IA...</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                                            {(() => {
                                                const slotMeals = selectedSlots.map(s => s.split('-')[1]);
                                                const defaultTurn = slotMeals[0] || 'Almuerzo';
                                                return suggestions.map((sug, i) => {
                                                    const turn = suggestionTurns[i] || defaultTurn;
                                                    return (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                background: '#FFF9F2', border: '2px solid rgba(230,126,34,0.18)', borderRadius: 16,
                                                                padding: '18px 20px',
                                                            }}
                                                        >
                                                            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#2A2118' }}>
                                                                {sug.title}
                                                            </h4>
                                                            <p style={{ margin: '0 0 14px', color: '#6B5E4F', fontSize: '0.9rem' }}>
                                                                {sug.description}
                                                            </p>

                                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                                                                ¿Para qué turno?
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                                                                {mealTypesOptions.map(t => {
                                                                    const active = turn === t;
                                                                    return (
                                                                        <button
                                                                            key={t}
                                                                            onClick={() => setSuggestionTurns(prev => ({ ...prev, [i]: t }))}
                                                                            style={{
                                                                                padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                                                                                fontWeight: 700, fontSize: '0.85rem',
                                                                                border: active ? '2px solid #FF9F43' : '2px solid rgba(230,126,34,0.2)',
                                                                                background: active ? 'linear-gradient(135deg, #FF9F43, #FF7F50)' : 'white',
                                                                                color: active ? '#fff' : '#6B5E4F',
                                                                                transition: 'all 0.18s',
                                                                            }}
                                                                        >
                                                                            {t}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            <button
                                                                className="btn-generate"
                                                                style={{ width: '100%', justifyContent: 'center' }}
                                                                onClick={() => handlePickSuggestion(sug, turn)}
                                                            >
                                                                Elegir para {turn} <Check weight="bold" />
                                                            </button>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── PASO 3: GENERANDO RECETA ── */}
                            {aiStep === 'generating' && (
                                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                                    <CircleNotch size={56} className="ph-spin" color="#FF9F43" />
                                    <p style={{ color: '#2A2118', marginTop: 20, fontWeight: 700, fontSize: '1.1rem' }}>Cocinando tu receta...</p>
                                    <p style={{ color: '#6B5E4F', fontSize: '0.9rem' }}>Gemini está generando ingredientes, pasos y calorías</p>
                                </div>
                            )}

                            {/* ── PASO 4: ¿CUÁNTAS PERSONAS? ── */}
                            {aiStep === 'servings' && aiDish && (() => {
                                const selMembers = familyMembers.filter(m => selectedMemberIds.includes(m.user_id));
                                const base = aiDish.servings || 1;
                                const planFactor = selMembers.length ? totalPortions(selMembers) : base;
                                const multiplier = base > 0 ? planFactor / base : 1;
                                const sugg = buildSuggestions(selMembers, aiDish.ingredients);
                                const totalKcal = Number(aiDish.cal) ? Math.round(Number(aiDish.cal) * planFactor) : null;
                                const hasIngs = aiDish.ingredients && aiDish.ingredients.length > 0;
                                const showPerPerson = servingsView === 'person' && selMembers.length >= 2;
                                return (
                                <div className="nv-stagger" style={{ padding: '4px 0 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* 1) INTEGRANTES */}
                                    {familyMembers.length > 0 ? (
                                        <div>
                                            <div className="nv-serv-label"><UsersThree size={14} weight="fill" /> ¿Quiénes comen?</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="group" aria-label="Integrantes que comerán">
                                                {familyMembers.map(m => {
                                                    const on = selectedMemberIds.includes(m.user_id);
                                                    const f = portionFactor(m);
                                                    const initial = (m.name || '?').trim().charAt(0).toUpperCase();
                                                    return (
                                                        <button type="button" key={m.user_id} onClick={() => toggleMember(m.user_id)} aria-pressed={on}
                                                            className={`nv-serv-member${on ? ' on' : ''}`}>
                                                            <span className="nv-serv-check">{on && <Check size={13} weight="bold" />}</span>
                                                            <span className="nv-serv-avatar">{initial}</span>
                                                            <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                                                                <span style={{ display: 'block', fontWeight: 800, color: '#2A2118', fontSize: '0.92rem' }}>{m.name}</span>
                                                                {m.goal && <span style={{ display: 'block', fontSize: '0.72rem', color: '#9b8d7c', fontWeight: 600 }}>{goalLabel(m.goal)}</span>}
                                                            </span>
                                                            <span className="nv-serv-x" title="Factor de porción">×{f}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: '#9b8d7c', textAlign: 'center' }}>No se pudieron cargar los integrantes; se usará la porción base de la receta.</p>
                                    )}

                                    {familyMembers.length > 0 && selMembers.length === 0 && (
                                        <div className="nv-serv-warn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Warning size={14} weight="fill" /> Selecciona al menos una persona para poder agregar la receta.
                                        </div>
                                    )}

                                    {/* 2) RESUMEN */}
                                    <div className="nv-serv-stats">
                                        <div className="nv-serv-stat"><span className="nv-serv-stat-n">{selMembers.length}</span><span className="nv-serv-stat-l">{selMembers.length === 1 ? 'persona' : 'personas'}</span></div>
                                        <div className="nv-serv-stat"><span className="nv-serv-stat-n">{portionsLabel(planFactor)}</span><span className="nv-serv-stat-l">porciones</span></div>
                                        {totalKcal != null && <div className="nv-serv-stat"><span className="nv-serv-stat-n">{totalKcal}</span><span className="nv-serv-stat-l">kcal total</span></div>}
                                    </div>

                                    {/* 3) SUGERENCIAS */}
                                    {(sugg.warnings.length > 0 || sugg.tips.length > 0) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {sugg.warnings.map((w, i) => (<div key={`w${i}`} className="nv-serv-warn"><Warning size={14} weight="fill" style={{ verticalAlign: '-2px', marginRight: 4 }} />{w}</div>))}
                                            {sugg.tips.map((t, i) => (<div key={`t${i}`} className="nv-serv-tip"><Lightbulb size={14} weight="fill" style={{ verticalAlign: '-2px', marginRight: 4 }} />{t}</div>))}
                                        </div>
                                    )}

                                    {/* 4) INGREDIENTES: total / por persona */}
                                    {hasIngs && (
                                        <div>
                                            <div className="nv-serv-toggle">
                                                <button type="button" className={!showPerPerson ? 'on' : ''} onClick={() => setServingsView('total')}>Total</button>
                                                <button type="button" className={showPerPerson ? 'on' : ''} onClick={() => setServingsView('person')} disabled={selMembers.length < 2}>Por persona</button>
                                            </div>
                                            {!showPerPerson ? (
                                                <div className="nv-serv-panel">
                                                    {scaleAIDish(aiDish, multiplier, true).map((ing, i) => (
                                                        <div key={i} className="nv-serv-ing">{ing}</div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {selMembers.map(m => {
                                                        const pf = portionFactor(m);
                                                        const list = scaleAIDish(aiDish, base > 0 ? pf / base : pf, true);
                                                        const initial = (m.name || '?').trim().charAt(0).toUpperCase();
                                                        return (
                                                            <div key={m.user_id} className="nv-serv-person">
                                                                <div className="nv-serv-person-head">
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                                        <span className="nv-serv-avatar sm">{initial}</span>
                                                                        <span style={{ fontWeight: 800, color: '#2A2118', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                                                                    </span>
                                                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e67e22', whiteSpace: 'nowrap' }}>×{pf}{Number(aiDish.cal) ? ` · ${Math.round(Number(aiDish.cal) * pf)} kcal` : ''}</span>
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6B5E4F', marginTop: 4, lineHeight: 1.5 }}>{list.join(' · ')}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                );
                            })()}

                            {/* Bloque 7: revisión del plan variado (1 receta por cuadro) */}
                            {aiStep === 'plan' && (
                                <div style={{ padding: '4px 0 8px' }}>
                                    <p style={{ fontSize: '0.9rem', color: '#6B5E4F', margin: '0 0 14px' }}>Una receta distinta para cada cuadro. {planGenerating ? 'Generando…' : 'Revisa y confirma.'}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {planItems.map((p, i) => {
                                            const [dStr, t] = p.slot.split('-');
                                            const dName = weekDays[parseInt(dStr, 10)] || '';
                                            return (
                                                <div key={i} style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(230,126,34,0.16)', background: '#fff' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ flex: 'none', width: 54, height: 54, borderRadius: 12, overflow: 'hidden', background: '#F3EADF', display: 'grid', placeItems: 'center' }}>
                                                            {p.status === 'done' && p.recipe ? <img src={imgProxy(p.recipe.img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                : p.status === 'error' ? <Warning size={22} color="#EF4444" weight="fill" />
                                                                    : <CircleNotch size={22} className="ph-spin" color="#FF9F43" />}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{dName} · {t}</div>
                                                            <div style={{ fontWeight: 800, color: '#2A2118', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {p.status === 'done' ? p.recipe.name : p.status === 'error' ? 'No se pudo generar' : (p.title || 'Pensando…')}
                                                            </div>
                                                            {p.status === 'done' && p.recipe && <div style={{ fontSize: '0.78rem', color: '#e67e22', fontWeight: 700 }}>{p.recipe.cal || '—'} kcal · {p.recipe.time}</div>}
                                                        </div>
                                                    </div>
                                                    {p.status === 'done' && p.recipe && renderSlotEaters(p.slot)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer-modern">
                            {aiStep === 'existing' && !editingExisting && (
                                <button className="btn-cancel" onClick={() => setAiStep('config')}>← Volver a IA</button>
                            )}
                            {aiStep === 'suggestions' && !isGenerating && (
                                <button className="btn-cancel" onClick={() => { setAiStep('config'); setSuggestions([]); }}>← Volver</button>
                            )}
                            {aiStep === 'servings' && (
                                <button className="btn-cancel" onClick={() => { setAiStep(aiFromExisting ? 'existing' : 'suggestions'); setAiDish(null); setAiFromExisting(false); }}>← Volver</button>
                            )}
                            {aiStep === 'plan' && (
                                <button className="btn-cancel" onClick={() => setAiStep('config')} disabled={planGenerating}>← Volver</button>
                            )}
                            <button className="btn-cancel" onClick={handleCloseModal}>Cancelar</button>
                            {aiStep === 'existing' && editingExisting && (() => {
                                const nAssigned = selectedSlots.filter(s => slotAssignments[s]).length;
                                return (
                                    <button className="btn-generate" onClick={handleSaveEditMulti} disabled={nAssigned === 0}>
                                        Guardar cambios{nAssigned > 0 ? ` (${nAssigned})` : ''} <Check weight="bold" />
                                    </button>
                                );
                            })()}
                            {aiStep === 'existing' && !editingExisting && selectedSlots.length >= 2 && (() => {
                                const nAssigned = selectedSlots.filter(s => slotAssignments[s]).length;
                                return (
                                    <button className="btn-generate" onClick={handleConfirmExistingPlan} disabled={nAssigned === 0}>
                                        Agregar plan{nAssigned > 0 ? ` (${nAssigned})` : ''} <Check weight="bold" />
                                    </button>
                                );
                            })()}
                            {aiStep === 'config' && (
                                <button className="btn-generate" onClick={handleAISuggest} disabled={isGenerating || planGenerating || selectedIngredients.length === 0}>
                                    {isGenerating ? <><CircleNotch size={18} className="ph-spin" /> Pensando...</> : <>Generar Menú <Sparkle weight="fill" /></>}
                                </button>
                            )}
                            {aiStep === 'config' && selectedSlots.length >= 2 && (
                                <button className="btn-generate" onClick={handleGeneratePlan} disabled={isGenerating || planGenerating || selectedIngredients.length === 0} title="Una receta distinta por cada cuadro seleccionado" style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}>
                                    Plan variado <Sparkle weight="fill" />
                                </button>
                            )}
                            {aiStep === 'servings' && (
                                <button className="btn-generate" onClick={handleConfirmAIServings}>
                                    Agregar al planner <Check weight="bold" />
                                </button>
                            )}
                            {aiStep === 'plan' && (
                                <button className="btn-generate" onClick={handleConfirmPlanMulti} disabled={planGenerating || !planItems.some(p => p.status === 'done')}>
                                    {planGenerating ? <><CircleNotch size={18} className="ph-spin" /> Generando…</> : <>Agregar plan <Check weight="bold" /></>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DETALLE DEL PLATO (mismo diseño que Recetas) --- */}
            {selectedMealDetails && (() => {
                const mealSlot = resolveMealSlot();
                const badgeType = mealSlot ? mealSlot.type : (Array.isArray(selectedMealDetails.category) ? selectedMealDetails.category[0] : null);
                const canEditMeal = userRole !== 'ayudante' && mealSlot;
                // Desglose por persona en el detalle: solo quienes comen esta comida (detailEaters, editable).
                // Si no hay selección (o comidas antiguas), se asume toda la familia.
                const dBase = Number(selectedMealDetails.servings) || 2;
                const dMembers = (Array.isArray(detailEaters) && detailEaters.length)
                    ? familyMembers.filter(m => detailEaters.includes(m.user_id))
                    : familyMembers;
                const dPlanFactor = dMembers.length ? totalPortions(dMembers) : dBase;
                const dMultiplier = dBase > 0 ? dPlanFactor / dBase : 1;
                const dCal = Number(selectedMealDetails.cal) || 0;
                const dTotalKcal = dCal ? Math.round(dCal * dPlanFactor) : null;
                const dHasIngs = Array.isArray(selectedMealDetails.ingredients) && selectedMealDetails.ingredients.length > 0;
                const dShowPerPerson = servingsView === 'person' && dMembers.length >= 2;
                // Texto para "Leer": la versión escalada a la familia (no la base estática).
                const dReadable = {
                    name: selectedMealDetails.name,
                    servings: dMembers.length || dBase,
                    cal: dTotalKcal,
                    ingredients: dHasIngs ? scaleAIDish(selectedMealDetails, dMultiplier, true) : (selectedMealDetails.ingredients || []),
                    steps: selectedMealDetails.steps,
                };
                return (
                <div className="modal-overlay" onClick={handleCloseMealDetails}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#2A2118' }}>{selectedMealDetails.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    onClick={() => speechState === 'idle' ? startSpeech(dReadable) : togglePause()}
                                    title={speechState === 'idle' ? 'Leer receta en voz alta' : speechState === 'speaking' ? 'Pausar lectura' : 'Reanudar lectura'}
                                    className={`btn-speech${speechState === 'speaking' ? ' speaking' : speechState === 'paused' ? ' paused' : ''}`}
                                >
                                    {speechState === 'idle' && <SpeakerHigh size={20} weight="fill" />}
                                    {speechState === 'speaking' && <Pause size={20} weight="fill" />}
                                    {speechState === 'paused' && <Play size={20} weight="fill" />}
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                        {speechState === 'idle' && 'Leer'}
                                        {speechState === 'speaking' && 'Pausar'}
                                        {speechState === 'paused' && 'Reanudar'}
                                    </span>
                                </button>
                                <button onClick={handleCloseMealDetails} className="btn-secondary" style={{ padding: 8, border: 'none' }}><X size={24} /></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="recipe-hero-wrapper">
                                <img src={imgProxy(selectedMealDetails.img)} className="recipe-hero-img" alt={selectedMealDetails.name} />
                                {badgeType && (
                                    <div className="hero-badges-overlay">
                                        <span className="mini-badge" style={{ background: 'rgba(255,255,255,0.95)', color: getMealColor(badgeType), boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{badgeType}</span>
                                    </div>
                                )}
                            </div>
                            <div className="recipe-detail-stats" style={{ display: 'flex', justifyContent: 'center', gap: 30, marginBottom: 30, padding: '10px 0', borderBottom: '1px dashed #EADBC7', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: '#6B5E4F', fontWeight: 700 }} title={dCal ? `${dCal} kcal por porción` : ''}>
                                    <Fire weight="fill" color="#F7B27B" size={22} /> {dTotalKcal != null ? dTotalKcal.toLocaleString('es') : (selectedMealDetails.cal || '—')} kcal{dTotalKcal != null && dMembers.length > 1 ? ' (total)' : ''}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: '#6B5E4F', fontWeight: 700 }}>
                                    <Clock weight="fill" color="#F7B27B" size={22} /> {selectedMealDetails.time || '30 min'}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: '#6B5E4F', fontWeight: 700 }}>
                                    <UsersThree weight="fill" color="#F7B27B" size={22} /> {dMembers.length || (selectedMealDetails.servings || 2)} {(dMembers.length || 2) === 1 ? 'persona' : 'personas'}
                                </span>
                            </div>
                            {selectedMealDetails.description && (
                                <p style={{ color: '#6B5E4F', marginBottom: 20, fontStyle: 'italic' }}>{selectedMealDetails.description}</p>
                            )}
                            {/* ¿Quiénes comen? — editable en el detalle; recalcula y guarda solo */}
                            {familyMembers.length > 0 && (
                                <div className="nv-eaters-wrap" style={{ marginBottom: 22 }}>
                                    <div className="nv-serv-label">
                                        <UsersThree size={15} weight="fill" /> ¿Quiénes comen?
                                        <span className="nv-eaters-count">
                                            {dMembers.length} {dMembers.length === 1 ? 'persona' : 'personas'}
                                            {savingEaters && <CircleNotch size={11} className="ph-spin" />}
                                        </span>
                                    </div>
                                    <div className="nv-eaters-row">
                                        {familyMembers.map((m, idx) => {
                                            const on = dMembers.some(x => x.user_id === m.user_id);
                                            const clickable = canEditMeal && !savingEaters;
                                            const initial = (m.name || '?').trim().charAt(0).toUpperCase();
                                            return (
                                                <button type="button" key={m.user_id}
                                                    className={`nv-eater${on ? ' on' : ''}${(!canEditMeal && !on) ? ' off-locked' : ''}`}
                                                    style={{ animationDelay: `${idx * 45}ms` }}
                                                    onClick={clickable ? () => handleToggleDetailEater(m.user_id) : undefined}
                                                    disabled={!clickable}
                                                    aria-pressed={on}>
                                                    <span className="nv-eater-av">{on ? <Check size={15} weight="bold" /> : initial}</span>
                                                    {m.name}
                                                    {on && <span className="nv-eater-fac">×{portionFactor(m)}</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {canEditMeal && <div className="nv-eater-hint"><Lightbulb size={13} weight="fill" color="#F7B27B" /> Toca para agregar o quitar. Las cantidades se recalculan y se guardan solas.</div>}
                                </div>
                            )}
                            {/* Porciones y calorías (Total / Por persona) — mismo diseño que el planificador */}
                            {dHasIngs && (
                                <div style={{ marginBottom: 22 }}>
                                    <div className="nv-serv-label"><ChefHat size={15} weight="fill" /> Porciones y calorías</div>
                                    <div className="nv-serv-toggle">
                                        <button type="button" className={!dShowPerPerson ? 'on' : ''} onClick={() => setServingsView('total')}>Total</button>
                                        <button type="button" className={dShowPerPerson ? 'on' : ''} onClick={() => setServingsView('person')} disabled={dMembers.length < 2}>Por persona</button>
                                    </div>
                                    <div key={dMembers.length} className="nv-recalc">
                                    {!dShowPerPerson ? (
                                        <div className="nv-serv-panel">
                                            {scaleAIDish(selectedMealDetails, dMultiplier, true).map((ing, i) => <div key={i} className="nv-serv-ing">{ing}</div>)}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {dMembers.map(m => {
                                                const pf = portionFactor(m);
                                                const list = scaleAIDish(selectedMealDetails, dBase > 0 ? pf / dBase : pf, true);
                                                const initial = (m.name || '?').trim().charAt(0).toUpperCase();
                                                return (
                                                    <div key={m.user_id} className="nv-serv-person">
                                                        <div className="nv-serv-person-head">
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                                <span className="nv-serv-avatar sm">{initial}</span>
                                                                <span style={{ fontWeight: 800, color: '#2A2118', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                                                            </span>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e67e22', whiteSpace: 'nowrap' }}>×{pf}{dCal ? ` · ${Math.round(dCal * pf)} kcal` : ''}{m.goal ? ` · ${goalLabel(m.goal)}` : ''}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6B5E4F', marginTop: 4, lineHeight: 1.5 }}>{list.join(' · ')}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    </div>
                                </div>
                            )}

                            {/* Pasos — formato libro, más legibles (item 2) */}
                            <div className="detail-card-section">
                                <h4><ListNumbers size={24} weight="duotone" /> Pasos</h4>
                                {selectedMealDetails.steps && selectedMealDetails.steps.length > 0 ? (
                                    <ol className="nv-instr-list">
                                        {selectedMealDetails.steps.map((step, i) => (
                                            <li key={i} className="nv-instr">
                                                <span className="nv-step-n">{i + 1}</span>
                                                <span className="nv-step-tx">{step.replace(/^\d+[\.\-]?\s*/, '')}</span>
                                            </li>
                                        ))}
                                    </ol>
                                ) : <p style={{ color: '#c9b9a6' }}>Sin instrucciones registradas</p>}
                            </div>
                        </div>
                        <div className="modal-footer nv-detail-footer">
                            <button className="btn-secondary nv-df-close" onClick={handleCloseMealDetails}>Cerrar</button>
                            {canEditMeal && (
                                <>
                                    <button
                                        className="btn-secondary nv-df-change"
                                        onClick={async () => {
                                            const isDone = !!selectedMealDetails.is_completed;
                                            const newStatus = !isDone;
                                            try {
                                                await dailyMealsService.toggleComplete(selectedMealDetails.daily_meal_id, newStatus);
                                                setPlannerData(prev => ({
                                                    ...prev,
                                                    [`${mealSlot.dayIndex}-${mealSlot.type}`]: {
                                                        ...prev[`${mealSlot.dayIndex}-${mealSlot.type}`],
                                                        is_completed: newStatus ? 1 : 0
                                                    }
                                                }));
                                                setSelectedMealDetails(prev => ({ ...prev, is_completed: newStatus ? 1 : 0 }));
                                                
                                                if (newStatus) {
                                                    await deductForCooked(selectedMealDetails);
                                                    setPendingLeftovers({
                                                        name: selectedMealDetails.name,
                                                        recipe_id: selectedMealDetails.recipe_id,
                                                    });
                                                }
                                            } catch (e) { console.error(e); showToast('Error al actualizar.'); }
                                        }}
                                        style={{ 
                                            background: selectedMealDetails.is_completed ? '#EADBC7' : 'linear-gradient(135deg, #16a34a, #15803d)', 
                                            color: selectedMealDetails.is_completed ? '#6B5E4F' : '#fff', 
                                            fontWeight: 800, border: 'none', borderRadius: 14, padding: '12px 22px', 
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 
                                        }}
                                    >
                                        <Check size={18} weight="bold" /> {selectedMealDetails.is_completed ? 'Desmarcar' : 'Marcar hecha'}
                                    </button>
                                    <button
                                        className="btn-secondary nv-df-change"
                                        onClick={() => { handleCloseMealDetails(); handlePlanSlot(mealSlot.dayIndex, mealSlot.type, 'edit'); }}
                                        style={{ color: '#e67e22', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                                    >
                                        <ArrowsClockwise size={18} weight="bold" /> Cambiar
                                    </button>
                                    <button
                                        className="nv-df-del"
                                        onClick={() => { handleCloseMealDetails(); requestDeleteMeal(mealSlot.dayIndex, mealSlot.type); }}
                                        style={{ background: 'linear-gradient(135deg, #FF7043, #E53935)', border: 'none', color: '#fff', fontWeight: 800, borderRadius: 14, padding: '12px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                                    >
                                        <Trash size={18} weight="bold" /> Eliminar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* === CONFIRMACIÓN DE BORRADO === */}
            {/* Bloque 8: aviso "¿cocinaste?" (por franja horaria) */}
            {cookedPrompt && (
                <div className="modal-overlay" style={{ zIndex: 7000 }} onClick={handleCookedNo}>
                    <div className="nv-confirm-card" onClick={e => e.stopPropagation()}>
                        <div className="nv-confirm-icon" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                            <Fire size={34} weight="fill" color="#fff" />
                        </div>
                        <h3 className="nv-confirm-title">¿Cocinaste el {cookedPrompt.type.toLowerCase()} de hoy?</h3>
                        <p className="nv-confirm-text"><b>{cookedPrompt.meal.name}</b><br />Si ya lo cocinaste, descontamos sus ingredientes de tu inventario.</p>
                        <div className="nv-confirm-actions">
                            <button className="nv-confirm-cancel" onClick={handleCookedNo}>Aún no</button>
                            <button className="nv-confirm-del" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }} onClick={handleCookedYes}>Sí, la cociné</button>
                        </div>
                    </div>
                </div>
            )}

            {pendingDelete && (
                <div className="modal-overlay" onClick={() => setPendingDelete(null)}>
                    <div className="nv-confirm-card" onClick={e => e.stopPropagation()}>
                        <div className="nv-confirm-icon"><Warning size={38} weight="fill" /></div>
                        <h3 className="nv-confirm-title">¿Eliminar esta receta?</h3>
                        <p className="nv-confirm-text">
                            Vas a quitar <strong>{pendingDelete.name}</strong> del plan
                            {' '}({pendingDelete.type} · {weekDays[pendingDelete.dayIndex]}).
                            <br />Esta acción no se puede deshacer.
                        </p>
                        <div className="nv-confirm-actions">
                            <button className="nv-confirm-cancel" onClick={() => setPendingDelete(null)}>Cancelar</button>
                            <button className="nv-confirm-del" onClick={confirmDeleteMeal}><Trash size={18} weight="bold" /> Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === CONFIRMACIÓN DE BORRADO MÚLTIPLE === */}
            {pendingBulkDelete && (
                <div className="modal-overlay" onClick={() => setPendingBulkDelete(null)}>
                    <div className="nv-confirm-card" onClick={e => e.stopPropagation()}>
                        <div className="nv-confirm-icon"><Warning size={38} weight="fill" /></div>
                        <h3 className="nv-confirm-title">¿Eliminar {pendingBulkDelete.length} {pendingBulkDelete.length === 1 ? 'receta' : 'recetas'}?</h3>
                        <p className="nv-confirm-text">
                            Vas a quitar del plan:
                            <br />
                            <span style={{ fontWeight: 700, color: '#2A2118' }}>
                                {pendingBulkDelete.map(s => { const [d, t] = s.split('-'); return `${weekDays[parseInt(d, 10)]} · ${t}`; }).join(', ')}
                            </span>
                            <br />Esta acción no se puede deshacer.
                        </p>
                        <div className="nv-confirm-actions">
                            <button className="nv-confirm-cancel" onClick={() => setPendingBulkDelete(null)}>Cancelar</button>
                            <button className="nv-confirm-del" onClick={confirmBulkDelete}><Trash size={18} weight="bold" /> Eliminar {pendingBulkDelete.length}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === POPUP ANIMADO: motivo por el que no se pudo planificar/generar === */}
            {planNotice && (
                <div className="modal-overlay" onClick={() => setPlanNotice(null)} style={{ zIndex: 3000 }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 24, padding: '30px 26px 24px', maxWidth: 420, width: 'calc(100% - 40px)',
                        textAlign: 'center', boxShadow: '0 30px 70px rgba(120,60,10,0.32)',
                        animation: 'nv-pop 0.34s cubic-bezier(.34,1.56,.64,1)',
                    }}>
                        <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#FFE7CF,#FFD3AE)', color: '#e67e22', boxShadow: '0 8px 20px rgba(230,126,34,0.25)' }}>
                            <Warning size={34} weight="fill" />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#2A2118' }}>{planNotice.title}</h3>
                        <p style={{ margin: 0, color: '#6B5E4F', fontSize: '0.98rem', lineHeight: 1.5 }}>{planNotice.reason}</p>
                        {planNotice.hint && (
                            <div style={{ background: '#FFF7ED', border: '1px solid rgba(230,126,34,0.2)', borderRadius: 12, padding: '10px 14px', margin: '16px 0 0', display: 'flex', gap: 8, alignItems: 'flex-start', textAlign: 'left' }}>
                                <Lightbulb size={18} weight="fill" color="#F7B27B" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontSize: '0.86rem', color: '#6B5E4F', fontWeight: 600, lineHeight: 1.45 }}>{planNotice.hint}</span>
                            </div>
                        )}
                        <button onClick={() => setPlanNotice(null)} style={{
                            marginTop: 18, padding: '13px 28px', borderRadius: 14, border: 'none', width: '100%',
                            background: 'linear-gradient(135deg,#FF9F43,#FF7F50)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: '0 8px 20px rgba(255,127,80,0.35)',
                        }}>Entendido</button>
                    </div>
                </div>
            )}

            {/* === POPUP "NO ALCANZA EL INVENTARIO" === */}
            {shortfallNotice && Array.isArray(shortfallNotice.items) && shortfallNotice.items.length > 0 && (
                <div className="modal-overlay" onClick={() => setShortfallNotice(null)} style={{ zIndex: 3000 }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 24, padding: '30px 26px 24px', maxWidth: 440, width: 'calc(100% - 40px)',
                        textAlign: 'center', boxShadow: '0 30px 70px rgba(120,60,10,0.32)', animation: 'nv-pop 0.34s cubic-bezier(.34,1.56,.64,1)',
                    }}>
                        <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#FFE7CF,#FFD3AE)', color: '#e67e22', boxShadow: '0 8px 20px rgba(230,126,34,0.25)' }}>
                            <ShoppingCart size={32} weight="fill" />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#2A2118' }}>No te alcanza para todo el plan</h3>
                        <p style={{ margin: 0, color: '#6B5E4F', fontSize: '0.96rem', lineHeight: 1.5 }}>
                            Con lo que tienes disponible (ya descontando lo reservado por otras comidas), te faltaría:
                        </p>
                        <div style={{ background: '#FFF7ED', border: '1px solid rgba(230,126,34,0.2)', borderRadius: 12, padding: '12px 14px', margin: '14px 0 0', textAlign: 'left' }}>
                            {shortfallNotice.items.map((it, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', fontSize: '0.9rem', color: '#6B5E4F', fontWeight: 600 }}>
                                    <span>{it.name}</span>
                                    <span style={{ color: '#DC2626', fontWeight: 800 }}>faltan {formatQty(it.missing, it.unit)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                            <button onClick={() => setShortfallNotice(null)} style={{
                                flex: '1 1 130px', padding: '13px 18px', borderRadius: 14, border: '2px solid #EADBC7', background: '#fff',
                                color: '#6B5E4F', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
                            }}>Planificar igual</button>
                            <button onClick={() => addShortfallsToShopping(shortfallNotice.items)} style={{
                                flex: '1 1 170px', padding: '13px 18px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(135deg,#FF9F43,#FF7F50)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 8px 20px rgba(255,127,80,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}><ShoppingCart size={18} weight="fill" /> Agregar a la compra</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL SOBRAS === */}
            {pendingLeftovers && (
                <div className="modal-overlay" onClick={() => setPendingLeftovers(null)}>
                    <div className="nv-confirm-card" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: 400 }}>
                        <div className="nv-confirm-icon" style={{ background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', color: '#FF9F43', fontSize: 36 }}>
                            🥡
                        </div>
                        <h3 className="nv-confirm-title">¿Quedaron sobras?</h3>
                        <p className="nv-confirm-text">
                            ¿Cómo quedó <strong>{pendingLeftovers.name}</strong>?
                            <br /><span style={{ fontSize: '0.85rem', color: '#9b8d7c' }}>Las sobras se guardarán en tu inventario por 3 días.</span>
                        </p>

                        {/* Selector de porciones */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '16px 0', background: '#FFF9F2', borderRadius: 14, padding: '14px', border: '1px solid #EADBC7' }}>
                            <button
                                onClick={() => setLeftoversQty(q => Math.max(0.5, q - 0.5))}
                                style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #EADBC7', background: 'white', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >−</button>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '2rem', fontWeight: 900, color: '#2A2118', lineHeight: 1 }}>{leftoversQty}</span>
                                <span style={{ fontSize: '0.8rem', color: '#9b8d7c' }}>{leftoversQty === 1 ? 'porción' : 'porciones'}</span>
                            </div>
                            <button
                                onClick={() => setLeftoversQty(q => q + 0.5)}
                                style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #EADBC7', background: 'white', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >+</button>
                        </div>

                        <div className="nv-confirm-actions">
                            <button
                                className="nv-confirm-cancel"
                                onClick={() => setPendingLeftovers(null)}
                            >
                                No, gracias
                            </button>
                            <button
                                className="nv-confirm-del"
                                style={{ background: 'linear-gradient(135deg, #FF9F43, #FF7F50)', border: 'none' }}
                                onClick={async () => {
                                    try {
                                        const leftoverName = `Sobras de ${pendingLeftovers.name}`;
                                        // El backend ya maneja duplicados: devuelve el existente si ya hay uno
                                        const ingRes = await ingredientsService.create({
                                            name: leftoverName,
                                            category: 'otro',
                                            unit: 'porcion',
                                            average_expiry_days: 3,
                                        });

                                        if (ingRes && ingRes.ingredient_id) {
                                            const expDate = new Date();
                                            expDate.setDate(expDate.getDate() + 3);
                                            await inventoryService.create({
                                                family_id: currentFamily.family_id || currentFamily.id,
                                                ingredient_id: ingRes.ingredient_id,
                                                quantity: leftoversQty,
                                                expiration_date: expDate.toISOString().split('T')[0],
                                            });
                                            showToast(`🥡 ${leftoversQty} ${leftoversQty === 1 ? 'porción guardada' : 'porciones guardadas'} en el inventario`);
                                        } else {
                                            showToast('Error al guardar las sobras.');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        showToast('Error al guardar las sobras.');
                                    } finally {
                                        setPendingLeftovers(null);
                                        setLeftoversQty(1);
                                    }
                                }}
                            >
                                🥡 Guardar {leftoversQty} {leftoversQty === 1 ? 'porción' : 'porciones'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === DESTACADO: PLAN DE HOY (solo semana actual) === */}
            {weekOffset === 0 && (() => {
                const todayIndex = (new Date().getDay() + 6) % 7; // 0=Lunes ... 6=Domingo
                const todayName = weekDays[todayIndex];
                const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
                return (
                    <div className="today-highlight">
                        <div className="today-glow" aria-hidden="true"></div>
                        <div className="today-head">
                            <span className="today-badge"><Sun size={16} weight="fill" /> HOY · {todayName}</span>
                            <span className="today-sub">Lo que toca hoy</span>
                        </div>
                        <div className="today-meals">
                            {mealTypes.map((type, i) => {
                                const meal = plannerData ? plannerData[`${todayIndex}-${type}`] : null;
                                return (
                                    <div
                                        key={type}
                                        className="today-meal"
                                        style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                                        onClick={() => meal ? openMealDetails(meal, todayIndex, type) : handlePlanSlot(todayIndex, type)}
                                    >
                                        <div className={`today-meal-img ${meal ? 'filled' : 'empty'}`}>
                                            {meal
                                                ? <img src={imgProxy(meal.img)} alt={meal.name} />
                                                : <Plus size={24} weight="bold" />}
                                        </div>
                                        <span className="today-meal-type">{type}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            <div
                key={weekOffset}
                className={slideDir === 'right' ? 'week-slide-right' : slideDir === 'left' ? 'week-slide-left' : ''}
                style={{ overflow: 'hidden' }}
            >
                <div className="calendar-wrapper">
                    <div className="calendar-header desktop-only">
                        <div></div>
                        {weekDays.map(d => <div key={d} className="day-label">{d}</div>)}
                    </div>
                    {/* AQUÍ SE PASA LA FUNCIÓN AL CALENDARIO */}
                    <CalendarGrid
                        data={plannerData}
                        onMealClick={openMealDetails}
                        onEmptyClick={handlePlanSlot}
                        canEdit={userRole !== 'ayudante'}
                        selectMode={calSelectMode}
                        selected={calSelected}
                        onToggleSelect={toggleCalSelect}
                    />
                </div>
            </div>

            {/* Barra CRUD flotante del modo selección múltiple */}
            {calSelectMode && !showModal && !selectedMealDetails && !pendingBulkDelete && (
                <div className="nv-crud-bar" style={{
                    position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 1200,
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
                    maxWidth: 'calc(100% - 24px)',
                    background: '#fff', border: '1px solid rgba(230,126,34,0.25)', borderRadius: 18,
                    padding: '12px 16px', boxShadow: '0 18px 45px rgba(120,60,10,0.25)',
                    animation: 'nv-toast-in 0.25s ease',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <span style={{ fontWeight: 800, color: '#2A2118', fontSize: '0.98rem' }}>
                            {calSelected.length} {calSelected.length === 1 ? 'cuadro elegido' : 'cuadros elegidos'}
                            {calMode === 'manage' && <span style={{ marginLeft: 6, fontSize: '0.72rem', fontWeight: 800, color: '#e67e22', background: '#FFF3E6', padding: '2px 8px', borderRadius: 999 }}>PLANIFICADAS</span>}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#9b8d7c' }}>
                            {calMode === 'manage' ? 'Toca recetas planificadas para editar o eliminar' : calMode === 'plan' ? 'Toca cuadros vacíos para planificar' : 'Toca un cuadro: vacío → planificar · con receta → editar/eliminar'}
                        </span>
                    </div>
                    <button type="button" onClick={exitCalSelect} style={{
                        padding: '10px 16px', borderRadius: 12, border: '1.5px solid #e7dccb', background: '#fff',
                        color: '#6B5E4F', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem',
                    }}>Cancelar</button>
                    {calMode === 'manage' ? (
                        <>
                            <button type="button" onClick={requestBulkDelete} disabled={calSelected.length === 0} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12,
                                border: '1.5px solid #FCA5A5', background: '#fff', color: '#DC2626', fontWeight: 800,
                                cursor: calSelected.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.92rem',
                            }}>
                                <Trash size={16} weight="bold" /> Eliminar ({calSelected.length})
                            </button>
                            <button type="button" onClick={startEditSelection} disabled={calSelected.length === 0} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none',
                                background: calSelected.length === 0 ? '#f0e6d8' : 'linear-gradient(135deg,#FF9F43,#FF7F50)',
                                color: calSelected.length === 0 ? '#b6a894' : '#fff', fontWeight: 800,
                                cursor: calSelected.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.95rem',
                                boxShadow: calSelected.length === 0 ? 'none' : '0 6px 16px rgba(255,127,80,0.32)',
                            }}>
                                <PencilSimple size={16} weight="bold" /> Editar ({calSelected.length})
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={startPlanFromSelection} disabled={calSelected.length === 0} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none',
                            background: calSelected.length === 0 ? '#f0e6d8' : 'linear-gradient(135deg,#FF9F43,#FF7F50)',
                            color: calSelected.length === 0 ? '#b6a894' : '#fff', fontWeight: 800,
                            cursor: calSelected.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.95rem',
                            boxShadow: calSelected.length === 0 ? 'none' : '0 6px 16px rgba(255,127,80,0.32)',
                        }}>
                            <Sparkle size={17} weight="fill" /> Planificar ({calSelected.length})
                        </button>
                    )}
                </div>
            )}
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
    // Código de invitación llegado por el QR/enlace (?join=XXXX). Se limpia de la URL
    // para no reintentar al refrescar; se usa para pre-rellenar "unirse a familia".
    const [pendingJoinCode, setPendingJoinCode] = useState(() => {
        try {
            const code = new URLSearchParams(window.location.search).get('join');
            if (code) {
                window.history.replaceState({}, '', window.location.pathname + window.location.hash);
                return code.trim();
            }
        } catch { /* ignore */ }
        return null;
    });
    // --- Landing / Home informativa (visible sin estar logueado) ---
    const [showLanding, setShowLanding] = useState(false);
    const [authForceRegister, setAuthForceRegister] = useState(false);
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
                name: "Usuario", email: "user@test.com", avatar: null, role: "Admin"
            };
        } catch {
            return { name: "Usuario", email: "user@test.com", avatar: null, role: "Admin" };
        }
    });

    const [userFamilies, setUserFamilies] = useState([]);
    // Inicializar el rol desde la familia guardada en localStorage para que sea correcto desde el inicio
    const [userRole, setUserRole] = useState(() => {
        try {
            const saved = localStorage.getItem('neverita_family');
            if (saved) {
                const fam = JSON.parse(saved);
                return fam.role || 'ayudante';
            }
        } catch { /* ignore */ }
        return 'ayudante';
    });

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

                // Leer la familia activa desde localStorage para garantizar que el role esté sincronizado
                // aunque currentFamily aún no esté en el closure
                const savedFamilyStr = localStorage.getItem('neverita_family');
                const activeFamilyId = savedFamilyStr
                    ? JSON.parse(savedFamilyStr)?.family_id ?? JSON.parse(savedFamilyStr)?.id
                    : null;

                if (activeFamilyId) {
                    const match = mappedFamilies.find(f => f.family_id === activeFamilyId || f.id === activeFamilyId);
                    if (match) {
                        setUserRole(match.role);
                        // Actualizar también el objeto guardado en localStorage para que tenga el role correcto
                        const savedFam = JSON.parse(savedFamilyStr);
                        localStorage.setItem('neverita_family', JSON.stringify({ ...savedFam, role: match.role }));
                    }
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
        // Conservar una foto de perfil personalizada previa (subida o por enlace)
        let savedAvatar = null;
        try {
            const prev = JSON.parse(localStorage.getItem('neverita_user') || 'null');
            if (prev && (prev.user_id === user.user_id || prev.username === user.username)
                && prev.avatar && !String(prev.avatar).includes('pravatar.cc')) {
                savedAvatar = prev.avatar;
            }
        } catch (e) { /* noop */ }

        const profile = {
            ...user,
            avatar: savedAvatar || null, // sin foto: se usa el avatar de inicial
            role: "Admin"
        };
        setUserProfile(profile);
        setIsAuthenticated(true);
        // Guardar sesión en localStorage
        localStorage.setItem('neverita_auth', 'true');
        localStorage.setItem('neverita_user', JSON.stringify(profile));
    };

    // Actualizar perfil y persistirlo (para que NO se borre al refrescar)
    const handleUpdateUser = (updated) => {
        setUserProfile(updated);
        try {
            localStorage.setItem('neverita_user', JSON.stringify(updated));
        } catch (e) {
            console.warn('No se pudo guardar el perfil (almacenamiento lleno).');
        }
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
            localStorage.setItem('neverita_family', JSON.stringify(fam));
        } catch (error) {
            console.error("Error al crear familia:", error);
            showToast("Ocurrió un error al crear la familia en el servidor.");
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
        let date;
        if (typeof d === 'string') {
            const dateStr = d.includes('T') ? d.split('T')[0] : d;
            date = new Date(`${dateStr}T12:00:00`);
        } else {
            // Forzar fecha a mediodía para evitar cambios de día por la zona horaria
            date = new Date(d);
            date.setHours(12, 0, 0, 0);
        }
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
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

    // Dedup de creación de plan: comparte la MISMA promesa si el efecto corre 2 veces
    // (React StrictMode) → evita crear planes duplicados para la misma semana.
    const planCreatePromises = useRef({});

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
                    const pMonday = getMonday(p.start_date);
                    const pMondayStr = pMonday.toLocaleDateString('en-CA');
                    return pMondayStr === targetMondayStr;
                });

                // 3. Si no existe plan para esa semana Y es la semana actual o futura, crear uno nuevo.
                //    Se comparte la promesa por semana para no crear duplicados (efecto 2x).
                if (!plan && offset >= 0) {
                    const fid = currentFamily.family_id || currentFamily.id;
                    const lockKey = `${fid}-${targetMondayStr}`;
                    if (!planCreatePromises.current[lockKey]) {
                        planCreatePromises.current[lockKey] = menuPlansService.create({
                            plan_name: `Menú de ${currentFamily.name}`,
                            start_date: targetMondayStr,
                            created_by: userProfile.user_id,
                            family_id: fid,
                        }).finally(() => { delete planCreatePromises.current[lockKey]; });
                    }
                    plan = await planCreatePromises.current[lockKey];
                }

                // Si es semana pasada y no hay plan, no hay nada que mostrar
                // Normalizar start_date a string YYYY-MM-DD para evitar problemas
                // con mysql2 que puede devolver un objeto Date en lugar de string.
                if (plan && plan.start_date) {
                    const sd = plan.start_date;
                    if (sd instanceof Date) {
                        plan = { ...plan, start_date: sd.toISOString().split('T')[0] };
                    } else if (typeof sd === 'string' && sd.includes('T')) {
                        plan = { ...plan, start_date: sd.split('T')[0] };
                    }
                }
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
                        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients.map(pluralizeUnits) : [],
                        steps: meal.instructions ? meal.instructions.split('\n').filter(Boolean) : [],
                        description: meal.description || '',
                        servings: meal.servings ?? meal.servings_count ?? null,
                        eaters: Array.isArray(meal.eaters) ? meal.eaters : null,
                        is_completed: meal.is_completed || 0,
                        recommended_meal: meal.recommended_meal || 'almuerzo',
                        category: [{ desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', cualquiera: 'Cualquiera' }[meal.recommended_meal] || 'Almuerzo'],
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
    const handleAddToPlanner = async (recipe, dayIndex, mealType, multiplier, eaters) => {
        if (!currentMenuPlan) return false;

        // Calcular la fecha exacta en la que se planifica
        const startDateStr = currentMenuPlan.start_date.split('T')[0];
        const scheduledDate = new Date(`${startDateStr}T12:00:00`);
        scheduledDate.setDate(scheduledDate.getDate() + dayIndex);

        try {
            // Validar que no haya ingredientes vencidos para esa fecha
            const validation = await recipesService.validateExpiration({
                recipe_id: recipe.recipe_id || recipe.id,
                family_id: currentFamily.family_id || currentFamily.id,
                scheduled_date: scheduledDate.toISOString().split('T')[0]
            });

            if (!validation.valid) {
                showToast(`⚠️ No puedes planificar esta receta para ese día.\n\nLos siguientes ingredientes estarán vencidos:\n- ${validation.expiredIngredients.join('\n- ')}`);
                return false; // Bloquear flujo
            }
        } catch (err) {
            console.error('Error validando caducidad', err);
        }

        const key = `${dayIndex}-${mealType}`;
        const eatersVal = (Array.isArray(eaters) && eaters.length) ? eaters : null;
        // Pintado optimista (con los comensales elegidos)
        setPlannerData(prev => ({ ...prev, [key]: { ...recipe, eaters: eatersVal } }));

        try {
            const saved = await dailyMealsService.save({
                menu_plan_id: currentMenuPlan.menu_plan_id,
                recipe_id: recipe.recipe_id || recipe.id,
                meal_type: MEAL_ENUM[mealType] || mealType.toLowerCase(),
                day_of_week: DAY_ENUM[dayIndex],
                eaters: eatersVal,
            });
            setPlannerData(prev => ({ ...prev, [key]: { ...prev[key], daily_meal_id: saved.daily_meal_id } }));
            return true;
        } catch (err) {
            console.error('Error guardando en el menú:', err);
            // Revertir el pintado: no se guardó en BD.
            setPlannerData(prev => { const n = { ...prev }; delete n[key]; return n; });
            return false;
        }
    };

    if (!isAuthenticated) return (
        <>
            <Auth
                onLogin={handleLogin}
                onShowLanding={() => setShowLanding(true)}
                forceRegister={authForceRegister}
            />
            {showLanding && (
                <LandingPage
                    onClose={() => setShowLanding(false)}
                    onRegister={() => { setAuthForceRegister(true); setShowLanding(false); }}
                />
            )}
        </>
    );
    if (!currentFamily) return <FamilySelect families={userFamilies} initialJoinCode={pendingJoinCode} onJoinCodeConsumed={() => setPendingJoinCode(null)} onSelectFamily={(fam) => { setCurrentFamily(fam); setUserRole(fam.role || 'ayudante'); localStorage.setItem('neverita_family', JSON.stringify(fam)); }} onCreateFamily={handleCreateFamily} onJoinByCode={handleJoinByCode} />;

    return (
        <HashRouter>
            <div className="app-container">
                <Sidebar 
                    activeFamily={currentFamily}
                    onOpenManager={() => setShowFamilyManager(true)}
                    onLogout={handleLogout}
                />

                {/* Encabezado móvil: muestra la familia activa sin entrar al perfil */}
                <button className="mobile-family-bar" onClick={() => setShowFamilyManager(true)}>
                    <div className="mfb-avatar">{currentFamily.name.charAt(0).toUpperCase()}</div>
                    <div className="mfb-info">
                        <span className="mfb-label">Tu Espacio</span>
                        <strong className="mfb-name">{currentFamily.name}</strong>
                    </div>
                    <Avatar name={userProfile.name} src={userProfile.avatar} size={34} className="mfb-user" />
                </button>

                {/* Esta es la línea que acabas de agregar */}
                <MobileNav onOpenManager={() => setShowFamilyManager(true)} />

                {showFamilyManager && (
                    <FamilyManager
                        activeFamily={currentFamily}
                        userFamilies={userFamilies}
                        currentUser={userProfile}
                        userRole={userRole}
                        onUpdateUser={handleUpdateUser}
                        onClose={() => setShowFamilyManager(false)}
                        onSwitchFamily={handleSwitchFamily}
                        onCreateNew={() => { setShowFamilyManager(false); setCurrentFamily(null); }}
                        onLeaveFamily={() => {
                            setShowFamilyManager(false);
                            const fid = currentFamily?.family_id || currentFamily?.id;
                            setUserFamilies(prev => prev.filter(f => (f.family_id || f.id) !== fid));
                            setCurrentFamily(null);
                            localStorage.removeItem('neverita_family');
                        }}
                        onLogout={handleLogout}
                    />
                )}

                <Routes>
                    <Route path="/" element={<PlannerPage userProfile={userProfile} plannerData={plannerData} setPlannerData={setPlannerData} currentMenuPlan={currentMenuPlan} currentFamily={currentFamily} weekLabel={weekLabel} userRole={userRole} weekOffset={weekOffset} onNavigateWeek={handleNavigateWeek} />} />
                    <Route path="/recipes" element={<Recipes onAddToPlanner={handleAddToPlanner} currentFamily={currentFamily} userProfile={userProfile} userRole={userRole} />} />
                    <Route path="/inventory" element={<Inventory currentFamily={currentFamily} userRole={userRole} />} />
                    <Route path="/shopping-list" element={<ShoppingList currentFamily={currentFamily} />} />
                    <Route path="/stats" element={<Stats currentFamily={currentFamily} />} />
                </Routes>
                {currentFamily && userProfile && (
                    <SuggestionsPanel currentFamily={currentFamily} currentUser={userProfile} userRole={userRole} />
                )}
            </div>
        </HashRouter>
    );
}

export default App;