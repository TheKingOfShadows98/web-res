'use client';

/**
 * @file CuotasLegend.tsx
 * @description Leyenda informativa que explica los códigos de colores de las casas según el ciclo quincenal.
 */

import React from 'react';
import { QuincenaEnum } from '../domain/enums';

interface CuotasLegendProps {
  activeQuincena: QuincenaEnum;
  monthName: string;
  year: number;
}

export function CuotasLegend({ activeQuincena, monthName, year }: CuotasLegendProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        backgroundColor: 'var(--background-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            boxShadow: '0 0 10px var(--primary)',
          }}
        />
        <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
          Corte Activo:{' '}
          <strong style={{ color: 'var(--primary)' }}>
            {activeQuincena === QuincenaEnum.PRIMERA ? '1ª Quincena (Días 1-14)' : '2ª Quincena (Días 15+)'}
          </strong>{' '}
          de {monthName} {year}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem' }}>
        {/* Verde */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: 'var(--success)',
            }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            <strong style={{ color: 'var(--success)' }}>Verde:</strong> Al día (Pagada)
          </span>
        </div>

        {/* Azul */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: '#3b82f6',
            }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            <strong style={{ color: '#3b82f6' }}>Azul:</strong> Otra Quincena
          </span>
        </div>

        {/* Naranja / Ámbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: 'var(--warning)',
            }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
            <strong style={{ color: 'var(--warning)' }}>Ámbar:</strong> Pendiente de Cobro
          </span>
        </div>
      </div>
    </div>
  );
}
