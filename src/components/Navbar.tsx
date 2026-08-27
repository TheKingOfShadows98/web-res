'use client';

/**
 * @file Navbar.tsx
 * @description Componente de barra de navegación principal.
 * @module components
 */

import React from 'react';

interface NavbarProps {
  onOpenPortal: () => void;
}

/**
 * Barra de navegación interactiva y adaptada a dispositivos móviles.
 * 
 * @param {NavbarProps} props - Propiedades del componente navbar.
 * @returns {React.ReactElement} La barra de navegación renderizada.
 */
export default function Navbar({ onOpenPortal }: NavbarProps): React.ReactElement {
  return (
    <nav className="navbar">
      <div className="navbarContainer">
        <a href="#" className="logo">
          <div className="logoIcon">RM</div>
          <span>ADESCO Residencial México</span>
        </a>

        <div className="navLinks">
          <a href="#inicio" className="navLink">Inicio</a>
          <a href="#servicios" className="navLink">Servicios</a>
          <a href="#estadisticas" className="navLink">Portal Comunal</a>
          <a href="#noticias" className="navLink">Transparencia</a>
        </div>

        <div>
          <button className="btnPrimary" onClick={onOpenPortal}>
            {/* Icono de usuario SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Acceso Vecinal
          </button>
        </div>
      </div>
    </nav>
  );
}
