import React, { useState } from 'react';
import { User, Lock, Heartbeat, Ruler, Scales } from '@phosphor-icons/react';

const Auth = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);

    // Formulario de Registro con los datos que pediste
    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        // Simulamos registro exitoso y pasamos al siguiente paso
        onLogin(); 
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">Neve<span>rita</span></div>
                
                <h2 style={{marginBottom: '1.5rem', fontSize: '1.5rem'}}>
                    {isRegistering ? 'Crea tu Perfil' : '¡Hola de nuevo!'}
                </h2>

                <form onSubmit={handleRegisterSubmit}>
                    {!isRegistering ? (
                        /* --- FORMULARIO LOGIN --- */
                        <>
                            <div className="form-group">
                                <div style={{position: 'relative'}}>
                                    <User size={20} style={{position:'absolute', left:10, top:12, color:'#999'}}/>
                                    <input type="email" className="form-input" placeholder="Correo electrónico" style={{paddingLeft: 35}} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <div style={{position: 'relative'}}>
                                    <Lock size={20} style={{position:'absolute', left:10, top:12, color:'#999'}}/>
                                    <input type="password" className="form-input" placeholder="Contraseña" style={{paddingLeft: 35}} required />
                                </div>
                            </div>
                            <button className="btn-primary" style={{width: '100%', justifyContent:'center'}}>Entrar</button>
                        </>
                    ) : (
                        /* --- FORMULARIO REGISTRO COMPLETO --- */
                        <div style={{textAlign: 'left'}}>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                                <input type="text" className="form-input" placeholder="Nombre" required />
                                <input type="text" className="form-input" placeholder="Apellido" required />
                            </div>
                            <div className="form-group" style={{marginTop:'10px'}}>
                                <input type="email" className="form-input" placeholder="Correo electrónico" required />
                            </div>
                            <div className="form-group">
                                <input type="password" className="form-input" placeholder="Contraseña" required />
                            </div>
                            
                            {/* Datos de Salud */}
                            <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#666', marginBottom:'5px', display:'block'}}>Datos Físicos (Para la IA nutricional)</label>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px'}}>
                                <div style={{position:'relative'}}>
                                    <Scales size={18} style={{position:'absolute', right:10, top:12, color:'#999'}}/>
                                    <input type="number" className="form-input" placeholder="Peso (kg)" />
                                </div>
                                <div style={{position:'relative'}}>
                                    <Ruler size={18} style={{position:'absolute', right:10, top:12, color:'#999'}}/>
                                    <input type="number" className="form-input" placeholder="Altura (cm)" />
                                </div>
                            </div>

                            <button className="btn-primary" style={{width: '100%', justifyContent:'center', marginTop:'10px'}}>Registrarse</button>
                        </div>
                    )}
                </form>

                <div className="link-text" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Nuevo aquí? Regístrate'}
                </div>
            </div>
        </div>
    );
};

export default Auth;