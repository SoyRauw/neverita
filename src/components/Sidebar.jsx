import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarCheck, CookingPot, Package, ShoppingCart, Gear, SignOut } from '@phosphor-icons/react';
import { inventoryService } from '../api';

const Sidebar = ({ activeFamily, onOpenManager, onLogout }) => {
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    if (!activeFamily) return;

    const checkExpiring = async () => {
      try {
        const inv = await inventoryService.getAll();
        const filtered = inv.filter(i => i.family_id === activeFamily.family_id || i.family_id === activeFamily.id);
        
        let count = 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filtered.forEach(item => {
          if (item.expiration_date) {
            const expDate = new Date(item.expiration_date);
            const diffTime = expDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 3) {
              count++;
            }
          }
        });

        setExpiringCount(count);
      } catch (err) {
        console.error('Error checking expiring items:', err);
      }
    };

    checkExpiring();
  }, [activeFamily]);

  return (
    <aside className="sidebar-modern">
      {/* 1. LOGO */}
      <div className="sidebar-logo">
        <div className="icon-badge">
            <CookingPot size={24} color="white" weight="fill" />
        </div>
        <h2>Neve<span>rita.</span></h2>
      </div>
      
      {/* 2. MENÚ DE NAVEGACIÓN */}
      <nav className="sidebar-menu">
        <span className="menu-label">MENU PRINCIPAL</span>
        
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <CalendarCheck size={22} weight="bold" /> 
            <span>Plan Semanal</span>
        </NavLink>

        <NavLink to="/recipes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <CookingPot size={22} weight="bold" /> 
            <span>Recetas</span>
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Package size={22} weight="bold" /> 
            <span>Inventario</span>
            {expiringCount > 0 && <div className="nav-badge" title={`${expiringCount} ítems por vencer o vencidos`}>{expiringCount}</div>}
        </NavLink>

        <NavLink to="/shopping-list" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <ShoppingCart size={22} weight="bold" /> 
            <span>Compras</span>
        </NavLink>
      </nav>

      {/* 3. FOOTER (Familia + Logout) */}
      <div className="sidebar-footer">
          {/* Widget de Familia (Abre el Manager) */}
          {activeFamily && (
            <div className="family-widget" onClick={onOpenManager} title="Gestionar familia">
                <div className="family-avatar">
                    {activeFamily.name.charAt(0).toUpperCase()}
                </div>
                <div className="family-info">
                    <span className="label">Tu Espacio</span>
                    <h4>{activeFamily.name}</h4>
                </div>
                <div className="family-settings">
                    <Gear size={20} weight="fill" />
                </div>
            </div>
          )}

          {/* Botón de Cerrar Sesión (Conectado a App.jsx) */}
          <button className="btn-sidebar-logout" onClick={onLogout}>
              <SignOut size={20} weight="bold" />
              <span>Cerrar Sesión</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;