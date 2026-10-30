'use client';

/**
 * @file ModalRegistrarPago.tsx
 * @description Modal de recolección de cuota con captura y contraste obligatorio de correlativo de recibo.
 */

import React, { useState } from 'react';
import { ICasaCuotaView } from '../domain/entities';
import { QuincenaEnum } from '../domain/enums';

interface ModalRegistrarPagoProps {
  casa: ICasaCuotaView | null;
  year: number;
  mes: number;
  quincena: QuincenaEnum;
  onClose: () => void;
  onSubmit: (params: {
    casaId: string;
    casaNumero: string;
    subdivisionNombre: string;
    correlativoRecibo: string;
    monto: number;
    metodoPago: string;
    observaciones: string;
  }) => Promise<void>;
}

export function ModalRegistrarPago({
  casa,
  year,
  mes,
  quincena,
  onClose,
  onSubmit,
}: ModalRegistrarPagoProps): React.ReactElement | null {
  const [correlativo, setCorrelativo] = useState('');
  const [monto, setMonto] = useState<number>(casa ? casa.cuotaMonto : 10);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!casa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correlativo.trim()) {
      setErrorMessage('Debes ingresar el correlativo del recibo para contrastar el cobro.');
      return;
    }
    if (monto <= 0) {
      setErrorMessage('El monto de la cuota debe ser mayor a 0.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await onSubmit({
        casaId: casa.casaId,
        casaNumero: casa.casaNumero,
        subdivisionNombre: casa.subdivisionNombre,
        correlativoRecibo: correlativo.trim(),
        monto: Number(monto),
        metodoPago,
        observaciones: observaciones.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el cobro.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0b1320',
          border: '1px solid var(--border-hover)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Registrar Cobro de Cuota
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
              {casa.casaNumero} • {casa.subdivisionNombre || 'Subdivisión'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--foreground-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.85rem',
            color: 'var(--foreground)',
            marginBottom: '1.5rem',
          }}
        >
          Período a saldar:{' '}
          <strong style={{ color: 'var(--primary)' }}>
            {quincena === QuincenaEnum.PRIMERA ? '1ª Quincena' : '2ª Quincena'} de {mes}/{year}
          </strong>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Correlativo del Recibo (Obligatorio) */}
          <div className="formGroup" style={{ marginBottom: '1rem' }}>
            <label className="formLabel" htmlFor="correlativoInput">
              Correlativo del Recibo Físico / Digital <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="correlativoInput"
              type="text"
              className="formInput"
              placeholder="Ej. REC-2026-0045"
              value={correlativo}
              onChange={(e) => setCorrelativo(e.target.value)}
              required
              autoFocus
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', marginTop: '0.25rem', display: 'block' }}>
              Debe contrastar con el número único impreso en el talonario o comprobante emitido.
            </span>
          </div>

          {/* Monto y Método de Pago */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="formGroup" style={{ margin: 0 }}>
              <label className="formLabel" htmlFor="montoInput">
                Monto Cobrado ($)
              </label>
              <input
                id="montoInput"
                type="number"
                step="0.01"
                min="0.01"
                className="formInput"
                value={monto}
                onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="formGroup" style={{ margin: 0 }}>
              <label className="formLabel" htmlFor="metodoPagoSelect">
                Método de Pago
              </label>
              <select
                id="metodoPagoSelect"
                className="formInput"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA_BANCARIA">Transferencia</option>
                <option value="CHEQUE">Cheque</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="BITCOIN">Bitcoin</option>
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div className="formGroup" style={{ marginBottom: '1.5rem' }}>
            <label className="formLabel" htmlFor="observacionesInput">
              Observaciones (Opcional)
            </label>
            <input
              id="observacionesInput"
              type="text"
              className="formInput"
              placeholder="Ej. Vecino entregó cuota adelantada..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btnSecondary"
              disabled={loading}
              onClick={onClose}
              style={{ padding: '0.6rem 1.25rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btnPrimary"
              disabled={loading}
              style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? 'Registrando...' : 'Confirmar e Insertar en Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
