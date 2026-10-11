'use client';

/**
 * @file HalloweenNavbar.tsx
 * @description Barra de navegación temática para la temporada de Halloween con menú y enlaces adaptados.
 * @module themes/halloween
 */

import React from 'react';
import Link from 'next/link';
import styles from './Halloween.module.css';

export default function HalloweenNavbar(): React.ReactElement {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>🎃</div>
          <span>Residencial México</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Inicio</Link>
          <Link href="/reglamento" className={styles.navLink}>Reglamento</Link>
          <Link href="/actividades" className={styles.navLink}>
            Actividades Spooky 🦇
          </Link>
          <Link href="/finanzas" className={styles.navLink}>Finanzas</Link>
        </div>

        <div>
          <Link href="/admin" className={styles.btnAdmin}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Acceso
          </Link>
        </div>
      </div>
    </nav>
  );
}
