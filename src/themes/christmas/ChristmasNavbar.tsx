'use client';

/**
 * @file ChristmasNavbar.tsx
 * @description Barra de navegación temática para la temporada de Navidad e Invierno
 * con estética escarcha, carámbanos de hielo sobresalientes y gorro de Santa Claus en el logo.
 * @module themes/christmas
 */

import React from 'react';
import Link from 'next/link';
import styles from './Christmas.module.css';

export default function ChristmasNavbar(): React.ReactElement {
  return (
    <nav className={styles.navbar}>
      {/* Capa de nieve en el borde superior */}
      <div className={styles.snowCapBar} aria-hidden="true" />

      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          {/* Contenedor relativo del logo con el gorrito de Santa Claus */}
          <div className={styles.logoIconWrapper}>
            <svg
              className={styles.santaHat}
              viewBox="0 0 36 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Sombra base */}
              <ellipse cx="14" cy="25" rx="12" ry="2.5" fill="rgba(0,0,0,0.25)" />
              {/* Cono rojo curvado del gorro */}
              <path
                d="M6 22 C8 11, 18 4, 28 6 C33 7, 34 11, 32 15 C30 17, 27 16, 26 14 C22 10, 15 12, 10 22 Z"
                fill="#dc2626"
              />
              <path
                d="M7 21 C10 12, 18 6, 27 7"
                stroke="#ef4444"
                strokeWidth="1.2"
              />
              {/* Pompón / borla blanca */}
              <circle cx="32" cy="16" r="4.2" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
              <circle cx="31.2" cy="15.2" r="2.8" fill="#f8fafc" />
              {/* Borde afelpado blanco acolchado */}
              <rect x="2" y="19" width="23" height="8" rx="4" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
              <circle cx="5" cy="23" r="3" fill="#f1f5f9" />
              <circle cx="10" cy="23" r="3" fill="#f8fafc" />
              <circle cx="15" cy="23" r="3" fill="#f1f5f9" />
              <circle cx="20" cy="23" r="3" fill="#f8fafc" />
            </svg>

            <div className={styles.logoIcon}>❄️</div>
          </div>

          <span>Residencial México</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Inicio</Link>
          <Link href="/reglamento" className={styles.navLink}>Reglamento</Link>
          <Link href="/actividades" className={styles.navLink}>
            Convivio Navideño 🎄
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

      {/* Carámbanos colgando a lo largo del borde inferior del navbar horizontal */}
      <div className={styles.iciclesBar} aria-hidden="true" />
    </nav>
  );
}
