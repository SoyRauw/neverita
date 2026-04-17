import React, { useState } from 'react';
import { User, Lock, EnvelopeSimple, ForkKnife, CircleNotch, Eye, EyeSlash, CheckCircle, XCircle } from '@phosphor-icons/react';
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

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const passwordRules = getPasswordRules(formData.password);
    const passwordValid = passwordRules.every(r => r.ok);
    const passwordsMatch = formData.password === formData.confirmPassword;

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (isRegistering) {
            if (!passwordValid) {
                setErrorMsg('La contraseña no cumple los requisitos mínimos.');
                return;
            }
            if (!passwordsMatch) {
                setErrorMsg('Las contraseñas no coinciden.');
                return;
            }
        }

        setIsLoading(true);
        
        // Limpiamos los datos para evitar espacios accidentales
        const cleanUsername = formData.username.trim().toLowerCase();
        const cleanPassword = formData.password.trim();

        try {
            let userData;
            if (isRegistering) {
                // SOLUCIÓN: Enviamos cleanPassword directamente. Supabase se encarga del cifrado.
                userData = await authService.register({
                    username: cleanUsername,
                    password: cleanPassword,
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                });
            } else {
                // SOLUCIÓN: Enviamos cleanPassword directamente.
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
                <div className="auth-card-glass">
                    <div className="form-header">
                        <h2>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h2>
                        <p>{isRegistering ? 'Empieza tu viaje culinario' : 'Ingresa tus credenciales'}</p>
                    </div>

                    <form onSubmit={handleAuthSubmit}>
                        {errorMsg && (
                            <div style={{
                                background: '#FEF2F2', border: '1px solid #FECACA',
                                color: '#DC2626', borderRadius: '12px',
                                padding: '10px 14px', marginBottom: '14px',
                                fontSize: '0.875rem', textAlign: 'center'
                            }}>
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
                                    <PasswordField
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        showPw={showPw}
                                        onToggleShow={() => setShowPw(v => !v)}
                                    />
                                </div>
                                <div className="forgot-pass">
                                    <a href="#">¿Olvidaste tu contraseña?</a>
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
                                    <PasswordField
                                        name="password"
                                        placeholder="Crea una clave segura"
                                        value={formData.password}
                                        onChange={handleChange}
                                        showPw={showPw}
                                        onToggleShow={() => setShowPw(v => !v)}
                                    />
                                    {formData.password.length > 0 && (
                                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {passwordRules.map(rule => (
                                                <div key={rule.label} style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    fontSize: '0.78rem', color: rule.ok ? '#16a34a' : '#9CA3AF',
                                                    transition: 'color 0.2s'
                                                }}>
                                                    {rule.ok
                                                        ? <CheckCircle size={14} weight="fill" color="#16a34a" />
                                                        : <XCircle size={14} weight="fill" color="#D1D5DB" />
                                                    }
                                                    {rule.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group-floating">
                                    <label>Confirmar Contraseña</label>
                                    <PasswordField
                                        name="confirmPassword"
                                        placeholder="Repite tu contraseña"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        showPw={showConfirmPw}
                                        onToggleShow={() => setShowConfirmPw(v => !v)}
                                    />
                                    {formData.confirmPassword.length > 0 && (
                                        <div style={{
                                            marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px',
                                            fontSize: '0.78rem',
                                            color: passwordsMatch ? '#16a34a' : '#DC2626',
                                            transition: 'color 0.2s'
                                        }}>
                                            {passwordsMatch
                                                ? <><CheckCircle size={14} weight="fill" /> Las contraseñas coinciden</>
                                                : <><XCircle size={14} weight="fill" /> Las contraseñas no coinciden</>
                                            }
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="btn-floating-primary"
                                    disabled={isLoading || !passwordValid || !passwordsMatch}
                                    style={{ opacity: (!passwordValid || !passwordsMatch) ? 0.6 : 1 }}
                                >
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
            </div>
        </div>
    );
};

export default Auth;