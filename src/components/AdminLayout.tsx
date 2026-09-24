'use client';

/**
 * @file AdminLayout.tsx
 * @description Layout general para todas las páginas del lado del Administrador de la ADESCO.
 * Proporciona barra de navegación administrativa superior, gestión de sesión, enlaces rápidos y pie de página de estado.
 * @module components
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { UserRole } from '@/app/entities/Recivos';
import styles from './AdminLayout.module.css';

export interface AdminLayoutProps {
  /** Elementos hijos que componen el contenido de la página administrativa */
  children: React.ReactNode;
  /** Oculta la barra de navegación administrativa superior */
  hideNavbar?: boolean;
  /** Oculta el pie de página de administración */
  hideFooter?: boolean;
  /** Clase CSS complementaria */
  className?: string;
  /** Ancho máximo opcional del contenedor principal */
  maxWidth?: string;
}

const roleLabels: Record<number, { name: string; color: string }> = {
  [UserRole.OWNER]: { name: 'Owner', color: '#8b5cf6' },
  [UserRole.ADMINISTRADOR]: { name: 'Administrador', color: '#10b981' },
  [UserRole.AUDITOR]: { name: 'Auditor', color: '#3b82f6' },
  [UserRole.COLABORADOR]: { name: 'Colaborador', color: '#f59e0b' },
  [UserRole.MIEMBRO]: { name: 'Miembro', color: '#64748b' },
};

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/admin/finanzas',
    label: 'Finanzas & Balance',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/admin/finanzas/recivos',
    label: 'Registrar Movimiento',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    exact: false,
  },
  {
    href: '/admin/usuarios',
    label: 'Usuarios & Roles',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    exact: false,
  },
];

export default function AdminLayout({
  children,
  hideNavbar = false,
  hideFooter = false,
  className = '',
  maxWidth,
}: AdminLayoutProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<number>(UserRole.MIEMBRO);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Cargar sesión del usuario para mostrar perfil en el topbar
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted) setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('usuario')
            .select('rol')
            .eq('id', user.id)
            .single();

          if (profile && isMounted) {
            setUserRole(profile.rol ?? UserRole.MIEMBRO);
          }
        }
      } catch (err) {
        console.error('Error al obtener sesión en AdminLayout:', err);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setUser(session?.user || null);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('usuario')
          .select('rol')
          .eq('id', session.user.id)
          .single();

        if (profile && isMounted) {
          setUserRole(profile.rol ?? UserRole.MIEMBRO);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/admin');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const currentRole = roleLabels[userRole] || roleLabels[UserRole.MIEMBRO];

  return (
    <div className={`${styles.layoutWrapper} ${className}`}>
      {!hideNavbar && (
        <header className={styles.topbar}>
          <div className={styles.topbarContainer}>
            {/* Logo y Badge de Admin */}
            <div className={styles.brandGroup}>
              <Link href="/admin" className={styles.logo}>
                <div className={styles.logoIcon}>RM</div>
                <span>Residencial México</span>
              </Link>
              <span className={styles.adminBadge}>Admin</span>
            </div>

            {/* Enlaces de Navegación de Escritorio */}
            <nav className={styles.navLinks} aria-label="Navegación Administrativa">
              {NAV_ITEMS.map((item) => {
                const active = isLinkActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Acciones de Usuario */}
            <div className={styles.userArea}>
              {user && (
                <div className={styles.userProfile} title={`Sesión iniciada como ${user.email}`}>
                  <span className={styles.userDot} aria-hidden="true" />
                  <span className={styles.userEmail}>{user.email}</span>
                  <span
                    className={styles.roleTag}
                    style={{
                      background: `${currentRole.color}20`,
                      color: currentRole.color,
                      border: `1px solid ${currentRole.color}60`,
                    }}
                  >
                    {currentRole.name}
                  </span>
                </div>
              )}

              <Link
                href="/"
                className={styles.actionBtn}
                title="Volver a la vista del residente / pública"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Portal Público</span>
              </Link>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${styles.actionBtn} ${styles.logoutBtn}`}
                  title="Cerrar Sesión"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Salir</span>
                </button>
              )}

              {/* Botón Móvil */}
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir menú de navegación móvil"
                aria-expanded={mobileMenuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Menú Desplegable Móvil */}
          <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </header>
      )}

      {/* Contenedor Principal */}
      <main
        className={styles.mainContent}
        style={maxWidth ? { maxWidth, margin: '0 auto', width: '100%' } : undefined}
      >
        {children}
      </main>

      {!hideFooter && (
        <footer className={styles.adminFooter}>
          <div className={styles.footerInner}>
            <div className={styles.systemStatus}>
              <span className={styles.statusDot} aria-hidden="true" />
              <span>Sistema Electrónico ADESCO 2026 - Conexión Segura</span>
            </div>
            <div>
              <span>Residencial México &bull; Panel de Gestión Directiva</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

/** Alias alternativo en español */
export { AdminLayout as LayoutAdministrador, AdminLayout as LayoutAdmin };
