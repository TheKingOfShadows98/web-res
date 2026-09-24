import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UnderConstruction from '@/components/UnderConstruction';

export default function Reglamento(): React.ReactElement {
  return (
    <>
      <Navbar />
      <main>
        <UnderConstruction
          title="Actividades y Gestiones"
          subtitle="Estamos construyendo el sistema de gestiones y Actividades."
          estimatedDate="Disponible próximamente"          
          backUrl="/"
          backText="Volver al Inicio"
        />
      </main>
      <Footer />
    </>
  );
}