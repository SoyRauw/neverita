import React, { useState } from 'react';
import { Plus, House, ArrowLeft, Check, Key, SignIn, CircleNotch, CaretDown, CaretUp, ForkKnife, CookingPot, Carrot } from '@phosphor-icons/react';

const FamilySelect = ({ families, onSelectFamily, onCreateFamily, onJoinByCode }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'join'
    const [newFamilyName, setNewFamilyName] = useState("");
    const [newFamilyCode, setNewFamilyCode] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    // Estado exclusivo para el funcionamiento del acordeón en móvil
    const [isMenuOpen, setIsMenuOpen] = useState(true);

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
            onSelectFamily({ ...family, id: family.family_id, role: "Miembro", members: 1 });
        } catch (err) {
            setJoinError(err.message || "Error al unirse a la familia");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="family-screen-bg">
            {/* Fondo animado: blobs a la deriva + glifos flotantes */}
            <div className="fam-bg-decor" aria-hidden="true">
                <div className="fam-blob b1"></div>
                <div className="fam-blob b2"></div>
                <div className="fam-blob b3"></div>
            </div>
            <div className="fam-glyphs" aria-hidden="true">
                <ForkKnife size={58} weight="fill" />
                <CookingPot size={64} weight="fill" />
                <Carrot size={50} weight="fill" />
                <House size={54} weight="fill" />
            </div>

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

                        {/* ACORDEÓN EXCLUSIVO MÓVIL */}
                        <div className="mobile-accordion-card">
                            <button className="accordion-header" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <div className="header-info">
                                    <House size={24} weight="duotone" color="#FF9F43" />
                                    <span>Tus familias ({families.length})</span>
                                </div>
                                {isMenuOpen ? <CaretUp size={20} /> : <CaretDown size={20} />}
                            </button>
                            <div className={`accordion-content ${isMenuOpen ? 'is-open' : ''}`}>
                                {families.map(fam => (
                                    <div key={fam.id} className="mobile-family-item" onClick={() => onSelectFamily(fam)}>
                                        <div className="item-details">
                                            <strong>{fam.name}</strong>
                                            <span>{fam.members} Integrantes • {fam.role}</span>
                                        </div>
                                        <div className="item-arrow">→</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* GRID PC (Oculto en móvil por CSS) */}
                        <div className="family-grid-modern">
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

                            <div className="family-card-glass action-card" onClick={() => setViewMode('create')}>
                                <div className="icon-box-dashed">
                                    <Plus size={32} />
                                </div>
                                <div className="card-info">
                                    <h3>Crear Nueva</h3>
                                    <span>Tu propio espacio</span>
                                </div>
                            </div>

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

                        {/* NUEVOS BOTONES FLOTANTES ESTILO CARD (SOLO MÓVIL) */}
                        <div className="mobile-action-grid">
                            <div className="mobile-action-card" onClick={() => setViewMode('create')}>
                                <div className="mini-icon-box-dashed">
                                    <Plus size={24} weight="bold" />
                                </div>
                                <div className="mini-card-info">
                                    <h3>Crear</h3>
                                    <span>Nuevo espacio</span>
                                </div>
                            </div>

                            <div className="mobile-action-card" onClick={() => setViewMode('join')}>
                                <div className="mini-icon-box-dashed">
                                    <Key size={24} weight="bold" />
                                </div>
                                <div className="mini-card-info">
                                    <h3>Unirse</h3>
                                    <span>Tengo código</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VISTA: FORMULARIOS (CREAR/UNIRSE) --- */}
                {(viewMode === 'create' || viewMode === 'join') && (
                    <div className="form-container-glass animate-fade-up">
                        <button className="btn-back" onClick={() => setViewMode('list')}>
                            <ArrowLeft size={20} /> Volver
                        </button>
                        
                        {viewMode === 'create' ? (
                            <>
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
                                        maxLength={11}
                                        onChange={(e) => setNewFamilyCode(e.target.value)}
                                    />
                                </div>
                                <button className="btn-confirm-huge" onClick={handleCreate}>
                                    Crear Espacio <Check size={24} weight="bold" />
                                </button>
                            </>
                        ) : (
                            <>
                                <h2>🔑 Unirse a una familia</h2>
                                <p>Ingresa el código de invitación del administrador.</p>
                                {joinError && <div className="error-msg">{joinError}</div>}
                                <div className="input-group-huge">
                                    <input
                                        type="text"
                                        placeholder="Ingresa el código"
                                        value={joinCode}
                                        autoFocus
                                        onChange={(e) => setJoinCode(e.target.value)}
                                    />
                                </div>
                                <button className="btn-confirm-huge" onClick={handleJoin} disabled={isJoining}>
                                    {isJoining ? <CircleNotch className="ph-spin" size={24} /> : <>Entrar <SignIn size={24} weight="bold" /></>}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .mobile-accordion-card, .mobile-action-grid { display: none; }

                @media (max-width: 768px) {
                    .family-grid-modern { display: none !important; }
                    .family-logo { font-size: 2.2rem !important; margin-bottom: 5px !important; text-align: center; }
                    .family-title { font-size: 1.4rem !important; text-align: center; }
                    .family-subtitle { text-align: center; margin-bottom: 20px !important; }

                    /* Acordeón */
                    .mobile-accordion-card { 
                        display: block; background: rgba(255,255,255,0.78); backdrop-filter: blur(12px);
                        border: 1px solid rgba(255,159,67,0.18);
                        border-radius: 22px; 
                        box-shadow: 0 14px 34px rgba(180,100,30,0.12); overflow: hidden; margin-bottom: 20px;
                        animation: nv-rise-sm 0.5s var(--ease-out) both;
                    }
                    .accordion-header {
                        width: 100%; padding: 18px; display: flex; justify-content: space-between;
                        align-items: center; background: transparent; border: none; outline: none; cursor: pointer;
                    }
                    .header-info { display: flex; align-items: center; gap: 10px; font-weight: 800; color: #2A2118; }
                    .accordion-content { max-height: 0; transition: max-height 0.35s var(--ease-out); background: rgba(255,246,236,0.6); overflow: hidden; }
                    .accordion-content.is-open { max-height: 400px; overflow-y: auto; }
                    .mobile-family-item {
                        padding: 16px 20px; display: flex; justify-content: space-between;
                        align-items: center; border-top: 1px solid rgba(255,159,67,0.14);
                        transition: background 0.2s;
                    }
                    .mobile-family-item:active { background: #FFF1E0; }
                    .item-details strong { display: block; color: #2A2118; font-size: 1rem; }
                    .item-details span { font-size: 0.8rem; color: #9b8d7c; }
                    .item-arrow { color: #FF9F43; font-weight: bold; font-size: 1.2rem; }

                    /* Grid de Botones Accionadores estilo PC */
                    .mobile-action-grid {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;
                    }
                    .mobile-action-card {
                        background: rgba(255,255,255,0.78); backdrop-filter: blur(12px); border-radius: 24px; padding: 18px 15px;
                        display: flex; flex-direction: column; align-items: center; text-align: center;
                        box-shadow: 0 14px 30px rgba(180,100,30,0.12);
                        border: 1px solid rgba(255,159,67,0.18);
                        cursor: pointer; transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
                        animation: nv-pop 0.5s var(--ease-spring) both;
                    }
                    .mobile-action-card:nth-child(2) { animation-delay: 0.1s; }
                    .mobile-action-card:active { transform: scale(0.95); }
                    
                    .mini-icon-box-dashed {
                        width: 54px; height: 54px;
                        background: linear-gradient(135deg, #FF9F43, #FF7F50);
                        border-radius: 16px; display: flex; align-items: center; justify-content: center;
                        color: #fff; margin-bottom: 10px;
                        box-shadow: 0 8px 18px rgba(255,127,80,0.32);
                    }
                    .mini-card-info h3 { font-size: 0.98rem; font-weight: 800; color: #2A2118; margin: 0; }
                    .mini-card-info span { font-size: 0.75rem; color: #9b8d7c; white-space: nowrap; }

                    .error-msg { color: #EF4444; background: #FEF2F2; padding: 12px; border-radius: 12px; font-size: 0.9rem; margin-bottom: 16px; text-align: center; }
                }
            `}} />
        </div>
    );
};

export default FamilySelect;