'use client';

/**
 * @file CuotasFilterBar.tsx
 * @description Barra de filtrado por Zona, Subdivisión (Edificio/Pasaje/Calle), Quincena y búsqueda por casa.
 */

import React from 'react';
import { IZona, ISubdivision } from '../domain/entities';
import { QuincenaEnum } from '../domain/enums';

interface CuotasFilterBarProps {
  zonas: IZona[];
  subdivisiones: ISubdivision[];
  selectedZonaId: string;
  selectedSubdivisionId: string;
  selectedQuincena: QuincenaEnum;
  searchCasa: string;
  onZonaChange: (zonaId: string) => void;
  onSubdivisionChange: (subdivisionId: string) => void;
  onQuincenaChange: (quincena: QuincenaEnum) => void;
  onSearchChange: (search: string) => void;
  loading?: boolean;
}

export function CuotasFilterBar({
  zonas,
  subdivisiones,
  selectedZonaId,
  selectedSubdivisionId,
  selectedQuincena,
  searchCasa,
  onZonaChange,
  onSubdivisionChange,
  onQuincenaChange,
  onSearchChange,
  loading = false,
}: CuotasFilterBarProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        padding: '1.25rem',
        backgroundColor: 'var(--background-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}
    >
      {/* Selector de Zona */}
      <div className="formGroup" style={{ margin: 0 }}>
        <label className="formLabel" htmlFor="zonaSelect">
          Zona
        </label>
        <select
          id="zonaSelect"
          className="formInput"
          value={selectedZonaId}
          disabled={loading || zonas.length === 0}
          onChange={(e) => onZonaChange(e.target.value)}
        >
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Subdivisión (Edificio / Pasaje / Calle) */}
      <div className="formGroup" style={{ margin: 0 }}>
        <label className="formLabel" htmlFor="subdivisionSelect">
          Edificio / Pasaje / Calle
        </label>
        <select
          id="subdivisionSelect"
          className="formInput"
          value={selectedSubdivisionId}
          disabled={loading || subdivisiones.length === 0}
          onChange={(e) => onSubdivisionChange(e.target.value)}
        >
          {subdivisiones.map((s) => (
            <option key={s.id} value={s.id}>
              {s.tipo}: {s.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Quincena Evaluada */}
      <div className="formGroup" style={{ margin: 0 }}>
        <label className="formLabel" htmlFor="quincenaSelect">
          Quincena de Cobro
        </label>
        <select
          id="quincenaSelect"
          className="formInput"
          value={selectedQuincena}
          disabled={loading}
          onChange={(e) => onQuincenaChange(e.target.value as QuincenaEnum)}
        >
          <option value={QuincenaEnum.PRIMERA}>1ª Quincena (Inicio de mes)</option>
          <option value={QuincenaEnum.SEGUNDA}>2ª Quincena (Mitad de mes)</option>
        </select>
      </div>

      {/* Búsqueda rápida por número de casa */}
      <div className="formGroup" style={{ margin: 0 }}>
        <label className="formLabel" htmlFor="searchCasaInput">
          Buscar Casa / Apartamento
        </label>
        <input
          id="searchCasaInput"
          type="text"
          className="formInput"
          placeholder="Ej. Casa 12, Apto 3..."
          value={searchCasa}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
