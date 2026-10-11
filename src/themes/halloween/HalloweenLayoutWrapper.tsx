'use client';

/**
 * @file HalloweenLayoutWrapper.tsx
 * @description Envoltorio visual decorativo para el tema Halloween.
 * @module themes/halloween
 */

import React from 'react';
import styles from './Halloween.module.css';

export interface HalloweenLayoutWrapperProps {
  children: React.ReactNode;
}

export default function HalloweenLayoutWrapper({ children }: HalloweenLayoutWrapperProps): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spookyGlow} aria-hidden="true" />
      {children}
    </div>
  );
}
