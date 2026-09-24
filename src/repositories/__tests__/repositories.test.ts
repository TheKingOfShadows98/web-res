import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanzasRepository } from '@/repositories/finanzas.repository';
import { UsuariosRepository } from '@/repositories/usuarios.repository';
import { UserRole } from '@/app/entities/Recivos';

describe('Repositories Layer', () => {
  let mockSelect: any;
  let mockInsert: any;
  let mockUpdate: any;
  let mockDelete: any;
  let mockUpsert: any;
  let mockOrder: any;
  let mockLimit: any;
  let mockGte: any;
  let mockLte: any;
  let mockEq: any;
  let mockMaybeSingle: any;
  let mockSingle: any;
  let mockFrom: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMaybeSingle = vi.fn();
    mockSingle = vi.fn();
    mockLimit = vi.fn();
    mockLte = vi.fn();
    mockGte = vi.fn().mockReturnValue({ lte: mockLte });
    mockEq = vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    });
    mockOrder = vi.fn().mockReturnValue({
      limit: mockLimit,
    });
    mockSelect = vi.fn().mockReturnValue({
      gte: mockGte,
      order: mockOrder,
      eq: mockEq,
    });
    mockInsert = vi.fn();
    mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn() });
    mockDelete = vi.fn().mockReturnValue({ eq: vi.fn() });
    mockUpsert = vi.fn();

    mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
    });

    mockSupabase = {
      from: mockFrom,
    } as any;
  });

  describe('FinanzasRepository', () => {
    it('getGlobalMetrics calcula balance total acumulado', async () => {
      mockFrom.mockImplementation((table: string) => ({
        select: vi.fn().mockResolvedValue({
          data: table === 'ingreso' ? [{ cantidad: 500 }, { cantidad: 200 }] : [{ cantidad: 300 }],
          error: null,
        }),
      }));

      const repo = new FinanzasRepository(mockSupabase);
      const metrics = await repo.getGlobalMetrics();

      expect(metrics.totalIngresos).toBe(700);
      expect(metrics.totalEgresos).toBe(300);
      expect(metrics.balanceTotal).toBe(400);
    });

    it('getIngresosByRange mapea correctamente los campos y tipo ingreso', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 10,
                  correlativo: 'REC-10',
                  concepto: 'Cuota Comunal',
                  cantidad: 40,
                  comprobante: 'https://comprobante.pdf',
                  fecha: '2026-09-01T00:00:00Z',
                  hash: 'hash-abc',
                  prev_hash: 'hash-prev',
                },
              ],
              error: null,
            }),
          }),
        }),
      }));

      const repo = new FinanzasRepository(mockSupabase);
      const records = await repo.getIngresosByRange('2026-09-01T00:00:00Z', '2026-09-30T23:59:59Z');

      expect(records).toHaveLength(1);
      expect(records[0].tipo).toBe('ingreso');
      expect(records[0].correlativo).toBe('REC-10');
      expect(records[0].cantidad).toBe(40);
      expect(records[0].hash).toBe('hash-abc');
    });

    it('getLastMovementHash obtiene el hash del registro más reciente', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ hash: 'latest-hash-123' }],
              error: null,
            }),
          }),
        }),
      }));

      const repo = new FinanzasRepository(mockSupabase);
      const hash = await repo.getLastMovementHash('ingresos');

      expect(hash).toBe('latest-hash-123');
    });

    it('createIngreso y createEgreso llaman a insert con la tabla respectiva', async () => {
      const repo = new FinanzasRepository(mockSupabase);

      mockInsert.mockResolvedValue({ error: null });

      await repo.createIngreso({
        concepto: 'Pago Seguridad',
        cantidad: 35,
        correlativo: 'REC-01',
      });

      expect(mockFrom).toHaveBeenCalledWith('ingreso');
      expect(mockInsert).toHaveBeenCalled();

      await repo.createEgreso({
        concepto: 'Reparación Tubo',
        cantidad: 80,
      });

      expect(mockFrom).toHaveBeenCalledWith('egreso');
    });
  });

  describe('UsuariosRepository', () => {
    it('getUserProfile obtiene perfil por ID', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'u-1',
                nombre: 'Ana Lopez',
                correo: 'ana@adesco.org',
                rol: UserRole.ADMINISTRADOR,
                telefono: '7777-8888',
              },
              error: null,
            }),
          }),
        }),
      });

      const repo = new UsuariosRepository(mockSupabase);
      const profile = await repo.getUserProfile('u-1');

      expect(profile).not.toBeNull();
      expect(profile?.nombre).toBe('Ana Lopez');
      expect(profile?.rol).toBe(UserRole.ADMINISTRADOR);
    });

    it('getUserRole retorna MIEMBRO cuando no se encuentra o hay error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const repo = new UsuariosRepository(mockSupabase);
      const role = await repo.getUserRole('unknown-user');

      expect(role).toBe(UserRole.MIEMBRO);
    });

    it('updateUserRole actualiza el rol numérico', async () => {
      const mockEqUpdate = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: mockEqUpdate }),
      });

      const repo = new UsuariosRepository(mockSupabase);
      await repo.updateUserRole('u-2', UserRole.AUDITOR);

      expect(mockFrom).toHaveBeenCalledWith('usuario');
      expect(mockEqUpdate).toHaveBeenCalledWith('id', 'u-2');
    });

    it('deleteUserProfile elimina el usuario de la tabla pública', async () => {
      const mockEqDelete = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: mockEqDelete }),
      });

      const repo = new UsuariosRepository(mockSupabase);
      await repo.deleteUserProfile('u-delete');

      expect(mockFrom).toHaveBeenCalledWith('usuario');
      expect(mockEqDelete).toHaveBeenCalledWith('id', 'u-delete');
    });
  });
});
