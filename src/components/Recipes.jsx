import React, { useState, useEffect, useRef, useCallback } from 'react';
import { showToast } from '../Toast';
import {
    Plus, Fire, Clock, X, MagnifyingGlass,
    ChefHat, ListNumbers, Check, ArrowRight, Trash, LockSimple, UsersThree,
    SpeakerHigh, Pause, Play, PencilSimple, Info, UploadSimple
} from '@phosphor-icons/react';
import { recipesService, familyRecipesService, inventoryService, ingredientsService } from '../api';

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
const MEAL_LABEL = {
    'desayuno': 'Desayuno',
    'almuerzo': 'Almuerzo',
    'cena': 'Cena',
    'cualquiera': 'Cualquiera',
};

const getMealColor = (type) => {
    const normalized = (type || '').toLowerCase();
    switch (normalized) {
        case 'desayuno': return '#f6b93b';
        case 'almuerzo': return '#e55039';
        case 'cena': return '#4a69bd';
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
    category: [MEAL_LABEL[r.recommended_meal] || 'Almuerzo'],
    recommended_meal: r.recommended_meal || 'almuerzo',
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

    // --- TTS (Text-to-Speech) ---
    const [speechState, setSpeechState] = useState('idle'); // 'idle' | 'speaking' | 'paused'
    const utteranceRef = useRef(null);

    const stopSpeech = useCallback(() => {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
        setSpeechState('idle');
    }, []);

    const startSpeech = useCallback((recipe) => {
        stopSpeech();

        // Texto natural con pausas (comas extra entre secciones)
        const ingList = recipe.ingredients && recipe.ingredients.length > 0
            ? recipe.ingredients.map(pluralizeUnits).join(', ')
            : 'Sin ingredientes registrados';

        const stepsList = recipe.steps && recipe.steps.length > 0
            ? recipe.steps.map((s, i) => `Paso ${i + 1}: ${s.replace(/^\d+[.\-]?\s*/, '')}`).join('. ')
            : 'Sin pasos registrados';

        const personas = recipe.servings
            ? `Para ${recipe.servings} ${Number(recipe.servings) === 1 ? 'persona' : 'personas'}. `
            : '';

        const fullText = `Receta: ${recipe.name}. ${personas}Los ingredientes son: ${ingList}. Ahora, las instrucciones. ${stepsList}.`;

        // Elegir la mejor voz disponible en español
        const pickBestVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            const esVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));

            // Prioridad: Google (Chrome) > Microsoft Natural (Edge) > cualquier español
            return [
                esVoices.find(v => /Google.*(español|spanish)/i.test(v.name)),
                esVoices.find(v => /Microsoft.*Natural/i.test(v.name)),
                esVoices.find(v => /Microsoft/i.test(v.name)),
                esVoices.find(v => v.lang === 'es-ES'),
                esVoices.find(v => v.lang.toLowerCase().startsWith('es')),
                esVoices[0],
            ].find(Boolean) || null;
        };

        // Hablar SOLO cuando ya tenemos la voz en español asignada
        let spoken = false;
        const speakNow = () => {
            if (spoken) return;
            spoken = true;

            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.lang = 'es-ES';
            utterance.rate = 0.88;   // un poco más lento = más natural
            utterance.pitch = 1.05;  // ligeramente más agudo = menos robótico

            const voice = pickBestVoice();
            if (voice) utterance.voice = voice;

            utterance.onend = () => setSpeechState('idle');
            utterance.onerror = () => setSpeechState('idle');

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            setSpeechState('speaking');
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            speakNow();
        } else {
            // Las voces cargan de forma asíncrona (Chrome/Edge/iOS):
            // esperamos a que estén listas para no usar la voz por defecto (inglés).
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.onvoiceschanged = null;
                speakNow();
            };
            // Respaldo por si 'onvoiceschanged' no dispara (iOS Safari)
            setTimeout(speakNow, 300);
        }
    }, [stopSpeech]);

    const togglePause = useCallback(() => {
        if (speechState === 'speaking') {
            window.speechSynthesis.pause();
            setSpeechState('paused');
        } else if (speechState === 'paused') {
            window.speechSynthesis.resume();
            setSpeechState('speaking');
        }
    }, [speechState]);

    // Detener síntesis al cerrar el modal
    const handleCloseViewRecipe = useCallback(() => {
        stopSpeech();
        setViewRecipe(null);
    }, [stopSpeech]);

    // Precargar voces del navegador (para que el primer clic ya tenga voz en español)
    // y cancelar cualquier lectura al desmontar el componente.
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }
        return () => {
            try { window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
        };
    }, []);

    const [viewRecipe, setViewRecipe] = useState(null);
    const [detailServings, setDetailServings] = useState(2); // personas en el detalle (escala ingredientes)
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
    const [myInventory, setMyInventory] = useState([]); // para validar incremento

    const [newRecipe, setNewRecipe] = useState({
        name: "", cal: "", time: "", category: [],
        img: "", imgType: "url", ingredients: "", steps: "",
        description: "", servings: 2
    });
    const [editingId, setEditingId] = useState(null); // id de receta en edición (null = crear)
    const [saving, setSaving] = useState(false);
    const imgFileRef = useRef(null); // input de archivo oculto para la imagen

    // Abrir el modal en modo edición, precargando la receta
    const openEdit = (recipe, e) => {
        if (e) e.stopPropagation();
        setEditingId(recipe.id);
        setNewRecipe({
            name: recipe.name || "",
            cal: recipe.cal || "",
            time: recipe.time ? String(recipe.time).replace(/\D/g, '') : "",
            category: recipe.category && recipe.category.length ? [recipe.category[0]] : [],
            img: recipe.img || "",
            imgType: "url",
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : "",
            steps: Array.isArray(recipe.steps) ? recipe.steps.join('\n') : "",
            description: recipe.description || "",
            servings: recipe.servings || 2,
        });
        setIsAdding(true);
    };

    const closeCreateModal = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewRecipe({ name: "", cal: "", time: "", category: [], img: "", imgType: "url", ingredients: "", steps: "", description: "", servings: 2 });
    };

    // Al abrir el detalle de una receta, arrancar con sus personas base
    useEffect(() => {
        if (viewRecipe) setDetailServings(viewRecipe.servings || 2);
    }, [viewRecipe]);

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
            showToast('Error al remover la receta.');
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
            showToast('Error al agregar receta a la familia');
        }
    };

    // ---------- Crear ----------
    const toggleNewRecipeCategory = (type) => {
        // Ahora es una sola categoría, así que reemplazamos el array
        setNewRecipe({
            ...newRecipe,
            category: newRecipe.category.includes(type) ? [] : [type]
        });
    };

    // Convierte el archivo a una imagen redimensionada (data URL) para que persista
    // en la BD (columna image_url) en vez de un blob temporal.
    const handleFileUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('Selecciona un archivo de imagen.'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const maxW = 900;
                const scale = Math.min(1, maxW / img.width);
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                setNewRecipe(prev => ({ ...prev, img: canvas.toDataURL('image/jpeg', 0.82) }));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCreateRecipe = async () => {
        if (!newRecipe.name || !newRecipe.cal) {
            showToast("Por favor completa el nombre y las calorías.");
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
                servings: Math.max(1, parseInt(newRecipe.servings) || 2),
                image_url: newRecipe.img || '',
                calories_per_serving: parseInt(newRecipe.cal) || null,
                created_by: userProfile?.user_id || null,
                family_id: currentFamily?.family_id || currentFamily?.id || null,
                recommended_meal: newRecipe.category.length > 0 ? newRecipe.category[0].toLowerCase() : 'cualquiera',
            };
            if (editingId) {
                await recipesService.update(editingId, payload);
                setRecipes(prev => prev.map(r => r.id === editingId ? {
                    ...r,
                    name: payload.title,
                    cal: payload.calories_per_serving,
                    time: payload.preparation_time ? `${payload.preparation_time} min` : 'N/A',
                    category: [MEAL_LABEL[payload.recommended_meal] || 'Cualquiera'],
                    recommended_meal: payload.recommended_meal,
                    img: payload.image_url || r.img,
                    servings: payload.servings,
                    description: payload.description,
                    steps: payload.instructions ? payload.instructions.split('\n').filter(Boolean) : r.steps,
                } : r));
                if (viewRecipe?.id === editingId) setViewRecipe(prev => prev ? { ...prev, name: payload.title, description: payload.description, servings: payload.servings } : prev);
            } else {
                const created = await recipesService.create(payload);
                setRecipes(prev => [...prev, mapRecipe(created)]);
            }
            closeCreateModal();
        } catch (err) {
            showToast('Error al guardar la receta.');
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
        if (factor === 1 || !recipe.ingredients || recipe.ingredients.length === 0) return (recipe.ingredients || []).map(pluralizeUnits);
        return recipe.ingredients.map(ing => {
            // Formato: "1 cucharada de Nombre (cantidad unidad)" o "Nombre (cantidad unidad)" o solo "Nombre"
            const match = ing.match(/^(?:([\d.]+)\s+(.+?)\s+de\s+)?(.+?)\s*\(([\d.]+)\s*(.+?)\)$/);
            if (!match) return ing;
            
            const mQty = match[1] ? parseFloat(match[1]) : null;
            const mUnit = match[2] || '';
            const name = match[3].trim();
            const bQty = parseFloat(match[4]);
            const bUnit = match[5].trim();
            
            const scaledBQty = Math.round(bQty * factor * 100) / 100;
            if (mQty) {
                const scaledMQty = Math.round(mQty * factor * 100) / 100;
                return pluralizeUnits(`${scaledMQty} ${mUnit} de ${name} (${scaledBQty} ${bUnit})`);
            } else {
                return pluralizeUnits(`${name} (${scaledBQty} ${bUnit})`);
            }
        });
    };

    const handleConfirmPlan = async () => {
        if (selectedSlots.length === 0) return showToast("Selecciona al menos un espacio.");
        const multiplier = planBaseServings > 0 ? planServings / planBaseServings : 1;
        
        let successCount = 0;
        for (const slot of selectedSlots) {
            const [dayIndexStr, meal] = slot.split('-');
            const success = await onAddToPlanner(planRecipe, parseInt(dayIndexStr, 10), meal, multiplier);
            if (success) {
                successCount++;
            }
        }

        // Descontar inventario escalado por personas
        const fid = currentFamily?.family_id || currentFamily?.id;
        if (planRecipe?.recipe_id && fid && successCount > 0) {
            try {
                const totalMultiplier = multiplier * successCount;
                await inventoryService.deduct(planRecipe.recipe_id, fid, totalMultiplier);
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
                // Cargar inventario para validar incremento en tiempo real
                try {
                    const [inv, allIngs] = await Promise.all([
                        inventoryService.getAll(),
                        ingredientsService.getAll()
                    ]);
                    const filtered = fid ? inv.filter(i => i.family_id === fid) : inv;
                    const inventoryItems = filtered.map(item => {
                        const ing = allIngs.find(i => i.ingredient_id === item.ingredient_id);
                        return {
                            id: item.inventory_id,
                            name: ing ? ing.name : '',
                            quantity: Number(item.quantity) || 0,
                            unit: ing ? ing.unit : '',
                        };
                    });
                    setMyInventory(inventoryItems);
                } catch(err) { console.error('Error cargando inventario local:', err); }

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

    // Determinar si podemos incrementar personas según inventario
    let canIncrementPlan = planServings < 20;
    if (canIncrementPlan && pendingRecipe && pendingRecipe.ingredients && myInventory.length > 0) {
        const base = pendingRecipe.servings || 2;
        const factor = (planServings + 1) / base;
        for (const ingStr of pendingRecipe.ingredients) {
            const match = ingStr.match(/^(?:([\d.]+)\s+(.+?)\s+de\s+)?(.+?)\s*\(([\d.]+)\s*(.+?)\)$/);
            if (!match) continue;
            const name = match[3].trim().toLowerCase();
            const reqQty = parseFloat(match[4]) * factor;
            const invItem = myInventory.find(i => i.name.toLowerCase() === name);
            if (invItem && reqQty > invItem.quantity) {
                canIncrementPlan = false;
                break;
            }
        }
    }

    // Helper para bloquear días pasados
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

    return (
        <div className="main-content">
            <header>
                <div className="header-title">
                    <h1>Mis Recetas</h1>
                    <p>Explora y gestiona tu colección culinaria</p>
                </div>
                <div className="header-actions">
                    <div className="search-wrapper" style={{ position: 'relative' }}>
                        <MagnifyingGlass size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9b8d7c' }} />
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

            {loading && <div className="nv-loading"><div className="nv-spinner" /><span>Cargando recetas…</span></div>}
            {error && <p style={{ color: '#e74c3c', textAlign: 'center', padding: '3rem' }}>{error}</p>}

            {!loading && !error && (
                <div className="recipes-grid">
                    {filtered.length === 0 ? (
                        <div className="nv-empty">
                            <div className="nv-empty-ic"><ChefHat size={40} weight="fill" /></div>
                            <h3>Aún no hay recetas</h3>
                            <p>Crea tu primera receta o genera una con IA a partir de lo que tienes en la nevera.</p>
                        </div>
                    ) : (
                        filtered.map(recipe => (
                            <div key={recipe.id} className="recipe-card" onClick={() => setViewRecipe(recipe)} style={{ position: 'relative' }}>
                                <div className="recipe-img-wrap">
                                    <img src={recipe.img} alt={recipe.name} className="recipe-img" />
                                    <div className="recipe-badges">
                                        {recipe.category.map(cat => (
                                            <span key={cat} className="mini-badge" style={{ background: getMealColor(cat) }}>{cat}</span>
                                        ))}
                                    </div>
                                    <span className="recipe-view-hint">Ver receta →</span>
                                </div>

                                <div className="recipe-content">
                                    <h3 className="recipe-title">{recipe.name}</h3>
                                    <div className="recipe-stats">
                                        <div className="stat-item"><Fire weight="fill" color="#F7B27B" /> {recipe.cal || '—'} kcal</div>
                                        <div className="stat-item"><Clock weight="fill" color="#F7B27B" /> {recipe.time}</div>
                                    </div>
                                    {/* Acciones abajo: info, editar, eliminar */}
                                    <div className="recipe-actions">
                                        <button
                                            className="recipe-act info"
                                            onClick={(e) => { e.stopPropagation(); setViewRecipe(recipe); }}
                                            title="Ver descripción"
                                        >
                                            <Info size={17} weight="bold" />
                                        </button>
                                        {canDo(userRole) && (
                                            <button
                                                className="recipe-act edit"
                                                onClick={(e) => openEdit(recipe, e)}
                                                title="Editar receta"
                                            >
                                                <PencilSimple size={17} weight="bold" />
                                            </button>
                                        )}
                                        <div className="btn-locked-wrapper" style={{ flex: 1 }} data-tooltip={!canDo(userRole) ? '🔒 Sin permiso' : undefined}>
                                            <button
                                                onClick={canDo(userRole) ? (e) => handleDelete(recipe.id, e) : undefined}
                                                className={`recipe-del-btn${!canDo(userRole) ? ' btn-locked' : ''}`}
                                                title={canDo(userRole) ? 'Eliminar receta' : '🔒 Sin permiso'}
                                            >
                                                {canDo(userRole) ? <><Trash size={16} weight="bold" /> <span className="recipe-del-text">Eliminar</span></> : <><LockSimple size={16} /> <span className="recipe-del-text">Sin permiso</span></>}
                                            </button>
                                        </div>
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
                <div className="modal-overlay" onClick={closeCreateModal}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>{editingId ? 'Editar Receta' : 'Nueva Receta'}</h3>
                                <p style={{ margin: 0, color: '#9b8d7c', fontSize: '0.9rem' }}>{editingId ? 'Ajusta los datos de tu receta' : 'Comparte tu talento culinario'}</p>
                            </div>
                            <button onClick={closeCreateModal} className="btn-secondary" style={{ padding: 8, border: 'none' }}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="create-recipe-top-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 15, marginBottom: 20 }}>
                                <div>
                                    <label className="ia-label">Nombre del plato</label>
                                    <input className="form-input" placeholder="Ej. Lasaña" value={newRecipe.name} onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="ia-label">Calorías</label>
                                    {editingId ? (
                                        <input type="number" className="form-input" value={newRecipe.cal} readOnly disabled tabIndex={-1} />
                                    ) : (
                                        <input type="number" className="form-input" placeholder="400" value={newRecipe.cal} onChange={e => setNewRecipe({ ...newRecipe, cal: e.target.value })} />
                                    )}
                                </div>
                                <div>
                                    <label className="ia-label">Tiempo (min)</label>
                                    <input className="form-input" placeholder="30" value={newRecipe.time} onChange={e => setNewRecipe({ ...newRecipe, time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="ia-label">Personas</label>
                                    <input type="number" min="1" className="form-input" placeholder="2" value={newRecipe.servings} onChange={e => setNewRecipe({ ...newRecipe, servings: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label className="ia-label">Descripción (opcional)</label>
                                <input className="form-input" placeholder="Breve descripción..." value={newRecipe.description} onChange={e => setNewRecipe({ ...newRecipe, description: e.target.value })} />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label className="ia-label">Categoría Recomendada (Comida)</label>
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
                                <input ref={imgFileRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                                    <button type="button" className="nv-upload-btn" onClick={() => imgFileRef.current && imgFileRef.current.click()}>
                                        <UploadSimple size={20} weight="bold" /> {newRecipe.img ? 'Cambiar imagen' : 'Subir imagen'}
                                    </button>
                                    {newRecipe.img && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <img src={newRecipe.img} alt="preview" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 12px rgba(150,80,20,0.18)' }} />
                                            <span style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 700 }}>✓ Imagen lista</span>
                                        </div>
                                    )}
                                </div>
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
                            <button className="btn-secondary" onClick={closeCreateModal}>Cancelar</button>
                            <button className="btn-primary" onClick={handleCreateRecipe} disabled={saving}>
                                {saving ? 'Guardando...' : (editingId ? <>Guardar Cambios <Check weight="bold" /></> : 'Guardar Receta')}
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
                        <h3 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800, color: '#2A2118' }}>¿Para cuántas personas?</h3>
                        <p style={{ margin: '0 0 24px', color: '#6B5E4F', fontSize: '0.9rem' }}>Los ingredientes se escalarán automáticamente.</p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                            <button
                                onClick={() => setPlanServings(p => Math.max(1, p - 1))}
                                style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #EADBC7', background: 'white', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.borderColor = '#FF9F43'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#EADBC7'; }}
                            >&minus;</button>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: 900, color: '#2A2118', lineHeight: 1 }}>{planServings}</span>
                                <span style={{ fontSize: '0.8rem', color: '#9b8d7c' }}>{planServings === 1 ? 'persona' : 'personas'}</span>
                            </div>
                            <button
                                disabled={!canIncrementPlan}
                                onClick={() => {
                                    if (canIncrementPlan) setPlanServings(p => p + 1);
                                }}
                                style={{ 
                                    width: 40, height: 40, borderRadius: '50%', border: '2px solid #EADBC7', 
                                    background: 'white', fontSize: '1.4rem', fontWeight: 700, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    transition: 'all 0.15s',
                                    cursor: canIncrementPlan ? 'pointer' : 'not-allowed',
                                    opacity: canIncrementPlan ? 1 : 0.4
                                }}
                                onMouseEnter={e => { if (canIncrementPlan) { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.borderColor = '#FF9F43'; } }}
                                onMouseLeave={e => { if (canIncrementPlan) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#EADBC7'; } }}
                            >+</button>
                        </div>

                        {/* Preview de ingredientes escalados */}
                        {pendingRecipe.ingredients && pendingRecipe.ingredients.length > 0 && (
                            <div style={{ background: '#FFF9F2', border: '1px solid #EADBC7', borderRadius: 10, padding: '10px 14px', marginBottom: 20, textAlign: 'left', maxHeight: 130, overflowY: 'auto' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 700, color: '#9b8d7c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingredientes escalados</p>
                                {getScaledIngredients(pendingRecipe, planServings).map((ing, i) => (
                                    <div key={i} style={{ fontSize: '0.85rem', color: '#2A2118', padding: '2px 0', borderBottom: i < pendingRecipe.ingredients.length - 1 ? '1px dashed #EADBC7' : 'none' }}>
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
                                    <p style={{ margin: 0, color: '#9b8d7c', fontSize: '0.9rem' }}>Toca donde quieres comer <span style={{ color: '#F7B27B', fontWeight: 600 }}>{planRecipe.name}</span></p>
                                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#9b8d7c' }}>
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
                                            const disabled = isSlotDisabled(dayIndex, meal);
                                            return (
                                                <div key={slotKey} onClick={() => { if (!disabled) toggleSlot(dayIndex, meal); }} style={{
                                                    aspectRatio: '1', borderRadius: '8px',
                                                    border: isSelected ? '2px solid #F7B27B' : (disabled ? '2px solid #e2e8f0' : '2px dashed #cbd5e1'),
                                                    backgroundColor: disabled ? '#f1f5f9' : (isSelected ? '#fffaf5' : '#f8fafc'),
                                                    cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s ease', transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                                                    opacity: disabled ? 0.6 : 1
                                                }}>
                                                    {isSelected ? <Check weight="bold" color="#F7B27B" size={20} /> : (disabled ? <X weight="bold" color="#cbd5e1" size={16} /> : <Plus weight="bold" color="#cbd5e1" size={16} />)}
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
                                <p style={{ margin: 0, color: '#9b8d7c', fontSize: '0.9rem' }}>Agrega recetas del sistema a tu familia</p>
                            </div>
                            <button onClick={() => setIsAddingExisting(false)} className="btn-secondary" style={{ padding: 8, border: 'none' }}><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {availableRecipes.length === 0 ? (
                                <p style={{ color: '#9b8d7c', textAlign: 'center', padding: '2rem' }}>No hay recetas adicionales disponibles en el sistema.</p>
                            ) : (
                                <div className="import-list nv-stagger">
                                    {availableRecipes.map(recipe => (
                                        <div key={recipe.id} className="import-row">
                                            <img src={recipe.img} alt={recipe.name} className="import-row-img" />
                                            <div className="import-row-info">
                                                <span className="import-row-name">{recipe.name}</span>
                                                <span className="import-row-meta"><Fire size={13} weight="fill" color="#FF8A4C" /> {recipe.cal || '—'} kcal · <Clock size={13} weight="fill" color="#FF8A4C" /> {recipe.time}</span>
                                            </div>
                                            <div className="import-row-actions">
                                                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setViewRecipe(recipe)}>
                                                    Ver
                                                </button>
                                                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleAddExistingRecipe(recipe.id)}>
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
                <div className="modal-overlay" style={{ zIndex: 6000 }} onClick={handleCloseViewRecipe}>
                    <div className="modal-modern" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#2A2118' }}>{viewRecipe.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {/* Botón TTS */}
                                <button
                                    id="btn-recipe-tts"
                                    onClick={() => speechState === 'idle' ? startSpeech(viewRecipe) : togglePause()}
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
                                <button onClick={handleCloseViewRecipe} className="btn-secondary" style={{ padding: 8, border: 'none' }}><X size={24} /></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="recipe-book">
                                {/* Columna izquierda: foto + datos rápidos */}
                                <div className="recipe-book-left">
                                    <div className="recipe-hero-wrapper">
                                        <img src={viewRecipe.img} className="recipe-hero-img" alt={viewRecipe.name} />
                                    </div>
                                    <div className="recipe-book-stats">
                                        <div className="rb-stat"><Fire weight="fill" color="#FF8A4C" size={18} /> <span>{viewRecipe.cal || '—'} kcal</span></div>
                                        <div className="rb-stat"><Clock weight="fill" color="#FF8A4C" size={18} /> <span>{viewRecipe.time}</span></div>
                                        <div className="rb-stat rb-stat-serv">
                                            <UsersThree weight="fill" color="#FF8A4C" size={18} />
                                            <button className="rb-serv-btn" onClick={() => setDetailServings(s => Math.max(1, s - 1))} title="Menos personas">−</button>
                                            <span>{detailServings} pers.</span>
                                            <button className="rb-serv-btn" onClick={() => setDetailServings(s => Math.min(20, s + 1))} title="Más personas">+</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna derecha: categoría + descripción + ingredientes + pasos */}
                                <div className="recipe-book-right">
                                    {viewRecipe.category && viewRecipe.category.length > 0 && (
                                        <div className="rb-meal-chips">
                                            {viewRecipe.category.map(cat => (
                                                <span key={cat} className="rb-meal-chip" style={{ background: getMealColor(cat) }}>{cat}</span>
                                            ))}
                                        </div>
                                    )}
                                    {viewRecipe.description && (
                                        <p className="rb-desc">{viewRecipe.description}</p>
                                    )}
                                    <div className="detail-card-section">
                                        <h4><ChefHat size={24} weight="duotone" /> Ingredientes <span className="rb-serv-note">para {detailServings} {detailServings === 1 ? 'persona' : 'personas'}</span></h4>
                                        <ul className="detail-list">
                                            {viewRecipe.ingredients && viewRecipe.ingredients.length > 0
                                                ? getScaledIngredients(viewRecipe, detailServings).map((ing, i) => <li key={i}>{ing}</li>)
                                                : <li style={{ color: '#c9b9a6' }}>Sin ingredientes registrados</li>}
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
                                                : <li style={{ color: '#c9b9a6' }}>Sin instrucciones registradas</li>}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={handleCloseViewRecipe}>Cerrar</button>
                            {availableRecipes.some(r => r.id === viewRecipe.id) ? (
                                <div className="btn-locked-wrapper" data-tooltip={!canDo(userRole) ? '🔒 Sin permiso' : undefined}>
                                    <button
                                        className={`btn-primary${!canDo(userRole) ? ' btn-locked' : ''}`}
                                        onClick={canDo(userRole) ? () => { handleAddExistingRecipe(viewRecipe.id); handleCloseViewRecipe(); } : undefined}
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
                        <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem', color: '#2A2118' }}>Faltan ingredientes</h3>
                        <p style={{ margin: '0 0 20px', color: '#6B5E4F', fontSize: '0.95rem' }}>Para preparar esta receta, necesitas agregar lo siguiente a tu inventario:</p>
                        
                        <div style={{ background: '#FFF9F2', border: '1px solid #EADBC7', borderRadius: 12, padding: '15px', textAlign: 'left', marginBottom: 25, maxHeight: 150, overflowY: 'auto' }}>
                            <ul style={{ margin: 0, paddingLeft: 20, color: '#6B5E4F', lineHeight: 1.6 }}>
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