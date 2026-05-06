import React, { useState } from 'react';
import { User, Lock, EnvelopeSimple, ForkKnife, CircleNotch, Eye, EyeSlash, CheckCircle, XCircle, ArrowLeft, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react';
import { authService } from '../api';

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
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: '#9CA3AF', display: 'flex', alignItems: 'center',
            }}
            title={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
            {showPw ? <EyeSlash size={20} /> : <Eye size={20} />}
        </button>
    </div>
);

const Auth = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', name: '', email: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
            let userData;
            if (isRegistering) {
                userData = await authService.register({
                    username: cleanUsername, password: cleanPassword,
                    name: formData.name.trim(), email: formData.email.trim().toLowerCase(),
                });
            } else {
                userData = await authService.login(cleanUsername, cleanPassword);
            }
            onLogin(userData);
        } catch (err) {
            setErrorMsg(err.message || 'Error de autenticación');
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
                                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: rule.ok ? '#16a34a' : '#9CA3AF' }}>
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
    // RENDER PRINCIPAL
    // =====================
    return (
        <div className="login-split-screen">
            {/* --- LADO IZQUIERDO: BANNER --- */}
            <div className="login-banner">
                <div className="banner-content">
                    <div className="logo-display">
                        <div className="logo-icon-bg">
                            <ForkKnife size={32} color="white" weight="fill" />
                        </div>
                        <h1>Neve<span>rita.</span></h1>
                    </div>
                    <p className="banner-text">
                        Tu cocina inteligente: planifica, ahorra y disfruta cocinando.
                    </p>
                </div>
                <div className="banner-footer">© 2026 Neverita App</div>
            </div>

            {/* --- LADO DERECHO: FORMULARIO --- */}
            <div className="login-form-container">
                {forgotMode ? renderForgotPassword() : (
                    <div className="auth-card-glass">
                        <div className="form-header">
                            <h2>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h2>
                            <p>{isRegistering ? 'Empieza tu viaje culinario' : 'Ingresa tus credenciales'}</p>
                        </div>

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
                                                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: rule.ok ? '#16a34a' : '#9CA3AF', transition: 'color 0.2s' }}>
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