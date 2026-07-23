import React, { useState, useEffect } from 'react';
import { User, Lock, EnvelopeSimple, ForkKnife, CircleNotch, Eye, EyeSlash, CheckCircle, XCircle, ArrowLeft, ArrowRight, PaperPlaneTilt, ShieldCheck, Sparkle, PlayCircle, Snowflake, CalendarBlank, ShoppingCart, Check, Gear, Heartbeat, Ruler, Barbell, Leaf, Target, Warning } from '@phosphor-icons/react';
import { authService, usersService } from '../api';
import NvSelect from './NvSelect';
import NvDatePicker from './NvDatePicker';
import { DIET_OPTS, GOAL_OPTS, RESTRICTION_OPTS } from '../profileOptions';
import PhoneMockup from './PhoneMockup';
import FridgeIcon from './FridgeIcon';

// Opciones de sexo y actividad + cálculo de edad (para el onboarding físico tras el registro)
const SEX_OPTS = [{ value: 'm', label: 'Masculino' }, { value: 'f', label: 'Femenino' }, { value: 'otro', label: 'Otro' }];
const ACTIVITY_OPTS = [{ value: 'bajo', label: 'Bajo (poco ejercicio)' }, { value: 'medio', label: 'Medio (moderado)' }, { value: 'alto', label: 'Alto (muy activo)' }];
const calcAge = (birth) => {
    if (!birth) return null;
    const b = new Date(String(birth).split('T')[0] + 'T00:00:00');
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age >= 0 && age < 130 ? age : null;
};

