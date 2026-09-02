import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      signUp: vi.fn(),
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

  it('permite al Owner ver la lista y el botón de crear usuario', async () => {
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
    expect(screen.getByRole('button', { name: /crear nuevo usuario/i })).toBeInTheDocument();
    expect(await screen.findByText(/Zoe \(Owner\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/Carlos Miembro/i)).toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: /crear nuevo usuario/i })).not.toBeInTheDocument();
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
