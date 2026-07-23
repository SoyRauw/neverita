import React, { useState, useEffect, useRef } from 'react';
import { showToast } from '../Toast';
import { X, UserCircle, Users, Plus, CaretRight, FloppyDisk, SignOut, Crown, ChefHat, Broom, Trash, UploadSimple, Copy, Heartbeat, PencilSimple, Leaf, Target, Warning, Check, Key } from '@phosphor-icons/react';
import { userFamilyService, usersService, imgProxy } from '../api';
import Avatar from './Avatar';
import NvSelect from './NvSelect';
import NvDatePicker from './NvDatePicker';
import { DIET_OPTS, GOAL_OPTS, RESTRICTION_OPTS } from '../profileOptions';

// Opciones de sexo y nivel de actividad (para los desplegables modernos)
const SEX_OPTS = [{ value: 'm', label: 'Masculino' }, { value: 'f', label: 'Femenino' }, { value: 'otro', label: 'Otro' }];
const ACTIVITY_OPTS = [{ value: 'bajo', label: 'Bajo (poco ejercicio)' }, { value: 'medio', label: 'Medio (moderado)' }, { value: 'alto', label: 'Alto (muy activo)' }];

// Edad a partir de la fecha de nacimiento (AAAA-MM-DD)
const calcAge = (birth) => {
    if (!birth) return null;
    const b = new Date(String(birth).split('T')[0] + 'T00:00:00');
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age >= 0 && age < 130 ? age : null;
};

