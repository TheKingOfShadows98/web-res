'use client';

/**
 * @file Services.tsx
 * @description Componente que renderiza la cuadrícula de servicios y módulos del portal de ADESCO.
 * @module components
 */

import React from 'react';
import UnderConstruction from './UnderConstruction';

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
        <UnderConstruction
        />
       
      </div>
    </section>
  );
}
