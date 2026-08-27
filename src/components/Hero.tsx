'use client';

/**
 * @file Hero.tsx
 * @description Componente de presentación Hero con llamado a la acción principal.
 * @module components
 */

import React from 'react';

interface HeroProps {
  onOpenPortal: () => void;
}

/**
 * Hero Banner principal de la página web con animaciones y estilos premium.
 * 
 * @param {HeroProps} props - Propiedades del componente hero.
 * @returns {React.ReactElement} El banner hero renderizado.
 */
export default function Hero({ onOpenPortal }: HeroProps): React.ReactElement {
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
          Simplifica tus pagos, genera pases QR de visitantes instantáneos, reserva áreas comunes y mantente informado en tiempo real.
        </p>
        
        <div className="heroActions">
          <button className="btnPrimary" onClick={onOpenPortal}>
            {/* Icono de llave/acceso SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Ingresar al Portal Vecinal
          </button>
          
          <a href="#servicios" className="btnSecondary">
            Explorar Servicios
          </a>
        </div>
      </div>
    </header>
  );
}
