import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MonthlyFinanceChart from '@/components/finance/MonthlyFinanceChart';

// Mock de ResponsiveContainer de Recharts para entorno jsdom
vi.mock('recharts', async () => {
  const originalModule = await vi.importActual('recharts');
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe('MonthlyFinanceChart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente los selectores de mes y año (con soporte >= 2025)', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    }));

    render(<MonthlyFinanceChart initialYear={2026} initialMonth={0} />);

    // Selector de Mes
    const selectMes = screen.getByLabelText(/seleccionar mes/i);
    expect(selectMes).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Enero' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Diciembre' })).toBeInTheDocument();

    // Selector de Año
    const selectAnio = screen.getByLabelText(/seleccionar año/i);
    expect(selectAnio).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2025' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2026' })).toBeInTheDocument();
  });

  it('calcula y muestra en grande el balance al final del mes seleccionado', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ingreso') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [
                  { cantidad: 1200, fecha: '2026-03-05T12:00:00.000Z' },
                  { cantidad: 800, fecha: '2026-03-20T12:00:00.000Z' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'egreso') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [
                  { cantidad: 500, fecha: '2026-03-10T12:00:00.000Z' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    render(<MonthlyFinanceChart initialYear={2026} initialMonth={2} />); // Marzo 2026

    // Total Ingresos: 2000, Total Egresos: 500 -> Balance: +1500 USD
    expect(await screen.findByText(/Rendimiento Mensual: Marzo 2026/i)).toBeInTheDocument();
    expect(await screen.findByText(/\$1,500\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/\+\$2,000\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/-\$500\.00/i)).toBeInTheDocument();
  });

  it('actualiza los datos cuando el usuario cambia de mes o año', async () => {
    let currentMonthQuery = -1;

    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockImplementation((_field: string, startIso: string) => {
          const date = new Date(startIso);
          currentMonthQuery = date.getUTCMonth();
          return {
            lte: vi.fn().mockResolvedValue({
              data: [
                { cantidad: currentMonthQuery === 1 ? 950 : 100, fecha: startIso },
              ],
              error: null,
            }),
          };
        }),
      }),
    }));

    render(<MonthlyFinanceChart initialYear={2026} initialMonth={0} />); // Enero

    const selectMes = screen.getByLabelText(/seleccionar mes/i);
    fireEvent.change(selectMes, { target: { value: '1' } }); // Cambiar a Febrero (1)

    await waitFor(() => {
      expect(screen.getByText(/Rendimiento Mensual: Febrero 2026/i)).toBeInTheDocument();
    });
  });

  it('en modo controlado oculta los selectores duplicados y responde a los props year y month del padre', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({
            data: [{ cantidad: 500, fecha: '2026-05-15T12:00:00.000Z' }],
            error: null,
          }),
        }),
      }),
    }));

    const { rerender } = render(<MonthlyFinanceChart year={2026} month={4} hideFilterControls={true} />); // Mayo 2026

    // No debe mostrar los selectores internos
    expect(screen.queryByLabelText(/seleccionar mes/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/seleccionar año/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/Rendimiento Mensual: Mayo 2026/i)).toBeInTheDocument();

    // Actualizar props desde el componente padre
    rerender(<MonthlyFinanceChart year={2026} month={9} hideFilterControls={true} />); // Octubre 2026
    expect(await screen.findByText(/Rendimiento Mensual: Octubre 2026/i)).toBeInTheDocument();
  });
});
