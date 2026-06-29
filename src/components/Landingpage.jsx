import React, { useState, useEffect, useRef } from 'react';
import {
    Snowflake, Sparkle, CalendarBlank, ShoppingCart, UsersThree,
    ArrowRight, X, Check, Clock, Leaf, PiggyBank, BellRinging, CaretDown,
    Plus, Fire, Carrot, Egg, Fish, Cheese, SpeakerHigh, Sun, BookOpen,
} from '@phosphor-icons/react';
import FridgeIcon from './FridgeIcon';

/* =====================================================================
   NEVERITA · LANDING / HOME PAGE
   Componente autocontenido. Todos los estilos están namespaced bajo
   .nv-land para no colisionar con el resto de la app. Solo front/estética.
   props:
     - onClose():   vuelve al login
     - onRegister(): vuelve al login en modo "Crear cuenta"
   ===================================================================== */

// Hook de revelado al hacer scroll (IntersectionObserver)
function useReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const root = ref.current;
        if (!root) return;
        const els = root.querySelectorAll('[data-reveal]');
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
            els.forEach((el) => el.classList.add('nv-in'));
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('nv-in');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
    return ref;
}

const FEATURES = [
    {
        icon: Snowflake,
        tag: 'Inventario',
        title: 'Tu heladera, siempre bajo control',
        text: 'Registra lo que tienes en casa y olvídate de los desperdicios. Neverita te avisa qué está por caducar y descuenta los ingredientes automáticamente cada vez que cocinas.',
        bullets: ['Control de caducidades', 'Descuento automático al cocinar', 'Stock siempre actualizado'],
        accent: '#FF9F43',
    },
    {
        icon: Sparkle,
        tag: 'Recetas con IA',
        title: 'Recetas con lo que ya tienes',
        text: 'La inteligencia artificial mira tu inventario y te sugiere platos que puedes preparar ahora mismo. ¿Te gustó una idea? La genera completa, la ajusta a las personas que comen y hasta te la lee en voz alta mientras cocinas.',
        bullets: ['Sugerencias según tu stock', 'Pasos, cantidades y porciones', 'Lectura en voz alta'],
        accent: '#FF7F50',
    },
    {
        icon: CalendarBlank,
        tag: 'Planificador',
        title: 'Planifica tu semana en minutos',
        text: 'Toca el día y la comida que quieras y elige cómo llenarlo: deja que la IA cree el plato o usa una receta que ya tienes. Cámbiala o elimínala cuando quieras, y mira de un vistazo "lo que toca hoy".',
        bullets: ['IA o tus propias recetas', 'Desayuno, almuerzo y cena por día', 'Edita, cambia o elimina'],
        accent: '#F9A03F',
    },
    {
        icon: ShoppingCart,
        tag: 'Lista de compras',
        title: 'La lista se arma sola',
        text: 'A partir de tu plan de la semana, Neverita calcula exactamente lo que te falta y crea tu lista de compras inteligente. Vas al súper sin dudas ni olvidos.',
        bullets: ['Generada desde tu menú', 'Solo lo que realmente falta', 'Lista lista para el súper'],
        accent: '#FF9F43',
    },
    {
        icon: UsersThree,
        tag: 'Familias',
        title: 'Cocinen en equipo',
        text: 'Comparte inventario, recetas y planes con tu familia mediante un simple código de invitación. Todos sincronizados, todos al día.',
        bullets: ['Unión por código', 'Inventario compartido', 'Planes en conjunto'],
        accent: '#FF7F50',
    },
];

const STEPS = [
    { n: '01', icon: Snowflake, title: 'Carga tu heladera', text: 'Añade los alimentos que tienes en casa con sus fechas.' },
    { n: '02', icon: Sparkle, title: 'Pide ideas a la IA', text: 'Recibe recetas hechas con tus ingredientes disponibles.' },
    { n: '03', icon: CalendarBlank, title: 'Planifica la semana', text: 'Toca cada día y elige: que la IA cocine por ti o usa una receta tuya.' },
    { n: '04', icon: ShoppingCart, title: 'Compra sin olvidos', text: 'Genera tu lista con lo justo y necesario.' },
];

const BENEFITS = [
    { icon: Leaf, title: 'Menos desperdicio', text: 'Aprovecha cada alimento antes de que caduque.' },
    { icon: Clock, title: 'Ahorra tiempo', text: 'Se acabó pensar "¿qué cocino hoy?" cada día.' },
    { icon: PiggyBank, title: 'Cuida tu bolsillo', text: 'Compras lo justo, gastas mejor.' },
    { icon: UsersThree, title: 'En familia', text: 'Todos coordinados desde un mismo lugar.' },
];

const FLOAT_ICONS = [Carrot, Egg, Fish, Cheese, Fire, Leaf];

