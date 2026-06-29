import React from 'react';

/**
 * Icono de marca de Neverita: una nevera retro / vintage.
 * Cuerpo redondeado, congelador pequeño arriba, manija de jalar vertical
 * y patitas. Trazo y color configurables para encajar en los badges.
 * Diseñado para verse igual que el favicon.
 */
const FridgeIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, style, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
    >
        {/* Cuerpo redondeado (look antiguo) */}
        <rect x="6" y="2.5" width="12" height="18" rx="3.4" />
        {/* División del congelador (compartimento pequeño arriba) */}
        <line x1="6" y1="8" x2="18" y2="8" />
        {/* Manija de jalar vertical (cromada): congelador y puerta */}
        <line x1="15" y1="4.4" x2="15" y2="6.4" />
        <line x1="15" y1="10" x2="15" y2="18" />
        {/* Patitas */}
        <line x1="9" y1="20.5" x2="9" y2="22" />
        <line x1="15" y1="20.5" x2="15" y2="22" />
    </svg>
);

export default FridgeIcon;
