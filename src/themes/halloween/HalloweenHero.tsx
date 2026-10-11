'use client';

/**
 * @file HalloweenHero.tsx
 * @description Sección Hero temática de Halloween con llamados a actividades y finanzas de la temporada.
 * @module themes/halloween
 */

import React from 'react';
import Link from 'next/link';
import styles from './Halloween.module.css';

export default function HalloweenHero(): React.ReactElement {
  return (
    <header className={styles.hero}>
      <div className={styles.badge}>
        <span>🕷️</span>
        Edición Especial de Halloween 2026
      </div>

      <h1 className={styles.heroTitle}>
        Comunidad Unida, <br />
        <span className={styles.heroAccent}>Noche de Tradición y Alegría</span>
      </h1>

      <p className={styles.heroSubtitle}>
        Bienvenidos a la temporada de octubre en Residencial México. Consulta las actividades comunitarias, 
        el concurso de decoración y nuestro reporte de transparencia en tiempo real.
      </p>

      <div className={styles.heroActions}>
        <Link href="/actividades" className={styles.btnSpookyPrimary}>
          <span>Ver Eventos y Concursos 🎃</span>
        </Link>
        <Link href="/finanzas" className={styles.btnSpookySecondary}>
          Transparencia de Fondos
        </Link>
      </div>
    </header>
  );
}