const LandingPage = ({ onClose, onRegister }) => {
    const rootRef = useReveal();
    const [screen, setScreen] = useState(0); // mockup del teléfono: 0,1,2
    const [scrolled, setScrolled] = useState(false);

    // Ciclo automático del mockup
    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        const id = setInterval(() => setScreen((s) => (s + 1) % 3), 2600);
        return () => clearInterval(id);
    }, []);

    // Sombra del nav al hacer scroll
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const onScroll = () => setScrolled(el.scrollTop > 24);
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [rootRef]);

    const screens = [
        { label: 'Inventario', icon: Snowflake, color: '#FF9F43' },
        { label: 'Receta IA', icon: Sparkle, color: '#FF7F50' },
        { label: 'Mi semana', icon: CalendarBlank, color: '#F9A03F' },
    ];

    return (
        <div className="nv-land" ref={rootRef}>
            <style>{CSS}</style>

            {/* Fondos decorativos */}
            <div className="nv-bg-mesh" aria-hidden="true" />
            <div className="nv-bg-grain" aria-hidden="true" />

            {/* NAV */}
            <nav className={`nv-nav ${scrolled ? 'nv-nav-solid' : ''}`}>
                <div className="nv-nav-inner">
                    <div className="nv-logo" onClick={() => rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <span className="nv-logo-badge"><FridgeIcon size={20} color="#fff" strokeWidth={2.2} /></span>
                        <span className="nv-logo-text">Neve<b>rita.</b></span>
                    </div>
                    <button className="nv-btn nv-btn-ghost nv-nav-cta" onClick={onClose}>
                        Iniciar sesión <ArrowRight size={16} weight="bold" />
                    </button>
                </div>
            </nav>

            {/* HERO */}
            <header className="nv-hero">
                <div className="nv-hero-grid">
                    <div className="nv-hero-copy">
                        <span className="nv-eyebrow nv-pop" style={{ animationDelay: '.05s' }}>
                            <Sparkle size={15} weight="fill" /> Tu cocina, más inteligente
                        </span>
                        <h1 className="nv-h1">
                            <span className="nv-pop" style={{ animationDelay: '.12s' }}>Menos desperdicio.</span><br />
                            <span className="nv-pop nv-grad-text" style={{ animationDelay: '.22s' }}>Más sabor.</span>
                        </h1>
                        <p className="nv-lead nv-pop" style={{ animationDelay: '.34s' }}>
                            Neverita organiza tu heladera, te sugiere recetas con lo que ya tienes,
                            planifica tu semana, arma tu lista de compras y hasta te lee las recetas
                            en voz alta. Todo en un solo lugar, y en familia.
                        </p>
                        <div className="nv-hero-cta nv-pop" style={{ animationDelay: '.46s' }}>
                            <button className="nv-btn nv-btn-primary" onClick={onRegister}>
                                Crear cuenta gratis <ArrowRight size={18} weight="bold" />
                            </button>
                            <button className="nv-btn nv-btn-soft" onClick={onClose}>
                                Ya tengo cuenta
                            </button>
                        </div>
                        <div className="nv-hero-mini nv-pop" style={{ animationDelay: '.58s' }}>
                            <Check size={15} weight="bold" /> Sin tarjeta &nbsp;·&nbsp; <Check size={15} weight="bold" /> Gratis &nbsp;·&nbsp; <Check size={15} weight="bold" /> En segundos
                        </div>
                    </div>

                    {/* Mockup animado */}
                    <div className="nv-hero-visual nv-pop" style={{ animationDelay: '.4s' }}>
                        <div className="nv-glow" aria-hidden="true" />
                        {FLOAT_ICONS.map((Ic, i) => (
                            <span key={i} className={`nv-float nv-float-${i}`} aria-hidden="true">
                                <Ic size={22} weight="fill" />
                            </span>
                        ))}
                        <div className="nv-phone">
                            <div className="nv-phone-notch" />
                            <div className="nv-phone-screen">
                                <div className="nv-app-top">
                                    <span className="nv-app-dot" /> Neverita
                                </div>
                                <div className="nv-app-tabs">
                                    {screens.map((s, i) => (
                                        <span key={i} className={`nv-app-tab ${screen === i ? 'on' : ''}`}>
                                            <s.icon size={15} weight={screen === i ? 'fill' : 'regular'} />
                                        </span>
                                    ))}
                                </div>

                                <div className="nv-app-body">
                                    {/* Pantalla 0: inventario */}
                                    <div className={`nv-app-view ${screen === 0 ? 'on' : ''}`}>
                                        {['Tomates', 'Huevos', 'Pollo', 'Queso'].map((t, i) => (
                                            <div className="nv-row" style={{ animationDelay: `${i * 0.07}s` }} key={t}>
                                                <span className="nv-row-ic" style={{ background: '#FFECD9', color: '#FF9F43' }}>
                                                    <Snowflake size={16} weight="fill" />
                                                </span>
                                                <span className="nv-row-tx">{t}</span>
                                                <span className="nv-row-tag">en stock</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Pantalla 1: receta IA */}
                                    <div className={`nv-app-view ${screen === 1 ? 'on' : ''}`}>
                                        <div className="nv-reci">
                                            <div className="nv-reci-img"><Fire size={26} weight="fill" color="#fff" /></div>
                                            <div className="nv-reci-tt">Tortilla de la casa</div>
                                            <div className="nv-reci-sub"><Sparkle size={12} weight="fill" /> Sugerida por IA</div>
                                            <div className="nv-reci-chips">
                                                <span>Huevos</span><span>Queso</span><span>15 min</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Pantalla 2: semana */}
                                    <div className={`nv-app-view ${screen === 2 ? 'on' : ''}`}>
                                        {['Lun', 'Mar', 'Mié', 'Jue'].map((d, i) => (
                                            <div className="nv-day" style={{ animationDelay: `${i * 0.07}s` }} key={d}>
                                                <span className="nv-day-l">{d}</span>
                                                <span className="nv-day-bar" style={{ width: `${55 + i * 12}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="nv-scrollcue" aria-hidden="true">
                    <CaretDown size={20} weight="bold" />
                </div>
            </header>

            {/* FEATURES */}
            <section className="nv-section">
                <div className="nv-sec-head" data-reveal>
                    <span className="nv-kicker">Todo lo que puedes hacer</span>
                    <h2 className="nv-h2">Una cocina que piensa contigo</h2>
                    <p className="nv-sub">Cinco herramientas que trabajan juntas para que comas mejor, gastes menos y te compliques cero.</p>
                </div>

                <div className="nv-features">
                    {FEATURES.map((f, i) => {
                        const Ic = f.icon;
                        return (
                            <article className={`nv-feat ${i % 2 ? 'nv-feat-rev' : ''}`} data-reveal key={f.title}>
                                <div className="nv-feat-copy">
                                    <span className="nv-feat-tag" style={{ background: `${f.accent}1a`, color: f.accent }}>
                                        <Ic size={15} weight="fill" /> {f.tag}
                                    </span>
                                    <h3 className="nv-h3">{f.title}</h3>
                                    <p className="nv-feat-text">{f.text}</p>
                                    <ul className="nv-feat-list">
                                        {f.bullets.map((b) => (
                                            <li key={b}><span className="nv-check" style={{ background: f.accent }}><Check size={12} weight="bold" /></span>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="nv-feat-art" style={{ '--ac': f.accent }}>
                                    <div className="nv-feat-card">
                                        <div className="nv-feat-bigic" style={{ background: `linear-gradient(135deg, ${f.accent}, #FF7F50)` }}>
                                            <Ic size={42} weight="fill" color="#fff" />
                                        </div>
                                        <div className="nv-feat-skeleton">
                                            <span style={{ width: '70%' }} />
                                            <span style={{ width: '90%' }} />
                                            <span style={{ width: '55%' }} />
                                        </div>
                                        <div className="nv-feat-pill" style={{ background: f.accent }}>
                                            <Ic size={14} weight="fill" /> {f.tag}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* CÓMO FUNCIONA */}
            <section className="nv-section nv-steps-sec">
                <div className="nv-sec-head" data-reveal>
                    <span className="nv-kicker">Cómo funciona</span>
                    <h2 className="nv-h2">De la heladera al plato en 4 pasos</h2>
                </div>
                <div className="nv-steps">
                    <div className="nv-steps-line" aria-hidden="true" />
                    {STEPS.map((s, i) => {
                        const Ic = s.icon;
                        return (
                            <div className="nv-step" data-reveal style={{ transitionDelay: `${i * 0.09}s` }} key={s.n}>
                                <div className="nv-step-bubble"><Ic size={26} weight="fill" /></div>
                                <span className="nv-step-n">{s.n}</span>
                                <h4 className="nv-step-tt">{s.title}</h4>
                                <p className="nv-step-tx">{s.text}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* BENEFICIOS */}
            <section className="nv-section">
                <div className="nv-benefits">
                    {BENEFITS.map((b, i) => {
                        const Ic = b.icon;
                        return (
                            <div className="nv-benefit" data-reveal style={{ transitionDelay: `${i * 0.08}s` }} key={b.title}>
                                <div className="nv-benefit-ic"><Ic size={24} weight="fill" /></div>
                                <h4>{b.title}</h4>
                                <p>{b.text}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* SOBRE NOSOTROS */}
            <section className="nv-section nv-about-sec" id="sobre-nosotros">
                <div className="nv-sec-head" data-reveal>
                    <span className="nv-kicker">Sobre nosotros</span>
                    <h2 className="nv-h2">Cocinar bien, sin desperdiciar</h2>
                    <p className="nv-sub">
                        Neverita nació de una frustración cotidiana: comida que se vence olvidada en la nevera,
                        recetas que no se nos ocurren y listas de compra que siempre se escapan. Creemos que
                        organizar la cocina de tu familia debería ser simple, inteligente y hasta divertido.
                    </p>
                </div>
                <div className="nv-about-grid">
                    <div className="nv-about-card" data-reveal>
                        <div className="nv-about-ic"><Leaf size={24} weight="fill" /></div>
                        <h4>Nuestra misión</h4>
                        <p>Ayudar a las familias a aprovechar al máximo lo que ya tienen, reduciendo el desperdicio de alimentos y el gasto innecesario.</p>
                    </div>
                    <div className="nv-about-card" data-reveal style={{ transitionDelay: '.08s' }}>
                        <div className="nv-about-ic"><Sparkle size={24} weight="fill" /></div>
                        <h4>Cómo lo hacemos</h4>
                        <p>Unimos un inventario inteligente, recetas generadas con IA y un planificador semanal — todo en un mismo lugar y pensado para el día a día.</p>
                    </div>
                    <div className="nv-about-card" data-reveal style={{ transitionDelay: '.16s' }}>
                        <div className="nv-about-ic"><UsersThree size={24} weight="fill" /></div>
                        <h4>Para quién</h4>
                        <p>Para hogares y familias que quieren comer mejor, coordinarse sin caos y ahorrar tiempo y dinero cada semana.</p>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="nv-cta-band" data-reveal>
                <div className="nv-cta-inner">
                    <span className="nv-cta-badge"><FridgeIcon size={28} color="#fff" strokeWidth={2.2} /></span>
                    <h2 className="nv-cta-h">Tu próxima comida empieza aquí</h2>
                    <p className="nv-cta-p">Únete a Neverita y transforma la forma en que tu familia organiza, cocina y compra.</p>
                    <div className="nv-cta-actions">
                        <button className="nv-btn nv-btn-white" onClick={onRegister}>
                            Crear mi cuenta gratis <ArrowRight size={18} weight="bold" />
                        </button>
                        <button className="nv-btn nv-btn-ghost-light" onClick={onClose}>
                            Iniciar sesión
                        </button>
                    </div>
                </div>
            </section>

            <footer className="nv-footer">
                <div className="nv-logo nv-logo-sm">
                    <span className="nv-logo-badge"><FridgeIcon size={16} color="#fff" strokeWidth={2.2} /></span>
                    <span className="nv-logo-text">Neve<b>rita.</b></span>
                </div>
                <button
                    className="nv-foot-link"
                    onClick={() => rootRef.current?.querySelector('#sobre-nosotros')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Sobre nosotros
                </button>
                <span className="nv-foot-tx">© 2026 Neverita · Tu cocina inteligente</span>
            </footer>

            {/* Botón flotante para volver al login en cualquier momento */}
            <button className="nv-close-fab" onClick={onClose} title="Volver al inicio de sesión" aria-label="Cerrar">
                <X size={20} weight="bold" />
            </button>
        </div>
    );
};

/* ===================== ESTILOS (namespaced .nv-land) ===================== */
const CSS = `
.nv-land{
  --o:#FF9F43; --o2:#FF7F50; --o3:#F9A03F;
  --ink:#2A2118; --ink2:#6B5E4F; --ink3:#9b8d7c;
  --cream:#FFF6EC; --card:rgba(255,255,255,.85);
  --disp:'Nunito',sans-serif;
  position:fixed; inset:0; z-index:10000; overflow-y:auto; overflow-x:hidden;
  background:linear-gradient(180deg,#FFF7EF 0%,#FFEFDF 38%,#FFF6EC 100%);
  color:var(--ink); font-family:'Nunito',sans-serif;
  -webkit-font-smoothing:antialiased; scroll-behavior:smooth;
}
.nv-land *{box-sizing:border-box;}

/* fondos */
.nv-bg-mesh{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(40% 38% at 82% 8%, rgba(255,127,80,.28), transparent 60%),
    radial-gradient(46% 40% at 8% 22%, rgba(255,159,67,.22), transparent 60%),
    radial-gradient(50% 45% at 92% 80%, rgba(249,160,63,.18), transparent 62%);}
.nv-bg-grain{position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.5;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.045'/%3E%3C/svg%3E");}
.nv-land>*:not(.nv-bg-mesh):not(.nv-bg-grain){position:relative;z-index:1;}

/* NAV */
.nv-nav{position:sticky;top:0;z-index:30;padding:14px 0;transition:all .3s ease;}
.nv-nav-solid{background:rgba(255,247,239,.82);backdrop-filter:blur(14px);
  box-shadow:0 6px 24px rgba(180,100,30,.08);border-bottom:1px solid rgba(255,159,67,.14);}
.nv-nav-inner{max-width:1180px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;}
.nv-logo{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;}
.nv-logo-badge{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;
  background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 8px 18px rgba(255,127,80,.35);flex:none;}
.nv-logo-text{font-family:var(--disp);font-weight:600;font-size:1.32rem;letter-spacing:-.01em;}
.nv-logo-text b{color:var(--o2);font-weight:700;}
.nv-logo-sm .nv-logo-badge{width:30px;height:30px;border-radius:10px;}
.nv-logo-sm .nv-logo-text{font-size:1.1rem;}

/* botones */
.nv-btn{font-family:'Nunito',sans-serif;font-weight:800;font-size:1rem;border:none;cursor:pointer;
  border-radius:16px;padding:14px 24px;display:inline-flex;align-items:center;gap:9px;
  transition:transform .22s cubic-bezier(.2,.8,.3,1),box-shadow .22s,background .2s;line-height:1;}
.nv-btn:active{transform:translateY(1px) scale(.99);}
.nv-btn-primary{background:linear-gradient(135deg,var(--o) 0%,var(--o2) 100%);color:#fff;
  box-shadow:0 12px 26px rgba(255,127,80,.4);}
.nv-btn-primary:hover{transform:translateY(-3px);box-shadow:0 20px 38px rgba(255,127,80,.5);}
.nv-btn-soft{background:#fff;color:var(--o2);box-shadow:0 6px 18px rgba(180,100,30,.1);border:1.5px solid #FFE0C4;}
.nv-btn-soft:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(180,100,30,.16);background:#FFFBF6;}
.nv-btn-ghost{background:transparent;color:var(--ink);padding:11px 18px;border:1.5px solid rgba(255,159,67,.45);}
.nv-btn-ghost:hover{background:#fff;border-color:var(--o);color:var(--o2);transform:translateY(-2px);}
.nv-btn-white{background:#fff;color:var(--o2);box-shadow:0 14px 30px rgba(0,0,0,.16);}
.nv-btn-white:hover{transform:translateY(-3px);box-shadow:0 22px 42px rgba(0,0,0,.22);}
.nv-btn-ghost-light{background:rgba(255,255,255,.16);color:#fff;border:1.5px solid rgba(255,255,255,.55);}
.nv-btn-ghost-light:hover{background:rgba(255,255,255,.26);transform:translateY(-2px);}

/* HERO */
.nv-hero{max-width:1180px;margin:0 auto;padding:42px 24px 30px;}
.nv-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;min-height:72vh;}
.nv-eyebrow{display:inline-flex;align-items:center;gap:7px;font-weight:800;font-size:.86rem;
  color:var(--o2);background:#FFEAD7;padding:8px 15px;border-radius:50px;letter-spacing:.01em;}
.nv-h1{font-family:var(--disp);font-weight:600;font-size:clamp(2.7rem,5.4vw,4.5rem);line-height:1.02;
  letter-spacing:-.025em;margin:20px 0 0;}
.nv-grad-text{background:linear-gradient(105deg,var(--o) 10%,var(--o2) 60%,#FF6A3D 100%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
.nv-lead{font-size:1.16rem;line-height:1.62;color:var(--ink2);max-width:34ch;margin:22px 0 0;font-weight:500;}
.nv-hero-cta{display:flex;gap:14px;margin-top:30px;flex-wrap:wrap;}
.nv-hero-mini{display:flex;align-items:center;gap:6px;margin-top:20px;color:var(--ink3);font-weight:700;font-size:.9rem;}
.nv-hero-mini svg{color:var(--o);}

/* mockup teléfono */
.nv-hero-visual{position:relative;display:flex;justify-content:center;align-items:center;min-height:480px;}
.nv-glow{position:absolute;width:380px;height:380px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,159,67,.5),transparent 65%);filter:blur(20px);
  animation:nv-breathe 6s ease-in-out infinite;}
.nv-phone{position:relative;width:268px;height:540px;border-radius:42px;background:#1f1810;
  padding:13px;box-shadow:0 40px 80px -20px rgba(120,60,10,.5),0 0 0 2px rgba(255,255,255,.06) inset;
  animation:nv-floaty 7s ease-in-out infinite;}
.nv-phone-notch{position:absolute;top:13px;left:50%;transform:translateX(-50%);width:96px;height:22px;
  background:#1f1810;border-radius:0 0 16px 16px;z-index:3;}
.nv-phone-screen{width:100%;height:100%;border-radius:30px;overflow:hidden;
  background:linear-gradient(180deg,#FFF6EC,#FFEFDF);display:flex;flex-direction:column;}
.nv-app-top{padding:30px 18px 10px;font-family:var(--disp);font-weight:600;font-size:1.12rem;display:flex;align-items:center;gap:8px;}
.nv-app-dot{width:9px;height:9px;border-radius:50%;background:var(--o);box-shadow:0 0 0 4px rgba(255,159,67,.22);}
.nv-app-tabs{display:flex;gap:8px;padding:0 18px 12px;}
.nv-app-tab{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#fff;color:var(--ink3);
  box-shadow:0 3px 8px rgba(180,100,30,.08);transition:all .35s;}
.nv-app-tab.on{background:linear-gradient(135deg,var(--o),var(--o2));color:#fff;box-shadow:0 8px 16px rgba(255,127,80,.4);transform:translateY(-2px);}
.nv-app-body{position:relative;flex:1;margin:0 14px 16px;}
.nv-app-view{position:absolute;inset:0;display:flex;flex-direction:column;gap:9px;opacity:0;
  transform:translateY(14px) scale(.98);transition:opacity .5s,transform .5s;pointer-events:none;}
.nv-app-view.on{opacity:1;transform:none;}
.nv-row{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:11px 12px;
  box-shadow:0 4px 12px rgba(180,100,30,.07);animation:nv-rowin .5s both;}
.nv-row-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:none;}
.nv-row-tx{font-weight:800;font-size:.92rem;flex:1;}
.nv-row-tag{font-size:.68rem;font-weight:800;color:#16a34a;background:#dcfce7;padding:3px 8px;border-radius:50px;}
.nv-reci{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 24px rgba(180,100,30,.12);}
.nv-reci-img{height:96px;background:linear-gradient(135deg,var(--o),var(--o2));display:grid;place-items:center;}
.nv-reci-tt{font-family:var(--disp);font-weight:600;font-size:1.05rem;padding:12px 13px 2px;}
.nv-reci-sub{display:flex;align-items:center;gap:5px;color:var(--o2);font-weight:800;font-size:.74rem;padding:0 13px;}
.nv-reci-chips{display:flex;gap:6px;flex-wrap:wrap;padding:11px 13px 14px;}
.nv-reci-chips span{font-size:.72rem;font-weight:800;background:#FFEAD7;color:var(--o2);padding:5px 10px;border-radius:50px;}
.nv-day{display:flex;align-items:center;gap:10px;background:#fff;border-radius:13px;padding:11px 12px;
  box-shadow:0 4px 12px rgba(180,100,30,.07);animation:nv-rowin .5s both;}
.nv-day-l{font-weight:900;font-size:.78rem;color:var(--ink3);width:30px;}
.nv-day-bar{height:9px;border-radius:50px;background:linear-gradient(90deg,var(--o),var(--o2));}

/* iconos flotantes */
.nv-float{position:absolute;width:46px;height:46px;border-radius:15px;background:#fff;
  display:grid;place-items:center;color:var(--o2);box-shadow:0 12px 26px rgba(180,100,30,.18);z-index:2;}
.nv-float-0{top:6%;left:6%;animation:nv-floaty 5.5s ease-in-out infinite;}
.nv-float-1{top:20%;right:2%;animation:nv-floaty 6.5s .4s ease-in-out infinite;}
.nv-float-2{bottom:24%;left:0;animation:nv-floaty 5s .2s ease-in-out infinite;}
.nv-float-3{bottom:6%;right:8%;animation:nv-floaty 7s .6s ease-in-out infinite;}
.nv-float-4{top:46%;left:-4%;animation:nv-floaty 6s .3s ease-in-out infinite;color:var(--o);}
.nv-float-5{top:2%;right:24%;animation:nv-floaty 6.2s .5s ease-in-out infinite;color:#16a34a;}

.nv-scrollcue{display:flex;justify-content:center;color:var(--o2);margin-top:6px;animation:nv-bob 1.8s ease-in-out infinite;}

/* SECTIONS */
.nv-section{max-width:1180px;margin:0 auto;padding:64px 24px;}
.nv-sec-head{text-align:center;max-width:680px;margin:0 auto 48px;}
.nv-kicker{font-weight:900;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:var(--o2);}
.nv-h2{font-family:var(--disp);font-weight:600;font-size:clamp(1.9rem,3.6vw,2.9rem);line-height:1.08;
  letter-spacing:-.02em;margin:12px 0 0;}
.nv-sub{color:var(--ink2);font-size:1.08rem;line-height:1.6;margin:16px 0 0;font-weight:500;}

/* features */
.nv-features{display:flex;flex-direction:column;gap:34px;}
.nv-feat{display:grid;grid-template-columns:1fr 1fr;gap:46px;align-items:center;
  background:var(--card);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.6);
  border-radius:30px;padding:42px;box-shadow:0 18px 50px -22px rgba(160,90,20,.28);}
.nv-feat-rev .nv-feat-copy{order:2;}
.nv-feat-tag{display:inline-flex;align-items:center;gap:7px;font-weight:900;font-size:.84rem;
  padding:7px 14px;border-radius:50px;}
.nv-h3{font-family:var(--disp);font-weight:600;font-size:clamp(1.4rem,2.6vw,2rem);line-height:1.12;
  letter-spacing:-.015em;margin:16px 0 0;}
.nv-feat-text{color:var(--ink2);font-size:1.05rem;line-height:1.62;margin:14px 0 0;font-weight:500;}
.nv-feat-list{list-style:none;padding:0;margin:20px 0 0;display:flex;flex-direction:column;gap:11px;}
.nv-feat-list li{display:flex;align-items:center;gap:11px;font-weight:700;color:var(--ink);font-size:.98rem;}
.nv-check{width:20px;height:20px;border-radius:7px;display:grid;place-items:center;color:#fff;flex:none;}

.nv-feat-art{display:flex;justify-content:center;}
.nv-feat-card{position:relative;width:100%;max-width:330px;background:#fff;border-radius:24px;padding:28px;
  box-shadow:0 20px 44px -18px rgba(160,90,20,.4);overflow:hidden;}
.nv-feat-card::before{content:'';position:absolute;top:-40%;right:-30%;width:200px;height:200px;border-radius:50%;
  background:radial-gradient(circle,var(--ac),transparent 70%);opacity:.16;}
.nv-feat-bigic{width:78px;height:78px;border-radius:22px;display:grid;place-items:center;
  box-shadow:0 14px 28px -8px var(--ac);}
.nv-feat-skeleton{display:flex;flex-direction:column;gap:10px;margin:24px 0;}
.nv-feat-skeleton span{height:13px;border-radius:50px;background:linear-gradient(90deg,#F0E6D8,#fbf3e8,#F0E6D8);
  background-size:200% 100%;animation:nv-shimmer 2.2s linear infinite;}
.nv-feat-pill{display:inline-flex;align-items:center;gap:7px;color:#fff;font-weight:900;font-size:.82rem;
  padding:8px 15px;border-radius:50px;}

/* steps */
.nv-steps-sec{padding-top:24px;}
.nv-steps{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
.nv-steps-line{position:absolute;top:34px;left:11%;right:11%;height:3px;z-index:0;
  background:repeating-linear-gradient(90deg,#FFD3AE 0 9px,transparent 9px 18px);}
.nv-step{position:relative;text-align:center;padding:8px;}
.nv-step-bubble{width:68px;height:68px;border-radius:22px;margin:0 auto;display:grid;place-items:center;color:#fff;
  background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 14px 28px -8px rgba(255,127,80,.55);position:relative;z-index:2;}
.nv-step-n{display:inline-block;font-family:var(--disp);font-weight:700;font-size:.92rem;color:var(--o2);
  background:#FFEAD7;border-radius:50px;padding:3px 12px;margin:16px 0 8px;}
.nv-step-tt{font-weight:900;font-size:1.08rem;margin:0;}
.nv-step-tx{color:var(--ink2);font-size:.95rem;line-height:1.5;margin:8px 0 0;font-weight:500;}

/* beneficios */
.nv-benefits{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
.nv-benefit{background:var(--card);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.6);
  border-radius:24px;padding:30px 24px;text-align:center;box-shadow:0 14px 38px -20px rgba(160,90,20,.3);
  transition:transform .3s,box-shadow .3s;}
.nv-benefit:hover{transform:translateY(-6px);box-shadow:0 26px 50px -22px rgba(160,90,20,.42);}
.nv-benefit-ic{width:56px;height:56px;border-radius:18px;margin:0 auto 16px;display:grid;place-items:center;
  background:#FFEAD7;color:var(--o2);}
.nv-benefit h4{font-weight:900;font-size:1.08rem;margin:0;}
.nv-benefit p{color:var(--ink2);font-size:.93rem;line-height:1.5;margin:8px 0 0;font-weight:500;}

/* sobre nosotros */
.nv-about-grid{max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
.nv-about-card{background:var(--card);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.6);
  border-radius:26px;padding:34px 28px;box-shadow:0 16px 40px -22px rgba(160,90,20,.32);
  transition:transform .3s,box-shadow .3s,border-color .3s;}
.nv-about-card:hover{transform:translateY(-6px);box-shadow:0 28px 54px -24px rgba(160,90,20,.45);border-color:rgba(255,159,67,.5);}
.nv-about-ic{width:60px;height:60px;border-radius:18px;display:grid;place-items:center;margin-bottom:18px;
  background:linear-gradient(135deg,var(--o),var(--o2));color:#fff;box-shadow:0 10px 22px -8px rgba(255,127,80,.6);}
.nv-about-card h4{font-family:var(--disp);font-weight:600;font-size:1.25rem;margin:0 0 8px;color:var(--ink);}
.nv-about-card p{color:var(--ink2);font-size:.96rem;line-height:1.55;margin:0;font-weight:500;}

/* cta band */
.nv-cta-band{max-width:1180px;margin:24px auto 0;padding:0 24px;}
.nv-cta-inner{background:linear-gradient(135deg,var(--o) 0%,var(--o2) 55%,#FF6A3D 100%);
  border-radius:38px;padding:64px 32px;text-align:center;position:relative;overflow:hidden;
  box-shadow:0 30px 70px -28px rgba(255,110,60,.7);}
.nv-cta-inner::before,.nv-cta-inner::after{content:'';position:absolute;border-radius:50%;
  background:rgba(255,255,255,.12);}
.nv-cta-inner::before{width:280px;height:280px;top:-120px;left:-60px;}
.nv-cta-inner::after{width:220px;height:220px;bottom:-110px;right:-40px;}
.nv-cta-badge{position:relative;width:64px;height:64px;border-radius:20px;margin:0 auto 18px;display:grid;place-items:center;
  background:rgba(255,255,255,.2);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.3);}
.nv-cta-h{position:relative;font-family:var(--disp);font-weight:600;color:#fff;
  font-size:clamp(1.9rem,4vw,3rem);line-height:1.06;letter-spacing:-.02em;margin:0;}
.nv-cta-p{position:relative;color:rgba(255,255,255,.94);font-size:1.12rem;line-height:1.55;
  max-width:48ch;margin:16px auto 0;font-weight:500;}
.nv-cta-actions{position:relative;display:flex;gap:14px;justify-content:center;margin-top:32px;flex-wrap:wrap;}

/* footer */
.nv-footer{max-width:1180px;margin:0 auto;padding:42px 24px;display:flex;align-items:center;
  justify-content:space-between;gap:16px;flex-wrap:wrap;border-top:1px solid rgba(255,159,67,.18);margin-top:64px;}
.nv-foot-tx{color:var(--ink3);font-weight:700;font-size:.9rem;}
.nv-foot-link{background:none;border:none;cursor:pointer;color:var(--ink2);font-weight:800;font-size:.9rem;
  font-family:inherit;padding:6px 0;transition:color .2s;}
.nv-foot-link:hover{color:var(--o2);}

/* close fab */
.nv-close-fab{position:fixed;top:18px;right:18px;z-index:40;width:42px;height:42px;border-radius:14px;border:none;
  background:rgba(255,255,255,.9);backdrop-filter:blur(8px);color:var(--ink2);cursor:pointer;display:none;
  place-items:center;box-shadow:0 8px 20px rgba(180,100,30,.16);transition:transform .2s;}
.nv-close-fab:hover{transform:rotate(90deg) scale(1.05);color:var(--o2);}

/* reveal */
[data-reveal]{opacity:0;transform:translateY(34px);transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1);}
[data-reveal].nv-in{opacity:1;transform:none;}

/* pop-in (hero load) */
.nv-pop{opacity:0;animation:nv-pop .8s cubic-bezier(.2,.8,.2,1) forwards;}
@keyframes nv-pop{from{opacity:0;transform:translateY(26px);}to{opacity:1;transform:none;}}
@keyframes nv-floaty{0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);}}
@keyframes nv-breathe{0%,100%{transform:scale(1);opacity:.85;}50%{transform:scale(1.08);opacity:1;}}
@keyframes nv-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(7px);}}
@keyframes nv-rowin{from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:none;}}
@keyframes nv-shimmer{from{background-position:200% 0;}to{background-position:-200% 0;}}

/* ===================== RESPONSIVE ===================== */
@media (max-width:980px){
  .nv-hero-grid{grid-template-columns:1fr;gap:30px;text-align:center;min-height:auto;padding-top:10px;}
  .nv-lead{margin-left:auto;margin-right:auto;}
  .nv-hero-cta,.nv-hero-mini{justify-content:center;}
  .nv-eyebrow{margin:0 auto;}
  .nv-feat,.nv-feat-rev{grid-template-columns:1fr;gap:28px;padding:30px;}
  .nv-feat-rev .nv-feat-copy{order:0;}
  .nv-feat-art{order:-1;}
  .nv-feat-list{align-items:flex-start;text-align:left;display:inline-flex;}
  .nv-steps{grid-template-columns:repeat(2,1fr);gap:34px 20px;}
  .nv-steps-line{display:none;}
  .nv-benefits{grid-template-columns:repeat(2,1fr);}
  .nv-about-grid{grid-template-columns:repeat(2,1fr);}
  .nv-about-card:last-child{grid-column:1 / -1;}
}
@media (max-width:640px){
  .nv-nav{padding:10px 0;}
  .nv-nav-inner{padding:0 16px;}
  .nv-nav-cta{display:inline-flex !important; width:auto !important; padding:9px 15px !important; font-size:.85rem;}
  .nv-close-fab{display:none;}
  .nv-hero{padding:24px 18px 16px;}
  .nv-h1{font-size:clamp(2.3rem,10vw,3rem);}
  .nv-lead{font-size:1.05rem;}
  .nv-btn{width:100%;justify-content:center;padding:15px 22px;}
  .nv-hero-cta{flex-direction:column;width:100%;}
  .nv-hero-mini{font-size:.82rem;flex-wrap:wrap;}
  .nv-section{padding:48px 18px;}
  .nv-feat{padding:24px;border-radius:24px;}
  .nv-feat-art .nv-feat-card{max-width:100%;}
  .nv-benefits{grid-template-columns:1fr;}
  .nv-about-grid{grid-template-columns:1fr;}
  .nv-cta-inner{padding:44px 22px;border-radius:30px;}
  .nv-cta-actions{flex-direction:column;width:100%;}
  .nv-footer{justify-content:center;text-align:center;flex-direction:column;gap:14px;padding:32px 20px;}
  .nv-foot-tx{order:3;font-size:.82rem;}
  .nv-foot-link{order:2;}
  .nv-logo-sm{order:1;}
  .nv-phone{width:230px;height:466px;}
}
@media (prefers-reduced-motion:reduce){
  .nv-land *{animation:none!important;}
  .nv-pop{opacity:1!important;}
  [data-reveal]{opacity:1!important;transform:none!important;}
}
`;

export default LandingPage;