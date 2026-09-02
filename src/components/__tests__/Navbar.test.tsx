import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';

describe('Navbar Component', () => {
  it('renderiza correctamente el título de la ADESCO y el logo', () => {
    render(<Navbar />);
    expect(screen.getByText(/ADESCO Residencial México/i)).toBeInTheDocument();
    expect(screen.getByText('RM')).toBeInTheDocument();
  });

  it('renderiza el botón de Ingresar con enlace a /admin', () => {
    render(<Navbar />);
    const loginLink = screen.getByRole('link', { name: /ingresar/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/admin');
  });

  it('no muestra el botón de Acceso Vecinal', () => {
    render(<Navbar />);
    expect(screen.queryByRole('button', { name: /acceso vecinal/i })).not.toBeInTheDocument();
  });
});
