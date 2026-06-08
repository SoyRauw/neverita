import React from 'react';
import { Plus, Trash, ArrowsClockwise } from '@phosphor-icons/react';

const CalendarGrid = ({ data, onMealClick, onEmptyClick, onChangeMeal, onDeleteMeal, canEdit = true }) => {
    const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
    const days = Array(7).fill(null);
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Botones de acción (cambiar / eliminar) que se superponen sobre la imagen
    const SlotActions = ({ dayIndex, type }) => (
        <div className="slot-actions">
            <button
                type="button"
                className="slot-btn"
                title="Cambiar receta"
                onClick={(e) => { e.stopPropagation(); onChangeMeal && onChangeMeal(dayIndex, type); }}
            >
                <ArrowsClockwise size={14} weight="bold" />
            </button>
            <button
                type="button"
                className="slot-btn slot-btn-del"
                title="Eliminar"
                onClick={(e) => { e.stopPropagation(); onDeleteMeal && onDeleteMeal(dayIndex, type); }}
            >
                <Trash size={14} weight="bold" />
            </button>
        </div>
    );

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
                            return (
                                <div
                                    key={mealKey}
                                    className="meal-card"
                                    style={meal
                                        ? { border: 'none', padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative' }
                                        : { cursor: canEdit ? 'pointer' : 'default' }}
                                    onClick={() => meal
                                        ? (onMealClick && onMealClick(meal))
                                        : (canEdit && onEmptyClick && onEmptyClick(dayIndex, type))}
                                >
                                    {meal ? (
                                        <>
                                            <img src={meal.img} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {canEdit && <SlotActions dayIndex={dayIndex} type={type} />}
                                        </>
                                    ) : (
                                        <div className="empty-state"><Plus size={32} color="#F0C28E" weight="bold" /></div>
                                    )}
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
                                return (
                                    <div
                                        key={mealKey}
                                        className="mobile-meal-slot"
                                        onClick={() => meal
                                            ? (onMealClick && onMealClick(meal))
                                            : (canEdit && onEmptyClick && onEmptyClick(dayIndex, type))}
                                    >
                                        <div className="mobile-meal-img-container" style={{ position: 'relative' }}>
                                            {meal ? (
                                                <>
                                                    <img src={meal.img} alt="" className="filled-img" />
                                                    {canEdit && <SlotActions dayIndex={dayIndex} type={type} />}
                                                </>
                                            ) : (
                                                <Plus size={20} color="#F0C28E" />
                                            )}
                                        </div>
                                        <span className="mobile-meal-label">{type}</span>
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
                    overflow: hidden;
                    padding: 0;
                    box-sizing: border-box;
                }
                /* Botones de acción sobre cada receta colocada */
                .slot-actions {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    display: flex;
                    gap: 5px;
                    z-index: 2;
                }
                .slot-btn {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(30, 20, 10, 0.55);
                    backdrop-filter: blur(4px);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    padding: 0;
                    transition: background 0.18s, transform 0.18s;
                }
                .slot-btn:hover { background: rgba(230, 126, 34, 0.95); transform: scale(1.08); }
                .slot-btn-del:hover { background: rgba(220, 53, 69, 0.95); }
                @media (max-width: 768px) {
                    .slot-actions { top: 4px; right: 4px; gap: 4px; }
                    .slot-btn { width: 22px; height: 22px; }
                }
            `}</style>
        </div>
    );
};

export default CalendarGrid;