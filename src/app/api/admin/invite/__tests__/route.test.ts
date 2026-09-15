import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/invite/route';
import { UserRole } from '@/app/entities/Recivos';

// Mocks de Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockInviteUserByEmail = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        inviteUserByEmail: mockInviteUserByEmail,
      },
    },
    from: mockAdminFrom,
  }),
}));

describe('POST /api/admin/invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 401 si no hay usuario autenticado', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('No session'),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@resmex.com', rol: UserRole.MIEMBRO }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toMatch(/no autorizado/i);
  });

  it('retorna 403 si el usuario no tiene rol de Administrador ni Owner', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-miembro' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { rol: UserRole.MIEMBRO },
            error: null,
          }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@resmex.com', rol: UserRole.MIEMBRO }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toMatch(/permisos insuficientes/i);
  });

  it('permite al Administrador enviar una invitación exitosamente', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { rol: UserRole.ADMINISTRADOR },
            error: null,
          }),
        }),
      }),
    });

    mockInviteUserByEmail.mockResolvedValue({
      data: { user: { id: 'new-user-id', email: 'invitado@resmex.com' } },
      error: null,
    });

    mockAdminFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      headers: {
        origin: 'https://residencial-mexico.com',
      },
      body: JSON.stringify({ email: 'invitado@resmex.com', rol: UserRole.COLABORADOR }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockInviteUserByEmail).toHaveBeenCalledWith('invitado@resmex.com', {
      data: {
        rol: UserRole.COLABORADOR,
        invitado_por: 'admin-id',
      },
      redirectTo: 'https://residencial-mexico.com/completar-registro',
    });
  });
});
