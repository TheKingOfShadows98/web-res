'use client';

/**
 * @file Footer.tsx
 * @description Componente del pie de página con información de contacto y emergencias.
 * @module components
 */

import React from 'react';

/**
 * Pie de página institucional de la ADESCO.
 * 
 * @returns {React.ReactElement} El pie de página renderizado.
 */
export default function Footer(): React.ReactElement {
  return (
    <footer id="noticias" className="footer">
      <div className="footerContainer">
        <div className="footerGrid">
          <div>
            <a href="#" className="logo" style={{ marginBottom: '1rem' }}>
              <div className="logoIcon">RM</div>
              <span>Residencial México</span>
            </a>
            <p className="footerBrandDesc">
              Trabajando juntos por la seguridad, el orden y el bienestar de todas nuestras familias (Actualmente en desarrollo).
            </p>
          </div>

          <div>
            <h4 className="footerColTitle">Enlaces Rápidos</h4>
            <ul className="footerLinks">
              <li><a href="#inicio" className="footerLink">Inicio</a></li>
              <li><a href="#servicios" className="footerLink">Servicios</a></li>
              <li><a href="#estadisticas" className="footerLink">Indicadores</a></li>
              <li><a href="#" className="footerLink">Reglamento Interno</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footerColTitle">Contacto Directo</h4>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Próximamente
            </p>
          </div>

          <div>
            <h4 className="footerColTitle">Emergencias</h4>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Próximamente
            </p>
          </div>
        </div>

        <div className="footerBottom">
          <p>2026. Todos los derechos reservados.</p>
          <p>Desarrollado con compromiso Pro-Bono para el bienestar de la comunidad.</p>
        </div>
      </div>
    </footer>
  );
}
