'use client';

/**
 * @file Hero.tsx
 * @description Componente de presentación Hero con llamado a la acción principal.
 * @module components
 */

import React from 'react';

export default function Hero(): React.ReactElement {
  return (
    <header id="inicio" className="hero">
      <div className="heroContainer">
        <div className="badge">
          <span className="badgeDot"></span>
          Sistema Oficial ADESCO 2026
        </div>
        
        <h1 className="heroTitle">
          Tu Comunidad Conectada, Segura y Transparente
        </h1>
        
        <p className="heroSubtitle">
          Bienvenido al Portal de la Asociación de Desarrollo Comunal de Residencial México.
          Trabajando juntos por el orden, la transparencia financiera y el bienestar de todas nuestras familias.
        </p>
        
        <div className="heroActions">
          <a href="#estadisticas" className="btnPrimary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Ver Transparencia
          </a>
          
          <a href="#servicios" className="btnSecondary">
            Servicios Comunitarios
          </a>
        </div>
      </div>
    </header>
  );
}
