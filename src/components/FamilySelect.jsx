import React, { useState } from 'react';
import { Plus, House, ArrowLeft, Check, Key, SignIn, CircleNotch } from '@phosphor-icons/react';

const FamilySelect = ({ families, onSelectFamily, onCreateFamily, onJoinByCode }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'join'
    const [newFamilyName, setNewFamilyName] = useState("");
    const [newFamilyCode, setNewFamilyCode] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const handleCreate = () => {
        if (newFamilyName.trim()) {
            onCreateFamily({ name: newFamilyName, code: newFamilyCode.trim() || null, role: "Admin", members: 1 });
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        setJoinError("");
        setIsJoining(true);
        try {
            const family = await onJoinByCode(joinCode.trim());
            // Si se unió exitosamente, seleccionar la familia
            onSelectFamily({ ...family, id: family.family_id, role: "Miembro", members: 1 });
        } catch (err) {
            setJoinError(err.message || "Error al unirse a la familia");
        } finally {
            setIsJoining(false);
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
                                        <House size={32} weight="duotone" color="#FF9F43" />
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

                            {/* 3. UNIRSE CON CÓDIGO */}
                            <div className="family-card-glass action-card" onClick={() => { setViewMode('join'); setJoinError(""); setJoinCode(""); }}>
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
                        <div className="input-group-huge" style={{ marginTop: '12px' }}>
                            <input
                                type="text"
                                placeholder="Código de invitación (Ej. 0205)"
                                value={newFamilyCode}
                                onChange={(e) => setNewFamilyCode(e.target.value)}
                            />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '8px' }}>Comparte este código para que otros se unan a tu familia.</p>
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

                        {joinError && (
                            <div style={{ color: '#EF4444', background: '#FEF2F2', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '16px', textAlign: 'center' }}>
                                {joinError}
                            </div>
                        )}

                        <div className="input-group-huge">
                            <input
                                type="text"
                                placeholder="Ingresa el código"
                                value={joinCode}
                                autoFocus
                                onChange={(e) => setJoinCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            />
                        </div>
                        <button className="btn-confirm-huge" onClick={handleJoin} disabled={isJoining}>
                            {isJoining ? <><CircleNotch className="ph-spin" size={24} /> Buscando...</> : <>Entrar <SignIn size={24} weight="bold" /></>}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default FamilySelect;
