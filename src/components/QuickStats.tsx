'use client';

/**
 * @file QuickStats.tsx
 * @description Componente para mostrar estadísticas e indicadores rápidos del estado comunal de Residencial México.
 * @module components
 */

import React from 'react';

/**
 * Panel de estado rápido y estadísticas de transparencia del vecindario.
 * 
 * @returns {React.ReactElement} El panel de estadísticas renderizado.
 */
export default function QuickStats(): React.ReactElement {
  return (
    <section id="estadisticas" className="stats">
      <div className="statsContainer">
        <div className="sectionHeader">
          <span className="sectionLabel">Estado de la Residencial</span>
          <h2 className="sectionTitle">Transparencia en Números</h2>
        </div>

        <div className="statsGrid">
          {/* Indicador 1 */}
          <div className="statItem">
            <div className="statValue">24/7</div>
            <div className="statLabel">Vigilancia y Control</div>
            <div className="statDesc">Cámaras y patrullaje activos en portería</div>
          </div>

          {/* Indicador 2 */}
          <div className="statItem">
            <div className="statValue">94%</div>
            <div className="statLabel">Cuotas al Día</div>
            <div className="statDesc">Eficiencia en recaudación de mantenimiento</div>
          </div>

          {/* Indicador 3 */}
          <div className="statItem">
            <div className="statValue">10+</div>
            <div className="statLabel">Áreas Recreativas</div>
            <div className="statDesc">Parques y canchas deportivas mantenidas</div>
          </div>

          {/* Indicador 4 */}
          <div className="statItem">
            <div className="statValue">$12,450</div>
            <div className="statLabel">Fondo de Reserva</div>
            <div className="statDesc">Fondos asignados a mejoras de seguridad</div>
          </div>
        </div>
      </div>
    </section>
  );
}
