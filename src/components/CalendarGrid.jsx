import React from 'react';
import { Plus, ForkKnife, Check, PencilSimple } from '@phosphor-icons/react';
import { imgProxy } from '../api';

// Reintento vía proxy/CDN de imágenes: sirve la foto redimensionada y con headers
// permisivos, rescatando URLs que el navegador no logra cargar directo (referer, host lento…).
const proxiedImg = (url) => {
    if (!url) return '';
    try { return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&w=420&h=420&fit=cover&output=webp&q=82`; }
    catch { return url; }
};

// Thumbnail de una comida planificada. Intenta la imagen REAL directa; si falla, la
// rescata por el proxy; si aún falla, respaldo (degradado + icono). Nombre visible al hover.
const MealThumb = ({ meal, compact = false }) => {
    // 0 = url directa · 1 = proxy · 2 = respaldo
    const [stage, setStage] = React.useState(0);
    React.useEffect(() => { setStage(0); }, [meal && meal.img]);
    // 0 = backend mismo-origen (evita bloqueadores) · 1 = CDN weserv directo · 2 = respaldo
    const src = stage === 0 ? imgProxy(meal.img) : stage === 1 ? proxiedImg(meal.img) : null;
    return (
        <div className="meal-thumb">
            {src ? (
                <img src={src} alt="" className="meal-thumb-img" loading="lazy" onError={() => setStage(s => Math.min(2, s + 1))} />
            ) : (
                <div className="meal-thumb-fallback">
                    <ForkKnife size={compact ? 18 : 24} weight="duotone" color="#fff" />
                    {!compact && <span className="meal-thumb-fb-name">{meal.name}</span>}
                </div>
            )}
            {!compact && src && (
                <div className="meal-thumb-scrim"><span className="meal-thumb-name">{meal.name}</span></div>
            )}
            {meal.is_completed ? <span className="meal-thumb-done"><Check size={12} weight="bold" /></span> : null}
        </div>
    );
};

const CalendarGrid = ({ data, onMealClick, onEmptyClick, canEdit = true, selectMode = false, selected = [], onToggleSelect }) => {
    const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
    const days = Array(7).fill(null);
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const isSel = (dayIndex, type) => selected.includes(`${dayIndex}-${type}`);

    const handleSlotClick = (meal, dayIndex, type) => {
        // En modo selección: TODAS las casillas se marcan/desmarcan; el padre decide el
        // comportamiento según la PRIMERA elegida (vacía=planificar, llena=editar/eliminar).
        if (selectMode) {
            onToggleSelect && onToggleSelect(dayIndex, type, !!meal);
            return;
        }
        if (meal) { onMealClick && onMealClick(meal, dayIndex, type); }
        else if (canEdit && onEmptyClick) { onEmptyClick(dayIndex, type); }
    };

    return (
        <div className="calendar-responsive-wrapper">
            {/* --- VISTA PC --- */}
            <div className="calendar-body desktop-only">
                {mealTypes.map((type) => (
                    <React.Fragment key={type}>
                        <div className="meal-label">{type}</div>
                        {days.map((_, dayIndex) => {
                            const mealKey = `${dayIndex}-${type}`;
                            const meal = data ? data[mealKey] : null;
                            const sel = isSel(dayIndex, type);
                            return (
                                <div
                                    key={mealKey}
                                    className={`meal-card${meal ? '' : ' empty'}${selectMode ? ' select-mode' : ''}${sel ? ' selected' : ''}`}
                                    style={meal
                                        ? { border: 'none', padding: 0, overflow: 'hidden', cursor: 'pointer' }
                                        : { cursor: canEdit ? 'pointer' : 'default' }}
                                    onClick={() => handleSlotClick(meal, dayIndex, type)}
                                >
                                    {meal ? (
                                        <MealThumb meal={meal} />
                                    ) : (
                                        <div className="empty-state">{sel ? <Check size={30} color="#FF7F50" weight="bold" /> : <Plus size={32} color="#F0C28E" weight="bold" />}</div>
                                    )}
                                    {selectMode && meal && (sel
                                        ? <span className="meal-sel-check"><Check size={15} weight="bold" /></span>
                                        : <span className="meal-edit-badge" title="Editar / eliminar"><PencilSimple size={12} weight="bold" /></span>)}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            {/* --- VISTA MÓVIL --- */}
            <div className="calendar-mobile-list mobile-only">
                {dayNames.map((dayName, dayIndex) => (
                    <div key={dayName} className="mobile-day-card">
                        <div className="mobile-day-header">{dayName}</div>
                        <div className="mobile-meals-grid">
                            {mealTypes.map(type => {
                                const mealKey = `${dayIndex}-${type}`;
                                const meal = data ? data[mealKey] : null;
                                const selM = isSel(dayIndex, type);
                                return (
                                    <div
                                        key={mealKey}
                                        className={`mobile-meal-slot${selectMode ? ' select-mode' : ''}${selM ? ' selected' : ''}`}
                                        onClick={() => handleSlotClick(meal, dayIndex, type)}
                                    >
                                        <div className="mobile-meal-img-container">
                                            {meal ? (
                                                <MealThumb meal={meal} compact />
                                            ) : (
                                                selM ? <Check size={20} color="#FF7F50" weight="bold" /> : <Plus size={20} color="#F0C28E" />
                                            )}
                                            {selectMode && meal && (selM
                                                ? <span className="meal-sel-check"><Check size={13} weight="bold" /></span>
                                                : <span className="meal-edit-badge"><PencilSimple size={11} weight="bold" /></span>)}
                                        </div>
                                        <span className="mobile-meal-label" title={meal ? meal.name : type} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal ? meal.name : type}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .calendar-responsive-wrapper {
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                    /* overflow visible: permite que las tarjetas "floten" al hover
                       sin que la 1ª fila/columna se corte con el marco */
                    overflow: visible;
                    padding: 6px 4px;
                    box-sizing: border-box;
                }
                .meal-card { position: relative; }
                .meal-thumb { position: relative; width: 100%; height: 100%; overflow: hidden; }
                .meal-thumb-img {
                    width: 100%; height: 100%; object-fit: cover; display: block;
                    transition: transform .4s cubic-bezier(.34,1.4,.5,1);
                }
                .meal-card:hover .meal-thumb-img { transform: scale(1.06); }
                .meal-thumb-fallback {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 7px; padding: 8px; text-align: center;
                    background: linear-gradient(135deg, #FFB980, #FF8A4C);
                }
                .meal-thumb-fb-name {
                    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
                    color: #fff; font-size: .72rem; font-weight: 800; line-height: 1.15;
                    text-shadow: 0 1px 2px rgba(0,0,0,.25);
                }
                /* Nombre sobre la foto: oculto por defecto (foto limpia), aparece al hover */
                .meal-thumb-scrim {
                    position: absolute; left: 0; right: 0; bottom: 0;
                    padding: 18px 9px 8px; pointer-events: none;
                    background: linear-gradient(to top, rgba(42,33,24,.88) 0%, rgba(42,33,24,.45) 50%, transparent 100%);
                    opacity: 0; transform: translateY(6px); transition: opacity .2s ease, transform .25s ease;
                }
                .meal-card:hover .meal-thumb-scrim { opacity: 1; transform: none; }
                .meal-thumb-name {
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
                    color: #fff; font-size: .74rem; font-weight: 800; line-height: 1.18;
                    text-shadow: 0 1px 3px rgba(0,0,0,.45);
                }
                .meal-thumb-done {
                    position: absolute; top: 7px; right: 7px; width: 20px; height: 20px; border-radius: 50%;
                    background: #22C55E; color: #fff; display: grid; place-items: center;
                    box-shadow: 0 2px 7px rgba(0,0,0,.28); border: 1.5px solid #fff;
                }
                /* ===== Modo selección múltiple ===== */
                .meal-card.select-mode.empty { border: 2px dashed #F7C99A; background: #FFFBF5; transition: all .18s ease; }
                .meal-card.select-mode.empty:hover { border-color: #FF9F43; background: #FFF3E6; transform: translateY(-2px); }
                .meal-card.empty.selected {
                    border: 2px solid #FF9F43 !important; background: linear-gradient(135deg,#FFF3E6,#FFE7CF) !important;
                    box-shadow: 0 6px 16px rgba(255,159,67,.28); transform: translateY(-2px);
                }
                .meal-edit-badge {
                    position: absolute; top: 7px; left: 7px; width: 22px; height: 22px; border-radius: 8px;
                    background: rgba(255,255,255,.92); color: #e67e22; display: grid; place-items: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,.22); z-index: 2;
                }
                /* Casilla LLENA seleccionada (modo gestionar) */
                .meal-card.selected:not(.empty) { outline: 3px solid #FF9F43; outline-offset: -3px; border-radius: 12px; }
                .meal-card.selected:not(.empty)::after {
                    content: ''; position: absolute; inset: 0; background: rgba(255,159,67,.22); z-index: 1; pointer-events: none;
                }
                .meal-sel-check {
                    position: absolute; top: 7px; left: 7px; width: 24px; height: 24px; border-radius: 50%;
                    background: linear-gradient(135deg,#FF9F43,#FF7F50); color: #fff; display: grid; place-items: center;
                    box-shadow: 0 2px 8px rgba(255,127,80,.5); z-index: 3; border: 1.5px solid #fff;
                }
                .mobile-meal-slot.select-mode { cursor: pointer; }
                .mobile-meal-slot.selected .mobile-meal-img-container {
                    border: 2px solid #FF9F43; background: #FFF3E6; box-shadow: 0 4px 12px rgba(255,159,67,.25);
                }
            `}</style>
        </div>
    );
};

export default CalendarGrid;