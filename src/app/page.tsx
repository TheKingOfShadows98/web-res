'use client';

/**
 * @file page.tsx
 * @description Página principal (Home) de la Residencial México.
 * @module app
 */

import React from 'react';
import UserLayout from '@/components/UserLayout';
import { ThemeHero } from '@/active-theme';
import Services from '@/components/Services';
import QuickStats from '@/components/QuickStats';

/**
 * Componente principal de la página de inicio.
 * Renderiza el Hero modular provisto por el tema activo actual.
 * 
 * @returns {React.ReactElement} La estructura de la página principal.
 */
export default function Home(): React.ReactElement {
  return (
    <UserLayout>
      <ThemeHero />
      <Services />
      <QuickStats />
    </UserLayout>
  );
}
