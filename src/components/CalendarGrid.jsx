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

            {/* --- ESTILOS PARA ARREGLAR EL DESBORDAMIENTO --- */}
            <style jsx>{`
                .calendar-responsive-wrapper {
                    width: 100%;
                    max-width: 100vw;
                    margin: 0 auto;
                    overflow: hidden; /* CRÍTICO: Corta todo lo que intente salirse */
                    padding: 0 10px;
                    box-sizing: border-box;
                }

                /* Reglas para Móvil */
                @media (max-width: 768px) {
                    .desktop-only { 
                        display: none !important; 
                    }
                    
                    .mobile-only { 
                        display: block !important; 
                        width: 100%;
                    }

                    .mobile-day-card {
                        background: white;
                        border-radius: 18px;
                        padding: 15px;
                        margin-bottom: 15px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .mobile-day-header {
                        font-weight: 800;
                        text-transform: uppercase;
                        color: #FF9F43;
                        margin-bottom: 12px;
                        font-size: 0.85rem;
                        letter-spacing: 1px;
                        border-bottom: 1px solid #fff5ed;
                        padding-bottom: 5px;
                    }

                    .mobile-meals-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                        width: 100%;
                    }

                    .mobile-meal-slot {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 6px;
                    }

                    .mobile-meal-img-container {
                        width: 100%;
                        aspect-ratio: 1 / 1;
                        background: #fafafa;
                        border: 1.5px dashed #e5e7eb;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                    }

                    .filled-img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .mobile-meal-label {
                        font-size: 0.65rem;
                        color: #888;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                }

                /* Reglas para PC */
                @media (min-width: 769px) {
                    .mobile-only { display: none !important; }
                    /* Si en tu PC usas grid o flex, asegúrate de mantener esa clase en tu padre, 
                       aquí solo devolvemos la visibilidad */
                    .desktop-only { display: contents; } 
                }
            `}</style>
        </div>
    );
};

export default CalendarGrid;