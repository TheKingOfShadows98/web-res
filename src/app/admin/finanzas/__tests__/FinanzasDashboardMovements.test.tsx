import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FinanzasDashboard from '@/app/admin/finanzas/page';

vi.mock('@/components/finance/MonthlyFinanceChart', () => ({
  default: () => <div data-testid="mock-monthly-chart">Monthly Chart Mock</div>,
}));

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: mockFrom,
  }),
}));

describe('FinanzasDashboard - Vista Desplegable de Movimientos', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-123',
          email: 'admin@resmex.com',
        },
      },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    });

    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation((fields?: string) => {
        if (fields === 'cantidad') {
          return Promise.resolve({
            data: table === 'ingreso' ? [{ cantidad: 50.0 }] : [{ cantidad: 20.0 }],
            error: null,
          });
        }
        return {
          gte: vi.fn().mockResolvedValue({
            data:
              table === 'ingreso'
                ? [
                    {
                      id: 1,
                      correlativo: 'REC-001',
                      concepto: 'Pago de cuota de mantenimiento',
                      cantidad: 50.0,
                      fecha: '2026-09-02T10:00:00.000Z',
                      hash: 'a1b2c3d4e5f678901234567890abcdefa1b2c3d4e5f678901234567890abcdef',
                      prev_hash: '',
                    },
                  ]
                : [
                    {
                      id: 2,
                      correlativo: 'FAC-999',
                      concepto: 'Compra de bombillos LED',
                      cantidad: 20.0,
                      fecha: '2026-09-02T15:00:00.000Z',
                      hash: 'f9e8d7c6b5a432109876543210fedcbaf9e8d7c6b5a432109876543210fedcba',
                      prev_hash: 'a1b2c3d4e5f678901234567890abcdefa1b2c3d4e5f678901234567890abcdef',
                    },
                  ],
            error: null,
          }),
        };
      }),
    }));
  });

  it('despliega los detalles de movimientos con correlativo, concepto, monto y hash al hacer clic en el día', async () => {
    render(<FinanzasDashboard />);

    // Esperar a que cargue el dashboard
    expect(await screen.findByText(/Flujo de Caja por Día/i)).toBeInTheDocument();

    // Encontrar la fila del día 02/09/2026
    const dayRow = screen.getByText(/02\/09\/2026/i);
    expect(dayRow).toBeInTheDocument();

    // Antes del clic, los detalles del desglose no deben estar visibles
    expect(screen.queryByRole('heading', { name: /desglose de transacciones/i })).not.toBeInTheDocument();

    // Hacer clic en la fila del día para expandir
    fireEvent.click(dayRow);

    // Verificar que aparece el desglose con los movimientos
    expect(await screen.findByRole('heading', { name: /desglose de transacciones/i })).toBeInTheDocument();
    expect(screen.getByText(/#REC-001/i)).toBeInTheDocument();
    expect(screen.getByText(/Pago de cuota de mantenimiento/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\+.*50\.00/i).length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/#FAC-999/i)).toBeInTheDocument();
    expect(screen.getByText(/Compra de bombillos LED/i)).toBeInTheDocument();
    expect(screen.getAllByText(/-.*20\.00/i).length).toBeGreaterThanOrEqual(1);
  });
});
