'use client';

/**
 * @file page.tsx
 * @description Página principal (Home) de la ADESCO de la Residencial México.
 * @module app
 */

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import QuickStats from '@/components/QuickStats';
import Footer from '@/components/Footer';
import InteractiveModal from '@/components/InteractiveModal';

/**
 * Componente principal de la página de inicio.
 * Orquesta los diferentes bloques funcionales y gestiona el estado del modal del portal vecinal.
 * 
 * @returns {React.ReactElement} La estructura de la página principal.
 */
export default function Home(): React.ReactElement {
  const [isPortalOpen, setIsPortalOpen] = useState<boolean>(false);

  /**
   * Abre el modal del portal de vecinos.
   */
  const handleOpenPortal = () => {
    setIsPortalOpen(true);
  };

  /**
   * Cierra el modal del portal de vecinos.
   */
  const handleClosePortal = () => {
    setIsPortalOpen(false);
  };

  return (
    <>
      <Navbar onOpenPortal={handleOpenPortal} />
      
      <main>
        <Hero onOpenPortal={handleOpenPortal} />
        <Services onOpenPortal={handleOpenPortal} />
        <QuickStats />
      </main>

      <Footer />

      {/* Modal Interactivo (Simulador de Portal Vecinal) */}
      <InteractiveModal isOpen={isPortalOpen} onClose={handleClosePortal} />
    </>
  );
}
