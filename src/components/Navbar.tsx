'use client';

/**
 * @file Navbar.tsx
 * @description Componente de barra de navegación principal.
 * @module components
 */

import React from 'react';
import Link from 'next/link';

export default function Navbar(): React.ReactElement {
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
          <a href="#estadisticas" className="navLink">Transparencia</a>
          <a href="#noticias" className="navLink">Contacto</a>
        </div>

        <div>
          <Link href="/admin" className="btnPrimary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Icono de login / acceso */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Ingresar
          </Link>
        </div>
      </div>
    </nav>
  );
}
