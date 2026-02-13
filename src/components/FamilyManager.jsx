import React, { useState } from 'react';
import { X, UserCircle, Users, Plus, CaretRight, FloppyDisk } from '@phosphor-icons/react';

const FamilyManager = ({ 
    activeFamily, 
    userFamilies, 
    currentUser,   
    onUpdateUser,  
    onClose, 
    onSwitchFamily, 
    onCreateNew
}) => {
    const [mode, setMode] = useState('details'); // 'details', 'switch', 'profile'
    
    // Estado local para el formulario de edición
    const [editName, setEditName] = useState(currentUser.name);
    const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
    const [editEmail, setEditEmail] = useState(currentUser.email);

    const handleSaveProfile = () => {
        onUpdateUser({
            ...currentUser,
            name: editName,
            avatar: editAvatar,
            email: editEmail
        });
        setMode('details'); 
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', width: '450px' }}>
                
                {/* HEADER DEL MODAL */}
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>
                        {mode === 'details' && 'Gestión de Cuenta'}
                        {mode === 'switch' && 'Mis Familias'}
                        {mode === 'profile' && 'Editar Perfil'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* CONTENIDO DINÁMICO */}
                <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                    
                    {/* --- MODO: DETALLES (Vista Principal) --- */}
                    {mode === 'details' && (
                        <div style={{ textAlign: 'center' }}>
                            <img 
                                src={currentUser.avatar} 
                                alt="Avatar" 
                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '4px solid #fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} 
                            />
                            <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{currentUser.name}</h2>
                            <p style={{ color: '#888', margin: 0 }}>{currentUser.email}</p>
                            
                            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button 
                                    className="btn-secondary" 
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}
                                    onClick={() => setMode('profile')}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <UserCircle size={22} /> Editar Perfil
                                    </span>
                                    <CaretRight size={18} />
                                </button>

                                <button 
                                    className="btn-secondary" 
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}
                                    onClick={() => setMode('switch')}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Users size={22} /> Cambiar de Familia
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>{activeFamily.name}</span>
                                        <CaretRight size={18} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- MODO: CAMBIAR FAMILIA --- */}
                    {mode === 'switch' && (
                        <div>
                            <button className="btn-secondary" onClick={() => setMode('details')} style={{ marginBottom: '20px', padding: '5px 10px', fontSize: '0.85rem' }}>
                                ← Volver
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {userFamilies.map(fam => (
                                    <div 
                                        key={fam.id}
                                        onClick={() => onSwitchFamily(fam)}
                                        style={{
                                            padding: '15px', borderRadius: '12px', border: '1px solid #eee',
                                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: activeFamily.id === fam.id ? '#FFF3E0' : 'white',
                                            borderColor: activeFamily.id === fam.id ? 'var(--color-primary)' : '#eee'
                                        }}
                                    >
                                        <span style={{ fontWeight: 'bold', color: '#333' }}>{fam.name}</span>
                                        {activeFamily.id === fam.id && <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Activa</span>}
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={onCreateNew}
                                    style={{
                                        padding: '15px', borderRadius: '12px', border: '2px dashed #ddd',
                                        background: 'transparent', color: '#888', cursor: 'pointer', fontWeight: 'bold',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px'
                                    }}
                                >
                                    <Plus size={18} /> Crear nueva familia
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- MODO: EDITAR PERFIL --- */}
                    {mode === 'profile' && (
                        <div>
                            <button className="btn-secondary" onClick={() => setMode('details')} style={{ marginBottom: '20px', padding: '5px 10px', fontSize: '0.85rem' }}>
                                ← Volver
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>URL Avatar</label>
                                    <input className="form-input" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} />
                                    <small style={{ color: '#999', fontSize: '0.75rem' }}>Pega un enlace de imagen.</small>
                                </div>

                                <button 
                                    onClick={handleSaveProfile}
                                    className="btn-primary" 
                                    style={{ justifyContent: 'center', marginTop: '10px' }}
                                >
                                    <FloppyDisk size={20} weight="fill" /> Guardar Cambios
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* FOOTER (Solo Versión) */}
                <div style={{ background: '#f9f9f9', padding: '15px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#ccc' }}>Neve<strong>rita</strong> v2.0</div>
                </div>
            </div>
        </div>
    );
};

export default FamilyManager;