import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompletarRegistroPage from '@/app/completar-registro/page';
import { UserRole } from '@/app/entities/Recivos';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase Client
const mockGetSession = vi.fn();
const mockSetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUpdateUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      setSession: mockSetSession,
      onAuthStateChange: mockOnAuthStateChange,
      updateUser: mockUpdateUser,
    },
    from: mockFrom,
  }),
}));

describe('CompletarRegistroPage Component', () => {
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

  it('muestra mensaje de enlace expirado si se detecta error en los parámetros', async () => {
    window.history.pushState(
      {},
      'Test',
      '/completar-registro#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    );

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<CompletarRegistroPage />);

    expect(await screen.findByText(/Enlace de Invitación Expirado o Inválido/i)).toBeInTheDocument();
    expect(screen.getByText(/Email link is invalid or has expired/i)).toBeInTheDocument();
  });

  it('permite al usuario completar su nombre, teléfono y contraseña cuando la invitación es válida', async () => {
    window.history.pushState({}, 'Test', '/completar-registro');

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'invited-user-id',
            email: 'invitado@resmex.com',
            user_metadata: { rol: UserRole.COLABORADOR },
          },
        },
      },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { nombre: 'Usuario Invitado', telefono: '', rol: UserRole.COLABORADOR },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    mockUpdateUser.mockResolvedValue({ data: {}, error: null });

    render(<CompletarRegistroPage />);

    expect(await screen.findByText(/Completa tu Cuenta/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('invitado@resmex.com')).toBeInTheDocument();

    const nombreInput = screen.getByPlaceholderText('Ej. Juan Pérez');
    const telInput = screen.getByPlaceholderText('Ej. +503 7000-0000');
    const passInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmPassInput = screen.getByPlaceholderText('Repite la contraseña');

    fireEvent.change(nombreInput, { target: { value: 'Juan Pérez' } });
    fireEvent.change(telInput, { target: { value: '+503 7000-1111' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /finalizar y crear cuenta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'password123',
        data: {
          nombre: 'Juan Pérez',
          telefono: '+503 7000-1111',
        },
      });
    });

    expect(await screen.findByText(/¡Cuenta Creada Exitosamente!/i)).toBeInTheDocument();
  });

  it('extrae el token del hash y establece la sesión del usuario invitado', async () => {
    window.history.pushState(
      {},
      'Test',
      '/completar-registro#access_token=token-123&refresh_token=refresh-123&type=invite'
    );

    mockSetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'invited-via-hash',
            email: 'nuevo-invitado@resmex.com',
            user_metadata: { rol: UserRole.AUDITOR },
          },
        },
      },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { nombre: '', telefono: '', rol: UserRole.AUDITOR },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    render(<CompletarRegistroPage />);

    expect(await screen.findByText(/Completa tu Cuenta/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('nuevo-invitado@resmex.com')).toBeInTheDocument();
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'token-123',
      refresh_token: 'refresh-123',
    });
  });
});
