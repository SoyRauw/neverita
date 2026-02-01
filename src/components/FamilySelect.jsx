import React, { useState } from 'react';
import { Plus, House, ArrowLeft, Check, Key, SignIn } from '@phosphor-icons/react';

const FamilySelect = ({ families, onSelectFamily, onCreateFamily }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'join'
    const [newFamilyName, setNewFamilyName] = useState("");
    const [joinCode, setJoinCode] = useState("");

    const handleCreate = () => {
        if(newFamilyName.trim()) {
            onCreateFamily({ name: newFamilyName, role: "Admin", members: 1 });
        }
    };

    const handleJoin = () => {
        if(joinCode.trim()) {
            alert("Funcionalidad de backend pendiente: Unirse a " + joinCode);
            // Aquí iría la lógica real
        }
    };

    return (
        <div className="family-screen-bg">
            <div className="family-content-wrapper">
                
                {/* LOGO */}
                <div className="family-logo">Neve<span>rita.</span></div>

                {/* --- VISTA: LISTA DE OPCIONES --- */}
                {viewMode === 'list' && (
                    <div className="animate-fade-up">
                        <h1 className="family-title">
                            {families.length > 0 ? "¡Hora de cocinar!" : "Bienvenido a tu cocina"}
                        </h1>
                        <p className="family-subtitle">Elige tu espacio o únete a uno nuevo</p>

                        <div className="family-grid-modern">
                            {/* 1. FAMILIAS EXISTENTES */}
                            {families.map(fam => (
                                <div key={fam.id} className="family-card-glass" onClick={() => onSelectFamily(fam)}>
                                    <div className="icon-box">
                                        <House size={32} weight="duotone" color="#FF9F43"/>
                                    </div>
                                    <div className="card-info">
                                        <h3>{fam.name}</h3>
                                        <span>{fam.members} Integrantes</span>
                                    </div>
                                    <div className="role-badge">{fam.role}</div>
                                </div>
                            ))}

                            {/* 2. CREAR NUEVA */}
                            <div className="family-card-glass action-card" onClick={() => setViewMode('create')}>
                                <div className="icon-box-dashed">
                                    <Plus size={32} />
                                </div>
                                <div className="card-info">
                                    <h3>Crear Nueva</h3>
                                    <span>Tu propio espacio</span>
                                </div>
                            </div>

                            {/* 3. UNIRSE CON CÓDIGO (RECUPERADO) */}
                            <div className="family-card-glass action-card" onClick={() => setViewMode('join')}>
                                <div className="icon-box-dashed">
                                    <Key size={32} />
                                </div>
                                <div className="card-info">
                                    <h3>Tengo Código</h3>
                                    <span>Unirme a una existente</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VISTA: CREAR FAMILIA --- */}
                {viewMode === 'create' && (
                    <div className="form-container-glass animate-fade-up">
                        <button className="btn-back" onClick={() => setViewMode('list')}>
                            <ArrowLeft size={20} /> Volver
                        </button>
                        <h2>🏠 Ponle nombre a tu casa</h2>
                        <p>Crearemos un espacio nuevo donde tú serás el administrador.</p>
                        
                        <div className="input-group-huge">
                            <input 
                                type="text" 
                                placeholder="Ej. Casa de Mamá..." 
                                value={newFamilyName}
                                autoFocus
                                onChange={(e) => setNewFamilyName(e.target.value)}
                            />
                        </div>
                        <button className="btn-confirm-huge" onClick={handleCreate}>
                            Crear Espacio <Check size={24} weight="bold" />
                        </button>
                    </div>
                )}

                {/* --- VISTA: UNIRSE (JOIN) --- */}
                {viewMode === 'join' && (
                    <div className="form-container-glass animate-fade-up">
                        <button className="btn-back" onClick={() => setViewMode('list')}>
                            <ArrowLeft size={20} /> Volver
                        </button>
                        <h2>🔑 Unirse a una familia</h2>
                        <p>Pide el código de invitación al administrador e ingrésalo aquí.</p>
                        
                        <div className="input-group-huge">
                            <input 
                                type="text" 
                                placeholder="CÓDIGO (Ej. A4F-99)" 
                                value={joinCode}
                                autoFocus
                                onChange={(e) => setJoinCode(e.target.value)}
                                style={{textTransform:'uppercase', letterSpacing:'4px'}}
                            />
                        </div>
                        <button className="btn-confirm-huge" onClick={handleJoin}>
                            Entrar <SignIn size={24} weight="bold" />
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default FamilySelect;
