'use client';

/**
 * @file Hero.tsx
 * @description Componente de presentación Hero con llamado a la acción principal.
 * @module components
 */

import React from 'react';
import Link from 'next/link';

export default function Hero(): React.ReactElement {
  return (
    <header id="inicio" className="hero">
      <div className="heroContainer">
        <div className="badge">
          <span className="badgeDot"></span>
          Sistema Electronico 2026
        </div>
        
        <h1 className="heroTitle">
          Comunidad y Trnasparencia
        </h1>
        
        <p className="heroSubtitle">
          Bienvenido al Portal de la Residencial México.
           - <strong>Actualmente en desarrollo</strong> -.
        </p>
        
        <div className="heroActions">
          <Link href="/finanzas" className="btnPrimary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Ver Finanzas
          </Link>
          
          <a href="#servicios" className="btnSecondary">
            Servicios Comunitarios
          </a>
        </div>
      </div>
    </header>
  );
}
