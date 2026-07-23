import React, { useState, useEffect, useRef } from 'react';
import { ChatCircleDots, X, PaperPlaneTilt, Trash } from '@phosphor-icons/react';
import { mealSuggestionsService, familyRecipesService } from '../api';
import NvSelect from './NvSelect';
import { showToast } from '../Toast';

const DAYS = [
    { value: 'lunes', label: 'Lunes' }, { value: 'martes', label: 'Martes' }, { value: 'miércoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' }, { value: 'viernes', label: 'Viernes' }, { value: 'sábado', label: 'Sábado' }, { value: 'domingo', label: 'Domingo' },
];
const MEALS = [{ value: 'desayuno', label: 'Desayuno' }, { value: 'almuerzo', label: 'Almuerzo' }, { value: 'cena', label: 'Cena' }];
const KINDS = [{ value: 'nueva', label: 'Nueva' }, { value: 'inventario', label: 'Inventario' }, { value: 'receta', label: 'Receta' }];

const roleLabel = (r) => ({ creador: 'Creador', chef: 'Chef', ayudante: 'Ayudante' }[r] || r || '');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const fmtTime = (t) => {
    try { return new Date(String(t).replace(' ', 'T')).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
};
const renderContent = (s) => {
    if (s.kind === 'receta') return `📖 ${s.recipe_title || 'Receta sugerida'}`;
    if (s.kind === 'inventario') return `🧊 Con el inventario: ${s.content || ''}`;
    return `🆕 ${s.content || ''}`;
};

const SuggestionsPanel = ({ currentFamily, currentUser, userRole }) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recipes, setRecipes] = useState([]);
    const [form, setForm] = useState({ day: '', meal: '', kind: 'nueva', content: '', recipe_id: '' });
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);
    const familyId = currentFamily?.family_id || currentFamily?.id;

    const load = async (silent = true) => {
        if (!familyId) return;
        try { const data = await mealSuggestionsService.getByFamily(familyId); setItems(Array.isArray(data) ? data : []); }
        catch { if (!silent) showToast('No se pudieron cargar las sugerencias. Revisa tu conexión.', 'error'); }
    };

    // Cargar + refrescar por polling mientras el panel está abierto
    useEffect(() => {
        if (!open || !familyId) return;
        setLoading(true);
        load(false).finally(() => setLoading(false)); // primera carga: sí avisa si falla
        familyRecipesService.getByFamily(familyId).then(r => setRecipes(Array.isArray(r) ? r : [])).catch(() => { });
        const t = setInterval(load, 12000);
        return () => clearInterval(t);
    }, [open, familyId]);

    // Auto-scroll al último mensaje
    useEffect(() => { if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [items, open]);

    const handleSend = async () => {
        if (form.kind === 'receta' && !form.recipe_id) { showToast('Elige una receta.'); return; }
        if ((form.kind === 'nueva' || form.kind === 'inventario') && !form.content.trim()) { showToast('Escribe tu sugerencia.'); return; }
        setSending(true);
        try {
            await mealSuggestionsService.create({
                family_id: familyId,
                user_id: currentUser.user_id,
                day_of_week: form.day || null,
                meal_type: form.meal || null,
                kind: form.kind,
                content: form.content.trim() || null,
                recipe_id: form.kind === 'receta' ? form.recipe_id : null,
            });
            setForm(f => ({ ...f, content: '', recipe_id: '' }));
            await load();
        } catch (e) { showToast(e.message || 'No se pudo enviar la sugerencia.'); }
        finally { setSending(false); }
    };

    const handleDelete = async (s) => {
        if (s.user_id !== currentUser.user_id && userRole !== 'creador') { showToast('Solo el autor o el creador pueden borrar.'); return; }
        try { await mealSuggestionsService.remove(s.suggestion_id, currentUser.user_id); setItems(prev => prev.filter(x => x.suggestion_id !== s.suggestion_id)); }
        catch { showToast('No se pudo borrar.'); }
    };

    if (!familyId) return null;

    return (
        <>
            <button className="sg-fab" onClick={() => setOpen(o => !o)} title="Sugerencias de comida" aria-label="Sugerencias de comida">
                <ChatCircleDots size={26} weight="fill" />
                {items.length > 0 && <span className="sg-fab-badge">{items.length > 99 ? '99+' : items.length}</span>}
            </button>

            {open && (
                <div className="sg-overlay" onClick={() => setOpen(false)}>
                    <div className="sg-panel" onClick={e => e.stopPropagation()}>
                        <div className="sg-head">
                            <div>
                                <h3>Sugerencias</h3>
                                <p>Propongan qué cocinar y para qué día 🍳</p>
                            </div>
                            <button className="sg-x" onClick={() => setOpen(false)} aria-label="Cerrar"><X size={22} /></button>
                        </div>

                        <div className="sg-list" ref={listRef}>
                            {loading && items.length === 0 ? (
                                <div className="sg-empty">Cargando…</div>
                            ) : items.length === 0 ? (
                                <div className="sg-empty">Aún no hay sugerencias.<br />¡Sé el primero en proponer! 👇</div>
                            ) : items.map(s => {
                                const mine = s.user_id === currentUser.user_id;
                                const initial = (s.author_name || '?').trim().charAt(0).toUpperCase();
                                const canDelete = mine || userRole === 'creador';
                                return (
                                    <div key={s.suggestion_id} className={`sg-msg${mine ? ' mine' : ''}`}>
                                        <span className="sg-av">{initial}</span>
                                        <div className="sg-bubble">
                                            <div className="sg-bubble-top">
                                                <b>{mine ? 'Tú' : s.author_name}</b>
                                                {s.author_role && <span className="sg-role">{roleLabel(s.author_role)}</span>}
                                                {canDelete && <button className="sg-del" onClick={() => handleDelete(s)} title="Borrar"><Trash size={13} weight="bold" /></button>}
                                            </div>
                                            {(s.day_of_week || s.meal_type) && (
                                                <div className="sg-slot">{cap(s.day_of_week)}{s.day_of_week && s.meal_type ? ' · ' : ''}{cap(s.meal_type)}</div>
                                            )}
                                            <div className="sg-content">{renderContent(s)}</div>
                                            <div className="sg-time">{fmtTime(s.created_at)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sg-composer">
                            <div className="sg-row">
                                <NvSelect up value={form.day} onChange={v => setForm(f => ({ ...f, day: v }))} options={DAYS} placeholder="Día (opcional)" />
                                <NvSelect up value={form.meal} onChange={v => setForm(f => ({ ...f, meal: v }))} options={MEALS} placeholder="Comida" />
                            </div>
                            <div className="sg-kinds">
                                {KINDS.map(k => (
                                    <button key={k.value} type="button" className={`sg-kind${form.kind === k.value ? ' on' : ''}`} onClick={() => setForm(f => ({ ...f, kind: k.value }))}>{k.label}</button>
                                ))}
                            </div>
                            {form.kind === 'receta' ? (
                                <NvSelect up value={form.recipe_id} onChange={v => setForm(f => ({ ...f, recipe_id: v }))}
                                    options={recipes.map(r => ({ value: r.recipe_id, label: r.title }))} placeholder="Elige una receta…" />
                            ) : (
                                <input className="sg-input" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                                    placeholder={form.kind === 'nueva' ? 'Nombre de la comida…' : '¿Qué ingredientes del inventario usar?'} />
                            )}
                            <button className="sg-send" onClick={handleSend} disabled={sending}>
                                <PaperPlaneTilt size={18} weight="fill" /> {sending ? 'Enviando…' : 'Sugerir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{SG_CSS}</style>
        </>
    );
};

const SG_CSS = `
.sg-fab{position:fixed;right:24px;bottom:24px;z-index:1200;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;
  background:linear-gradient(135deg,#FF9F43,#FF7F50);color:#fff;display:grid;place-items:center;
  box-shadow:0 14px 30px rgba(255,127,80,.45);transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s;}
.sg-fab:hover{transform:translateY(-3px) scale(1.06);box-shadow:0 20px 40px rgba(255,127,80,.55);}
.sg-fab:active{transform:scale(.96);}
.sg-fab-badge{position:absolute;top:-3px;right:-3px;background:#EF4444;color:#fff;font-size:.66rem;font-weight:800;
  min-width:20px;height:20px;padding:0 5px;border-radius:999px;display:grid;place-items:center;border:2px solid #fff;}
body.nv-modal-open .sg-fab{display:none;}

.sg-overlay{position:fixed;inset:0;z-index:4600;background:rgba(42,33,24,.38);backdrop-filter:blur(4px);
  display:flex;justify-content:flex-end;animation:sg-fade .25s ease both;}
@keyframes sg-fade{from{opacity:0;}to{opacity:1;}}
.sg-panel{width:400px;max-width:100%;height:100%;background:linear-gradient(180deg,#FFFDFB,#FFF6EC);display:flex;flex-direction:column;
  box-shadow:-18px 0 50px rgba(60,30,0,.25);animation:sg-slide .3s cubic-bezier(.2,.8,.3,1) both;}
@keyframes sg-slide{from{transform:translateX(40px);opacity:.4;}to{transform:none;opacity:1;}}

.sg-head{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 22px 16px;border-bottom:1px solid rgba(255,159,67,.16);}
.sg-head h3{font-family:'Nunito',sans-serif;font-weight:700;font-size:1.4rem;color:#2A2118;margin:0;}
.sg-head p{color:#9b8d7c;margin:3px 0 0;font-size:.82rem;font-weight:600;}
.sg-x{background:rgba(0,0,0,.05);border:none;cursor:pointer;color:#6B5E4F;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:none;transition:background .2s;}
.sg-x:hover{background:rgba(0,0,0,.1);}

.sg-list{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px;}
.sg-empty{margin:auto;text-align:center;color:#9b8d7c;font-weight:600;line-height:1.6;padding:30px;}
.sg-msg{display:flex;gap:9px;align-items:flex-end;max-width:92%;animation:sg-rise .3s ease both;}
.sg-msg.mine{flex-direction:row-reverse;align-self:flex-end;}
@keyframes sg-rise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.sg-av{width:32px;height:32px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:800;font-size:.85rem;color:#fff;background:linear-gradient(135deg,#FFB980,#FF8A4C);}
.sg-bubble{background:#fff;border:1px solid rgba(230,126,34,.16);border-radius:16px;padding:9px 13px;box-shadow:0 5px 14px rgba(150,80,20,.08);min-width:0;}
.sg-msg.mine .sg-bubble{background:#FFF3E6;border-color:rgba(255,159,67,.4);}
.sg-bubble-top{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.sg-bubble-top b{font-size:.82rem;color:#2A2118;font-weight:800;}
.sg-role{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:#e67e22;background:#FFF1E0;padding:2px 7px;border-radius:999px;}
.sg-del{margin-left:auto;background:none;border:none;cursor:pointer;color:#EF4444;opacity:.5;padding:2px;border-radius:6px;display:flex;transition:opacity .2s,background .2s;}
.sg-del:hover{opacity:1;background:#FEF2F2;}
.sg-slot{font-size:.68rem;font-weight:800;color:#16a34a;background:#ECFDF5;display:inline-block;padding:2px 8px;border-radius:999px;margin-bottom:5px;}
.sg-content{font-size:.92rem;color:#2A2118;font-weight:600;line-height:1.4;}
.sg-time{font-size:.66rem;color:#c9b9a6;font-weight:700;margin-top:4px;text-align:right;}

.sg-composer{border-top:1px solid rgba(255,159,67,.16);padding:14px 16px;background:rgba(255,255,255,.7);display:flex;flex-direction:column;gap:9px;}
.sg-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.sg-kinds{display:flex;gap:6px;}
.sg-kind{flex:1;border:1.5px solid rgba(230,126,34,.22);background:#fff;color:#9b8d7c;font-family:'Nunito',sans-serif;font-weight:800;font-size:.72rem;
  padding:8px 4px;border-radius:10px;cursor:pointer;transition:all .18s;}
.sg-kind.on{background:linear-gradient(135deg,#FF9F43,#FF7F50);color:#fff;border-color:transparent;box-shadow:0 6px 14px rgba(255,127,80,.3);}
.sg-input{border:1.5px solid rgba(230,126,34,.22);border-radius:12px;padding:11px 14px;font-family:'Nunito',sans-serif;font-size:.95rem;font-weight:600;
  color:#2A2118;background:rgba(255,250,244,.9);outline:none;transition:border-color .2s,box-shadow .2s;}
.sg-input:focus{border-color:#FF9F43;background:#fff;box-shadow:0 0 0 4px rgba(255,159,67,.16);}
.sg-send{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#FF9F43,#FF7F50);color:#fff;font-family:'Nunito',sans-serif;font-weight:800;font-size:.95rem;
  padding:12px;border-radius:13px;box-shadow:0 10px 22px rgba(255,127,80,.32);transition:transform .2s,box-shadow .2s,filter .2s;}
.sg-send:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 30px rgba(255,127,80,.42);filter:brightness(1.04);}
.sg-send:disabled{opacity:.6;cursor:not-allowed;}

@media (max-width:768px){
  .sg-fab{bottom:88px;right:16px;width:54px;height:54px;}
  .sg-panel{width:100%;}
}
@media (prefers-reduced-motion: reduce){ .sg-overlay,.sg-panel,.sg-msg{animation:none!important;} }
`;

export default SuggestionsPanel;
