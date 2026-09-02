'use client';

/**
 * @file page.tsx
 * @description Página principal (Home) de la ADESCO de la Residencial México.
 * @module app
 */

import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import QuickStats from '@/components/QuickStats';
import Footer from '@/components/Footer';

/**
 * Componente principal de la página de inicio.
 * 
 * @returns {React.ReactElement} La estructura de la página principal.
 */
export default function Home(): React.ReactElement {
  return (
    <>
      <Navbar />
      
      <main>
        <Hero />
        <Services />
        <QuickStats />
      </main>

      <Footer />
    </>
  );
}
