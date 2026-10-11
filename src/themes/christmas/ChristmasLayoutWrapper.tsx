'use client';

/**
 * @file ChristmasLayoutWrapper.tsx
 * @description Envoltorio visual decorativo para el tema Navidad.
 * @module themes/christmas
 */

import React from 'react';
import styles from './Christmas.module.css';

export interface ChristmasLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ChristmasLayoutWrapper({ children }: ChristmasLayoutWrapperProps): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.festiveGlow} aria-hidden="true" />
      {children}
    </div>
  );
}
