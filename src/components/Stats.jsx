import React, { useState, useEffect, useMemo } from 'react';
import { Fire, ChartPieSlice, Recycle, ForkKnife, CalendarBlank, CircleNotch, Leaf, FilePdf } from '@phosphor-icons/react';
import { menuPlansService, dailyMealsService, inventoryService, ingredientsService } from '../api';

/* ============ utilidades de fecha ============ */
const toDateStr = (d) => (typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0]);
const startOfWeekMonday = (base = new Date()) => {
    const d = new Date(base);
    const day = d.getDay(); // 0 dom .. 6 sab
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const DAY_LABELS = [
    { key: 'lunes', short: 'Lun' }, { key: 'martes', short: 'Mar' }, { key: 'miércoles', short: 'Mié' },
    { key: 'jueves', short: 'Jue' }, { key: 'viernes', short: 'Vie' }, { key: 'sábado', short: 'Sáb' }, { key: 'domingo', short: 'Dom' },
];

const CAT_COLORS = {
    'proteína': '#E55039', 'grano': '#F6B93B', 'vegetal': '#16a34a', 'fruta': '#FF7043',
    'lácteo': '#4a90d9', 'grasa': '#b08a63', 'condimento': '#9b8d7c', 'bebida': '#48c6c6', 'otro': '#c9b9a6',
};
const CAT_LABELS = {
    'proteína': 'Proteínas', 'grano': 'Granos / Carbos', 'vegetal': 'Vegetales', 'fruta': 'Frutas',
    'lácteo': 'Lácteos', 'grasa': 'Grasas', 'condimento': 'Condimentos', 'bebida': 'Bebidas', 'otro': 'Otros',
};

/* ============ gráficas SVG ============ */
const Donut = ({ segments, size = 168, stroke = 24, centerTop, centerBottom }) => {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1E6D6" strokeWidth={stroke} />
            {segments.map((s, i) => {
                const len = (s.value / total) * c;
                const el = (
                    <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color}
                        strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
                        strokeLinecap="butt" transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{ transition: 'stroke-dasharray .6s ease, stroke-dashoffset .6s ease' }} />
                );
                offset += len;
                return el;
            })}
            {centerTop && <text x="50%" y="46%" textAnchor="middle" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 26, fill: '#2A2118' }}>{centerTop}</text>}
            {centerBottom && <text x="50%" y="60%" textAnchor="middle" style={{ fontWeight: 700, fontSize: 11, fill: '#9b8d7c', letterSpacing: '.04em' }}>{centerBottom}</text>}
        </svg>
    );
};

const Ring = ({ percent, size = 168, stroke = 22, color = '#16a34a' }) => {
    const p = Math.max(0, Math.min(100, percent || 0));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const len = (p / 100) * c;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1E6D6" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray .7s ease' }} />
            <text x="50%" y="46%" textAnchor="middle" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 30, fill: '#2A2118' }}>{Math.round(p)}%</text>
            <text x="50%" y="60%" textAnchor="middle" style={{ fontWeight: 700, fontSize: 10.5, fill: '#9b8d7c', letterSpacing: '.05em' }}>APROVECHADO</text>
        </svg>
    );
};

const Bars = ({ data, color = '#FF9F43', unit = '' }) => {
    const max = Math.max(1, ...data.map(d => d.value));
    return (
        <div className="st-bars">
            {data.map((d, i) => (
                <div key={i} className="st-bar-col">
                    <div className="st-bar-val">{d.value > 0 ? Math.round(d.value) : ''}</div>
                    <div className="st-bar-track">
                        <div className="st-bar-fill" style={{ height: `${(d.value / max) * 100}%`, background: `linear-gradient(180deg, ${color}, ${color}cc)` }} />
                    </div>
                    <div className="st-bar-lbl">{d.label}</div>
                </div>
            ))}
        </div>
    );
};

