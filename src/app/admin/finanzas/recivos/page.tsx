'use client';

/**
 * @file page.tsx
 * @description Página de administración de finanzas para el registro de ingresos y egresos.
 * @module app/admin/finanzas/recivos
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { IIngreso, IEgreso } from '@/app/entities/Recivos';

export default function RecivosPage(): React.ReactElement {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'ingreso' | 'egreso'>('ingreso');

  // Estado del formulario de Ingresos
  const [ingresoForm, setIngresoForm] = useState<Omit<IIngreso, 'id'>>({
    concepto: '',
    cantidad: 0,
    comprobante: '',
    fecha: '',
  });

  // Estado del formulario de Egresos
  const [egresoForm, setEgresoForm] = useState<Omit<IEgreso, 'id'>>({
    concepto: '',
    cantidad: 0,
    comprobante: '',
    fecha: '',
  });

  // Estados comunes de UI
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Establecer fecha por defecto al cargar el componente
  useEffect(() => {
    const now = new Date();
    // Formato YYYY-MM-DDThh:mm para input datetime-local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    setIngresoForm((prev) => ({ ...prev, fecha: formattedDateTime }));
    setEgresoForm((prev) => ({ ...prev, fecha: formattedDateTime }));
  }, [activeTab]);

  // Manejar el cambio en los inputs del formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    formType: 'ingreso' | 'egreso'
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === 'cantidad' ? parseFloat(value) || 0 : value;

    if (formType === 'ingreso') {
      setIngresoForm((prev) => ({ ...prev, [name]: parsedValue }));
    } else {
      setEgresoForm((prev) => ({ ...prev, [name]: parsedValue }));
    }
  };

  // Enviar formulario a Supabase
  const handleSubmit = async (e: React.FormEvent, formType: 'ingreso' | 'egreso') => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const data = formType === 'ingreso' ? ingresoForm : egresoForm;

    // Validación básica
    if (!data.concepto.trim()) {
      setMessage({ type: 'error', text: 'El concepto es obligatorio.' });
      setLoading(false);
      return;
    }
    if (data.cantidad <= 0) {
      setMessage({ type: 'error', text: 'La cantidad debe ser mayor que cero.' });
      setLoading(false);
      return;
    }

    try {
      const dbTable = formType === 'ingreso' ? 'ingreso' : 'egreso';
      
      // Preparar payload con fecha o dejar que la base de datos use el default si está vacía
      const payload = {
        concepto: data.concepto,
        cantidad: data.cantidad,
        comprobante: data.comprobante || null,
        fecha: data.fecha ? new Date(data.fecha as string).toISOString() : new Date().toISOString(),
      };

      const { error } = await supabase.from(dbTable).insert([payload]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `¡${formType === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado con éxito!`,
      });

      // Limpiar formulario excepto la fecha que se reinicia a ahora
      const now = new Date().toISOString().substring(0, 16);
      if (formType === 'ingreso') {
        setIngresoForm({ concepto: '', cantidad: 0, comprobante: '', fecha: now });
      } else {
        setEgresoForm({ concepto: '', cantidad: 0, comprobante: '', fecha: now });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: `Error al registrar en Supabase: ${err.message || 'Error desconocido'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminContainer" style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver al Inicio
        </Link>
        <h2 className="heroTitle" style={{ fontSize: '2rem', marginBottom: '0.5rem', textCombineUpright: 'none' }}>
          Registro de Finanzas
        </h2>
        <p className="heroSubtitle" style={{ fontSize: '0.95rem', margin: 0 }}>
          Módulo administrativo para el registro rápido de ingresos y egresos de la Residencial México.
        </p>
      </div>

      {/* Tabs / Selectores de Formulario */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button
          className={activeTab === 'ingreso' ? 'btnPrimary' : 'btnSecondary'}
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => {
            setActiveTab('ingreso');
            setMessage(null);
          }}
        >
          Registrar Ingreso
        </button>
        <button
          className={activeTab === 'egreso' ? 'btnPrimary' : 'btnSecondary'}
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => {
            setActiveTab('egreso');
            setMessage(null);
          }}
        >
          Registrar Egreso
        </button>
      </div>

      {/* Mensajes de feedback */}
      {message && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.9rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Formulario Dinámico */}
      <div className="card" style={{ cursor: 'default' }}>
        <h3 className="cardTitle" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          Formulario de {activeTab === 'ingreso' ? 'Ingreso' : 'Egreso'}
        </h3>

        <form onSubmit={(e) => handleSubmit(e, activeTab)}>
          <div className="formGroup">
            <label className="formLabel" htmlFor="concepto">Concepto / Descripción</label>
            <input
              id="concepto"
              name="concepto"
              type="text"
              className="formInput"
              placeholder="Ej. Pago de mantenimiento, Compra de insumos..."
              value={activeTab === 'ingreso' ? ingresoForm.concepto : egresoForm.concepto}
              onChange={(e) => handleInputChange(e, activeTab)}
              required
            />
          </div>

          <div className="formGroup">
            <label className="formLabel" htmlFor="cantidad">Cantidad ($)</label>
            <input
              id="cantidad"
              name="cantidad"
              type="number"
              step="0.01"
              className="formInput"
              placeholder="0.00"
              value={(activeTab === 'ingreso' ? ingresoForm.cantidad : egresoForm.cantidad) || ''}
              onChange={(e) => handleInputChange(e, activeTab)}
              required
            />
          </div>

          <div className="formGroup">
            <label className="formLabel" htmlFor="comprobante">URL del Comprobante (Opcional)</label>
            <input
              id="comprobante"
              name="comprobante"
              type="url"
              className="formInput"
              placeholder="https://ejemplo.com/comprobante.pdf"
              value={activeTab === 'ingreso' ? ingresoForm.comprobante : egresoForm.comprobante}
              onChange={(e) => handleInputChange(e, activeTab)}
            />
          </div>

          <div className="formGroup">
            <label className="formLabel" htmlFor="fecha">Fecha y Hora</label>
            <input
              id="fecha"
              name="fecha"
              type="datetime-local"
              className="formInput"
              value={activeTab === 'ingreso' ? (ingresoForm.fecha as string) : (egresoForm.fecha as string)}
              onChange={(e) => handleInputChange(e, activeTab)}
            />
          </div>

          <button
            type="submit"
            className="btnPrimary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
          >
            {loading ? 'Guardando en Supabase...' : `Registrar ${activeTab === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
