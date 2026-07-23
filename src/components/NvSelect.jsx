import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

/**
 * Lista desplegable moderna (reemplaza <select> nativo).
 * Animada, con color y estado activo. options: [{ value, label }].
 */
const NvSelect = ({ value, onChange, options = [], placeholder = 'Elegir', style = {}, className = '', up = false }) => {
    const [open, setOpen] = useState(false);
    const [flipUp, setFlipUp] = useState(false); // decidido automáticamente según el espacio
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
    }, [open]);

    // Al abrir: si no hay espacio abajo (p.ej. últimas tarjetas pegadas al borde del modal),
    // abre hacia arriba. El prop `up` sigue forzando la dirección si se pasa explícito.
    const toggle = () => {
        setOpen(prev => {
            if (prev) return false;
            const el = ref.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                setFlipUp(spaceBelow < 260 && spaceAbove > spaceBelow);
            }
            return true;
        });
    };

    const selected = options.find(o => String(o.value) === String(value));
    const openUp = up || flipUp;

    return (
        <div className={`nv-select ${className}`} ref={ref} style={style}>
            <button
                type="button"
                className={`nv-select-trigger${open ? ' open' : ''}`}
                onClick={toggle}
            >
                <span className={selected ? '' : 'nv-select-ph'}>{selected ? selected.label : placeholder}</span>
                <CaretDown size={16} weight="bold" className="nv-select-caret" />
            </button>
            {open && (
                <div className={`nv-select-menu${openUp ? ' up' : ''}`} role="listbox">
                    {options.map(o => (
                        <button
                            type="button"
                            key={o.value}
                            role="option"
                            aria-selected={String(o.value) === String(value)}
                            className={`nv-select-opt${String(o.value) === String(value) ? ' active' : ''}`}
                            onClick={() => { onChange(o.value); setOpen(false); }}
                        >
                            <span>{o.label}</span>
                            {String(o.value) === String(value) && <Check size={15} weight="bold" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NvSelect;
