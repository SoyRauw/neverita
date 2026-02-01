import React, { useState, useEffect } from 'react';
import { X, UserCircle, Users, Plus, SignOut, CaretRight, User, FloppyDisk } from '@phosphor-icons/react';

const FamilyManager = ({ 
    activeFamily, 
    userFamilies, 
    currentUser,   // Recibimos datos del usuario
    onUpdateUser,  // Recibimos función para actualizar
    onClose, 
    onSwitchFamily, 
    onCreateNew, 
    onLogout 
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
        // Volver a la vista de detalles o mostrar feedback visual
        setMode('details'); 
    };

    return (
        <div className="modal-overlay" style={{backdropFilter: 'blur(4px)'}} onClick={onClose}>
            <div className="auth-card" onClick={e => e.stopPropagation()} style={{ width: '450px', padding: '0', overflow: 'hidden', textAlign:'left', borderRadius:'16px' }}>
                
                {/* ENCABEZADO */}
                <div style={{
                    background: 'white', padding: '1.5rem', borderBottom: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div>
                        <h2 style={{margin:0, fontSize:'1.4rem', color:'#333'}}>
                            {mode === 'profile' ? 'Editar Perfil' : activeFamily.name}
                        </h2>
                        {mode !== 'profile' && (
                            <div style={{display:'flex', alignItems:'center', gap:'6px', marginTop:'4px'}}>
                                <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#4CAF50'}}></span>
                                <span style={{fontSize:'0.85rem', color:'#666'}}>Tu rol: <strong>{activeFamily.role}</strong></span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{background:'#f5f5f5', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#666'}}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{padding: '0'}}>
                    {/* MENU DE PESTAÑAS */}
                    <div style={{padding:'1rem 1.5rem 0 1.5rem'}}>
                        <div style={{background:'#f5f5f5', borderRadius:'10px', padding:'4px', display:'flex'}}>
                            {['details', 'switch', 'profile'].map((m) => (
                                <button 
                                    key={m}
                                    onClick={() => setMode(m)}
                                    style={{
                                        flex:1, border:'none', padding:'8px', borderRadius:'8px', 
                                        background: mode === m ? 'white' : 'transparent',
                                        boxShadow: mode === m ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                                        fontWeight: mode===m?600:500, color: mode===m?'#333':'#999', cursor:'pointer', fontSize:'0.9rem', transition:'all 0.2s',
                                        textTransform: 'capitalize'
                                    }}>
                                    {m === 'details' ? 'Miembros' : m === 'switch' ? 'Familias' : 'Perfil'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{padding: '1.5rem', maxHeight:'400px', overflowY:'auto'}}>
                        
                        {/* MODO 1: LISTA DE MIEMBROS */}
                        {mode === 'details' && (
                            <div className="animate-fade-in">
                                <h4 style={{fontSize:'0.8rem', textTransform:'uppercase', color:'#999', marginBottom:'10px', letterSpacing:'1px'}}>En esta casa</h4>
                                <ul style={{listStyle:'none', padding:0, margin:0}}>
                                    {/* TU USUARIO (Ahora usa los datos reales) */}
                                    <li style={{display:'flex', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f5f5f5'}}>
                                        <img src={currentUser.avatar} alt="Tú" style={{width:42, height:42, borderRadius:'50%', marginRight:'15px', objectFit:'cover'}} />
                                        <div style={{flex:1}}>
                                            <div style={{fontWeight:'600', color:'#333'}}>{currentUser.name} (Tú)</div>
                                            <div style={{fontSize:'0.8rem', color:'#888'}}>{activeFamily.role}</div>
                                        </div>
                                        <button onClick={() => setMode('profile')} style={{fontSize:'0.75rem', color:'var(--color-primary)', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Editar</button>
                                    </li>
                                    {/* MIEMBROS SIMULADOS */}
                                    {[...Array(activeFamily.members - 1)].map((_, i) => (
                                        <li key={i} style={{display:'flex', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f5f5f5'}}>
                                            <div style={{width:42, height:42, borderRadius:'50%', background:'#E3F2FD', color:'#2196F3', display:'flex', alignItems:'center', justifyContent:'center', marginRight:'15px'}}>
                                                <UserCircle size={24} weight="fill"/>
                                            </div>
                                            <div>
                                                <div style={{fontWeight:'500', color:'#333'}}>Familiar {i+1}</div>
                                                <div style={{fontSize:'0.8rem', color:'#888'}}>Miembro</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* MODO 2: CAMBIAR FAMILIA */}
                        {mode === 'switch' && (
                            <div className="animate-fade-in">
                                <h4 style={{fontSize:'0.8rem', textTransform:'uppercase', color:'#999', marginBottom:'10px', letterSpacing:'1px'}}>Tus Neveras</h4>
                                <div style={{display:'grid', gap:'8px'}}>
                                    {userFamilies.map(fam => (
                                        <div key={fam.id} onClick={() => fam.id !== activeFamily.id && onSwitchFamily(fam)}
                                            style={{
                                                padding:'12px 15px', borderRadius:'10px',
                                                cursor: fam.id === activeFamily.id ? 'default' : 'pointer',
                                                display:'flex', alignItems:'center', gap:'15px',
                                                background: fam.id === activeFamily.id ? '#FFF3E0' : 'white',
                                                border: fam.id === activeFamily.id ? '1px solid #FF9F43' : '1px solid #eee',
                                            }}>
                                            <div style={{width:36, height:36, borderRadius:'8px', background: fam.id === activeFamily.id ? '#FF9F43' : '#eee', color: fam.id === activeFamily.id ? 'white' : '#666', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                                                {fam.name.charAt(0)}
                                            </div>
                                            <div style={{flex:1}}>
                                                <div style={{fontWeight:'600', fontSize:'0.95rem', color: fam.id === activeFamily.id ? '#d35400' : '#333'}}>{fam.name}</div>
                                                <div style={{fontSize:'0.75rem', color:'#666'}}>{fam.role}</div>
                                            </div>
                                            {fam.id === activeFamily.id && <div style={{width:8, height:8, borderRadius:'50%', background:'#FF9F43'}}></div>}
                                        </div>
                                    ))}
                                    <button onClick={onCreateNew} className="hover-card" style={{padding:'12px', border:'1px dashed #ccc', borderRadius:'10px', background:'transparent', color:'#666', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'10px'}}>
                                        <Plus size={18} /> Crear nueva familia
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* MODO 3: PERFIL DE USUARIO */}
                        {mode === 'profile' && (
                            <div className="animate-fade-in">
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'20px'}}>
                                    <img src={editAvatar} alt="Preview" style={{width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'3px solid #f5f5f5', marginBottom:'10px'}} />
                                    <p style={{fontSize:'0.8rem', color:'#999'}}>Vista previa de tu foto</p>
                                </div>

                                <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                    <div>
                                        <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>Tu Nombre</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>Email</label>
                                        <input 
                                            type="email" 
                                            className="form-input" 
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>URL de Foto (Avatar)</label>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            placeholder="https://..."
                                            value={editAvatar}
                                            onChange={(e) => setEditAvatar(e.target.value)}
                                            style={{fontSize:'0.8rem'}}
                                        />
                                        <p style={{fontSize:'0.75rem', color:'#999', marginTop:'5px'}}>Pega un link de imagen (Ej. de Google o Unsplash).</p>
                                    </div>

                                    <button 
                                        onClick={handleSaveProfile}
                                        className="btn-primary" 
                                        style={{justifyContent:'center', marginTop:'10px'}}
                                    >
                                        <FloppyDisk size={20} weight="fill" /> Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* FOOTER */}
                <div style={{background:'#f9f9f9', padding:'1rem 1.5rem', borderTop:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontSize:'0.75rem', color:'#bbb'}}>Neve<strong>rita</strong> v1.0</div>
                    <button onClick={onLogout} style={{background:'white', border:'1px solid #ffcdd2', padding:'6px 12px', borderRadius:'6px', color:'#d32f2f', fontWeight:'600', fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}>
                        <SignOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FamilyManager;