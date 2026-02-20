import React, { useState } from 'react';
import { User, Lock, Ruler, Scales, ForkKnife, CircleNotch } from '@phosphor-icons/react';
import { authService } from '../api';

const Auth = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            let userData;
            if (isRegistering) {
                userData = await authService.register(formData);
            } else {
                userData = await authService.login(formData.username, formData.password);
            }
            onLogin(userData);
        } catch (err) {
            setErrorMsg(err.message || 'Error de autenticación');
        } finally {
            setIsLoading(false);
        }
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
                <div className="banner-footer">© 2024 Neverita App</div>
            </div>

            {/* --- LADO DERECHO: FORMULARIO MODERNO --- */}
            <div className="login-form-container">
                <div className="auth-card-glass">
                    <div className="form-header">
                        <h2>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h2>
                        <p>{isRegistering ? 'Empieza tu viaje culinario' : 'Ingresa tus credenciales'}</p>
                    </div>

                    <form onSubmit={handleAuthSubmit}>
                        {errorMsg && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</div>}
                        {!isRegistering ? (
                            /* LOGIN */
                            <>
                                <div className="form-group-floating">
                                    <label>Nombre de Usuario</label>
                                    <div className="input-wrapper-floating">
                                        <User size={20} className="input-icon-floating" />
                                        <input type="text" name="username" placeholder="Ej: jperez" value={formData.username} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="form-group-floating">
                                    <label>Contraseña</label>
                                    <div className="input-wrapper-floating">
                                        <Lock size={20} className="input-icon-floating" />
                                        <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="forgot-pass">
                                    <a href="#">¿Olvidaste tu contraseña?</a>
                                </div>
                                <button className="btn-floating-primary" disabled={isLoading}>
                                    {isLoading ? <CircleNotch className="ph-spin" size={20} /> : 'Iniciar Sesión'}
                                </button>
                            </>
                        ) : (
                            /* REGISTRO */
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
                                        <input type="text" name="username" placeholder="Crea tu usuario" value={formData.username} onChange={handleChange} required />
                                    </div>
                                </div>

                                <div className="form-group-floating">
                                    <label>Contraseña</label>
                                    <div className="input-wrapper-floating">
                                        <Lock size={20} className="input-icon-floating" />
                                        <input type="password" name="password" placeholder="Crea una clave segura" value={formData.password} onChange={handleChange} required />
                                    </div>
                                </div>

                                {/* Datos IA Flotantes */}
                                <div className="ia-data-container">
                                    <span className="ia-label">Datos para tu IA</span>
                                    <div className="ia-inputs-row">
                                        <div className="input-wrapper-floating small">
                                            <Scales size={18} className="input-icon-floating" />
                                            <input type="number" placeholder="Peso (kg)" />
                                        </div>
                                        <div className="input-wrapper-floating small">
                                            <Ruler size={18} className="input-icon-floating" />
                                            <input type="number" placeholder="Altura (cm)" />
                                        </div>
                                    </div>
                                </div>

                                <button className="btn-floating-primary" disabled={isLoading}>
                                    {isLoading ? <CircleNotch className="ph-spin" size={20} /> : 'Registrarse'}
                                </button>
                            </>
                        )}
                    </form>

                    <div className="auth-footer-modern">
                        {isRegistering ? '¿Ya tienes cuenta? ' : '¿Nuevo usuario? '}
                        <span onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? 'Ingresa aquí' : 'Crea una cuenta'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;