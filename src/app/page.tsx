'use client';

/**
 * @file page.tsx
 * @description Página principal (Home) de la Residencial México.
 * @module app
 */

import React from 'react';
import UserLayout from '@/components/UserLayout';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import QuickStats from '@/components/QuickStats';

/**
 * Componente principal de la página de inicio.
 * 
 * @returns {React.ReactElement} La estructura de la página principal.
 */
export default function Home(): React.ReactElement {
  return (
    <UserLayout>
      <Hero />
      <Services />
      <QuickStats />
    </UserLayout>
  );
}
