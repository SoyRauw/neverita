import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    CalendarCheck, CookingPot, Package, ShoppingCart, User 
} from '@phosphor-icons/react';

const MobileNav = ({ onOpenManager }) => {
  return (
    <nav className="mobile-nav">
      <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <CalendarCheck size={26} weight="fill" />
        <span>Plan</span>
      </NavLink>

      <NavLink to="/recipes" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <CookingPot size={26} weight="fill" />
        <span>Recetas</span>
      </NavLink>

      <NavLink to="/inventory" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <Package size={26} weight="fill" />
        <span>Stock</span>
      </NavLink>

      <NavLink to="/shopping-list" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <ShoppingCart size={26} weight="fill" />
        <span>Lista</span>
      </NavLink>

      <button className="mobile-nav-item" onClick={onOpenManager} style={{border:'none', background:'none'}}>
        <User size={26} weight="fill" />
        <span>Perfil</span>
      </button>
    </nav>
  );
};

export default MobileNav;