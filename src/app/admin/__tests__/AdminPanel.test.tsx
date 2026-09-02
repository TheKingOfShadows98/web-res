import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminHubPage from '@/app/admin/page';

// Mock del cliente de Supabase
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}));

describe('AdminHubPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it('muestra el formulario de acceso cuando el usuario no está autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(<AdminHubPage />);

    expect(await screen.findByText(/Acceso Administrativo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin@adesco.org/i)).toBeInTheDocument();
  });

  it('muestra el panel de administración con el botón a Finanzas cuando el usuario está autenticado', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'directiva@adesco.org',
        },
      },
    });

    render(<AdminHubPage />);

    expect(await screen.findByText(/Panel de Administración ADESCO/i)).toBeInTheDocument();
    expect(screen.getByText(/directiva@adesco.org/i)).toBeInTheDocument();

    // Validar botón a Finanzas
    const finanzasBtn = screen.getByRole('link', { name: /ver dashboard financiero/i });
    expect(finanzasBtn).toBeInTheDocument();
    expect(finanzasBtn).toHaveAttribute('href', '/admin/finanzas');

    // Validar botón de registro de recibo
    const recibosBtn = screen.getByRole('link', { name: /registrar movimiento \/ recibo/i });
    expect(recibosBtn).toBeInTheDocument();
    expect(recibosBtn).toHaveAttribute('href', '/admin/finanzas/recivos');

    // Validar enlace al sitio principal
    const homeBtn = screen.getByRole('link', { name: /ir al sitio principal/i });
    expect(homeBtn).toBeInTheDocument();
    expect(homeBtn).toHaveAttribute('href', '/');
  });
});
