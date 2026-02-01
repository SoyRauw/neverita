import React from 'react';
import { Plus } from '@phosphor-icons/react';

// Recibimos "data" como propiedad (prop) desde App.jsx
const CalendarGrid = ({ data }) => {
    const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
    const days = Array(7).fill(null);

    return (
        <div className="calendar-body">
            {mealTypes.map((type) => (
                <React.Fragment key={type}>
                    {/* Etiqueta Lateral */}
                    <div className="meal-label">{type}</div>

                    {/* Días */}
                    {days.map((_, dayIndex) => {
                        // Buscamos si hay comida para este día y tipo específico
                        const mealKey = `${dayIndex}-${type}`;
                        // Verificamos que 'data' exista antes de buscar
                        const meal = data ? data[mealKey] : null;

                        return (
                            <div key={mealKey} className="meal-card" style={meal ? { border: 'none', padding: 0 } : {}}>
                                {meal ? (
                                    // SI HAY COMIDA: Mostramos la tarjeta llena
                                    <>
                                        <img src={meal.img} alt={meal.name} />
                                        <div style={{padding: '0 8px 8px'}}>
                                            <div className="meal-name">{meal.name}</div>
                                            <div className="calories">{meal.cal} kcal</div>
                                        </div>
                                    </>
                                ) : (
                                    // NO HAY COMIDA: Mostramos el botón "+"
                                    <div className="empty-state">
                                        <Plus size={24} color="#ddd" weight="bold" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CalendarGrid;
