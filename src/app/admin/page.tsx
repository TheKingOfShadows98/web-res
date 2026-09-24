'use client';

/**
 * @file page.tsx
 * @description Panel principal de administración general de la ADESCO.
 * @module app/admin
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { UserRole } from '@/app/entities/Recivos';
import { usuariosRepository } from '@/repositories/usuarios.repository';

const roleLabels: Record<number, { name: string; color: string }> = {
  [UserRole.OWNER]: { name: 'Owner', color: '#8b5cf6' },
  [UserRole.ADMINISTRADOR]: { name: 'Administrador', color: '#10b981' },
  [UserRole.AUDITOR]: { name: 'Auditor', color: '#3b82f6' },
  [UserRole.COLABORADOR]: { name: 'Colaborador', color: '#f59e0b' },
  [UserRole.MIEMBRO]: { name: 'Miembro', color: '#64748b' },
};

export default function AdminHubPage(): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);

  // Estados de autenticación
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<number>(UserRole.MIEMBRO);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Monitorear sesión de usuario y obtener rol
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const role = await usuariosRepository.getUserRole(user.id, supabase);
          setUserRole(role);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const role = await usuariosRepository.getUserRole(session.user.id, supabase);
        setUserRole(role);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Manejador de cambios de input
  const handleAuthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit de autenticación
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
        setMessage({ type: 'success', text: '¡Sesión iniciada correctamente!' });
      } else {
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
      const errorMsg = err instanceof Error ? err.message : 'Error en la autenticación';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMessage({ type: 'success', text: 'Sesión cerrada con éxito.' });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setMessage({ type: 'error', text: 'Error al cerrar sesión.' });
    }
  };

  // Pantalla de carga mientras se verifica el token
  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'pulseGlow 1.5s infinite' }} />
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>Verificando credenciales de acceso...</p>
      </div>
    );
  }

  // Vista 1: Formulario de Autenticación (No logueado)
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
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            Acceso Administrativo
          </h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
            Portal exclusivo para miembros de la Junta Directiva de la ADESCO.
          </p>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            background: message.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.875rem'
          }}>
            {message.text}
          </div>
        )}

        <div style={{
          background: 'var(--background-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="nombre" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--foreground-muted)' }}>
                    Nombre Completo
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={authForm.nombre}
                    onChange={handleAuthInputChange}
                    placeholder="Ej. Carlos Mendoza"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="telefono" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--foreground-muted)' }}>
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    value={authForm.telefono}
                    onChange={handleAuthInputChange}
                    placeholder="7000-0000"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--foreground-muted)' }}>
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthInputChange}
                placeholder="admin@adesco.org"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--foreground)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--foreground-muted)' }}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthInputChange}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--foreground)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btnPrimary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              {authLoading ? 'Procesando...' : (authMode === 'login' ? 'Iniciar Sesión' : 'Registrar Cuenta')}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setMessage(null);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const roleInfo = roleLabels[userRole] || roleLabels[UserRole.MIEMBRO];

  // Vista 2: Dashboard Central del Administrador (Autenticado)
  return (
    <div className="adminContainer" style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 2rem' }}>
      {/* Header Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Ir al Sitio Principal
          </Link>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--foreground)' }}>
            Panel de Administración ADESCO
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>
              Usuario: <strong style={{ color: 'var(--foreground)' }}>{user.email}</strong>
            </p>
            <span style={{
              background: `${roleInfo.color}20`,
              color: roleInfo.color,
              border: `1px solid ${roleInfo.color}60`,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {roleInfo.name}
            </span>
          </div>
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="btnSecondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          fontSize: '0.875rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Grid de Secciones del Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Sección: Finanzas */}
        <div style={{
          background: 'var(--background-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'var(--primary)'
          }} />
          
          <div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
              Módulo de Finanzas
            </h3>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Gestión de ingresos, egresos, balance contable en tiempo real, visualización de métricas y emisión de recibos digitales.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href="/admin/finanzas"
              className="btnPrimary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Ver Dashboard Financiero
            </Link>

            <Link
              href="/admin/finanzas/recivos"
              className="btnSecondary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Registrar Movimiento / Recibo
            </Link>
          </div>
        </div>

        {/* Sección: Usuarios y Roles */}
        <div style={{
          background: 'var(--background-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: '#8b5cf6'
          }} />
          
          <div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
              Gestión de Usuarios y Roles
            </h3>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Administración de miembros, asignación de permisos (Owner, Administrador, Auditor, Colaborador) y creación de nuevos usuarios.
            </p>
          </div>

          <div>
            <Link
              href="/admin/usuarios"
              className="btnPrimary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem', background: '#8b5cf6' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              Gestionar Usuarios y Roles
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
