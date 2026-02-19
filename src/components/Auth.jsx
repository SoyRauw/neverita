import React, { useState } from 'react';
import { User, Lock, Ruler, Scales, ForkKnife } from '@phosphor-icons/react';

const Auth = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        onLogin(); 
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

                    <form onSubmit={handleRegisterSubmit}>
                        {!isRegistering ? (
                            /* LOGIN */
                            <>
                                <div className="form-group-floating">
                                    <label>Nombre de Usuario</label>
                                    <div className="input-wrapper-floating">
                                        <User size={20} className="input-icon-floating"/>
                                        <input type="text" placeholder="Ej: jperez" required />
                                    </div>
                                </div>
                                <div className="form-group-floating">
                                    <label>Contraseña</label>
                                    <div className="input-wrapper-floating">
                                        <Lock size={20} className="input-icon-floating"/>
                                        <input type="password" placeholder="••••••••" required />
                                    </div>
                                </div>
                                <div className="forgot-pass">
                                    <a href="#">¿Olvidaste tu contraseña?</a>
                                </div>
                                <button className="btn-floating-primary">
                                    Iniciar Sesión
                                </button>
                            </>
                        ) : (
                            /* REGISTRO */
                            <>
                                <div className="form-group-floating">
                                    <label>Nombre Completo</label>
                                    <div className="input-wrapper-floating">
                                        <User size={20} className="input-icon-floating"/>
                                        <input type="text" placeholder="Tu nombre" required />
                                    </div>
                                </div>
                                
                                <div className="form-group-floating">
                                    <label>Nombre de Usuario</label>
                                    <div className="input-wrapper-floating">
                                        <User size={20} className="input-icon-floating"/>
                                        <input type="text" placeholder="Crea tu usuario (Ej: jperez)" required />
                                    </div>
                                </div>

                                <div className="form-group-floating">
                                    <label>Contraseña</label>
                                    <div className="input-wrapper-floating">
                                        <Lock size={20} className="input-icon-floating"/>
                                        <input type="password" placeholder="Crea una clave segura" required />
                                    </div>
                                </div>

                                {/* Datos IA Flotantes */}
                                <div className="ia-data-container">
                                    <span className="ia-label">Datos para tu IA</span>
                                    <div className="ia-inputs-row">
                                        <div className="input-wrapper-floating small">
                                            <Scales size={18} className="input-icon-floating"/>
                                            <input type="number" placeholder="Peso (kg)" />
                                        </div>
                                        <div className="input-wrapper-floating small">
                                            <Ruler size={18} className="input-icon-floating"/>
                                            <input type="number" placeholder="Altura (cm)" />
                                        </div>
                                    </div>
                                </div>

                                <button className="btn-floating-primary">
                                    Registrarse
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