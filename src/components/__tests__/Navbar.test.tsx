import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';

describe('Navbar Component', () => {
  it('renderiza correctamente el título de la ADESCO y el logo', () => {
    render(<Navbar onOpenPortal={() => {}} />);
    expect(screen.getByText(/ADESCO Residencial México/i)).toBeInTheDocument();
    expect(screen.getByText('RM')).toBeInTheDocument();
  });

  it('renderiza el botón de Ingresar con enlace a /admin', () => {
    render(<Navbar onOpenPortal={() => {}} />);
    const loginLink = screen.getByRole('link', { name: /ingresar/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/admin');
  });

  it('ejecuta la función onOpenPortal al presionar el botón Acceso Vecinal', () => {
    const handleOpenPortal = vi.fn();
    render(<Navbar onOpenPortal={handleOpenPortal} />);
    const vecinalBtn = screen.getByRole('button', { name: /acceso vecinal/i });
    fireEvent.click(vecinalBtn);
    expect(handleOpenPortal).toHaveBeenCalledTimes(1);
  });
});
