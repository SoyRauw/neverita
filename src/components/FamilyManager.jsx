import React, { useState, useEffect } from 'react';
import { X, UserCircle, Users, Plus, CaretRight, FloppyDisk, SignOut, Crown, ChefHat, Broom, Trash } from '@phosphor-icons/react';
import { userFamilyService } from '../api';

const ROLE_CONFIG = {
    creador: { label: 'Creador', emoji: '🏠', color: '#FF9F43', bg: '#FFF7ED' },
    chef: { label: 'Chef', emoji: '👨‍🍳', color: '#10B981', bg: '#ECFDF5' },
    ayudante: { label: 'Ayudante', emoji: '🧹', color: '#6B7280', bg: '#F3F4F6' },
};

const FamilyManager = ({ 
    activeFamily, 
    userFamilies, 
    currentUser,   
    userRole,
    onUpdateUser,  
    onClose, 
    onSwitchFamily, 
    onCreateNew,
    onLogout
}) => {
    const [mode, setMode] = useState('details'); // 'details', 'switch', 'profile', 'members'
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    
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

    // Cargar miembros cuando se abre el panel
    const loadMembers = async () => {
        if (!activeFamily) return;
        setLoadingMembers(true);
        try {
            const data = await userFamilyService.getMembers(activeFamily.family_id || activeFamily.id);
            setMembers(data);
        } catch (err) {
            console.error('Error cargando miembros:', err);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        if (mode === 'members') {
            loadMembers();
        }
    }, [mode]);

    const handleRoleChange = async (targetUserId, newRole) => {
        try {
            await userFamilyService.updateRole(
                currentUser.user_id,
                targetUserId,
                activeFamily.family_id || activeFamily.id,
                newRole
            );
            setMembers(prev => prev.map(m => 
                m.user_id === targetUserId ? { ...m, role: newRole } : m
            ));
        } catch (err) {
            alert(err.message || 'Error al cambiar el rol.');
        }
    };

    const handleKick = async (targetUserId, targetName) => {
        if (!confirm(`¿Seguro que quieres expulsar a ${targetName} de la familia?`)) return;
        try {
            await userFamilyService.kick(
                currentUser.user_id,
                targetUserId,
                activeFamily.family_id || activeFamily.id
            );
            setMembers(prev => prev.filter(m => m.user_id !== targetUserId));
        } catch (err) {
            alert(err.message || 'Error al expulsar miembro.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content family-manager-modal" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', width: '95%', maxWidth: '450px' }}>
                
                {/* HEADER DEL MODAL */}
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>
                        {mode === 'details' && 'Gestión de Cuenta'}
                        {mode === 'switch' && 'Mis Familias'}
                        {mode === 'profile' && 'Editar Perfil'}
                        {mode === 'members' && 'Miembros de la Familia'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* CONTENIDO DINÁMICO */}
                <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
                    
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
                            
                            {/* Badge de rol */}
                            {userRole && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    marginTop: 10, padding: '4px 14px', borderRadius: 20,
                                    background: ROLE_CONFIG[userRole]?.bg || '#F3F4F6',
                                    color: ROLE_CONFIG[userRole]?.color || '#6B7280',
                                    fontWeight: 700, fontSize: '0.85rem'
                                }}>
                                    {ROLE_CONFIG[userRole]?.emoji} {ROLE_CONFIG[userRole]?.label}
                                </div>
                            )}
                            
                            <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

                                {/* Botón de miembros - Solo visible para el creador */}
                                {userRole === 'creador' && (
                                    <button 
                                        className="btn-secondary" 
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}
                                        onClick={() => setMode('members')}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            👥 Gestionar Miembros
                                        </span>
                                        <CaretRight size={18} />
                                    </button>
                                )}
                                
                                <button 
                                    className="btn-secondary" 
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', color: '#FA7070', borderColor: '#ffebeb', backgroundColor: '#fff5f5', marginTop: '10px' }}
                                    onClick={onLogout}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                                        <SignOut size={22} weight="bold" /> Cerrar Sesión
                                    </span>
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
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: '#333' }}>{fam.name}</span>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                marginLeft: 10, padding: '2px 8px', borderRadius: 10,
                                                background: ROLE_CONFIG[fam.role]?.bg || '#F3F4F6',
                                                color: ROLE_CONFIG[fam.role]?.color || '#6B7280',
                                                fontSize: '0.7rem', fontWeight: 700
                                            }}>
                                                {ROLE_CONFIG[fam.role]?.emoji} {ROLE_CONFIG[fam.role]?.label}
                                            </div>
                                        </div>
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

                    {/* --- MODO: GESTIONAR MIEMBROS (Solo Creador) --- */}
                    {mode === 'members' && (
                        <div>
                            <button className="btn-secondary" onClick={() => setMode('details')} style={{ marginBottom: '20px', padding: '5px 10px', fontSize: '0.85rem' }}>
                                ← Volver
                            </button>

                            {loadingMembers ? (
                                <p style={{ textAlign: 'center', color: '#999' }}>Cargando miembros...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {members.map(member => {
                                        const isCreator = member.role === 'creador';
                                        const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.ayudante;
                                        return (
                                            <div key={member.user_id} style={{
                                                padding: '12px', borderRadius: 14,
                                                border: `1px solid ${isCreator ? '#FFE4B5' : '#eee'}`,
                                                background: isCreator ? '#FFFBF5' : '#fff',
                                            }}>
                                                {/* Fila superior: Avatar + Nombre */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isCreator ? 0 : 8 }}>
                                                    <img 
                                                        src={`https://i.pravatar.cc/36?u=${member.user_id}`} 
                                                        alt={member.name}
                                                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {member.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
                                                    </div>
                                                    {isCreator && (
                                                        <div style={{
                                                            padding: '2px 8px', borderRadius: 8, flexShrink: 0,
                                                            background: rc.bg, color: rc.color,
                                                            fontSize: '0.7rem', fontWeight: 700
                                                        }}>
                                                            {rc.emoji} {rc.label}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Fila inferior: Controles de rol (solo no-creadores) */}
                                                {!isCreator && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 46 }}>
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                                            style={{
                                                                padding: '3px 6px', borderRadius: 6,
                                                                border: '1px solid #E5E7EB', fontSize: '0.75rem',
                                                                fontWeight: 600, cursor: 'pointer',
                                                                background: ROLE_CONFIG[member.role]?.bg || '#F3F4F6',
                                                                color: ROLE_CONFIG[member.role]?.color || '#6B7280'
                                                            }}
                                                        >
                                                            <option value="chef">👨‍🍳 Chef</option>
                                                            <option value="ayudante">🧹 Ayudante</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleKick(member.user_id, member.name)}
                                                            style={{
                                                                background: '#FEF2F2', border: 'none', borderRadius: 6,
                                                                padding: '3px 6px', cursor: 'pointer', color: '#DC2626',
                                                                fontSize: '0.7rem', fontWeight: 600,
                                                                display: 'flex', alignItems: 'center', gap: 3
                                                            }}
                                                            title="Expulsar"
                                                        >
                                                            <Trash size={13} /> Quitar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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