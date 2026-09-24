'use client';

/**
 * @file UserLayout.tsx
 * @description Layout general y envolvente para todas las páginas del lado del usuario / portal público.
 * Incluye barra de navegación superior (Navbar), contenedor principal semántico y pie de página (Footer).
 * @module components
 */

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './UserLayout.module.css';

export interface UserLayoutProps {
  /** Elementos hijos que componen el contenido de la página */
  children: React.ReactNode;
  /** Oculta la barra de navegación superior si es true */
  hideNavbar?: boolean;
  /** Oculta el pie de página institucional si es true */
  hideFooter?: boolean;
  /** Clase CSS adicional para el contenedor principal */
  className?: string;
  /** Ancho máximo opcional del contenido central */
  maxWidth?: string;
}

/**
 * Layout general para las páginas del lado del usuario / residentes.
 */
export default function UserLayout({
  children,
  hideNavbar = false,
  hideFooter = false,
  className = '',
  maxWidth,
}: UserLayoutProps): React.ReactElement {
  return (
    <div className={`${styles.layoutContainer} ${className}`}>
      {!hideNavbar && <Navbar />}

      <main
        className={styles.mainContent}
        style={maxWidth ? { maxWidth, margin: '0 auto', width: '100%' } : undefined}
      >
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}

/** Alias alternativo en español */
export { UserLayout as LayoutUsuario, UserLayout as LayoutPublico };