// --- Validaciones de contraseña ---
function getPasswordRules(password) {
    return [
        { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
        { label: 'Al menos una letra', ok: /[a-zA-Z]/.test(password) },
        { label: 'Al menos un número', ok: /[0-9]/.test(password) },
    ];
}

// --- Componente reutilizable de campo contraseña ---
const PasswordField = ({ name, placeholder, value, onChange, showPw, onToggleShow }) => (
    <div className="input-wrapper-floating" style={{ position: 'relative' }}>
        <Lock size={20} className="input-icon-floating" />
        <input
            type={showPw ? 'text' : 'password'}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required
            autoCapitalize="none"
            autoCorrect="off"
            style={{ paddingRight: '44px' }}
        />
        <button
            type="button"
            onClick={onToggleShow}
            style={{
                position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10,
                color: '#9b8d7c',
            }}
            title={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
            {showPw ? <EyeSlash size={20} /> : <Eye size={20} />}
        </button>
    </div>
);

const Auth = ({ onLogin, onShowLanding, forceRegister }) => {
    const [isRegistering, setIsRegistering] = useState(false);

    // Si se vuelve de la landing pulsando "Crear cuenta", abrimos el modo registro.
    useEffect(() => {
        if (forceRegister) setIsRegistering(true);
    }, [forceRegister]);

    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', name: '', email: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- Onboarding obligatorio tras el registro (usuario desde cero), 2 pasos ---
    const [pendingUser, setPendingUser] = useState(null); // usuario recién registrado, aún sin entrar
    const [onbStep, setOnbStep] = useState(1);             // 1 = datos físicos, 2 = preferencias
    const [physical, setPhysical] = useState({ birth_date: '', sex: '', height_cm: '', weight_kg: '', activity_level: 'medio' });
    const [diet, setDiet] = useState({ diet_type: '', goal: '', restrictions: [] });

    // Visibilidad de contraseñas
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // --- Recuperación de contraseña ---
    const [forgotMode, setForgotMode] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1=email, 2=código, 3=nueva contraseña, 4=éxito
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmPw, setResetConfirmPw] = useState('');
    const [showResetPw, setShowResetPw] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const passwordRules = getPasswordRules(formData.password);
    const passwordValid = passwordRules.every(r => r.ok);
    const passwordsMatch = formData.password === formData.confirmPassword;

    const resetPasswordRules = getPasswordRules(resetPassword);
    const resetPasswordValid = resetPasswordRules.every(r => r.ok);
    const resetPasswordsMatch = resetPassword === resetConfirmPw;

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (isRegistering) {
            if (!passwordValid) { setErrorMsg('La contraseña no cumple los requisitos mínimos.'); return; }
            if (!passwordsMatch) { setErrorMsg('Las contraseñas no coinciden.'); return; }
        }

        setIsLoading(true);
        const cleanUsername = formData.username.trim().toLowerCase();
        const cleanPassword = formData.password.trim();

        try {
            if (isRegistering) {
                const userData = await authService.register({
                    username: cleanUsername, password: cleanPassword,
                    name: formData.name.trim(), email: formData.email.trim().toLowerCase(),
                });
                // Cuenta creada: aún NO entra. Pasa al onboarding físico obligatorio.
                setPendingUser(userData);
            } else {
                const userData = await authService.login(cleanUsername, cleanPassword);
                onLogin(userData);
            }
        } catch (err) {
            setErrorMsg(err.message || 'Error de autenticación');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Onboarding: validación por paso y guardado final ---
    const onbAge = calcAge(physical.birth_date);
    const onbHeight = Number(physical.height_cm);
    const onbWeight = Number(physical.weight_kg);
    const physicalValid =
        !!physical.birth_date && onbAge !== null &&
        !!physical.sex &&
        physical.height_cm !== '' && Number.isFinite(onbHeight) && onbHeight >= 30 && onbHeight <= 260 &&
        physical.weight_kg !== '' && Number.isFinite(onbWeight) && onbWeight >= 1 && onbWeight <= 400 &&
        !!physical.activity_level;
    const dietValid = !!diet.diet_type && !!diet.goal;

    const toggleRestriction = (v) => setDiet(d => ({
        ...d,
        restrictions: d.restrictions.includes(v) ? d.restrictions.filter(x => x !== v) : [...d.restrictions, v],
    }));

    // Paso 1 (físico) → Paso 2 (preferencias)
    const handleNextStep = (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!physicalValid) { setErrorMsg('Completa todos los datos para continuar.'); return; }
        setOnbStep(2);
    };

    // Paso 2 → guardar todo (físico + preferencias) y entrar
    const handleSaveOnboarding = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!physicalValid) { setOnbStep(1); return; }
        if (!dietValid) { setErrorMsg('Elige tu tipo de alimentación y tu objetivo.'); return; }
        setIsLoading(true);
        try {
            await usersService.updateProfile(pendingUser.user_id, {
                birth_date: physical.birth_date,
                sex: physical.sex,
                height_cm: Number(physical.height_cm),
                weight_kg: Number(physical.weight_kg),
                activity_level: physical.activity_level,
                diet_type: diet.diet_type,
                goal: diet.goal,
                dietary_restrictions: diet.restrictions,
            });
            onLogin(pendingUser);
        } catch (err) {
            setErrorMsg(err.message || 'No se pudieron guardar tus datos. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setIsRegistering(!isRegistering);
        setErrorMsg('');
        setFormData({ username: '', password: '', confirmPassword: '', name: '', email: '' });
        setShowPw(false);
        setShowConfirmPw(false);
    };

    // --- Handlers de recuperación ---
    const handleRequestCode = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            await authService.requestPasswordReset(resetEmail.trim().toLowerCase());
            setSuccessMsg('📧 Código enviado a tu correo. Revisa tu bandeja de entrada.');
            setResetStep(2);
        } catch (err) {
            setErrorMsg(err.message || 'Error al enviar el código.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndReset = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!resetPasswordValid) { setErrorMsg('La contraseña no cumple los requisitos mínimos.'); return; }
        if (!resetPasswordsMatch) { setErrorMsg('Las contraseñas no coinciden.'); return; }
        setIsLoading(true);
        try {
            await authService.verifyPasswordReset(resetEmail.trim().toLowerCase(), resetCode.trim(), resetPassword);
            setSuccessMsg('✅ ¡Contraseña actualizada! Ya puedes iniciar sesión.');
            setResetStep(4);
        } catch (err) {
            setErrorMsg(err.message || 'Código inválido o expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    const exitForgotMode = () => {
        setForgotMode(false);
        setResetStep(1);
        setResetEmail(''); setResetCode(''); setResetPassword(''); setResetConfirmPw('');
        setErrorMsg(''); setSuccessMsg(''); setShowResetPw(false);
    };

    // =====================
    // RENDER: RECUPERACIÓN
    // =====================
    const renderForgotPassword = () => (
        <div className="auth-card-glass">
            <div className="form-header">
                <h2>
                    {resetStep === 1 && 'Recuperar Contraseña'}
                    {resetStep === 2 && 'Ingresa el Código'}
                    {resetStep === 3 && 'Nueva Contraseña'}
                    {resetStep === 4 && '¡Listo!'}
                </h2>
                <p>
                    {resetStep === 1 && 'Te enviaremos un código a tu correo'}
                    {resetStep === 2 && 'Revisa tu bandeja de entrada'}
                    {resetStep === 3 && 'Crea una contraseña nueva y segura'}
                    {resetStep === 4 && 'Tu contraseña ha sido actualizada'}
                </p>
            </div>

            {errorMsg && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.875rem', textAlign: 'center' }}>
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.875rem', textAlign: 'center' }}>
                    {successMsg}
                </div>
            )}

            {/* PASO 1: Email */}
            {resetStep === 1 && (
                <form onSubmit={handleRequestCode}>
                    <div className="form-group-floating">
                        <label>Correo Electrónico</label>
                        <div className="input-wrapper-floating">
                            <EnvelopeSimple size={20} className="input-icon-floating" />
                            <input type="email" placeholder="tucorreo@ejemplo.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required autoCapitalize="none" />
                        </div>
                    </div>
                    <button className="btn-floating-primary" disabled={isLoading || !resetEmail.trim()}>
                        {isLoading ? <CircleNotch className="ph-spin" size={20} /> : <><PaperPlaneTilt size={18} weight="fill" /> Enviar Código</>}
                    </button>
                </form>
            )}

            {/* PASO 2: Código */}
            {resetStep === 2 && (
                <form onSubmit={(e) => { e.preventDefault(); setSuccessMsg(''); setResetStep(3); }}>
                    <div className="form-group-floating">
                        <label>Código de 6 dígitos</label>
                        <div className="input-wrapper-floating">
                            <ShieldCheck size={20} className="input-icon-floating" />
                            <input type="text" placeholder="123456" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6}
                                style={{ letterSpacing: '8px', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }} />
                        </div>
                    </div>
                    <button className="btn-floating-primary" disabled={resetCode.length !== 6}>Verificar Código</button>
                    <button type="button" onClick={handleRequestCode} disabled={isLoading}
                        style={{ background: 'none', border: 'none', color: '#FF9F43', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginTop: 10, width: '100%', textAlign: 'center' }}>
                        {isLoading ? 'Enviando...' : '¿No recibiste el código? Reenviar'}
                    </button>
                </form>
            )}

            {/* PASO 3: Nueva contraseña */}
            {resetStep === 3 && (
                <form onSubmit={handleVerifyAndReset}>
                    <div className="form-group-floating">
                        <label>Nueva Contraseña</label>
                        <PasswordField name="resetPassword" placeholder="Crea una clave segura" value={resetPassword}
                            onChange={e => setResetPassword(e.target.value)} showPw={showResetPw} onToggleShow={() => setShowResetPw(v => !v)} />
                        {resetPassword.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {resetPasswordRules.map(rule => (
                                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: rule.ok ? '#16a34a' : '#9b8d7c' }}>
                                        {rule.ok ? <CheckCircle size={14} weight="fill" color="#16a34a" /> : <XCircle size={14} weight="fill" color="#D1D5DB" />}
                                        {rule.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="form-group-floating">
                        <label>Confirmar Contraseña</label>
                        <PasswordField name="resetConfirmPw" placeholder="Repite tu contraseña" value={resetConfirmPw}
                            onChange={e => setResetConfirmPw(e.target.value)} showPw={showResetPw} onToggleShow={() => setShowResetPw(v => !v)} />
                        {resetConfirmPw.length > 0 && (
                            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: resetPasswordsMatch ? '#16a34a' : '#DC2626' }}>
                                {resetPasswordsMatch
                                    ? <><CheckCircle size={14} weight="fill" /> Las contraseñas coinciden</>
                                    : <><XCircle size={14} weight="fill" /> Las contraseñas no coinciden</>}
                            </div>
                        )}
                    </div>
                    <button className="btn-floating-primary" disabled={isLoading || !resetPasswordValid || !resetPasswordsMatch}>
                        {isLoading ? <CircleNotch className="ph-spin" size={20} /> : 'Cambiar Contraseña'}
                    </button>
                </form>
            )}

            {/* PASO 4: Éxito */}
            {resetStep === 4 && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={36} weight="fill" color="white" />
                    </div>
                    <button className="btn-floating-primary" onClick={exitForgotMode}>Ir a Iniciar Sesión</button>
                </div>
            )}

            {resetStep !== 4 && (
                <div className="auth-footer-modern">
                    <span onClick={exitForgotMode} style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ArrowLeft size={16} /> Volver al inicio de sesión
                    </span>
                </div>
            )}
        </div>
    );

    // =====================
    // RENDER: ONBOARDING FÍSICO (obligatorio tras registro)
    // =====================
    const renderOnboarding = () => (
        <div className="auth-card-glass">
            <div className="form-header">
                <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px', background: 'linear-gradient(135deg, #FF9F43, #FF7F50)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(255,127,80,0.35)' }}>
                    {onbStep === 1 ? <Heartbeat size={30} weight="fill" color="white" /> : <Leaf size={30} weight="fill" color="white" />}
                </div>
                <h2>{onbStep === 1 ? 'Cuéntanos sobre ti' : 'Tus preferencias'}</h2>
                <p>{onbStep === 1
                    ? 'Con estos datos calculamos porciones y calorías a tu medida.'
                    : 'Ajustamos las recetas a tu dieta y evitamos lo que no puedes comer.'}</p>
                <div className="nv-steps">
                    <span className={`nv-step-dot${onbStep === 1 ? ' active' : ''}`} />
                    <span className={`nv-step-dot${onbStep === 2 ? ' active' : ''}`} />
                </div>
            </div>

            {errorMsg && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.875rem', textAlign: 'center' }}>
                    {errorMsg}
                </div>
            )}

            {onbStep === 1 ? (
                /* ===== PASO 1: DATOS FÍSICOS ===== */
                <form onSubmit={handleNextStep}>
                    <div className="form-group-floating">
                        <label>Fecha de nacimiento {onbAge !== null && <span style={{ color: '#FF8A4C', fontWeight: 700 }}>· {onbAge} años</span>}</label>
                        <NvDatePicker value={physical.birth_date} max={new Date().toISOString().split('T')[0]}
                            onChange={v => setPhysical(p => ({ ...p, birth_date: v }))} placeholder="Elige tu fecha de nacimiento" />
                    </div>

                    <div className="form-group-floating">
                        <label>Sexo</label>
                        <NvSelect value={physical.sex} onChange={v => setPhysical(p => ({ ...p, sex: v }))} options={SEX_OPTS} placeholder="Elegir" />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div className="form-group-floating" style={{ flex: 1 }}>
                            <label>Altura (cm)</label>
                            <div className="input-wrapper-floating">
                                <Ruler size={20} className="input-icon-floating" />
                                <input type="text" inputMode="numeric" name="height_cm" placeholder="Ej. 170" value={physical.height_cm}
                                    onChange={e => setPhysical(p => ({ ...p, height_cm: e.target.value.replace(/[^0-9]/g, '') }))} required />
                            </div>
                        </div>
                        <div className="form-group-floating" style={{ flex: 1 }}>
                            <label>Peso (kg)</label>
                            <div className="input-wrapper-floating">
                                <Barbell size={20} className="input-icon-floating" />
                                <input type="text" inputMode="decimal" name="weight_kg" placeholder="Ej. 70" value={physical.weight_kg}
                                    onChange={e => setPhysical(p => ({ ...p, weight_kg: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') }))} required />
                            </div>
                        </div>
                    </div>

                    <div className="form-group-floating">
                        <label>Nivel de actividad</label>
                        <NvSelect value={physical.activity_level} onChange={v => setPhysical(p => ({ ...p, activity_level: v }))} options={ACTIVITY_OPTS} placeholder="Elegir" />
                    </div>

                    <button className="btn-floating-primary" disabled={!physicalValid} style={{ opacity: physicalValid ? 1 : 0.6 }}>
                        Siguiente <ArrowRight size={18} weight="bold" />
                    </button>
                </form>
            ) : (
                /* ===== PASO 2: PREFERENCIAS DE DIETA ===== */
                <form onSubmit={handleSaveOnboarding}>
                    <div className="form-group-floating">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Leaf size={16} weight="fill" color="#FF7F50" /> Tipo de alimentación</label>
                        <div className="nv-choice-grid" role="group" aria-label="Tipo de alimentación">
                            {DIET_OPTS.map(o => (
                                <button type="button" key={o.value} aria-pressed={diet.diet_type === o.value}
                                    className={`nv-choice${diet.diet_type === o.value ? ' selected' : ''}`}
                                    onClick={() => setDiet(d => ({ ...d, diet_type: o.value }))}>
                                    {diet.diet_type === o.value && <Check size={14} weight="bold" className="nv-choice-check" />}{o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group-floating">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} weight="fill" color="#FF7F50" /> Objetivo</label>
                        <div className="nv-choice-grid" role="group" aria-label="Objetivo">
                            {GOAL_OPTS.map(o => (
                                <button type="button" key={o.value} aria-pressed={diet.goal === o.value}
                                    className={`nv-choice${diet.goal === o.value ? ' selected' : ''}`}
                                    onClick={() => setDiet(d => ({ ...d, goal: o.value }))}>
                                    {diet.goal === o.value && <Check size={14} weight="bold" className="nv-choice-check" />}{o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group-floating">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Warning size={16} weight="fill" color="#FF7F50" /> Alergias o restricciones
                            <span style={{ color: '#9b8d7c', fontWeight: 600 }}>· opcional</span>
                        </label>
                        <div className="nv-choice-grid" role="group" aria-label="Alergias o restricciones">
                            {RESTRICTION_OPTS.map(o => (
                                <button type="button" key={o.value} aria-pressed={diet.restrictions.includes(o.value)}
                                    className={`nv-choice${diet.restrictions.includes(o.value) ? ' selected' : ''}`}
                                    onClick={() => toggleRestriction(o.value)}>
                                    {diet.restrictions.includes(o.value) && <Check size={14} weight="bold" className="nv-choice-check" />}{o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="btn-floating-primary" disabled={isLoading || !dietValid} style={{ opacity: dietValid ? 1 : 0.6 }}>
                        {isLoading ? <CircleNotch className="ph-spin" size={20} /> : <><Check size={18} weight="bold" /> Guardar y entrar</>}
                    </button>
                    <button type="button" className="nv-ghost-back" onClick={() => { setErrorMsg(''); setOnbStep(1); }}>
                        <ArrowLeft size={15} weight="bold" /> Atrás
                    </button>
                </form>
            )}
        </div>
    );

    // =====================
    // RENDER PRINCIPAL
    // =====================
    return (
        <div className="login-split-screen">
            {/* --- LADO IZQUIERDO: BANNER --- */}
            <div className="login-banner">
                <div className="login-glyphs" aria-hidden="true">
                    <Snowflake size={64} weight="fill" />
                    <ForkKnife size={52} weight="fill" />
                    <CalendarBlank size={58} weight="fill" />
                    <ShoppingCart size={48} weight="fill" />
                </div>
                <div className="banner-content">
                    <div className="banner-info">
                    <div className="logo-display">
                        <div className="logo-icon-bg">
                            <FridgeIcon size={32} color="#FF7F50" strokeWidth={2.2} />
                        </div>
                        <h1>Neve<span>rita.</span></h1>
                    </div>
                    <p className="banner-text">
                        Tu cocina inteligente: planifica, ahorra y disfruta cocinando.
                    </p>
                    {onShowLanding && (
                        <button type="button" className="banner-discover-btn" onClick={onShowLanding}>
                            <PlayCircle size={22} weight="fill" />
                            Descubre cómo funciona
                        </button>
                    )}
                    <ul className="banner-feats">
                        <li><Gear size={16} weight="fill" /> Inventario</li>
                        <li><Sparkle size={16} weight="fill" /> Recetas IA</li>
                        <li><CalendarBlank size={16} weight="fill" /> Planificador</li>
                        <li><ShoppingCart size={16} weight="fill" /> Lista de compras</li>
                    </ul>
                    </div>
                    <div className="banner-phone"><PhoneMockup /></div>
                </div>
                <div className="banner-footer">© 2026 Neverita App</div>
            </div>

            {/* --- LADO DERECHO: FORMULARIO --- */}
            <div className="login-form-container">
                <div className="auth-mobile-brand" aria-hidden="true">
                    <div className="amb-badge"><FridgeIcon size={26} color="white" strokeWidth={2.2} /></div>
                    <span className="amb-text">Neve<b>rita.</b></span>
                </div>
                {pendingUser ? renderOnboarding() : forgotMode ? renderForgotPassword() : (
                    <div className="auth-card-glass">
                        <div className="form-header">
                            <h2>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h2>
                            <p>{isRegistering ? 'Empieza tu viaje culinario' : 'Ingresa tus credenciales'}</p>
                        </div>

                        {onShowLanding && (
                            <button type="button" className="form-discover-pill" onClick={onShowLanding}>
                                <Sparkle size={16} weight="fill" />
                                ¿Primera vez? Mira todo lo que puedes hacer
                            </button>
                        )}

                        <form onSubmit={handleAuthSubmit}>
                            {errorMsg && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.875rem', textAlign: 'center' }}>
                                    {errorMsg}
                                </div>
                            )}

                            {!isRegistering ? (
                                /* ===== LOGIN ===== */
                                <>
                                    <div className="form-group-floating">
                                        <label>Nombre de Usuario</label>
                                        <div className="input-wrapper-floating">
                                            <User size={20} className="input-icon-floating" />
                                            <input type="text" name="username" placeholder="Ej: jperez" value={formData.username} onChange={handleChange} required autoCapitalize="none" />
                                        </div>
                                    </div>
                                    <div className="form-group-floating">
                                        <label>Contraseña</label>
                                        <PasswordField name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} showPw={showPw} onToggleShow={() => setShowPw(v => !v)} />
                                    </div>
                                    <div className="forgot-pass">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setForgotMode(true); setErrorMsg(''); }}>¿Olvidaste tu contraseña?</a>
                                    </div>
                                    <button className="btn-floating-primary" disabled={isLoading}>
                                        {isLoading ? <CircleNotch className="ph-spin" size={20} /> : 'Iniciar Sesión'}
                                    </button>
                                </>
                            ) : (
                                /* ===== REGISTRO ===== */
                                <>
                                    <div className="form-group-floating">
                                        <label>Nombre Completo</label>
                                        <div className="input-wrapper-floating">
                                            <User size={20} className="input-icon-floating" />
                                            <input type="text" name="name" placeholder="Tu nombre" value={formData.name} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className="form-group-floating">
                                        <label>Nombre de Usuario</label>
                                        <div className="input-wrapper-floating">
                                            <User size={20} className="input-icon-floating" />
                                            <input type="text" name="username" placeholder="Crea tu usuario" value={formData.username} onChange={handleChange} required autoCapitalize="none" />
                                        </div>
                                    </div>
                                    <div className="form-group-floating">
                                        <label>Correo Electrónico</label>
                                        <div className="input-wrapper-floating">
                                            <EnvelopeSimple size={20} className="input-icon-floating" />
                                            <input type="email" name="email" placeholder="tucorreo@ejemplo.com" value={formData.email} onChange={handleChange} required autoCapitalize="none" />
                                        </div>
                                    </div>
                                    <div className="form-group-floating">
                                        <label>Contraseña</label>
                                        <PasswordField name="password" placeholder="Crea una clave segura" value={formData.password} onChange={handleChange} showPw={showPw} onToggleShow={() => setShowPw(v => !v)} />
                                        {formData.password.length > 0 && (
                                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {passwordRules.map(rule => (
                                                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: rule.ok ? '#16a34a' : '#9b8d7c', transition: 'color 0.2s' }}>
                                                        {rule.ok ? <CheckCircle size={14} weight="fill" color="#16a34a" /> : <XCircle size={14} weight="fill" color="#D1D5DB" />}
                                                        {rule.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group-floating">
                                        <label>Confirmar Contraseña</label>
                                        <PasswordField name="confirmPassword" placeholder="Repite tu contraseña" value={formData.confirmPassword} onChange={handleChange} showPw={showConfirmPw} onToggleShow={() => setShowConfirmPw(v => !v)} />
                                        {formData.confirmPassword.length > 0 && (
                                            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: passwordsMatch ? '#16a34a' : '#DC2626', transition: 'color 0.2s' }}>
                                                {passwordsMatch
                                                    ? <><CheckCircle size={14} weight="fill" /> Las contraseñas coinciden</>
                                                    : <><XCircle size={14} weight="fill" /> Las contraseñas no coinciden</>}
                                            </div>
                                        )}
                                    </div>
                                    <button className="btn-floating-primary" disabled={isLoading || !passwordValid || !passwordsMatch} style={{ opacity: (!passwordValid || !passwordsMatch) ? 0.6 : 1 }}>
                                        {isLoading ? <CircleNotch className="ph-spin" size={20} /> : 'Registrarse'}
                                    </button>
                                </>
                            )}
                        </form>

                        <div className="auth-footer-modern">
                            {isRegistering ? '¿Ya tienes cuenta? ' : '¿Nuevo usuario? '}
                            <span onClick={switchMode} style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: '600'}}>
                                {isRegistering ? 'Ingresa aquí' : 'Crea una cuenta'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;