const ROLE_CONFIG = {
    creador: { label: 'Creador', emoji: '🏠', color: '#FF9F43', bg: '#FFF7ED' },
    chef: { label: 'Chef', emoji: '👨‍🍳', color: '#10B981', bg: '#ECFDF5' },
    ayudante: { label: 'Ayudante', emoji: '🧹', color: '#6B5E4F', bg: '#FFF6EC' },
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
    onLeaveFamily,
    onLogout
}) => {
    const [mode, setMode] = useState('details'); // 'details', 'switch', 'profile', 'members'
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    
    // Estado local para el formulario de edición
    const [editName, setEditName] = useState(currentUser.name);
    const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
    const [editEmail, setEditEmail] = useState(currentUser.email);
    const [editUsername, setEditUsername] = useState(currentUser.username || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const fileInputRef = useRef(null);

    // Datos físicos del perfil (edad/peso/altura/sexo/actividad)
    const [physical, setPhysical] = useState({ birth_date: '', height_cm: '', weight_kg: '', sex: '', activity_level: 'medio' });
    // Preferencias alimentarias (dieta/objetivo/restricciones) — Bloque 2
    const [diet, setDiet] = useState({ diet_type: '', goal: '', restrictions: [] });
    const [savingProfile, setSavingProfile] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false); // evita guardar (y borrar) antes de cargar los datos actuales

    const toggleProfileRestriction = (v) => setDiet(d => ({
        ...d,
        restrictions: d.restrictions.includes(v) ? d.restrictions.filter(x => x !== v) : [...d.restrictions, v],
    }));

    // Cargar los datos del usuario (físico + preferencias) al abrir "Editar Perfil"
    useEffect(() => {
        if (mode !== 'profile' || !currentUser?.user_id) return;
        setLoadingProfile(true);
        usersService.getById(currentUser.user_id)
            .then(u => {
                setPhysical({
                    birth_date: u.birth_date ? String(u.birth_date).split('T')[0] : '',
                    height_cm: u.height_cm ?? '',
                    weight_kg: u.weight_kg ?? '',
                    sex: u.sex ?? '',
                    activity_level: u.activity_level ?? 'medio',
                });
                setDiet({
                    diet_type: u.diet_type ?? '',
                    goal: u.goal ?? '',
                    restrictions: Array.isArray(u.dietary_restrictions) ? u.dietary_restrictions : [],
                });
            })
            .catch(() => { showToast('No se pudieron cargar tus datos. Revisa tu conexión e inténtalo de nuevo.'); })
            .finally(() => setLoadingProfile(false));
    }, [mode, currentUser]);

    const handleSaveProfile = async () => {
        // No guardar hasta tener los datos actuales cargados: si no, enviaríamos
        // null en físico/preferencias y borraríamos lo ya guardado en la BD.
        if (loadingProfile) return;
        // Validaciones de cuenta
        if (!editUsername.trim()) { showToast('El nombre de usuario es obligatorio.', 'warning'); return; }
        if (!editName.trim()) { showToast('El nombre es obligatorio.', 'warning'); return; }
        if (!editEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) { showToast('Escribe un correo válido.', 'warning'); return; }
        if (newPassword && !currentPassword) { showToast('Escribe tu contraseña actual para cambiarla.', 'warning'); return; }

        setSavingProfile(true);
        // 1. Cuenta (usuario, nombre, correo, contraseña opcional) → backend, PERSISTE de verdad (#6/item 10)
        if (currentUser?.user_id) {
            try {
                const acc = { username: editUsername.trim(), name: editName.trim(), email: editEmail.trim() };
                if (newPassword) { acc.password = newPassword; acc.current_password = currentPassword; }
                const updated = await usersService.updateAccount(currentUser.user_id, acc);
                onUpdateUser({ ...currentUser, username: updated.username, name: updated.name, email: updated.email, avatar: editAvatar });
                setCurrentPassword(''); setNewPassword('');
            } catch (e) {
                showToast(e.message || 'No se pudo guardar la cuenta.', 'error');
                setSavingProfile(false);
                return;
            }
        }
        // 2. Datos físicos + preferencias → backend
        if (currentUser?.user_id) {
            try {
                await usersService.updateProfile(currentUser.user_id, {
                    birth_date: physical.birth_date || null,
                    height_cm: physical.height_cm === '' ? null : Number(physical.height_cm),
                    weight_kg: physical.weight_kg === '' ? null : Number(physical.weight_kg),
                    sex: physical.sex || null,
                    activity_level: physical.activity_level || null,
                    diet_type: diet.diet_type || null,
                    goal: diet.goal || null,
                    dietary_restrictions: diet.restrictions,
                });
            } catch (e) {
                showToast(e.message || 'No se pudieron guardar los datos físicos.', 'error');
                setSavingProfile(false);
                return;
            }
        }
        showToast('Cuenta actualizada.', 'success');
        setSavingProfile(false);
        setMode('details');
    };

    // --- Edición de datos físicos por miembro (en el panel de miembros) ---
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [memberPhysical, setMemberPhysical] = useState({});
    const [savingMember, setSavingMember] = useState(false);

    const startEditMember = (m) => {
        setEditingMemberId(m.user_id);
        setMemberPhysical({
            birth_date: m.birth_date ? String(m.birth_date).split('T')[0] : '',
            height_cm: m.height_cm ?? '',
            weight_kg: m.weight_kg ?? '',
            sex: m.sex ?? '',
            activity_level: m.activity_level ?? 'medio',
        });
    };

    const saveMemberPhysical = async (memberId) => {
        setSavingMember(true);
        try {
            const updated = await usersService.updateProfile(memberId, {
                birth_date: memberPhysical.birth_date || null,
                height_cm: memberPhysical.height_cm === '' ? null : Number(memberPhysical.height_cm),
                weight_kg: memberPhysical.weight_kg === '' ? null : Number(memberPhysical.weight_kg),
                sex: memberPhysical.sex || null,
                activity_level: memberPhysical.activity_level || null,
            });
            setMembers(prev => prev.map(mm => mm.user_id === memberId ? { ...mm, ...updated } : mm));
            setEditingMemberId(null);
            showToast('Datos actualizados.');
        } catch (e) {
            showToast(e.message || 'No se pudieron guardar los datos.');
        } finally {
            setSavingMember(false);
        }
    };

    // Resumen de datos físicos para mostrar en cada tarjeta de miembro
    const physicalSummary = (m) => {
        const parts = [];
        const age = calcAge(m.birth_date);
        if (age !== null) parts.push(`${age} años`);
        if (m.sex) parts.push(SEX_OPTS.find(o => o.value === m.sex)?.label || m.sex);
        if (m.weight_kg) parts.push(`${m.weight_kg} kg`);
        if (m.height_cm) parts.push(`${m.height_cm} cm`);
        return parts;
    };

    const familyCode = activeFamily?.code;
    // URL de invitación: abre la app con el código para unirse (el QR NO debe ser
    // solo el número, si no el navegador lo busca en Google).
    const joinUrl = familyCode
        ? `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(familyCode)}`
        : '';
    const handleCopyCode = async () => {
        if (!familyCode) return;
        try {
            await navigator.clipboard.writeText(String(familyCode));
            showToast('Código copiado al portapapeles.');
        } catch {
            showToast('No se pudo copiar el código.');
        }
    };

    // Subir foto desde un archivo: la redimensiona a 256x256 (recorte centrado)
    // y la convierte a data URL liviano para guardarla sin depender de enlaces.
    const handleAvatarFile = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Por favor selecciona un archivo de imagen.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const size = 256;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                const min = Math.min(img.width, img.height);
                const sx = (img.width - min) / 2;
                const sy = (img.height - min) / 2;
                ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
                setEditAvatar(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        // Permite volver a elegir el mismo archivo otra vez
        e.target.value = '';
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
            showToast('No se pudieron cargar los integrantes. Revisa tu conexión.', 'error');
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        if (mode === 'members') {
            loadMembers();
        }
    }, [mode]);

    // --- Salir de la familia (con transferencia de mando si soy el creador) ---
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [transferTo, setTransferTo] = useState('');
    const [leaving, setLeaving] = useState(false);
    const amCreator = userRole === 'creador';
    const otherMembers = members.filter(m => m.user_id !== currentUser.user_id);

    const openLeave = async () => {
        if (amCreator && members.length === 0) await loadMembers();
        setTransferTo('');
        setLeaveOpen(true);
    };
    const handleLeave = async () => {
        const familyId = activeFamily.family_id || activeFamily.id;
        const needsTransfer = amCreator && otherMembers.length > 0;
        if (needsTransfer && !transferTo) { showToast('Elige a quién le pasas el mando.', 'warning'); return; }
        setLeaving(true);
        try {
            await userFamilyService.leave(currentUser.user_id, familyId, needsTransfer ? Number(transferTo) : undefined);
            setLeaveOpen(false);
            showToast('Saliste de la familia.', 'success');
            if (onLeaveFamily) onLeaveFamily();
        } catch (e) {
            showToast(e.message || 'No se pudo salir de la familia.', 'error');
        } finally {
            setLeaving(false);
        }
    };

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
            showToast(err.message || 'Error al cambiar el rol.');
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
            showToast(err.message || 'Error al expulsar miembro.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content family-manager-modal" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', width: '95%', maxWidth: '480px' }}>
                
                {/* HEADER DEL MODAL */}
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,159,67,0.16)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg,#FFFDFB,#FFF8F1)' }}>
                    <h3 style={{ margin: 0, fontFamily: "'Nunito', sans-serif", fontSize: '1.3rem', fontWeight: 600, color: '#2A2118' }}>
                        {mode === 'details' && 'Gestión de Cuenta'}
                        {mode === 'switch' && 'Mis Familias'}
                        {mode === 'profile' && 'Editar Perfil'}
                        {mode === 'members' && 'Miembros de la Familia'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b8d7c', width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10 }}>
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* CONTENIDO DINÁMICO */}
                <div style={{ padding: '22px', paddingBottom: 'calc(22px + env(safe-area-inset-bottom))', maxHeight: '72dvh', overflowY: 'auto', overflowX: 'hidden' }}>
                    
                    {/* --- MODO: DETALLES (Vista Principal) --- */}
                    {mode === 'details' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                                <Avatar
                                    name={currentUser.name}
                                    src={currentUser.avatar}
                                    size={100}
                                    style={{ border: '4px solid #fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                                />
                            </div>
                            <h2 style={{ margin: '0 0 5px 0', fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: '1.6rem', color: '#2A2118' }}>{currentUser.name}</h2>
                            <p style={{ color: '#9b8d7c', margin: 0 }}>{currentUser.email}</p>
                            
                            {/* Badge de rol */}
                            {userRole && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    marginTop: 10, padding: '4px 14px', borderRadius: 20,
                                    background: ROLE_CONFIG[userRole]?.bg || '#FFF6EC',
                                    color: ROLE_CONFIG[userRole]?.color || '#6B5E4F',
                                    fontWeight: 700, fontSize: '0.85rem'
                                }}>
                                    {ROLE_CONFIG[userRole]?.emoji} {ROLE_CONFIG[userRole]?.label}
                                </div>
                            )}
                            
                            {/* Código de la familia para invitar a otros */}
                            {familyCode && (
                                <div style={{
                                    marginTop: 18, padding: '16px', borderRadius: 14,
                                    background: '#FFF7ED', border: '1px solid rgba(255,159,67,0.30)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9b8d7c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Código de Invitación
                                    </div>
                                    
                                    <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '2px solid rgba(255,159,67,0.2)' }}>
                                        <img
                                            src={imgProxy(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}&color=E67E22&bgcolor=FFFFFF`)}
                                            alt="QR Code de invitación"
                                            style={{ width: 120, height: 120, display: 'block' }}
                                        />
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#E67E22', letterSpacing: '0.2em' }}>
                                            {familyCode}
                                        </div>
                                        <button
                                            onClick={handleCopyCode}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                background: 'white', color: '#E67E22', border: '2px solid #E67E22', borderRadius: 10,
                                                padding: '6px 12px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                                            }}
                                        >
                                            <Copy size={18} weight="bold" />
                                        </button>
                                    </div>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeFamily.name}</span>
                                        <CaretRight size={18} style={{ flexShrink: 0 }} />
                                    </div>
                                </button>

                                {/* Botón de miembros - solo activo para el creador */}
                                <div className="btn-locked-wrapper" style={{ width: '100%' }} data-tooltip={userRole !== 'creador' ? '🔒 Solo el creador puede gestionar miembros' : undefined}>
                                    <button 
                                        className={`btn-secondary${userRole !== 'creador' ? ' btn-locked' : ''}`}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', width: '100%' }}
                                        onClick={userRole === 'creador' ? () => setMode('members') : undefined}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Users size={18} weight="bold" style={{ verticalAlign: '-3px', marginRight: 6 }} />Gestionar Miembros
                                        </span>
                                        <CaretRight size={18} />
                                    </button>
                                </div>
                                
                                <button
                                    className="btn-secondary"
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '13px', color: '#B45309', borderColor: '#FDE68A', backgroundColor: '#FFFBEB', marginTop: '10px' }}
                                    onClick={openLeave}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                                        <SignOut size={20} weight="bold" /> Salir de esta familia
                                    </span>
                                </button>

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
                            <button className="btn-secondary" onClick={() => setMode('details')} style={{ marginBottom: '20px', padding: '9px 16px', fontSize: '0.85rem', minHeight: 40 }}>
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
                                            borderColor: activeFamily.id === fam.id ? 'var(--color-primary)' : '#EADBC7'
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: '#2A2118' }}>{fam.name}</span>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                marginLeft: 10, padding: '2px 8px', borderRadius: 10,
                                                background: ROLE_CONFIG[fam.role]?.bg || '#FFF6EC',
                                                color: ROLE_CONFIG[fam.role]?.color || '#6B5E4F',
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
                                        background: 'transparent', color: '#9b8d7c', cursor: 'pointer', fontWeight: 'bold',
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
                            <button className="btn-secondary" onClick={() => setMode('details')} style={{ marginBottom: '20px', padding: '9px 16px', fontSize: '0.85rem', minHeight: 40 }}>
                                ← Volver
                            </button>

                            {loadingMembers ? (
                                <p style={{ textAlign: 'center', color: '#9b8d7c' }}>Cargando miembros...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {members.map(member => {
                                        const isCreator = member.role === 'creador';
                                        const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.ayudante;
                                        return (
                                            <div key={member.user_id} style={{
                                                padding: '12px', borderRadius: 14,
                                                border: `1px solid ${isCreator ? '#FFE4B5' : '#EADBC7'}`,
                                                background: isCreator ? '#FFFBF5' : '#fff',
                                            }}>
                                                {/* Fila superior: Avatar + Nombre */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isCreator ? 0 : 8 }}>
                                                    <Avatar name={member.name} size={36} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2A2118', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {member.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#9b8d7c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
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
                                                    <div className="nv-mm-indent" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 46, flexWrap: 'wrap' }}>
                                                        <NvSelect
                                                            value={member.role}
                                                            onChange={(v) => handleRoleChange(member.user_id, v)}
                                                            options={[{ value: 'chef', label: '👨‍🍳 Chef' }, { value: 'ayudante', label: '🧹 Ayudante' }]}
                                                            placeholder="Rol"
                                                            style={{ minWidth: 140 }}
                                                        />
                                                        <button
                                                            onClick={() => handleKick(member.user_id, member.name)}
                                                            style={{
                                                                background: '#FEF2F2', border: 'none', borderRadius: 8,
                                                                padding: '9px 12px', minHeight: 40, cursor: 'pointer', color: '#DC2626',
                                                                fontSize: '0.78rem', fontWeight: 700,
                                                                display: 'inline-flex', alignItems: 'center', gap: 5
                                                            }}
                                                            title="Expulsar"
                                                        >
                                                            <Trash size={13} /> Quitar
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Datos físicos del miembro (el creador puede editarlos) */}
                                                <div className="nv-mm-indent" style={{ marginTop: 10, marginLeft: 46 }}>
                                                    {editingMemberId === member.user_id ? (
                                                        <div className="nv-mm-grid" style={{ background: '#FFF9F2', border: '1px solid #EADBC7', borderRadius: 10, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nacimiento</label>
                                                                <NvDatePicker value={memberPhysical.birth_date} max={new Date().toISOString().split('T')[0]} onChange={v => setMemberPhysical(p => ({ ...p, birth_date: v }))} placeholder="Nacimiento" />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Sexo</label>
                                                                <NvSelect value={memberPhysical.sex} onChange={v => setMemberPhysical(p => ({ ...p, sex: v }))} options={SEX_OPTS} placeholder="—" />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Peso (kg)</label>
                                                                <input type="text" inputMode="decimal" className="form-input" style={{ padding: '7px 9px', fontSize: '0.85rem' }} placeholder="70" value={memberPhysical.weight_kg} onChange={e => setMemberPhysical(p => ({ ...p, weight_kg: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') }))} />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Altura (cm)</label>
                                                                <input type="text" inputMode="numeric" className="form-input" style={{ padding: '7px 9px', fontSize: '0.85rem' }} placeholder="170" value={memberPhysical.height_cm} onChange={e => setMemberPhysical(p => ({ ...p, height_cm: e.target.value.replace(/[^0-9]/g, '') }))} />
                                                            </div>
                                                            <div style={{ gridColumn: '1 / -1' }}>
                                                                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9b8d7c', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Actividad</label>
                                                                <NvSelect value={memberPhysical.activity_level} onChange={v => setMemberPhysical(p => ({ ...p, activity_level: v }))} options={ACTIVITY_OPTS} placeholder="—" />
                                                            </div>
                                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 2 }}>
                                                                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setEditingMemberId(null)}>Cancelar</button>
                                                                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={savingMember} onClick={() => saveMemberPhysical(member.user_id)}>{savingMember ? 'Guardando…' : 'Guardar'}</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                            {physicalSummary(member).length > 0 ? (
                                                                physicalSummary(member).map((t, i) => (
                                                                    <span key={i} style={{ background: '#FFF6EC', color: '#6B5E4F', fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 999 }}>{t}</span>
                                                                ))
                                                            ) : (
                                                                <span style={{ fontSize: '0.75rem', color: '#c9b9a6' }}>Sin datos físicos</span>
                                                            )}
                                                            <button onClick={() => startEditMember(member)} style={{ background: 'none', border: 'none', color: '#FF8A4C', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                                <PencilSimple size={13} weight="bold" /> Editar datos
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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
                            <button className="btn-secondary" onClick={() => setMode('details')} style={{ marginBottom: '20px', padding: '9px 16px', fontSize: '0.85rem', minHeight: 40 }}>
                                ← Volver
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Vista previa + subir foto */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <Avatar
                                        name={editName}
                                        src={editAvatar}
                                        size={72}
                                        style={{ border: '3px solid #fff', boxShadow: '0 6px 16px rgba(230,126,34,0.25)' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 16px' }}
                                        >
                                            <UploadSimple size={18} weight="bold" /> Subir foto
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarFile}
                                            style={{ display: 'none' }}
                                        />
                                        <small style={{ display: 'block', color: '#9b8d7c', fontSize: '0.75rem', marginTop: 6 }}>
                                            JPG o PNG desde tu dispositivo.
                                        </small>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Nombre de usuario</label>
                                    <input className="form-input" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="tu_usuario" />
                                </div>
                                <div className="form-group">
                                    <label>Nombre</label>
                                    <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input className="form-input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>O pega un enlace de imagen</label>
                                    <input className="form-input" value={editAvatar || ''} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://..." />
                                </div>

                                {/* --- CAMBIAR CONTRASEÑA (opcional) --- */}
                                <div style={{ borderTop: '1px dashed rgba(255,159,67,0.3)', paddingTop: 16, marginTop: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <Key size={18} weight="fill" color="#FF8A4C" />
                                        <span style={{ fontWeight: 800, color: '#2A2118', fontSize: '1rem' }}>Cambiar contraseña</span>
                                        <span style={{ fontSize: '0.78rem', color: '#9b8d7c' }}>opcional</span>
                                    </div>
                                    <div className="form-group">
                                        <label>Contraseña actual</label>
                                        <input className="form-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Solo si vas a cambiarla" />
                                    </div>
                                    <div className="form-group">
                                        <label>Nueva contraseña</label>
                                        <input className="form-input" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Déjalo vacío para no cambiarla" />
                                    </div>
                                </div>

                                {/* --- DATOS FÍSICOS (edad/peso/altura/sexo/actividad) --- */}
                                <div style={{ borderTop: '1px dashed rgba(255,159,67,0.3)', paddingTop: 16, marginTop: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                                        <Heartbeat size={20} weight="fill" color="#FF8A4C" />
                                        <span style={{ fontWeight: 800, color: '#2A2118', fontSize: '1rem' }}>Datos físicos</span>
                                        <span style={{ fontSize: '0.78rem', color: '#9b8d7c' }}>para porciones y métricas sanas</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label>Fecha de nacimiento {calcAge(physical.birth_date) !== null && <span style={{ color: '#FF8A4C', fontWeight: 700 }}>· {calcAge(physical.birth_date)} años</span>}</label>
                                            <NvDatePicker value={physical.birth_date} max={new Date().toISOString().split('T')[0]} onChange={v => setPhysical(p => ({ ...p, birth_date: v }))} placeholder="Fecha de nacimiento" />
                                        </div>
                                        <div className="form-group">
                                            <label>Sexo</label>
                                            <NvSelect value={physical.sex} onChange={v => setPhysical(p => ({ ...p, sex: v }))} options={SEX_OPTS} placeholder="Elegir" />
                                        </div>
                                        <div className="form-group">
                                            <label>Peso (kg)</label>
                                            <input type="text" inputMode="decimal" className="form-input" placeholder="Ej. 70" value={physical.weight_kg} onChange={e => setPhysical(p => ({ ...p, weight_kg: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Altura (cm)</label>
                                            <input type="text" inputMode="numeric" className="form-input" placeholder="Ej. 170" value={physical.height_cm} onChange={e => setPhysical(p => ({ ...p, height_cm: e.target.value.replace(/[^0-9]/g, '') }))} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>Nivel de actividad</label>
                                            <NvSelect value={physical.activity_level} onChange={v => setPhysical(p => ({ ...p, activity_level: v }))} options={ACTIVITY_OPTS} placeholder="Elegir" />
                                        </div>
                                    </div>
                                </div>

                                {/* --- PREFERENCIAS (dieta / objetivo / restricciones) --- */}
                                <div style={{ borderTop: '1px dashed rgba(255,159,67,0.3)', paddingTop: 16, marginTop: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                                        <Leaf size={20} weight="fill" color="#FF8A4C" />
                                        <span style={{ fontWeight: 800, color: '#2A2118', fontSize: '1rem' }}>Preferencias</span>
                                        <span style={{ fontSize: '0.78rem', color: '#9b8d7c' }}>para ajustar tus recetas y calorías</span>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Leaf size={15} weight="fill" color="#FF7F50" /> Tipo de alimentación</label>
                                        <div className="nv-choice-grid" role="group" aria-label="Tipo de alimentación">
                                            {DIET_OPTS.map(o => (
                                                <button type="button" key={o.value} aria-pressed={diet.diet_type === o.value}
                                                    className={`nv-choice${diet.diet_type === o.value ? ' selected' : ''}`}
                                                    onClick={() => setDiet(d => ({ ...d, diet_type: o.value }))}>
                                                    {diet.diet_type === o.value && <Check size={14} weight="bold" className="nv-choice-check" />}{o.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: 12 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Target size={15} weight="fill" color="#FF7F50" /> Objetivo</label>
                                        <div className="nv-choice-grid" role="group" aria-label="Objetivo">
                                            {GOAL_OPTS.map(o => (
                                                <button type="button" key={o.value} aria-pressed={diet.goal === o.value}
                                                    className={`nv-choice${diet.goal === o.value ? ' selected' : ''}`}
                                                    onClick={() => setDiet(d => ({ ...d, goal: o.value }))}>
                                                    {diet.goal === o.value && <Check size={14} weight="bold" className="nv-choice-check" />}{o.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: 12 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Warning size={15} weight="fill" color="#FF7F50" /> Alergias o restricciones
                                            <span style={{ color: '#9b8d7c', fontWeight: 600 }}>· opcional</span>
                                        </label>
                                        <div className="nv-choice-grid" role="group" aria-label="Alergias o restricciones">
                                            {RESTRICTION_OPTS.map(o => (
                                                <button type="button" key={o.value} aria-pressed={diet.restrictions.includes(o.value)}
                                                    className={`nv-choice${diet.restrictions.includes(o.value) ? ' selected' : ''}`}
                                                    onClick={() => toggleProfileRestriction(o.value)}>
                                                    {diet.restrictions.includes(o.value) && <Check size={14} weight="bold" className="nv-choice-check" />}{o.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    className="btn-primary"
                                    disabled={savingProfile || loadingProfile}
                                    style={{ justifyContent: 'center', marginTop: '10px' }}
                                >
                                    <FloppyDisk size={20} weight="fill" /> {loadingProfile ? 'Cargando…' : savingProfile ? 'Guardando…' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* FOOTER (Solo Versión) */}
                <div style={{ background: '#FFFAF4', padding: '15px', borderTop: '1px solid rgba(255,159,67,0.16)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#c9b9a6' }}>Neve<strong>rita</strong> v2.0</div>
                </div>
            </div>

            {/* --- MODAL: SALIR DE LA FAMILIA (con transferencia si soy creador) --- */}
            {leaveOpen && (() => {
                const needsTransfer = amCreator && otherMembers.length > 0;
                return (
                    <div className="modal-overlay" style={{ zIndex: 4000 }} onClick={() => !leaving && setLeaveOpen(false)}>
                        <div className="nv-confirm-card" onClick={e => e.stopPropagation()}>
                            <div className="nv-confirm-icon" style={{ background: '#FFFBEB', color: '#D97706' }}><SignOut size={34} weight="bold" /></div>
                            <h3 className="nv-confirm-title">Salir de «{activeFamily.name}»</h3>
                            {needsTransfer ? (
                                <>
                                    <p className="nv-confirm-text">Eres el creador. Para salir, <strong>pásale el mando</strong> a otro integrante:</p>
                                    <div style={{ margin: '4px 0 8px' }}>
                                        <NvSelect
                                            value={transferTo}
                                            onChange={(v) => setTransferTo(v)}
                                            placeholder="Elige al nuevo responsable"
                                            options={otherMembers.map(m => ({ value: String(m.user_id), label: m.name || m.email || `Usuario ${m.user_id}` }))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="nv-confirm-text">
                                    {amCreator ? 'Eres el único integrante, así que la familia quedará sin ti. ' : ''}
                                    ¿Seguro que quieres salir de esta familia? Podrás volver con un código de invitación.
                                </p>
                            )}
                            <div className="nv-confirm-actions">
                                <button className="nv-confirm-cancel" onClick={() => setLeaveOpen(false)} disabled={leaving}>Cancelar</button>
                                <button className="nv-confirm-del" onClick={handleLeave} disabled={leaving || (needsTransfer && !transferTo)}>
                                    {leaving ? 'Saliendo...' : <><SignOut size={18} weight="bold" /> {needsTransfer ? 'Transferir y salir' : 'Salir'}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default FamilyManager;