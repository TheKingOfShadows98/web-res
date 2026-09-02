'use client';

/**
 * @file page.tsx
 * @description Módulo de gestión y administración de usuarios y roles de la ADESCO.
 * @module app/admin/usuarios
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { UserRole, IUsuario } from '@/app/entities/Recivos';

const roleMeta: Record<number, { name: string; color: string; desc: string }> = {
  [UserRole.OWNER]: {
    name: 'Owner',
    color: '#8b5cf6',
    desc: 'Control total. Puede promover y eliminar Administradores y Auditores.',
  },
  [UserRole.ADMINISTRADOR]: {
    name: 'Administrador',
    color: '#10b981',
    desc: 'Acceso al panel y finanzas. Puede gestionar usuarios con roles inferiores.',
  },
  [UserRole.AUDITOR]: {
    name: 'Auditor',
    color: '#3b82f6',
    desc: 'Solo lectura. Consulta toda la información sin ejecutar modificaciones.',
  },
  [UserRole.COLABORADOR]: {
    name: 'Colaborador',
    color: '#f59e0b',
    desc: 'Acceso básico al panel administrativo.',
  },
  [UserRole.MIEMBRO]: {
    name: 'Miembro',
    color: '#64748b',
    desc: 'Usuario estándar (solo portal vecinal y home).',
  },
};

export default function UsuariosPage(): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);

  // Estados de autenticación del usuario actual
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<number>(UserRole.MIEMBRO);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Estados de lista de usuarios
  const [users, setUsers] = useState<IUsuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estados del modal de creación de usuario
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
    rol: UserRole.MIEMBRO as number,
  });

  // Mensajes de feedback
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar lista de usuarios
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('id, nombre, correo, rol, telefono')
        .order('rol', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error al cargar lista de usuarios:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al cargar usuarios';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoadingUsers(false);
    }
  }, [supabase]);

  // 1. Verificar sesión, rol y cargar usuarios iniciales
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        setCurrentUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('usuario')
            .select('rol')
            .eq('id', user.id)
            .single();

          if (!isMounted) return;
          const role = profile?.rol ?? UserRole.MIEMBRO;
          setCurrentRole(role);

          if (role > UserRole.MIEMBRO) {
            const { data: userList, error: errUsers } = await supabase
              .from('usuario')
              .select('id, nombre, correo, rol, telefono')
              .order('rol', { ascending: false });

            if (errUsers) throw errUsers;
            if (isMounted) {
              setUsers(userList || []);
            }
          }
        }
      } catch (err) {
        console.error('Error al verificar sesión o cargar usuarios:', err);
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
          setLoadingUsers(false);
        }
      }
    };

    checkAuthAndFetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setCurrentUser(session?.user || null);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('usuario')
          .select('rol')
          .eq('id', session.user.id)
          .single();
        if (profile && isMounted) {
          setCurrentRole(profile.rol ?? UserRole.MIEMBRO);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Determinar si el usuario actual puede cambiar el rol de un usuario objetivo
  const canModifyUserRole = (targetUser: IUsuario): boolean => {
    if (currentRole === UserRole.AUDITOR || currentRole === UserRole.COLABORADOR || currentRole === UserRole.MIEMBRO) {
      return false; // Solo lectura o sin permisos
    }
    if (currentRole === UserRole.OWNER) {
      return targetUser.id !== currentUser?.id; // Owner puede modificar a todos excepto a sí mismo para no bloquearse
    }
    if (currentRole === UserRole.ADMINISTRADOR) {
      // Admin solo puede modificar usuarios con rol inferior al suyo (< 2)
      return Number(targetUser.rol) < UserRole.ADMINISTRADOR;
    }
    return false;
  };

  // Opciones de roles asignables según el rol del usuario logueado
  const getAssignableRoles = (): number[] => {
    if (currentRole === UserRole.OWNER) {
      return [UserRole.MIEMBRO, UserRole.COLABORADOR, UserRole.ADMINISTRADOR, UserRole.AUDITOR];
    }
    if (currentRole === UserRole.ADMINISTRADOR) {
      return [UserRole.MIEMBRO, UserRole.COLABORADOR];
    }
    return [];
  };

  // Cambiar rol de un usuario
  const handleRoleChange = async (userId: string, newRole: number) => {
    setUpdatingId(userId);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('usuario')
        .update({ rol: newRole })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Rol de usuario actualizado correctamente.' });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: newRole } : u))
      );
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar rol';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUpdatingId(null);
    }
  };

  // Manejar creación de un nuevo usuario
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setMessage(null);

    try {
      // 1. Crear el usuario en Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          data: {
            nombre: createForm.nombre,
            telefono: createForm.telefono,
          },
        },
      });

      if (authErr) throw authErr;

      // 2. Si se asignó un rol mayor que Miembro (0), actualizarlo en la tabla usuario
      if (authData.user && createForm.rol !== UserRole.MIEMBRO) {
        await supabase
          .from('usuario')
          .update({ rol: createForm.rol })
          .eq('id', authData.user.id);
      }

      setMessage({
        type: 'success',
        text: `Usuario ${createForm.email} creado con rol ${roleMeta[createForm.rol]?.name || 'Miembro'}.`,
      });

      setCreateForm({
        email: '',
        password: '',
        nombre: '',
        telefono: '',
        rol: UserRole.MIEMBRO,
      });
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al crear usuario';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setCreateLoading(false);
    }
  };

  // Indicador de carga
  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'pulseGlow 1.5s infinite' }} />
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>Verificando permisos de acceso...</p>
      </div>
    );
  }

  // Vista si no está autenticado
  if (!currentUser) {
    return (
      <div className="adminContainer" style={{ maxWidth: '480px', margin: '5rem auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--foreground)' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--foreground-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Debes iniciar sesión con una cuenta autorizada para gestionar usuarios.
        </p>
        <Link href="/admin" className="btnPrimary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
          Ir al Inicio de Sesión
        </Link>
      </div>
    );
  }

  // Vista si el rol es Miembro (sin permisos de administración)
  if (currentRole === UserRole.MIEMBRO) {
    return (
      <div className="adminContainer" style={{ maxWidth: '540px', margin: '5rem auto', padding: '2.5rem', textAlign: 'center', background: 'var(--background-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--foreground)' }}>Permisos Insuficientes</h2>
        <p style={{ color: 'var(--foreground-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Tu cuenta actual tiene el rol de <strong>Miembro</strong>. Este módulo está reservado para la Junta Directiva y Administradores de la ADESCO.
        </p>
        <Link href="/" className="btnSecondary">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const isReadOnly = currentRole === UserRole.AUDITOR || currentRole === UserRole.COLABORADOR;
  const assignableRoles = getAssignableRoles();

  return (
    <div className="adminContainer" style={{ maxWidth: '1100px', margin: '3rem auto', padding: '0 2rem' }}>
      {/* Navegación y Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/admin" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al Panel General
          </Link>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--foreground)' }}>
            Gestión de Usuarios y Roles
          </h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Administra los permisos de acceso y miembros registrados en la plataforma ADESCO.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isReadOnly && (
            <span style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              padding: '0.4rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              Modo Auditoría (Solo Lectura)
            </span>
          )}

          {!isReadOnly && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btnPrimary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#8b5cf6' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Crear Nuevo Usuario
            </button>
          )}
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

      {/* Tabla de Usuarios */}
      <div style={{
        background: 'var(--background-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)' }}>
            Usuarios Registrados ({users.length})
          </h3>
          <button
            onClick={fetchUsers}
            disabled={loadingUsers}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {loadingUsers ? 'Actualizando...' : 'Recargar'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--foreground-muted)', fontWeight: 600 }}>Usuario / Nombre</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--foreground-muted)', fontWeight: 600 }}>Correo Electrónico</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--foreground-muted)', fontWeight: 600 }}>Teléfono</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--foreground-muted)', fontWeight: 600 }}>Rol Actual</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--foreground-muted)', fontWeight: 600, textAlign: 'right' }}>Acciones / Asignar Rol</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const meta = roleMeta[item.rol] || roleMeta[UserRole.MIEMBRO];
                  const canEdit = canModifyUserRole(item);
                  const isSelf = item.id === currentUser?.id;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1.2rem 1.5rem', color: 'var(--foreground)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: meta.color
                          }}>
                            {(item.nombre || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            {item.nombre || 'Sin Nombre'}
                            {isSelf && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
                                (Tú)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1.2rem 1.5rem', color: 'var(--foreground-muted)' }}>
                        {item.correo || 'No registrado'}
                      </td>

                      <td style={{ padding: '1.2rem 1.5rem', color: 'var(--foreground-muted)' }}>
                        {item.telefono || '—'}
                      </td>

                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <span style={{
                          background: `${meta.color}20`,
                          color: meta.color,
                          border: `1px solid ${meta.color}60`,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {meta.name}
                        </span>
                      </td>

                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                        {canEdit ? (
                          <select
                            value={item.rol}
                            disabled={updatingId === item.id}
                            onChange={(e) => handleRoleChange(item.id, Number(e.target.value))}
                            aria-label={`Cambiar rol de ${item.nombre || item.correo}`}
                            style={{
                              padding: '0.45rem 0.8rem',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--foreground)',
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            <option value={item.rol} disabled>
                              Asignar Rol...
                            </option>
                            {assignableRoles.map((r) => (
                              <option key={r} value={r}>
                                {roleMeta[r]?.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: 'var(--foreground-muted)', fontSize: '0.8rem' }}>
                            {isSelf ? 'No modificable' : 'Sin permisos'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear Usuario */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--background-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Registrar Nuevo Usuario
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--foreground-muted)' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Castillo"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
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

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--foreground-muted)' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@resmex.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
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

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--foreground-muted)' }}>
                  Contraseña Temporal
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
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

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--foreground-muted)' }}>
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  placeholder="7000-0000"
                  value={createForm.telefono}
                  onChange={(e) => setCreateForm({ ...createForm, telefono: e.target.value })}
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

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--foreground-muted)' }}>
                  Rol Inicial
                </label>
                <select
                  value={createForm.rol}
                  onChange={(e) => setCreateForm({ ...createForm, rol: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--foreground)'
                  }}
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleMeta[r]?.name} — {roleMeta[r]?.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btnSecondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btnPrimary"
                  style={{ background: '#8b5cf6' }}
                >
                  {createLoading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
