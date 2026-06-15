import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    CalendarCheck, CookingPot, Package, ShoppingCart, ChartPieSlice, User
} from '@phosphor-icons/react';

const MobileNav = ({ onOpenManager }) => {
  return (
    <nav className="mobile-nav mobile-nav-6">
      <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <CalendarCheck size={24} weight="fill" />
        <span>Plan</span>
      </NavLink>

      <NavLink to="/recipes" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <CookingPot size={24} weight="fill" />
        <span>Recetas</span>
      </NavLink>

      <NavLink to="/inventory" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <Package size={24} weight="fill" />
        <span>Stock</span>
      </NavLink>

      <NavLink to="/shopping-list" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <ShoppingCart size={24} weight="fill" />
        <span>Lista</span>
      </NavLink>

      <NavLink to="/stats" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <ChartPieSlice size={24} weight="fill" />
        <span>Resumen</span>
      </NavLink>

      <button className="mobile-nav-item" onClick={onOpenManager} style={{border:'none', background:'none'}}>
        <User size={24} weight="fill" />
        <span>Perfil</span>
      </button>
    </nav>
  );
};

export default MobileNav;