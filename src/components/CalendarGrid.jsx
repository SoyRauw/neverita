import React from 'react';
import { Plus } from '@phosphor-icons/react';

const CalendarGrid = ({ data, onMealClick }) => {
    const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
    const days = Array(7).fill(null);
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <div className="calendar-responsive-wrapper">
            {/* IMPORTANTE: Si en tu componente padre (donde llamas a <CalendarGrid />) 
               tienes un div que renderiza los nombres de los días en horizontal, 
               debes ponerle la clase "desktop-only" también.
            */}

            {/* --- VISTA PC (Intacta) --- */}
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
                                    style={meal ? { border: 'none', padding: 0, overflow: 'hidden', cursor: 'pointer' } : {}}
                                    onClick={() => meal && onMealClick && onMealClick(meal)}
                                >
                                    {meal ? (
                                        <img src={meal.img} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="empty-state"><Plus size={32} color="#e5e7eb" weight="bold" /></div>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            {/* --- VISTA MÓVIL CORREGIDA --- */}
            <div className="calendar-mobile-list mobile-only">
                {dayNames.map((dayName, dayIndex) => (
                    <div key={dayName} className="mobile-day-card">
                        <div className="mobile-day-header">{dayName}</div>
                        <div className="mobile-meals-grid">
                            {mealTypes.map(type => {
                                const mealKey = `${dayIndex}-${type}`;
                                const meal = data ? data[mealKey] : null;
                                return (
                                    <div key={mealKey} className="mobile-meal-slot" onClick={() => meal && onMealClick(meal)}>
                                        <div className="mobile-meal-img-container">
                                            {meal ? <img src={meal.img} alt="" className="filled-img" /> : <Plus size={20} color="#ccc" />}
                                        </div>
                                        <span className="mobile-meal-label">{type}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- ESTILOS MÍNIMOS (el responsive completo está en index.css) --- */}
            <style>{`
                .calendar-responsive-wrapper {
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                    overflow: hidden;
                    padding: 0;
                    box-sizing: border-box;
                }
            `}</style>
        </div>
    );
};

export default CalendarGrid;