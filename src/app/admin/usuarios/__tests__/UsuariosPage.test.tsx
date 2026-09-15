import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsuariosPage from '@/app/admin/usuarios/page';
import { UserRole } from '@/app/entities/Recivos';

// Mock de Supabase Client
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

describe('UsuariosPage Component', () => {
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

  it('permite al Owner ver la lista y el botón de invitar usuario', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-owner', email: 'zoe@resmex.com' },
      },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockImplementation((fields: string) => {
            if (fields === 'rol') {
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { rol: UserRole.OWNER },
                    error: null,
                  }),
                }),
              };
            }
            return {
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'user-owner', nombre: 'Zoe (Owner)', correo: 'zoe@resmex.com', rol: UserRole.OWNER, telefono: '7777-7777' },
                  { id: 'user-2', nombre: 'Carlos Miembro', correo: 'carlos@resmex.com', rol: UserRole.MIEMBRO, telefono: '7000-0000' },
                ],
                error: null,
              }),
            };
          }),
        };
      }
      return { select: vi.fn() };
    });

    render(<UsuariosPage />);

    expect(await screen.findByText(/Gestión de Usuarios y Roles/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invitar usuario/i })).toBeInTheDocument();
    expect(await screen.findByText(/Zoe \(Owner\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Carlos Miembro/i)).toBeInTheDocument();
  });

  it('abre el modal y envía la invitación a la API', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-owner', email: 'zoe@resmex.com' },
      },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockImplementation((fields: string) => {
            if (fields === 'rol') {
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { rol: UserRole.OWNER },
                    error: null,
                  }),
                }),
              };
            }
            return {
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }),
        };
      }
      return { select: vi.fn() };
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Invitación enviada' }),
    });
    global.fetch = mockFetch;

    render(<UsuariosPage />);

    const inviteBtn = await screen.findByRole('button', { name: /invitar usuario/i });
    fireEvent.click(inviteBtn);

    expect(screen.getByText(/Invitar Nuevo Usuario/i)).toBeInTheDocument();
    expect(screen.getByText(/15 minutos/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('usuario@resmex.com');
    fireEvent.change(emailInput, { target: { value: 'nuevo@resmex.com' } });

    const submitBtn = screen.getByRole('button', { name: /enviar invitación/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/invite', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'nuevo@resmex.com', rol: UserRole.MIEMBRO }),
      }));
    });
  });

  it('permite eliminar un usuario abriendo el modal de confirmación según la jerarquía', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-admin', email: 'admin@resmex.com' },
      },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockImplementation((fields: string) => {
            if (fields === 'rol') {
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { rol: UserRole.ADMINISTRADOR },
                    error: null,
                  }),
                }),
              };
            }
            return {
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'user-admin', nombre: 'Admin User', correo: 'admin@resmex.com', rol: UserRole.ADMINISTRADOR, telefono: '' },
                  { id: 'user-miembro', nombre: 'Carlos Miembro', correo: 'carlos@resmex.com', rol: UserRole.MIEMBRO, telefono: '' },
                  { id: 'user-owner', nombre: 'Zoe Owner', correo: 'zoe@resmex.com', rol: UserRole.OWNER, telefono: '' },
                ],
                error: null,
              }),
            };
          }),
        };
      }
      return { select: vi.fn() };
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Usuario eliminado' }),
    });
    global.fetch = mockFetch;

    render(<UsuariosPage />);

    // El Administrador debe ver botón de eliminar en Miembro, pero NO en sí mismo ni en Owner
    const deleteMiembroBtn = await screen.findByRole('button', { name: /eliminar a carlos miembro/i });
    expect(deleteMiembroBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar a zoe owner/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar a admin user/i })).not.toBeInTheDocument();

    // Clic en eliminar
    fireEvent.click(deleteMiembroBtn);

    expect(screen.getByText(/¿Eliminar Usuario\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Estás a punto de eliminar la cuenta de/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /sí, eliminar usuario/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-miembro', {
        method: 'DELETE',
      });
    });
  });

  it('muestra modo auditoría (solo lectura) cuando el usuario es Auditor', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-auditor', email: 'auditor@resmex.com' },
      },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockImplementation((fields: string) => {
            if (fields === 'rol') {
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { rol: UserRole.AUDITOR },
                    error: null,
                  }),
                }),
              };
            }
            return {
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'user-1', nombre: 'Zoe (Owner)', correo: 'zoe@resmex.com', rol: UserRole.OWNER, telefono: '' },
                ],
                error: null,
              }),
            };
          }),
        };
      }
      return { select: vi.fn() };
    });

    render(<UsuariosPage />);

    expect(await screen.findByText(/Modo Auditoría \(Solo Lectura\)/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /invitar usuario/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar a zoe/i })).not.toBeInTheDocument();
  });

  it('bloquea el acceso con mensaje de permisos insuficientes si el usuario es Miembro', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-miembro', email: 'vecino@resmex.com' },
      },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { rol: UserRole.MIEMBRO },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    render(<UsuariosPage />);

    expect(await screen.findByText(/Permisos Insuficientes/i)).toBeInTheDocument();
    expect(screen.getByText(/Tu cuenta actual tiene el rol de/i)).toBeInTheDocument();
  });
});
