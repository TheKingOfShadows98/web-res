'use client';

/**
 * @file CuotaCasaCard.tsx
 * @description Tarjeta visual representativa de cada casa en el tablero de recolección de cuotas.
 */

import React from 'react';
import { ICasaCuotaView } from '../domain/entities';
import { EstadoVisualCasaEnum, QuincenaEnum } from '../domain/enums';

interface CuotaCasaCardProps {
  casa: ICasaCuotaView;
  onOpenPaymentModal: (casa: ICasaCuotaView) => void;
  canCollect: boolean;
}

export function CuotaCasaCard({
  casa,
  onOpenPaymentModal,
  canCollect,
}: CuotaCasaCardProps): React.ReactElement {
  const isAlDia = casa.estadoVisual === EstadoVisualCasaEnum.AL_DIA;
  const isOtraQuincena = casa.estadoVisual === EstadoVisualCasaEnum.OTRA_QUINCENA;
  const isPendiente = casa.estadoVisual === EstadoVisualCasaEnum.PENDIENTE;

  // Estilos y paleta según estado visual
  let borderColor = 'var(--border)';
  let bgGradient = 'var(--background-card)';
  let tagBg = 'rgba(255, 255, 255, 0.05)';
  let tagColor = 'var(--foreground-muted)';
  let statusLabel = 'Pendiente';

  if (isAlDia) {
    borderColor = 'var(--success)';
    bgGradient = 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)';
    tagBg = 'var(--success-glow)';
    tagColor = 'var(--success)';
    statusLabel = 'Al Día';
  } else if (isOtraQuincena) {
    borderColor = '#3b82f6';
    bgGradient = 'linear-gradient(145deg, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)';
    tagBg = 'rgba(59, 130, 246, 0.15)';
    tagColor = '#60a5fa';
    statusLabel = 'Otra Quincena';
  } else if (isPendiente) {
    borderColor = 'var(--warning)';
    bgGradient = 'linear-gradient(145deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)';
    tagBg = 'var(--warning-glow)';
    tagColor = 'var(--warning)';
    statusLabel = 'Por Cobrar';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        border: `1.5px solid ${borderColor}`,
        background: bgGradient,
        opacity: isAlDia ? 0.8 : 1,
        transition: 'var(--transition-normal)',
        minHeight: '190px',
      }}
    >
      {/* Encabezado de la tarjeta */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              {casa.casaNumero}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
              Pago acordado: {casa.quincenaAsignada === QuincenaEnum.PRIMERA ? '1ª Qna' : '2ª Qna'}
            </span>
          </div>

          <span
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: tagBg,
              color: tagColor,
              border: `1px solid ${borderColor}`,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Monto de Cuota */}
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>Monto Cuota: </span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>
            ${casa.cuotaMonto.toFixed(2)}
          </strong>
        </div>

        {/* Datos si ya fue pagada */}
        {isAlDia && casa.correlativoRecibo && (
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              fontSize: '0.75rem',
              color: 'var(--foreground-muted)',
              marginBottom: '0.5rem',
            }}
          >
            <div>Recibo: <strong style={{ color: 'var(--success)' }}>{casa.correlativoRecibo}</strong></div>
            {casa.fechaPago && (
              <div>Fecha: {new Date(casa.fechaPago).toLocaleDateString()}</div>
            )}
          </div>
        )}
      </div>

      {/* Botón de acción */}
      <div style={{ marginTop: '0.5rem' }}>
        {isAlDia ? (
          <button
            type="button"
            className="btnSecondary"
            disabled
            style={{
              width: '100%',
              fontSize: '0.85rem',
              padding: '0.45rem 0.75rem',
              opacity: 0.6,
              cursor: 'not-allowed',
              justifyContent: 'center',
            }}
          >
            ✓ Pagada
          </button>
        ) : (
          <button
            type="button"
            className={isPendiente ? 'btnPrimary' : 'btnSecondary'}
            disabled={!canCollect}
            onClick={() => onOpenPaymentModal(casa)}
            style={{
              width: '100%',
              fontSize: '0.85rem',
              padding: '0.5rem 0.75rem',
              justifyContent: 'center',
              backgroundColor: isOtraQuincena ? 'rgba(59, 130, 246, 0.2)' : undefined,
              borderColor: isOtraQuincena ? '#3b82f6' : undefined,
              color: isOtraQuincena ? '#93c5fd' : undefined,
            }}
          >
            {isOtraQuincena ? 'Adelantar Pago' : 'Registrar Cobro'}
          </button>
        )}
      </div>
    </div>
  );
}
