'use client';

/**
 * @file page.tsx
 * @description Formulario personalizado para completar el registro de cuenta tras recibir una invitación de la ADESCO.
 * @module app/completar-registro
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { UserRole } from '@/app/entities/Recivos';
import { usuariosRepository } from '@/repositories/usuarios.repository';

export default function CompletarRegistroPage(): React.ReactElement {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Estados de validación y carga
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number>(UserRole.MIEMBRO);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Campos del formulario
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Feedback y éxito
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // 1. Detectar token / sesión de invitación
  useEffect(() => {
    let isMounted = true;

    const parseAuthToken = async () => {
      try {
        let targetUser: User | null = null;

        // A. Verificar parámetros y tokens en el hash o query string de la URL
        if (typeof window !== 'undefined') {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);

          const error = hashParams.get('error') || searchParams.get('error');
          const errorDescription =
            hashParams.get('error_description') || searchParams.get('error_description');
          const errorCode = hashParams.get('error_code') || searchParams.get('error_code');

          if (error || errorCode === 'otp_expired') {
            if (isMounted) {
              setTokenError(
                errorDescription?.replace(/\+/g, ' ') ||
                  'El enlace de invitación ha expirado o ya fue utilizado (límite de 15 minutos). Por favor solicita una nueva invitación.'
              );
              setLoading(false);
            }
            return;
          }

          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          // Si el enlace contiene un access_token de invitación, cambiar explícitamente la sesión
          if (accessToken) {
            const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (setSessionErr) {
              console.error('Error al establecer sesión desde el hash:', setSessionErr);
            } else if (setSessionData.session?.user) {
              targetUser = setSessionData.session.user;
            }
          }
        }

        // B. Si no venía en el hash o ya se estableció, verificar sesión
        if (!targetUser) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;
          targetUser = session?.user || null;
        }

        if (targetUser) {
          if (!isMounted) return;
          setUserId(targetUser.id);
          setEmail(targetUser.email || '');

          // Cargar rol asignado en los metadatos o en la tabla usuario
          const metadataRole = targetUser.user_metadata?.rol;
          if (typeof metadataRole === 'number') {
            setUserRole(metadataRole);
          }

          // Consultar nombre preexistente si lo hubiese
          const profile = await usuariosRepository.getUserProfile(targetUser.id, supabase);

          if (profile && isMounted) {
            if (profile.nombre && profile.nombre !== 'Usuario Invitado' && profile.nombre !== 'Usuario Nuevo') {
              setNombre(profile.nombre);
            }
            if (profile.telefono) setTelefono(profile.telefono);
            if (typeof profile.rol === 'number') setUserRole(profile.rol);
          }
        } else {
          // Si no hay sesión inmediata, suscribirse al cambio de estado de Auth
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (newSession?.user && isMounted) {
              setUserId(newSession.user.id);
              setEmail(newSession.user.email || '');
              const metadataRole = newSession.user.user_metadata?.rol;
              if (typeof metadataRole === 'number') setUserRole(metadataRole);
              setLoading(false);
            }
          });

          // Timeout de cortesía si no se detecta token
          const timeoutId = setTimeout(() => {
            if (isMounted && !userId) {
              setLoading(false);
              setTokenError((prev) =>
                prev ||
                'No se encontró una sesión de invitación activa. Verifica que hayas abierto el enlace desde el correo más reciente.'
              );
            }
          }, 2500);

          return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error('Error al validar sesión de invitación:', err);
        if (isMounted) {
          setTokenError('Ocurrió un error al validar el enlace de invitación.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    parseAuthToken();

    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones
    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Verifícalas cuidadosamente.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Actualizar contraseña y metadata del usuario en Supabase Auth
      const { error: updateAuthErr } = await supabase.auth.updateUser({
        password,
        data: {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
        },
      });

      if (updateAuthErr) throw updateAuthErr;

      // 2. Sincronizar el perfil en la tabla public.usuario
      if (userId) {
        try {
          await usuariosRepository.updateUserProfile(
            userId,
            {
              nombre: nombre.trim(),
              telefono: telefono.trim(),
              correo: email,
            },
            supabase
          );
        } catch (profileErr) {
          console.warn('Advertencia al sincronizar perfil público:', profileErr);
        }
      }

      setSuccess(true);

      // Redirigir según el rol del usuario tras breve pausa
      setTimeout(() => {
        if (userRole >= UserRole.ADMINISTRADOR) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 2000);
    } catch (err) {
      console.error('Error al completar registro:', err);
      const message = err instanceof Error ? err.message : 'Error al guardar los datos de tu cuenta.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Pantalla de carga
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '45px', height: '45px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem' }}>Validando tu invitación...</p>
        </div>
      </main>
    );
  }

  // 2. Pantalla de Token Expirado / Inválido
  if (tokenError) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '1.5rem' }}>
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem',
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--foreground)' }}>
            Enlace de Invitación Expirado o Inválido
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            {tokenError}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: 'var(--primary)',
                color: '#fff',
                padding: '0.8rem 1.5rem',
                borderRadius: '10px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'opacity 0.2s ease',
              }}
            >
              Ir al Inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Pantalla de Éxito
  if (success) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '1.5rem' }}>
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem',
            }}
          >
            ✅
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--foreground)' }}>
            ¡Cuenta Creada Exitosamente!
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Tu contraseña y datos personales se han registrado. Redirigiéndote al sistema...
          </p>
          <div style={{ width: '100%', background: 'var(--border)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: '#10b981', animation: 'pulseGlow 1.5s infinite' }} />
          </div>
        </div>
      </main>
    );
  }

  // 4. Formulario de Completar Registro
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.4rem 0.9rem',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              marginBottom: '1rem',
            }}
          >
            Invitación de ADESCO
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
            Completa tu Cuenta
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
            Ingresa tus datos personales y define tu contraseña de acceso.
          </p>
        </div>

        {/* Mensaje de error si falla */}
        {errorMsg && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '0.88rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Correo (Solo lectura) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--foreground-muted)', marginBottom: '0.4rem' }}>
              Correo Electrónico (Invitado)
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--foreground)',
                fontSize: '0.92rem',
                cursor: 'not-allowed',
                opacity: 0.85,
              }}
            />
          </div>

          {/* Nombre Completo */}
          <div>
            <label htmlFor="nombre" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
              Nombre Completo <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="nombre"
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.92rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
              Número de Teléfono / WhatsApp
            </label>
            <input
              id="telefono"
              type="tel"
              placeholder="Ej. +503 7000-0000"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Contraseña */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--foreground)' }}>
                Contraseña Nueva <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--foreground)', marginBottom: '0.4rem' }}>
              Confirmar Contraseña <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: `1px solid ${
                  confirmPassword && password !== confirmPassword ? 'rgba(239, 68, 68, 0.6)' : 'var(--border)'
                }`,
                background: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
            {confirmPassword && password !== confirmPassword && (
              <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.3rem', display: 'block' }}>
                Las contraseñas no coinciden.
              </span>
            )}
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '0.75rem',
              padding: '0.9rem',
              borderRadius: '12px',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '700',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'transform 0.15s ease, opacity 0.2s ease',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Guardando Cuenta...</span>
              </>
            ) : (
              'Finalizar y Crear Cuenta'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
