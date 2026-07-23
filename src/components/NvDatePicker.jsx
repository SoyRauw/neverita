import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const pad = (n) => String(n).padStart(2, '0');
const toStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m: 0-11
const parse = (s) => {
    if (!s) return null;
    const [y, m, d] = String(s).split('T')[0].split('-').map(Number);
    if (!y || !m || !d) return null;
    return { y, m: m - 1, d };
};
const fmtDisplay = (s) => {
    const p = parse(s);
    if (!p) return null;
    return `${pad(p.d)} ${MONTHS[p.m].slice(0, 3).toLowerCase()}. ${p.y}`;
};

const POP_W = 270;
const POP_H = 340; // alto aproximado para decidir arriba/abajo

/**
 * Selector de fecha propio (reemplaza <input type="date"> nativo).
 * El calendario se renderiza en un PORTAL con posición fija + auto-flip,
 * así nunca se corta aunque esté dentro de un modal con scroll o pegado al borde.
 * Navegación tipo Google Calendar: clic en el título salta a elegir MES, y de ahí a AÑO.
 * onChange devuelve 'YYYY-MM-DD'. Props: value, onChange, placeholder, min, max, style, className.
 */
const NvDatePicker = ({ value, onChange, placeholder = 'Elegir fecha', min, max, style = {}, className = '' }) => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('days'); // 'days' | 'months' | 'years'
    const [pos, setPos] = useState(null); // { left, top, openUp }
    const base = parse(value) || (() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; })();
    const [viewY, setViewY] = useState(base.y);
    const [viewM, setViewM] = useState(base.m);
    const wrapRef = useRef(null);
    const popRef = useRef(null);

    const computePos = () => {
        const el = wrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const openUp = spaceBelow < POP_H && r.top > spaceBelow;
        let left = Math.min(r.left, window.innerWidth - POP_W - 8);
        left = Math.max(8, left);
        const top = openUp ? r.top - 6 : r.bottom + 6;
        setPos({ left, top, openUp });
    };

    useEffect(() => {
        if (!open) return;
        const p = parse(value);
        if (p) { setViewY(p.y); setViewM(p.m); }
        computePos();
        const onMove = () => computePos();
        const onDoc = (e) => {
            if (wrapRef.current && wrapRef.current.contains(e.target)) return;
            if (popRef.current && popRef.current.contains(e.target)) return;
            setOpen(false);
        };
        const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('scroll', onMove, true);
        window.addEventListener('resize', onMove);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            window.removeEventListener('scroll', onMove, true);
            window.removeEventListener('resize', onMove);
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, value]);

    const sel = parse(value);
    const now = new Date();
    const todayStr = toStr(now.getFullYear(), now.getMonth(), now.getDate());
    const minY = min ? Number(String(min).slice(0, 4)) : null;
    const maxY = max ? Number(String(max).slice(0, 4)) : null;

    const firstDow = (new Date(viewY, viewM, 1).getDay() + 6) % 7; // 0 = Lunes
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const prevMonth = () => { if (viewM === 0) { setViewM(11); setViewY(y => y - 1); } else setViewM(m => m - 1); };
    const nextMonth = () => { if (viewM === 11) { setViewM(0); setViewY(y => y + 1); } else setViewM(m => m + 1); };

    const pick = (d) => {
        const s = toStr(viewY, viewM, d);
        if (min && s < min) return;
        if (max && s > max) return;
        onChange(s);
        setOpen(false);
    };

    const openPop = () => { setMode('days'); setOpen(o => !o); };

    // Rango de 12 años centrado en el año en vista (para el modo 'years').
    const yearPageStart = viewY - 5;
    const yearCells = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

    return (
        <div className={`nv-dp ${className}`} ref={wrapRef} style={style}>
            <button type="button" className={`nv-select-trigger${open ? ' open' : ''}`} onClick={openPop}>
                <span className={sel ? '' : 'nv-select-ph'}>{fmtDisplay(value) || placeholder}</span>
                <CalendarBlank size={18} weight="fill" className="nv-dp-ic" />
            </button>
            {open && pos && createPortal(
                <div ref={popRef} style={{ position: 'fixed', left: pos.left, top: pos.top, width: POP_W, transform: pos.openUp ? 'translateY(-100%)' : 'none', zIndex: 99990 }}>
                    <div className={`nv-dp-pop${pos.openUp ? ' up' : ''}`} role="dialog">
                        {/* ── Cabecera según el modo ── */}
                        {mode === 'days' && (
                            <div className="nv-dp-head">
                                <button type="button" className="nv-dp-nav" onClick={prevMonth} aria-label="Mes anterior"><CaretLeft size={16} weight="bold" /></button>
                                <button type="button" className="nv-dp-title nv-dp-title-btn" onClick={() => setMode('months')} title="Elegir mes y año">{MONTHS[viewM]} {viewY}</button>
                                <button type="button" className="nv-dp-nav" onClick={nextMonth} aria-label="Mes siguiente"><CaretRight size={16} weight="bold" /></button>
                            </div>
                        )}
                        {mode === 'months' && (
                            <div className="nv-dp-head">
                                <button type="button" className="nv-dp-nav" onClick={() => setViewY(y => y - 1)} aria-label="Año anterior"><CaretLeft size={16} weight="bold" /></button>
                                <button type="button" className="nv-dp-title nv-dp-title-btn" onClick={() => setMode('years')} title="Elegir año">{viewY}</button>
                                <button type="button" className="nv-dp-nav" onClick={() => setViewY(y => y + 1)} aria-label="Año siguiente"><CaretRight size={16} weight="bold" /></button>
                            </div>
                        )}
                        {mode === 'years' && (
                            <div className="nv-dp-head">
                                <button type="button" className="nv-dp-nav" onClick={() => setViewY(y => y - 12)} aria-label="Años anteriores"><CaretLeft size={16} weight="bold" /></button>
                                <span className="nv-dp-title">{yearCells[0]} – {yearCells[11]}</span>
                                <button type="button" className="nv-dp-nav" onClick={() => setViewY(y => y + 12)} aria-label="Años siguientes"><CaretRight size={16} weight="bold" /></button>
                            </div>
                        )}

                        {/* ── Cuerpo según el modo ── */}
                        {mode === 'days' && (
                            <>
                                <div className="nv-dp-week">{WEEK.map((w, i) => <span key={i}>{w}</span>)}</div>
                                <div className="nv-dp-grid" key={`${viewY}-${viewM}`}>
                                    {cells.map((d, i) => {
                                        if (d === null) return <span key={i} className="nv-dp-empty" />;
                                        const s = toStr(viewY, viewM, d);
                                        const isSel = sel && sel.y === viewY && sel.m === viewM && sel.d === d;
                                        const isToday = s === todayStr;
                                        const disabled = (min && s < min) || (max && s > max);
                                        return (
                                            <button type="button" key={i} disabled={disabled}
                                                className={`nv-dp-day${isSel ? ' sel' : ''}${isToday ? ' today' : ''}`}
                                                onClick={() => pick(d)}>{d}</button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        {mode === 'months' && (
                            <div className="nv-dp-mgrid" key={`m-${viewY}`}>
                                {MONTHS_SHORT.map((mn, i) => {
                                    const isSel = sel && sel.y === viewY && sel.m === i;
                                    const isCur = todayStr.startsWith(`${viewY}-${pad(i + 1)}`);
                                    return (
                                        <button type="button" key={i}
                                            className={`nv-dp-mbtn${isSel ? ' sel' : ''}${isCur ? ' today' : ''}`}
                                            onClick={() => { setViewM(i); setMode('days'); }}>{mn}</button>
                                    );
                                })}
                            </div>
                        )}
                        {mode === 'years' && (
                            <div className="nv-dp-mgrid" key={`y-${yearPageStart}`}>
                                {yearCells.map((yr) => {
                                    const disabled = (minY && yr < minY) || (maxY && yr > maxY);
                                    const isSel = sel && sel.y === yr;
                                    const isCur = yr === now.getFullYear();
                                    return (
                                        <button type="button" key={yr} disabled={disabled}
                                            className={`nv-dp-mbtn${isSel ? ' sel' : ''}${isCur ? ' today' : ''}`}
                                            onClick={() => { setViewY(yr); setMode('months'); }}>{yr}</button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default NvDatePicker;
