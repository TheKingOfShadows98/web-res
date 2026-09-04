'use client';

/**
 * @file page.tsx
 * @description Página de administración de finanzas para el registro de ingresos y egresos con autenticación y cumplimiento de RLS.
 * @module app/admin/finanzas/recivos
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { IIngreso, IEgreso } from '@/app/entities/Recivos';
import { generateReceiptHash } from '@/utils/crypto';

const getInitialDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function RecivosPage(): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);

  // Estados de autenticación
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
  });

  // Estados del formulario financiero
  const [activeTab, setActiveTab] = useState<'ingreso' | 'egreso'>('ingreso');
  const [ingresoForm, setIngresoForm] = useState<Omit<IIngreso, 'id'>>(() => ({
    correlativo: '',
    concepto: '',
    cantidad: 0,
    comprobante: '',
    fecha: getInitialDateTime(),
  }));
  const [egresoForm, setEgresoForm] = useState<Omit<IEgreso, 'id'>>(() => ({
    correlativo: '',
    concepto: '',
    cantidad: 0,
    comprobante: '',
    fecha: getInitialDateTime(),
  }));

  // Estados comunes de UI
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Monitorear estado de autenticación de Supabase
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();

    // Suscribirse a cambios en el estado de autenticación (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Manejar cambios en formularios
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

  const handleAuthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  // Autenticación: Registrar o Iniciar Sesión
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: '¡Sesión iniciada con éxito!' });
      } else {
        // Registro de usuario en Supabase Auth con metadatos de perfil
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              nombre: authForm.nombre,
              telefono: authForm.telefono,
            },
          },
        });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: '¡Usuario registrado! Revisa tu correo de confirmación si está activado.',
        });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Error en autenticación';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setAuthLoading(false);
    }
  };

  // Cerrar sesión
  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMessage({ type: 'success', text: 'Sesión cerrada.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cerrar sesión.' });
    } finally {
      setLoading(false);
    }
  };

  // Enviar formulario financiero a Supabase (requiere estar autenticado por RLS)
  const handleSubmit = async (e: React.FormEvent, formType: 'ingreso' | 'egreso') => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!user) {
      setMessage({ type: 'error', text: 'Debes estar autenticado para realizar esta acción.' });
      setLoading(false);
      return;
    }

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

      // 1. Obtener el hash del registro anterior para encadenamiento criptográfico
      const { data: lastRows } = await supabase
        .from(dbTable)
        .select('hash')
        .order('id', { ascending: false })
        .limit(1);

      const prevHash = (lastRows && lastRows.length > 0 && lastRows[0].hash) ? String(lastRows[0].hash) : '';

      // 2. Construir payload determinista
      const payloadToHash = {
        correlativo: String(data.correlativo || '').trim(),
        concepto: data.concepto.trim(),
        cantidad: data.cantidad,
        comprobante: data.comprobante ? data.comprobante.trim() : null,
        fecha: data.fecha ? new Date(data.fecha as string).toISOString() : new Date().toISOString(),
        prev_hash: prevHash,
      };

      // 3. Generar firma SHA-256
      const hash = await generateReceiptHash(payloadToHash);

      const payload = {
        ...payloadToHash,
        hash,
      };

      const { error } = await supabase.from(dbTable).insert([payload]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `¡${formType === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado con éxito con firma criptográfica!`,
      });

      // Limpiar formulario financiero
      const now = getInitialDateTime();
      if (formType === 'ingreso') {
        setIngresoForm({ correlativo: '', concepto: '', cantidad: 0, comprobante: '', fecha: now });
      } else {
        setEgresoForm({ correlativo: '', concepto: '', cantidad: 0, comprobante: '', fecha: now });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setMessage({
        type: 'error',
        text: `Error al registrar en Supabase: ${errorMsg}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar indicador de carga mientras se verifica el token/sesión en localStorage/cookies
  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'pulseGlow 1.5s infinite' }} />
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>Verificando credenciales de administrador...</p>
      </div>
    );
  }

  // --- Vista 1: Formulario de Acceso (No Autenticado) ---
  if (!user) {
    return (
      <div className="adminContainer" style={{ maxWidth: '480px', margin: '5rem auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link href="/" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al Inicio
          </Link>
          <h2 className="heroTitle" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Acceso Administrativo
          </h2>
          <p className="heroSubtitle" style={{ fontSize: '0.95rem', margin: 0 }}>
            Debes iniciar sesión con tu cuenta de administrador para registrar ingresos y egresos.
          </p>
        </div>

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
            }}
          >
            {message.text}
          </div>
        )}

        <div className="card" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <button
              className={authMode === 'login' ? 'btnPrimary' : 'btnSecondary'}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setAuthMode('login'); setMessage(null); }}
            >
              Iniciar Sesión
            </button>
            <button
              className={authMode === 'register' ? 'btnPrimary' : 'btnSecondary'}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setAuthMode('register'); setMessage(null); }}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <>
                <div className="formGroup">
                  <label className="formLabel" htmlFor="nombre">Nombre Completo</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="formInput"
                    placeholder="Ej. Juan Pérez"
                    value={authForm.nombre}
                    onChange={handleAuthInputChange}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label className="formLabel" htmlFor="telefono">Teléfono</label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    className="formInput"
                    placeholder="Ej. 7777-7777"
                    value={authForm.telefono}
                    onChange={handleAuthInputChange}
                  />
                </div>
              </>
            )}

            <div className="formGroup">
              <label className="formLabel" htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                className="formInput"
                placeholder="ejemplo@correo.com"
                value={authForm.email}
                onChange={handleAuthInputChange}
                required
              />
            </div>

            <div className="formGroup">
              <label className="formLabel" htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                className="formInput"
                placeholder="••••••••"
                value={authForm.password}
                onChange={handleAuthInputChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btnPrimary"
              disabled={authLoading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
            >
              {authLoading ? 'Procesando...' : authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Vista 2: Registro de Recibos (Usuario Autenticado) ---
  return (
    <div className="adminContainer" style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem' }}>
      
      {/* Panel Superior del Usuario */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'var(--background-card)', 
        border: '1px solid var(--border)', 
        padding: '0.75rem 1.25rem', 
        borderRadius: 'var(--radius-sm)', 
        marginBottom: '2rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
            Sesión: <strong>{user.email}</strong>
          </span>
        </div>
        <button 
          onClick={handleLogout} 
          className="btnSecondary" 
          disabled={loading} 
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
        >
          Cerrar Sesión
        </button>
      </div>

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
            <label className="formLabel" htmlFor="correlativo">Nº Correlativo / Recibo (Opcional)</label>
            <input
              id="correlativo"
              name="correlativo"
              type="text"
              className="formInput"
              placeholder="Ej. REC-001, 1024, etc."
              value={activeTab === 'ingreso' ? (ingresoForm.correlativo || '') : (egresoForm.correlativo || '')}
              onChange={(e) => handleInputChange(e, activeTab)}
            />
          </div>

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
