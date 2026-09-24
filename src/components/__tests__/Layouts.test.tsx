import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserLayout, { LayoutUsuario } from '@/components/UserLayout';
import AdminLayout, { LayoutAdministrador } from '@/components/AdminLayout';

// Mock de Next Navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/finanzas',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock de Supabase Client
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: { rol: 2 } }), // Administrador
        }),
      }),
    }),
  }),
}));

describe('UserLayout Component', () => {
  it('renderiza Navbar, contenido hijo y Footer por defecto', () => {
    render(
      <UserLayout>
        <div data-testid="user-child">Contenido del Portal Público</div>
      </UserLayout>
    );

    expect(screen.getByTestId('user-child')).toBeInTheDocument();
    expect(screen.getAllByText(/Residencial México/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: /reglamento y estatutos/i })).toBeInTheDocument();
    expect(screen.getByText(/Todos los derechos reservados/i)).toBeInTheDocument();
  });

  it('permite ocultar Navbar o Footer opcionalmente', () => {
    render(
      <LayoutUsuario hideNavbar={true} hideFooter={true}>
        <div data-testid="isolated-content">Vista Aislada</div>
      </LayoutUsuario>
    );

    expect(screen.getByTestId('isolated-content')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /reglamento y estatutos/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Todos los derechos reservados/i)).not.toBeInTheDocument();
  });
});

describe('AdminLayout Component', () => {
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

  it('renderiza la barra de navegación administrativa, enlaces principales y estado del sistema', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-01',
          email: 'junta@residencialmexico.org',
        },
      },
    });

    render(
      <AdminLayout>
        <div data-testid="admin-child">Contenido del Panel Admin</div>
      </AdminLayout>
    );

    expect(await screen.findByTestId('admin-child')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Verificamos enlaces de navegación (escritorio y móvil)
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);

    const finanzasLinks = screen.getAllByRole('link', { name: /finanzas & balance/i });
    expect(finanzasLinks.length).toBeGreaterThanOrEqual(1);

    const movimientosLinks = screen.getAllByRole('link', { name: /registrar movimiento/i });
    expect(movimientosLinks.length).toBeGreaterThanOrEqual(1);

    const usuariosLinks = screen.getAllByRole('link', { name: /usuarios & roles/i });
    expect(usuariosLinks.length).toBeGreaterThanOrEqual(1);

    // Enlace al portal público
    const portalLink = screen.getByRole('link', { name: /portal público/i });
    expect(portalLink).toBeInTheDocument();
    expect(portalLink).toHaveAttribute('href', '/');

    // Footer de administración
    expect(screen.getByText(/Sistema Electrónico ADESCO 2026/i)).toBeInTheDocument();
  });

  it('funciona el alias en español LayoutAdministrador', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(
      <LayoutAdministrador>
        <span>Test Alias Admin</span>
      </LayoutAdministrador>
    );

    expect(await screen.findByText('Test Alias Admin')).toBeInTheDocument();
  });
});
