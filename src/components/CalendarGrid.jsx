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
                    {/* Etiqueta Lateral (Desayuno, Almuerzo...) */}
                    <div className="meal-label">{type}</div>

                    {/* Celdas de los días */}
                    {days.map((_, dayIndex) => {
                        // Creamos la clave única para buscar la receta (ej: "0-Desayuno")
                        const mealKey = `${dayIndex}-${type}`;
                        const meal = data ? data[mealKey] : null;

                        return (
                            <div 
                                key={mealKey} 
                                className="meal-card" 
                                // Si hay comida, quitamos el borde y padding para que la foto se vea limpia
                                style={meal ? { border: 'none', padding: 0, overflow: 'hidden' } : {}}
                            >
                                {meal ? (
                                    // OPCIÓN A: HAY RECETA
                                    // Solo mostramos la imagen ocupando todo el espacio
                                    <img 
                                        src={meal.img} 
                                        alt={meal.name}
                                        title={meal.name} // Tooltip nativo al pasar el mouse
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }} 
                                    />
                                ) : (
                                    // OPCIÓN B: ESTÁ VACÍO
                                    // Mostramos el contenedor con el icono +
                                    <div className="empty-state">
                                        {/* Usamos un gris muy claro (#e5e7eb) para que sea sutil */}
                                        <Plus size={32} color="#e5e7eb" weight="bold" />
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
