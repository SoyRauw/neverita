import React from 'react';

// Determina si el avatar es una imagen personalizada real (foto subida o enlace),
// descartando los antiguos placeholders aleatorios de pravatar.
const isCustomImage = (src) =>
    typeof src === 'string' && src.trim() !== '' && !src.includes('pravatar.cc');

/**
 * Avatar por inicial del nombre sobre fondo naranja (estética de la app).
 * Si se pasa una foto real (data URL o enlace), la muestra en su lugar.
 */
const Avatar = ({ name = '', src, size = 40, style = {}, className = '', title }) => {
    const initial = ((name || '?').trim().charAt(0) || '?').toUpperCase();
    const dimension = { width: size, height: size, flexShrink: 0 };

    if (isCustomImage(src)) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                title={title}
                className={className}
                style={{ ...dimension, borderRadius: '50%', objectFit: 'cover', ...style }}
            />
        );
    }

    return (
        <div
            className={className}
            title={title}
            aria-label={name || 'Avatar'}
            style={{
                ...dimension,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-2))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: Math.round(size * 0.42),
                lineHeight: 1,
                userSelect: 'none',
                boxShadow: '0 6px 14px rgba(255, 127, 80, 0.3)',
                ...style,
            }}
        >
            {initial}
        </div>
    );
};

export default Avatar;
