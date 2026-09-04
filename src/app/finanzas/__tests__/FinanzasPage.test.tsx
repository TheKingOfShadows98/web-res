import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FinanzasPage from '@/app/finanzas/page';

vi.mock('@/components/finance/MonthlyFinanceChart', () => ({
  default: () => <div data-testid="mock-monthly-chart">Monthly Finance Chart Mock</div>,
}));

vi.mock('@/components/Navbar', () => ({
  default: () => <nav data-testid="mock-navbar">Navbar Mock</nav>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="mock-footer">Footer Mock</footer>,
}));

const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe('FinanzasPage Component (/finanzas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza métricas globales, selector de período y ambas tablas de conceptos agrupados', async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation((fields?: string) => {
        if (fields === 'cantidad') {
          return Promise.resolve({
            data: table === 'ingreso' ? [{ cantidad: 1000 }, { cantidad: 500 }] : [{ cantidad: 300 }],
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
                        correlativo: 'REC-001',
                        concepto: 'Cuota de agua comunal',
                        cantidad: 500,
                        fecha: '2026-09-02T10:00:00.000Z',
                        hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
                        prev_hash: '',
                      },
                    ]
                  : [
                      {
                        id: 2,
                        correlativo: 'FAC-002',
                        concepto: 'Reparación de luminaria',
                        cantidad: 150,
                        fecha: '2026-09-02T14:00:00.000Z',
                        hash: 'f9e8d7c6b5a43210fedcba1234567890fedcba1234567890fedcba1234567890',
                        prev_hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
                      },
                    ],
              error: null,
            }),
          }),
        };
      }),
    }));

    render(<FinanzasPage />);

    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-monthly-chart')).toBeInTheDocument();

    expect(screen.getByText(/Finanzas y Transparencia/i)).toBeInTheDocument();

    // Métricas globales históricas (1500 - 300 = 1200 USD)
    expect(await screen.findByText(/Fondo Comunitario Disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,200\.00/i)).toBeInTheDocument();

    // Tablas de Conceptos de Ingresos y Gastos (agrupadas)
    expect(screen.getByText(/Conceptos de Ingresos \(/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuota de agua comunal/i)).toBeInTheDocument();

    expect(screen.getByText(/Conceptos de Gastos \(/i)).toBeInTheDocument();
    expect(screen.getByText(/Reparación de luminaria/i)).toBeInTheDocument();

    // Tabla de Flujo de Caja por Día con acordeón
    expect(screen.getByText(/Flujo de Caja por Día/i)).toBeInTheDocument();
    const dayRows = screen.getAllByText(/02\/09\/2026/i);
    expect(dayRows.length).toBeGreaterThanOrEqual(1);

    // Hacer clic en la fila del día para desplegar movimientos individuales con hash y correlativo
    fireEvent.click(dayRows[dayRows.length - 1]);

    expect(await screen.findByRole('heading', { name: /desglose de transacciones/i })).toBeInTheDocument();
    expect(screen.getByText(/#REC-001/i)).toBeInTheDocument();
    expect(screen.getByText(/#FAC-002/i)).toBeInTheDocument();
  });

  it('agrupa conceptos repetidos sumando montos y segrega entre ingresos y gastos', async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation((fields?: string) => {
        if (fields === 'cantidad') {
          return Promise.resolve({ data: [], error: null });
        }
        return {
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data:
                table === 'ingreso'
                  ? [
                      { id: 1, correlativo: 'REC-01', concepto: 'Mantenimiento General', cantidad: 300, fecha: '2026-09-01T10:00:00.000Z' },
                      { id: 2, correlativo: 'REC-02', concepto: 'mantenimiento general', cantidad: 200, fecha: '2026-09-02T10:00:00.000Z' },
                      { id: 3, correlativo: 'REC-03', concepto: 'Alquiler Salón', cantidad: 100, fecha: '2026-09-03T10:00:00.000Z' },
                    ]
                  : [
                      { id: 4, correlativo: 'FAC-01', concepto: 'Mantenimiento General', cantidad: 150, fecha: '2026-09-01T14:00:00.000Z' },
                    ],
              error: null,
            }),
          }),
        };
      }),
    }));

    render(<FinanzasPage />);

    // En Ingresos: Mantenimiento General agrupado = 300 + 200 = $500 (2 aportes)
    expect(await screen.findByText(/\+\$500\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/2 aportes/i)).toBeInTheDocument();
    expect(screen.getByText(/Alquiler Salón/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\+\$100\.00/i).length).toBeGreaterThanOrEqual(1);

    // En Gastos: Mantenimiento General segregado en la tabla de gastos = $150
    expect(screen.getByText(/-\$150\.00/i)).toBeInTheDocument();
  });
});
