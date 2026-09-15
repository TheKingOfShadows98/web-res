import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/admin/users/[id]/route';
import { UserRole } from '@/app/entities/Recivos';

// Mocks
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockDeleteUser = vi.fn();
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
        deleteUser: mockDeleteUser,
      },
    },
    from: mockAdminFrom,
  }),
}));

describe('DELETE /api/admin/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 si el solicitante intenta eliminarse a sí mismo', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/users/admin-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'admin-1' }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/no puedes eliminar tu propia cuenta/i);
  });

  it('bloquea (403) si un Administrador intenta eliminar a otro Administrador o Auditor', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    // Rol del solicitante: Administrador
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

    // Rol del objetivo: Auditor
    mockAdminFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'target-auditor', rol: UserRole.AUDITOR, correo: 'auditor@resmex.com' },
            error: null,
          }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/users/target-auditor', {
      method: 'DELETE',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'target-auditor' }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toMatch(/permisos insuficientes/i);
  });

  it('permite a un Administrador eliminar a un Miembro o Colaborador', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
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

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'target-miembro', rol: UserRole.MIEMBRO, correo: 'vecino@resmex.com' },
                error: null,
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    mockDeleteUser.mockResolvedValue({ error: null });

    const req = new NextRequest('http://localhost:3000/api/admin/users/target-miembro', {
      method: 'DELETE',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'target-miembro' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockDeleteUser).toHaveBeenCalledWith('target-miembro');
  });

  it('permite al Owner eliminar a un Administrador', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'owner-1' } },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { rol: UserRole.OWNER },
            error: null,
          }),
        }),
      }),
    });

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'usuario') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'target-admin', rol: UserRole.ADMINISTRADOR, correo: 'admin@resmex.com' },
                error: null,
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    mockDeleteUser.mockResolvedValue({ error: null });

    const req = new NextRequest('http://localhost:3000/api/admin/users/target-admin', {
      method: 'DELETE',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'target-admin' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockDeleteUser).toHaveBeenCalledWith('target-admin');
  });
});
