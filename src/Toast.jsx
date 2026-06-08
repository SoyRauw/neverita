import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, WarningCircle, X } from '@phosphor-icons/react';

/**
 * Sistema de notificaciones (toasts) global.
 * Uso desde cualquier componente:
 *   import { showToast } from '../Toast';
 *   showToast('Producto agregado', 'success');
 *   showToast('Algo salió mal', 'error');
 *
 * Si no se pasa tipo, se infiere del texto (errores/validaciones -> rojo).
 */

function inferType(message) {
    const m = String(message).toLowerCase();
    if (m.includes('error') || m.includes('no se pudo') || m.includes('inválid') ||
        m.includes('invalid') || m.includes('falló') || m.includes('fallo') ||
        m.includes('selecciona') || m.includes('escribe') || m.includes('indica') ||
        m.includes('debes') || m.includes('obligatori')) {
        return 'error';
    }
    if (m.includes('✅') || m.includes('creado') || m.includes('creada') ||
        m.includes('guardad') || m.includes('agregad') || m.includes('añadid') ||
        m.includes('eliminad') || m.includes('actualizad') || m.includes('listo') ||
        m.includes('éxito') || m.includes('exito')) {
        return 'success';
    }
    return 'info';
}

export function showToast(message, type) {
    if (typeof window === 'undefined') return;
    const finalType = type || inferType(message);
    window.dispatchEvent(new CustomEvent('nv-toast', {
        detail: { message: String(message), type: finalType }
    }));
}

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: WarningCircle,
};

export function ToastHost() {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        const onToast = (e) => {
            const id = Date.now() + Math.random();
            const toast = { id, message: e.detail.message, type: e.detail.type || 'info' };
            setToasts((list) => [...list, toast]);
            setTimeout(() => remove(id), 4000);
        };
        window.addEventListener('nv-toast', onToast);
        return () => window.removeEventListener('nv-toast', onToast);
    }, [remove]);

    // Bloquear el scroll del fondo cuando hay cualquier modal abierto (.modal-overlay).
    // Usa un MutationObserver, así cubre TODOS los modales de la app sin tocar cada uno.
    // Bloquea tanto <html> como <body> para que funcione en todos los navegadores.
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const html = document.documentElement;
        const body = document.body;
        const apply = () => {
            const open = !!document.querySelector('.modal-overlay');
            html.style.overflow = open ? 'hidden' : '';
            body.style.overflow = open ? 'hidden' : '';
        };
        const observer = new MutationObserver(apply);
        observer.observe(document.body, { childList: true, subtree: true });
        apply();
        return () => {
            observer.disconnect();
            html.style.overflow = '';
            body.style.overflow = '';
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="nv-toast-host" role="status" aria-live="polite">
            {toasts.map((t) => {
                const Ic = ICONS[t.type] || Info;
                return (
                    <div className={`nv-toast nv-toast-${t.type}`} key={t.id}>
                        <span className="nv-toast-ic"><Ic size={22} weight="fill" /></span>
                        <span className="nv-toast-msg">{t.message}</span>
                        <button className="nv-toast-x" onClick={() => remove(t.id)} aria-label="Cerrar">
                            <X size={15} weight="bold" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default ToastHost;