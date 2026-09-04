import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuickStats from '@/components/QuickStats';

const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe('QuickStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calcula y renderiza el balance financiero, resumen del mes actual y botón a /finanzas', async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockImplementation((fields?: string) => {
        if (fields === 'cantidad') {
          return Promise.resolve({
            data: table === 'ingreso' ? [{ cantidad: 500 }, { cantidad: 250 }] : [{ cantidad: 150 }],
            error: null,
          });
        }
        return {
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: table === 'ingreso' ? [{ cantidad: 300 }] : [{ cantidad: 100 }],
              error: null,
            }),
          }),
        };
      }),
    }));

    render(<QuickStats />);

    // Balance General Total: 500 + 250 - 150 = 600 USD
    expect(await screen.findByText(/Fondo Comunitario y Balance Total/i)).toBeInTheDocument();
    expect(screen.getByText(/\$600\.00/i)).toBeInTheDocument();

    // Resumen del Mes en Curso (300 ingresos - 100 gastos = +200 balance)
    expect(screen.getByText(/Resumen del Mes en Curso/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresos del Mes/i)).toBeInTheDocument();
    expect(screen.getByText(/\+\$300\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Gastos del Mes/i)).toBeInTheDocument();
    expect(screen.getByText(/-\$100\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Balance del Mes/i)).toBeInTheDocument();
    expect(screen.getByText(/\+\$200\.00/i)).toBeInTheDocument();

    // Botón de enlace hacia /finanzas
    const financeLink = screen.getByRole('link', { name: /ver portal completo de finanzas/i });
    expect(financeLink).toBeInTheDocument();
    expect(financeLink).toHaveAttribute('href', '/finanzas');
  });
});