/* ============ componente principal ============ */
const Stats = ({ currentFamily }) => {
    const [view, setView] = useState('week'); // 'week' | 'month'
    const [loading, setLoading] = useState(true);
    const [raw, setRaw] = useState({ plansMeals: [], inventory: [], catMap: {} });

    const familyId = currentFamily?.family_id || currentFamily?.id;

    useEffect(() => {
        let cancel = false;
        const load = async () => {
            if (!familyId) { setLoading(false); return; }
            setLoading(true);
            try {
                const [plans, inventory, ingredients] = await Promise.all([
                    menuPlansService.getByFamily(familyId).catch(() => []),
                    inventoryService.getByFamily(familyId).catch(() => []),
                    ingredientsService.getAll().catch(() => []),
                ]);

                // mapa nombre(min) -> categoría
                const catMap = {};
                (Array.isArray(ingredients) ? ingredients : []).forEach(ing => {
                    if (ing && ing.name) catMap[String(ing.name).toLowerCase().trim()] = ing.category || 'otro';
                });

                // planes recientes (últimas ~6 semanas) para no sobrecargar
                const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 42);
                const recent = (Array.isArray(plans) ? plans : [])
                    .filter(p => p.start_date && new Date(p.start_date) >= cutoff)
                    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                    .slice(-6);

                const plansMeals = [];
                for (const p of recent) {
                    const meals = await dailyMealsService.getByPlan(p.menu_plan_id).catch(() => []);
                    plansMeals.push({ plan: p, meals: Array.isArray(meals) ? meals : [] });
                }
                if (!cancel) setRaw({ plansMeals, inventory: Array.isArray(inventory) ? inventory : [], catMap });
            } catch (e) {
                console.error('Error cargando estadísticas:', e);
                if (!cancel) setRaw({ plansMeals: [], inventory: [], catMap: {} });
            } finally {
                if (!cancel) setLoading(false);
            }
        };
        load();
        return () => { cancel = true; };
    }, [familyId]);

    /* ---- agregación según vista ---- */
    const agg = useMemo(() => {
        const thisMon = startOfWeekMonday();
        const thisMonStr = toDateStr(thisMon);
        const now = new Date();
        const curMonth = now.getMonth(), curYear = now.getFullYear();

        // filtra planes relevantes
        let relevant;
        if (view === 'week') {
            relevant = raw.plansMeals.filter(pm => toDateStr(pm.plan.start_date) === thisMonStr);
            if (relevant.length === 0 && raw.plansMeals.length) relevant = [raw.plansMeals[raw.plansMeals.length - 1]];
        } else {
            relevant = raw.plansMeals.filter(pm => {
                const d = new Date(pm.plan.start_date);
                return d.getMonth() === curMonth && d.getFullYear() === curYear;
            });
            if (relevant.length === 0) relevant = raw.plansMeals.slice(-4);
        }

        const allMeals = relevant.flatMap(pm => pm.meals);
        const totalCal = allMeals.reduce((a, m) => a + (Number(m.calories_per_serving) || 0), 0);
        const mealsCount = allMeals.length;

        // calorías por día (semana) o por semana (mes)
        let calBars;
        if (view === 'week') {
            const byDay = Object.fromEntries(DAY_LABELS.map(d => [d.key, 0]));
            allMeals.forEach(m => { const k = (m.day_of_week || '').toLowerCase(); if (k in byDay) byDay[k] += (Number(m.calories_per_serving) || 0); });
            calBars = DAY_LABELS.map(d => ({ label: d.short, value: byDay[d.key] }));
        } else {
            calBars = relevant.map((pm, i) => ({
                label: `S${i + 1}`,
                value: pm.meals.reduce((a, m) => a + (Number(m.calories_per_serving) || 0), 0),
            }));
        }

        // macros estimados (lógico, desde calorías)
        const protein = Math.round((totalCal * 0.25) / 4);
        const carbs = Math.round((totalCal * 0.50) / 4);
        const fat = Math.round((totalCal * 0.25) / 9);
        const sugar = Math.round(carbs * 0.28);

        // grupos de comida desde ingredientes planificados
        const groups = {};
        allMeals.forEach(m => {
            (Array.isArray(m.ingredients) ? m.ingredients : []).forEach(line => {
                const txt = String(line).split('(')[0].toLowerCase();
                let cat = null;
                for (const name in raw.catMap) { if (name && txt.includes(name)) { cat = raw.catMap[name]; break; } }
                if (!cat) cat = 'otro';
                groups[cat] = (groups[cat] || 0) + 1;
            });
        });
        const groupArr = Object.entries(groups)
            .map(([k, v]) => ({ cat: k, label: CAT_LABELS[k] || k, value: v, color: CAT_COLORS[k] || '#c9b9a6' }))
            .sort((a, b) => b.value - a.value);

        // aprovechamiento / desperdicio desde inventario (fechas de vencimiento)
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let fresh = 0, expired = 0;
        raw.inventory.forEach(it => {
            if (it.expiration_date) {
                const d = new Date(toDateStr(it.expiration_date) + 'T12:00:00');
                if (d < today) expired++; else fresh++;
            } else fresh++;
        });
        const totalInv = fresh + expired;
        const aprov = totalInv ? Math.round((fresh / totalInv) * 100) : 100;

        return { totalCal, mealsCount, calBars, protein, carbs, fat, sugar, groupArr, fresh, expired, totalInv, aprov, hasData: mealsCount > 0 };
    }, [raw, view]);

    /* ---- render ---- */
    if (loading) {
        return (
            <div className="main-content">
                <div className="st-loading"><CircleNotch size={46} className="ph-spin" color="#FF9F43" /><p>Calculando tu resumen…</p></div>
                <style>{ST_CSS}</style>
            </div>
        );
    }

    const macroSegs = [
        { label: 'Proteínas', value: agg.protein, color: '#E55039' },
        { label: 'Carbohidratos', value: agg.carbs, color: '#F6B93B' },
        { label: 'Grasas', value: agg.fat, color: '#b08a63' },
    ];
    const periodLabel = view === 'week' ? 'esta semana' : 'este mes';

    return (
        <div className="main-content">
            <div className="st-wrap">
                {/* encabezado solo para el PDF impreso */}
                <div className="st-print-head">
                    <h2>Neverita · Resumen {periodLabel}</h2>
                    <p>{(currentFamily?.name || currentFamily?.family_name || 'Mi familia')} — generado el {new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                {/* encabezado */}
                <div className="st-head">
                    <div>
                        <h1 className="st-title">Resumen</h1>
                        <p className="st-sub">Lo que has planificado {periodLabel}, en números.</p>
                    </div>
                    <div className="st-actions">
                        <div className="st-toggle" role="tablist">
                            <button className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}>Semana</button>
                            <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}>Mes</button>
                        </div>
                        <button className="st-export" onClick={() => window.print()} title="Exportar a PDF">
                            <FilePdf size={18} weight="fill" /> Exportar PDF
                        </button>
                    </div>
                </div>

                {!agg.hasData ? (
                    <div className="st-empty">
                        <CalendarBlank size={54} weight="duotone" color="#FF9F43" />
                        <h3>Aún no hay nada que mostrar</h3>
                        <p>Planifica algunas comidas {periodLabel} y aquí verás tus calorías, nutrientes y aprovechamiento con gráficas.</p>
                    </div>
                ) : (
                    <>
                        {/* KPIs */}
                        <div className="st-kpis">
                            <div className="st-kpi">
                                <div className="st-kpi-ic" style={{ background: 'linear-gradient(135deg,#FF9F43,#FF7F50)' }}><Fire size={22} weight="fill" /></div>
                                <div><div className="st-kpi-num">{agg.totalCal.toLocaleString('es')}</div><div className="st-kpi-lbl">kcal {periodLabel}</div></div>
                            </div>
                            <div className="st-kpi">
                                <div className="st-kpi-ic" style={{ background: 'linear-gradient(135deg,#FFB774,#FF9F43)' }}><ForkKnife size={22} weight="fill" /></div>
                                <div><div className="st-kpi-num">{agg.mealsCount}</div><div className="st-kpi-lbl">comidas planificadas</div></div>
                            </div>
                            <div className="st-kpi">
                                <div className="st-kpi-ic" style={{ background: 'linear-gradient(135deg,#34C759,#16a34a)' }}><Recycle size={22} weight="fill" /></div>
                                <div><div className="st-kpi-num">{agg.aprov}%</div><div className="st-kpi-lbl">comida aprovechada</div></div>
                            </div>
                            <div className="st-kpi">
                                <div className="st-kpi-ic" style={{ background: 'linear-gradient(135deg,#F6B93B,#e6a100)' }}><Leaf size={22} weight="fill" /></div>
                                <div><div className="st-kpi-num">{Math.round(agg.totalCal / Math.max(1, agg.mealsCount))}</div><div className="st-kpi-lbl">kcal por comida</div></div>
                            </div>
                        </div>

                        {/* fila de gráficas */}
                        <div className="st-grid">
                            {/* calorías */}
                            <div className="st-card st-card-wide">
                                <div className="st-card-h"><span className="st-dot" style={{ background: '#FF9F43' }} /> Calorías por {view === 'week' ? 'día' : 'semana'}</div>
                                <Bars data={agg.calBars} color="#FF9F43" />
                            </div>

                            {/* macros */}
                            <div className="st-card">
                                <div className="st-card-h"><ChartPieSlice size={18} weight="fill" color="#E55039" /> Nutrientes <span className="st-aprox">estimado</span></div>
                                <div className="st-donut-row">
                                    <Donut segments={macroSegs} centerTop={`${agg.totalCal.toLocaleString('es')}`} centerBottom="KCAL" />
                                    <ul className="st-legend">
                                        {macroSegs.map(s => (
                                            <li key={s.label}><span className="st-lg-dot" style={{ background: s.color }} /> {s.label}<b>{s.value} g</b></li>
                                        ))}
                                        <li className="st-sugar"><span className="st-lg-dot" style={{ background: '#fff', border: '2px solid #F6B93B' }} /> de ellos azúcares<b>{agg.sugar} g</b></li>
                                    </ul>
                                </div>
                            </div>

                            {/* aprovechamiento */}
                            <div className="st-card">
                                <div className="st-card-h"><Recycle size={18} weight="fill" color="#16a34a" /> Aprovechamiento</div>
                                <div className="st-donut-row">
                                    <Ring percent={agg.aprov} />
                                    <ul className="st-legend">
                                        <li><span className="st-lg-dot" style={{ background: '#16a34a' }} /> Aprovechada<b>{agg.fresh} ítems</b></li>
                                        <li><span className="st-lg-dot" style={{ background: '#E55039' }} /> Desperdiciada<b>{agg.expired} ítems</b></li>
                                        <li className="st-sugar"><span className="st-lg-dot" style={{ background: '#fff', border: '2px solid #c9b9a6' }} /> Total en inventario<b>{agg.totalInv} ítems</b></li>
                                    </ul>
                                </div>
                                <p className="st-note">Según las fechas de vencimiento de tu inventario.</p>
                            </div>

                            {/* grupos de comida */}
                            {agg.groupArr.length > 0 && (
                                <div className="st-card st-card-wide">
                                    <div className="st-card-h"><Leaf size={18} weight="fill" color="#16a34a" /> Grupos de comida que más usas</div>
                                    <div className="st-groups">
                                        {agg.groupArr.slice(0, 6).map(g => {
                                            const maxG = agg.groupArr[0].value || 1;
                                            return (
                                                <div className="st-group" key={g.cat}>
                                                    <span className="st-group-lbl">{g.label}</span>
                                                    <div className="st-group-track"><div className="st-group-fill" style={{ width: `${(g.value / maxG) * 100}%`, background: g.color }} /></div>
                                                    <span className="st-group-val">{g.value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="st-foot">Las calorías salen de tus recetas planificadas. Proteínas, carbohidratos y azúcares son una estimación a partir de esas calorías.</p>
                    </>
                )}
            </div>
            <style>{ST_CSS}</style>
        </div>
    );
};

const ST_CSS = `
.st-wrap{max-width:1100px;margin:0 auto;animation:st-in .5s ease both;}
@keyframes st-in{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
.st-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px;}
.st-title{font-family:'Nunito',sans-serif;font-weight:700;font-size:2.1rem;color:#2A2118;margin:0;}
.st-sub{color:#6B5E4F;margin:4px 0 0;font-size:.98rem;}
.st-toggle{display:inline-flex;background:#FFF1E0;border:1px solid rgba(230,126,34,.2);border-radius:999px;padding:4px;gap:4px;}
.st-toggle button{border:none;background:none;cursor:pointer;font-weight:800;font-size:.9rem;color:#9b8d7c;padding:8px 20px;border-radius:999px;transition:all .2s;}
.st-toggle button.on{background:linear-gradient(135deg,#FF9F43,#FF7F50);color:#fff;box-shadow:0 6px 14px rgba(255,127,80,.32);}
.st-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.st-export{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(230,126,34,.3);background:#fff;color:#e67e22;
  font-weight:800;font-size:.9rem;padding:9px 16px;border-radius:999px;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px rgba(230,126,34,.1);}
.st-export:hover{background:linear-gradient(135deg,#FF9F43,#FF7F50);color:#fff;border-color:transparent;transform:translateY(-2px);box-shadow:0 10px 20px rgba(255,127,80,.3);}
.st-print-head{display:none;}

.st-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;}
.st-kpi{background:#fff;border:1px solid rgba(230,126,34,.14);border-radius:18px;padding:16px;display:flex;align-items:center;gap:13px;box-shadow:0 8px 20px rgba(150,80,20,.07);}
.st-kpi-ic{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;color:#fff;flex:none;}
.st-kpi-num{font-family:'Nunito',sans-serif;font-weight:700;font-size:1.5rem;color:#2A2118;line-height:1;}
.st-kpi-lbl{font-size:.78rem;color:#9b8d7c;font-weight:700;margin-top:3px;}

.st-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.st-card{background:#fff;border:1px solid rgba(230,126,34,.14);border-radius:22px;padding:20px 22px;box-shadow:0 10px 26px rgba(150,80,20,.07);}
.st-card-wide{grid-column:1 / -1;}
.st-card-h{display:flex;align-items:center;gap:8px;font-weight:800;color:#2A2118;font-size:1.02rem;margin-bottom:16px;}
.st-dot{width:11px;height:11px;border-radius:50%;display:inline-block;}
.st-aprox{margin-left:auto;font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#b08a63;background:#FFF1E0;padding:3px 9px;border-radius:999px;}

.st-bars{display:flex;align-items:flex-end;gap:10px;height:180px;padding-top:10px;}
.st-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;gap:6px;}
.st-bar-val{font-size:.72rem;font-weight:800;color:#9b8d7c;height:14px;}
.st-bar-track{flex:1;width:100%;max-width:42px;display:flex;align-items:flex-end;}
.st-bar-fill{width:100%;border-radius:9px 9px 4px 4px;min-height:4px;transition:height .6s cubic-bezier(.2,.8,.3,1);}
.st-bar-lbl{font-size:.74rem;font-weight:800;color:#6B5E4F;}

.st-donut-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap;justify-content:center;}
.st-legend{list-style:none;margin:0;padding:0;flex:1;min-width:160px;display:flex;flex-direction:column;gap:11px;}
.st-legend li{display:flex;align-items:center;gap:9px;font-size:.92rem;color:#6B5E4F;font-weight:600;}
.st-legend li b{margin-left:auto;color:#2A2118;font-weight:800;}
.st-lg-dot{width:13px;height:13px;border-radius:5px;flex:none;}
.st-sugar{font-size:.84rem!important;color:#9b8d7c!important;border-top:1px dashed #EADBC7;padding-top:10px;}
.st-note{margin:14px 0 0;font-size:.78rem;color:#9b8d7c;text-align:center;}

.st-groups{display:flex;flex-direction:column;gap:12px;}
.st-group{display:flex;align-items:center;gap:12px;}
.st-group-lbl{width:130px;font-weight:700;color:#6B5E4F;font-size:.9rem;flex:none;}
.st-group-track{flex:1;height:14px;background:#F6EEE2;border-radius:999px;overflow:hidden;}
.st-group-fill{height:100%;border-radius:999px;transition:width .6s ease;}
.st-group-val{width:32px;text-align:right;font-weight:800;color:#2A2118;font-size:.88rem;}

.st-foot{margin:22px 0 0;text-align:center;color:#9b8d7c;font-size:.8rem;font-style:italic;}
.st-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-height:50vh;color:#6B5E4F;font-weight:600;}
.st-empty{background:#fff;border:1px dashed rgba(230,126,34,.3);border-radius:24px;padding:48px 28px;text-align:center;max-width:560px;margin:30px auto;}
.st-empty h3{font-family:'Nunito',sans-serif;color:#2A2118;margin:14px 0 8px;font-size:1.4rem;}
.st-empty p{color:#6B5E4F;margin:0;line-height:1.5;}

@media (max-width:900px){ .st-kpis{grid-template-columns:repeat(2,1fr);} }
@media (max-width:760px){
  .st-grid{grid-template-columns:1fr;}
  .st-title{font-size:1.7rem;}
  .st-head{align-items:flex-start;}
}
@media (max-width:480px){
  .st-kpis{grid-template-columns:repeat(2,1fr);gap:10px;}
  .st-kpi{padding:13px;flex-direction:column;align-items:flex-start;gap:9px;}
  .st-bars{height:150px;}
  .st-group-lbl{width:96px;font-size:.82rem;}
}
@media (prefers-reduced-motion: reduce){ .st-wrap,.st-bar-fill,.st-group-fill{animation:none!important;transition:none!important;} }

/* ====== IMPRESIÓN / EXPORTAR A PDF ====== */
@media print {
  /* ocultar el resto de la app, dejar solo el resumen */
  .sidebar-modern, .mobile-nav { display: none !important; }
  .app-container { display: block !important; }
  .main-content { padding: 0 !important; margin: 0 !important; width: 100% !important; }
  html, body { background: #fff !important; }
  /* asegurar que se impriman los colores de las gráficas */
  .st-wrap, .st-wrap * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .st-actions, .st-toggle, .st-export { display: none !important; }
  .st-print-head { display: block !important; margin-bottom: 18px; }
  .st-print-head h2 { font-family:'Nunito',sans-serif; color:#2A2118; font-size:1.5rem; margin:0 0 4px; }
  .st-print-head p { color:#6B5E4F; margin:0; font-size:.9rem; }
  .st-wrap { max-width: 100% !important; animation: none !important; }
  .st-head { margin-bottom: 14px; }
  .st-card, .st-kpi { box-shadow: none !important; border: 1px solid #e8ddcb !important; break-inside: avoid; }
  .st-grid { gap: 12px !important; }
  .st-foot { margin-top: 16px; }
  @page { margin: 1.4cm; }
}
`;

export default Stats;