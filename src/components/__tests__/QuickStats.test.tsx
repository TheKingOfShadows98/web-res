import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuickStats from '@/components/QuickStats';

const mockFrom = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

describe('QuickStats Component', () => {
  it('calcula y renderiza el balance financiero real de ingresos menos egresos', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ingreso') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ cantidad: 500 }, { cantidad: 250 }],
            error: null,
          }),
        };
      }
      if (table === 'egreso') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ cantidad: 150 }],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    render(<QuickStats />);

    // 500 + 250 - 150 = 600 USD
    expect(await screen.findByText(/Fondo Comunitario y Balance Actual/i)).toBeInTheDocument();
    expect(screen.getByText(/\$600\.00/i)).toBeInTheDocument();
  });
});
