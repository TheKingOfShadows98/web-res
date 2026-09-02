'use client';

/**
 * @file Services.tsx
 * @description Componente que renderiza la cuadrícula de servicios y módulos del portal de ADESCO.
 * @module components
 */

import React from 'react';

export default function Services(): React.ReactElement {
  return (
    <section id="servicios" className="services">
      <div className="sectionHeader">
        <span className="sectionLabel">Gestión y Autogestión</span>
        <h2 className="sectionTitle">Servicios para Residentes</h2>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 2rem',
        background: 'var(--background-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 1.25rem',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.75rem' }}>
          Próximamente
        </h3>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Los módulos de autogestión de cuotas, reservas de espacios y pases para residentes se encuentran en desarrollo activo.
        </p>
      </div>
    </section>
  );
}
