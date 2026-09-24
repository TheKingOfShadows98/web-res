import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UnderConstruction, { EnConstruccion } from '@/components/UnderConstruction';

describe('UnderConstruction Component', () => {
  it('renderiza con los valores por defecto correctamente', () => {
    render(<UnderConstruction />);

    expect(screen.getByRole('heading', { level: 2, name: /módulo en construcción/i })).toBeInTheDocument();
    expect(screen.getByText(/estamos trabajando en esta sección/i)).toBeInTheDocument();
    expect(screen.getByText(/en desarrollo/i)).toBeInTheDocument();
    
    const backLink = screen.getByRole('link', { name: /volver al inicio/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('renderiza con propiedades personalizadas y fecha estimada', () => {
    render(
      <UnderConstruction
        title="Portal de Asambleas"
        subtitle="Votaciones y actas de la comunidad"
        badgeText="Fase 2"
        estimatedDate="Mayo 2026"
        features={['Votación electrónica', 'Actas históricas']}
        backUrl="/admin"
        backText="Ir al Panel de Administración"
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: /portal de asambleas/i })).toBeInTheDocument();
    expect(screen.getByText(/votaciones y actas de la comunidad/i)).toBeInTheDocument();
    expect(screen.getByText(/fase 2/i)).toBeInTheDocument();
    expect(screen.getByText(/mayo 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/votación electrónica/i)).toBeInTheDocument();
    expect(screen.getByText(/actas históricas/i)).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: /ir al panel de administración/i });
    expect(backLink).toHaveAttribute('href', '/admin');
  });

  it('renderiza variante card y banner sin botón de regreso por defecto a menos que se fuerce', () => {
    const { rerender } = render(
      <UnderConstruction
        title="Tarjeta en desarrollo"
        variant="card"
      />
    );

    expect(screen.getByText(/tarjeta en desarrollo/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /volver al inicio/i })).not.toBeInTheDocument();

    rerender(
      <UnderConstruction
        title="Banner en desarrollo"
        variant="banner"
        showBackButton={true}
      />
    );

    expect(screen.getByText(/banner en desarrollo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toBeInTheDocument();
  });

  it('renderiza botones de acción secundarios (internos y externos)', () => {
    render(
      <UnderConstruction
        actionButton={{
          text: 'Contactar Soporte',
          href: 'mailto:contacto@residencialmexico.org',
          isExternal: true,
        }}
      />
    );

    const actionBtn = screen.getByRole('link', { name: /contactar soporte/i });
    expect(actionBtn).toBeInTheDocument();
    expect(actionBtn).toHaveAttribute('href', 'mailto:contacto@residencialmexico.org');
    expect(actionBtn).toHaveAttribute('target', '_blank');
  });

  it('funciona el alias EnConstruccion equivalentemente', () => {
    render(<EnConstruccion title="Alias Test" />);
    expect(screen.getByRole('heading', { level: 2, name: /alias test/i })).toBeInTheDocument();
  });
});
