'use client';

/**
 * @file ChristmasHero.tsx
 * @description Sección Hero temática de Navidad y Temporada Invernal con tonos glaciar y escarcha.
 * @module themes/christmas
 */

import React from 'react';
import Link from 'next/link';
import styles from './Christmas.module.css';

export default function ChristmasHero(): React.ReactElement {
    const showfinanzas = false;

    const finanzas = (<Link href="/finanzas" className={styles.btnFestiveSecondary}>
          Cierre Financiero Anual
        </Link>);
  return (
    <header className={styles.hero}>
      <div className={styles.badge}>
        <span>❄️</span>
        Edición Invernal y Fin de Año 2026
      </div>

      <h1 className={styles.heroTitle}>
        Paz, Unión Familiar y <br />
        <span className={styles.heroAccent}>Convivencia Vecinal</span>
      </h1>

      <p className={styles.heroSubtitle}>
        ¡Les deseamos una cálida temporada invernal a todas las familias de Residencial México! 
        Conoce los detalles de las posadas, la iluminación comunitaria y el cierre contable anual.
      </p>

      <div className={styles.heroActions}>
        <Link href="/actividades" className={styles.btnFestivePrimary}>
          <span>Ver Agenda Navideña 🎄</span>
        </Link>
        
         {showfinanzas ?? finanzas }
      </div>
    </header>
  );
}
