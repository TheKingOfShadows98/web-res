import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFinanzas } from '@/hooks/useFinanzas';

const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe('useFinanzas Hook (Lógica de Negocio Financiera)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calcula métricas globales, totales del mes y agrupa conceptos correctamente', async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation((fields?: string) => {
        if (fields === 'cantidad') {
          return Promise.resolve({
            data: table === 'ingreso' ? [{ cantidad: 2000 }, { cantidad: 500 }] : [{ cantidad: 1000 }],
            error: null,
          });
        }
        return {
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data:
                table === 'ingreso'
                  ? [
                      {
                        id: 1,
                        correlativo: 'REC-01',
                        concepto: 'Cuota de Seguridad',
                        cantidad: 300,
                        fecha: '2026-09-05T10:00:00.000Z',
                        hash: 'hash1',
                        prev_hash: '',
                      },
                      {
                        id: 2,
                        correlativo: 'REC-02',
                        concepto: 'Cuota de Seguridad',
                        cantidad: 200,
                        fecha: '2026-09-05T11:00:00.000Z',
                        hash: 'hash2',
                        prev_hash: 'hash1',
                      },
                    ]
                  : [
                      {
                        id: 3,
                        correlativo: 'FAC-01',
                        concepto: 'Mantenimiento Bomba',
                        cantidad: 150,
                        fecha: '2026-09-06T15:00:00.000Z',
                        hash: 'hash3',
                        prev_hash: 'hash2',
                      },
                    ],
              error: null,
            }),
          }),
        };
      }),
    }));

    const { result } = renderHook(() => useFinanzas({ initialYear: 2026, initialMonth: 8 }));

    // Esperar a que cargue tanto el histórico como las transacciones del período
    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
      expect(result.current.balanceTotalHistorico).toBe(1500);
    });

    // 1. Métricas Globales Históricas: (2000 + 500) - 1000 = 1500 USD
    expect(result.current.totalIngresosHistoricos).toBe(2500);
    expect(result.current.totalEgresosHistoricos).toBe(1000);
    expect(result.current.balanceTotalHistorico).toBe(1500);

    // 2. Totales del Mes: Ingresos = 300 + 200 = 500, Gastos = 150, Balance = 350
    expect(result.current.totalIngresosMes).toBe(500);
    expect(result.current.totalEgresosMes).toBe(150);
    expect(result.current.balanceMes).toBe(350);

    // 3. Conceptos agrupados
    expect(result.current.conceptosIngresos).toHaveLength(1);
    expect(result.current.conceptosIngresos[0].concepto).toBe('Cuota de Seguridad');
    expect(result.current.conceptosIngresos[0].totalMonto).toBe(500);
    expect(result.current.conceptosIngresos[0].count).toBe(2);

    expect(result.current.conceptosEgresos).toHaveLength(1);
    expect(result.current.conceptosEgresos[0].concepto).toBe('Mantenimiento Bomba');
    expect(result.current.conceptosEgresos[0].totalMonto).toBe(150);

    // 4. Actividades diarias
    expect(result.current.dailyActivities).toHaveLength(2);

    // 5. Manejo de acordeón
    act(() => {
      result.current.toggleDayExpansion('05/09/2026');
    });
    expect(result.current.expandedDays.has('05/09/2026')).toBe(true);

    act(() => {
      result.current.toggleDayExpansion('05/09/2026');
    });
    expect(result.current.expandedDays.has('05/09/2026')).toBe(false);
  });

  it('permite cambiar de mes y año actualizando los estados', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockImplementation((fields?: string) => {
        if (fields === 'cantidad') {
          return Promise.resolve({ data: [], error: null });
        }
        return {
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }),
    }));

    const { result } = renderHook(() => useFinanzas({ initialYear: 2026, initialMonth: 0 }));

    await waitFor(() => {
      expect(result.current.loadingData).toBe(false);
    });

    act(() => {
      result.current.setSelectedMonth(5);
      result.current.setSelectedYear(2027);
    });

    expect(result.current.selectedMonth).toBe(5);
    expect(result.current.selectedYear).toBe(2027);
  });
});
