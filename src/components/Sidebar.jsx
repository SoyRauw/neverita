import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarCheck, CookingPot, Package, ShoppingCart, Gear } from '@phosphor-icons/react';

const Sidebar = ({ activeFamily, onOpenManager }) => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <h2>Neve<span>rita</span></h2>
      </div>
      
      <nav className="menu">
        <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
            <CalendarCheck size={24} weight="bold" /> Plan Semanal
        </NavLink>

        <NavLink to="/recipes" className={({ isActive }) => isActive ? "active" : ""}>
            <CookingPot size={24} weight="bold" /> Recetas
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => isActive ? "active" : ""}>
            <Package size={24} weight="bold" /> Inventario 
            <span className="badge warning">2 exp</span>
        </NavLink>

        <NavLink to="/shopping-list" className={({ isActive }) => isActive ? "active" : ""}>
            <ShoppingCart size={24} weight="bold" /> Lista de Compras
        </NavLink>
      </nav>

      {/* TARJETA DE FAMILIA INTERACTIVA */}
      {activeFamily && (
        <div 
            className="family-card" 
            onClick={onOpenManager} 
            style={{cursor: 'pointer', transition: 'transform 0.2s', position: 'relative'}}
            title="Click para gestionar familia o cambiar"
        >
            <div style={{position:'absolute', right:15, top:20, opacity:0.3}}>
                <Gear size={20} />
            </div>
            <h4>Familia Activa:</h4>
            <p style={{marginBottom: '4px'}}>{activeFamily.name}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{fontSize: '0.8rem', color: '#666'}}>Rol: <strong>{activeFamily.role}</strong></span>
            </div>
            <div style={{fontSize:'0.7rem', color:'#FF9F43', marginTop:'8px', fontWeight:'bold'}}>
                Cambiar / Gestionar
            </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;