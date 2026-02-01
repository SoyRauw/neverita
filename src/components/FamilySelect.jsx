import React, { useState } from 'react';
import { Plus, MagnifyingGlass } from '@phosphor-icons/react';

const FamilySelect = ({ families, onSelectFamily, onCreateFamily }) => {
    const [viewMode, setViewMode] = useState('list'); 
    const [newFamilyName, setNewFamilyName] = useState("");

    const handleCreate = () => {
        if(newFamilyName.trim()) {
            onCreateFamily({ name: newFamilyName, role: "Admin", members: 1 });
        }
    };

    return (
        <div className="auth-container" style={{flexDirection: 'column'}}>
            <div className="auth-logo" style={{fontSize:'2rem'}}>Neve<span>rita</span></div>
            
            {viewMode === 'list' && (
                <>
                    <h2 style={{color: 'var(--text-dark)'}}>
                        {families.length > 0 ? "¿A qué nevera quieres entrar?" : "¡Bienvenido! Empieza creando tu familia"}
                    </h2>
                    
                    {families.length === 0 && (
                        <p style={{color: '#666', marginTop:'10px'}}>Aún no perteneces a ninguna familia.</p>
                    )}

                    <div className="family-grid">
                        {/* Renderizamos las familias que vienen por props */}
                        {families.map(fam => (
                            <div key={fam.id} className="family-card-select" onClick={() => onSelectFamily(fam)}>
                                <div className="avatar-large" style={{background: '#ffe0b2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem'}}>
                                    {fam.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{fontWeight:800}}>{fam.name}</h3>
                                    <span className="badge warning">{fam.role}</span>
                                </div>
                            </div>
                        ))}

                        {/* Botón Crear Nueva */}
                        <div className="family-card-select add-new" onClick={() => setViewMode('create')}>
                            <div style={{background:'#eee', borderRadius:'50%', width:80, height:80, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <Plus size={32} color="#999"/>
                            </div>
                            <h3>Crear Nueva Familia</h3>
                        </div>

                        {/* Botón Unirse */}
                        <div className="family-card-select add-new" onClick={() => setViewMode('join')}>
                            <div style={{background:'#eee', borderRadius:'50%', width:80, height:80, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <MagnifyingGlass size={32} color="#999"/>
                            </div>
                            <h3>Unirse con Código</h3>
                        </div>
                    </div>
                </>
            )}

            {viewMode === 'create' && (
                <div className="auth-card">
                    <h2>🏠 Nueva Familia</h2>
                    <p style={{marginBottom:'20px', color:'#666'}}>Tú serás el administrador.</p>
                    <input 
                        className="form-input" 
                        placeholder="Nombre de la familia (Ej. Los Pérez)" 
                        style={{marginBottom:10}} 
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                    />
                    
                    <div style={{display:'flex', gap:10, marginTop:20}}>
                        <button className="btn-secondary" style={{flex:1}} onClick={() => setViewMode('list')}>Cancelar</button>
                        <button className="btn-primary" style={{flex:1, justifyContent:'center'}} onClick={handleCreate}>Crear</button>
                    </div>
                </div>
            )}

            {viewMode === 'join' && (
                 <div className="auth-card">
                    <h2>🔑 Unirse a Familia</h2>
                    <p>Funcionalidad pendiente de Backend</p>
                    <button className="btn-secondary" onClick={() => setViewMode('list')}>Volver</button>
                 </div>
            )}
        </div>
    );
};

export default FamilySelect;
