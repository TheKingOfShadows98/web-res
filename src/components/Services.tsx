'use client';

/**
 * @file Services.tsx
 * @description Componente que renderiza la cuadrícula de servicios y módulos del portal de ADESCO.
 * @module components
 */

import React from 'react';

interface ServicesProps {
  onOpenPortal: () => void;
}

/**
 * Sección de servicios con tarjetas interactivas.
 * 
 * @param {ServicesProps} props - Propiedades del componente.
 * @returns {React.ReactElement} La cuadrícula de servicios renderizada.
 */
export default function Services({ onOpenPortal }: ServicesProps): React.ReactElement {
  return (
    <section id="servicios" className="services">
      <div className="sectionHeader">
        <span className="sectionLabel">Gestión y Autogestión</span>
        <h2 className="sectionTitle">Servicios Disponibles para Residentes</h2>
      </div>

      <div className="servicesGrid">
        {/* Tarjeta 1: Seguridad */}
        <div className="card" onClick={onOpenPortal}>
          <div className="cardIcon">
            {/* Icono de escudo SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="cardTitle">Seguridad y Accesos</h3>
          <p className="cardDesc">
            Genera pases QR rápidos para tus visitas, registra vehículos autorizados y reporta incidencias directamente a la caseta principal en tiempo real.
          </p>
          <span className="cardLink">
            Generar Pase QR
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>

        {/* Tarjeta 2: Recibos / Pagos */}
        <div className="card" onClick={onOpenPortal}>
          <div className="cardIcon">
            {/* Icono de factura/recibo SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <rect x="3" y="4" width="18" height="18" rx="2" fill="none" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="cardTitle">Estado de Cuenta y Recibos</h3>
          <p className="cardDesc">
            Consulta tus recibos de mantenimiento mensual, realiza pagos en línea mediante transferencia o Bitcoin y descarga comprobantes autorizados.
          </p>
          <span className="cardLink">
            Consultar Recibos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>

        {/* Tarjeta 3: Reservas */}
        <div className="card" onClick={onOpenPortal}>
          <div className="cardIcon">
            {/* Icono de calendario/casa SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 className="cardTitle">Reserva de Áreas Comunes</h3>
          <p className="cardDesc">
            Verifica la disponibilidad de la Casa Comunal, canchas deportivas y zona de barbacoas. Reserva de forma automatizada y transparente.
          </p>
          <span className="cardLink">
            Reservar Espacio
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>

        {/* Tarjeta 4: Comunicados */}
        <div className="card" onClick={onOpenPortal}>
          <div className="cardIcon">
            {/* Icono de megáfono SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3 className="cardTitle">Noticias y Transparencia</h3>
          <p className="cardDesc">
            Consulta las actas de las asambleas generales, estados financieros comunitarios auditados e informes sobre proyectos de infraestructura en desarrollo.
          </p>
          <span className="cardLink">
            Ver Documentos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
