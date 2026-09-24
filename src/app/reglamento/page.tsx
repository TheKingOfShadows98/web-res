import React from 'react';
import UserLayout from '@/components/UserLayout';
import UnderConstruction from '@/components/UnderConstruction';

export default function Reglamento(): React.ReactElement {
  return (
    <UserLayout>
      <UnderConstruction
        title="Reglamento Interno, Estatutos y Documentos"
        subtitle="Estamos construyendo el apartado de Documentos, Estatutos y Reglamentos"
        estimatedDate="Disponible próximamente"
        
        backUrl="/"
        backText="Volver al Inicio"
      />
    </UserLayout>
  );
}