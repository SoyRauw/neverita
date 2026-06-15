import React, { useState, useEffect } from 'react';
import { Snowflake, Sparkle, CalendarBlank, Fire, Carrot, Egg, Fish, Cheese, Leaf } from '@phosphor-icons/react';

// Mockup del teléfono con animación (reutiliza el de la landing, autocontenido)
const FLOAT_ICONS = [Carrot, Egg, Fish, Cheese, Fire, Leaf];
const SCREENS = [
    { label: 'Inventario', icon: Snowflake },
    { label: 'Receta IA', icon: Sparkle },
    { label: 'Mi semana', icon: CalendarBlank },
];

const PhoneMockup = () => {
    const [screen, setScreen] = useState(0);

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        const id = setInterval(() => setScreen((s) => (s + 1) % 3), 2600);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="pm-visual">
            <style>{PM_CSS}</style>
            <div className="pm-glow" aria-hidden="true" />
            {FLOAT_ICONS.map((Ic, i) => (
                <span key={i} className={`pm-float pm-float-${i}`} aria-hidden="true">
                    <Ic size={22} weight="fill" />
                </span>
            ))}
            <div className="pm-phone">
                <div className="pm-phone-notch" />
                <div className="pm-phone-screen">
                    <div className="pm-app-top"><span className="pm-app-dot" /> Neverita</div>
                    <div className="pm-app-tabs">
                        {SCREENS.map((s, i) => (
                            <span key={i} className={`pm-app-tab ${screen === i ? 'on' : ''}`}>
                                <s.icon size={15} weight={screen === i ? 'fill' : 'regular'} />
                            </span>
                        ))}
                    </div>
                    <div className="pm-app-body">
                        {/* Pantalla 0: inventario */}
                        <div className={`pm-app-view ${screen === 0 ? 'on' : ''}`}>
                            {['Tomates', 'Huevos', 'Pollo', 'Queso'].map((t, i) => (
                                <div className="pm-row" style={{ animationDelay: `${i * 0.07}s` }} key={t}>
                                    <span className="pm-row-ic"><Snowflake size={16} weight="fill" /></span>
                                    <span className="pm-row-tx">{t}</span>
                                    <span className="pm-row-tag">en stock</span>
                                </div>
                            ))}
                        </div>
                        {/* Pantalla 1: receta IA */}
                        <div className={`pm-app-view ${screen === 1 ? 'on' : ''}`}>
                            <div className="pm-reci">
                                <div className="pm-reci-img"><Fire size={26} weight="fill" color="#fff" /></div>
                                <div className="pm-reci-tt">Tortilla de la casa</div>
                                <div className="pm-reci-sub"><Sparkle size={12} weight="fill" /> Sugerida por IA</div>
                                <div className="pm-reci-chips"><span>Huevos</span><span>Queso</span><span>15 min</span></div>
                            </div>
                        </div>
                        {/* Pantalla 2: semana */}
                        <div className={`pm-app-view ${screen === 2 ? 'on' : ''}`}>
                            {['Lun', 'Mar', 'Mié', 'Jue'].map((d, i) => (
                                <div className="pm-day" style={{ animationDelay: `${i * 0.07}s` }} key={d}>
                                    <span className="pm-day-l">{d}</span>
                                    <span className="pm-day-bar" style={{ width: `${55 + i * 12}%` }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PM_CSS = `
.pm-visual{--o:#FF9F43;--o2:#FF7F50;--ink3:#9b8d7c;--disp:'Fraunces',Georgia,serif;
  position:relative;display:flex;justify-content:center;align-items:center;min-height:420px;}
.pm-glow{position:absolute;width:340px;height:340px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,159,67,.45),transparent 65%);filter:blur(20px);
  animation:pm-breathe 6s ease-in-out infinite;}
.pm-phone{position:relative;width:248px;height:500px;border-radius:42px;background:#1f1810;
  padding:13px;box-shadow:0 40px 80px -20px rgba(120,60,10,.5),0 0 0 2px rgba(255,255,255,.06) inset;
  animation:pm-floaty 7s ease-in-out infinite;}
.pm-phone-notch{position:absolute;top:13px;left:50%;transform:translateX(-50%);width:92px;height:21px;
  background:#1f1810;border-radius:0 0 16px 16px;z-index:3;}
.pm-phone-screen{width:100%;height:100%;border-radius:30px;overflow:hidden;
  background:linear-gradient(180deg,#FFF6EC,#FFEFDF);display:flex;flex-direction:column;}
.pm-app-top{padding:28px 18px 10px;font-family:var(--disp);font-weight:600;font-size:1.1rem;display:flex;align-items:center;gap:8px;color:#2A2118;}
.pm-app-dot{width:9px;height:9px;border-radius:50%;background:var(--o);box-shadow:0 0 0 4px rgba(255,159,67,.22);}
.pm-app-tabs{display:flex;gap:8px;padding:0 18px 12px;}
.pm-app-tab{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#fff;color:var(--ink3);
  box-shadow:0 3px 8px rgba(180,100,30,.08);transition:all .35s;}
.pm-app-tab.on{background:linear-gradient(135deg,var(--o),var(--o2));color:#fff;box-shadow:0 8px 16px rgba(255,127,80,.4);transform:translateY(-2px);}
.pm-app-body{position:relative;flex:1;margin:0 14px 16px;}
.pm-app-view{position:absolute;inset:0;display:flex;flex-direction:column;gap:9px;opacity:0;
  transform:translateY(14px) scale(.98);transition:opacity .5s,transform .5s;pointer-events:none;}
.pm-app-view.on{opacity:1;transform:none;}
.pm-row{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:11px 12px;
  box-shadow:0 4px 12px rgba(180,100,30,.07);animation:pm-rowin .5s both;}
.pm-row-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:none;background:#FFECD9;color:#FF9F43;}
.pm-row-tx{font-weight:800;font-size:.92rem;flex:1;color:#2A2118;}
.pm-row-tag{font-size:.68rem;font-weight:800;color:#16a34a;background:#dcfce7;padding:3px 8px;border-radius:50px;}
.pm-reci{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 24px rgba(180,100,30,.12);}
.pm-reci-img{height:96px;background:linear-gradient(135deg,var(--o),var(--o2));display:grid;place-items:center;}
.pm-reci-tt{font-family:var(--disp);font-weight:600;font-size:1.05rem;padding:12px 13px 2px;color:#2A2118;}
.pm-reci-sub{display:flex;align-items:center;gap:5px;color:var(--o2);font-weight:800;font-size:.74rem;padding:0 13px;}
.pm-reci-chips{display:flex;gap:6px;flex-wrap:wrap;padding:11px 13px 14px;}
.pm-reci-chips span{font-size:.72rem;font-weight:800;background:#FFEAD7;color:var(--o2);padding:5px 10px;border-radius:50px;}
.pm-day{display:flex;align-items:center;gap:10px;background:#fff;border-radius:13px;padding:11px 12px;
  box-shadow:0 4px 12px rgba(180,100,30,.07);animation:pm-rowin .5s both;}
.pm-day-l{font-weight:900;font-size:.78rem;color:var(--ink3);width:30px;}
.pm-day-bar{height:9px;border-radius:50px;background:linear-gradient(90deg,var(--o),var(--o2));}
.pm-float{position:absolute;width:46px;height:46px;border-radius:15px;background:#fff;
  display:grid;place-items:center;color:var(--o2);box-shadow:0 12px 26px rgba(180,100,30,.18);z-index:2;}
.pm-float-0{top:6%;left:4%;animation:pm-floaty 5.5s ease-in-out infinite;}
.pm-float-1{top:18%;right:0;animation:pm-floaty 6.5s .4s ease-in-out infinite;}
.pm-float-2{bottom:22%;left:-2%;animation:pm-floaty 5s .2s ease-in-out infinite;}
.pm-float-3{bottom:5%;right:6%;animation:pm-floaty 7s .6s ease-in-out infinite;}
.pm-float-4{top:46%;left:-5%;animation:pm-floaty 6s .3s ease-in-out infinite;color:var(--o);}
.pm-float-5{top:1%;right:22%;animation:pm-floaty 6.2s .5s ease-in-out infinite;color:#16a34a;}
@keyframes pm-floaty{0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);}}
@keyframes pm-breathe{0%,100%{transform:scale(1);opacity:.85;}50%{transform:scale(1.08);opacity:1;}}
@keyframes pm-rowin{from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:none;}}
@media (max-width:520px){ .pm-phone{width:210px;height:430px;} .pm-visual{min-height:360px;} }
@media (prefers-reduced-motion: reduce){ .pm-phone,.pm-glow,.pm-float{animation:none!important;} }
`;

export default PhoneMockup;
