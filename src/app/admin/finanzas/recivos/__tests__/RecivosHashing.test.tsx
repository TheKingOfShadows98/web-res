import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecivosPage from '@/app/admin/finanzas/recivos/page';

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit,
        }),
      }),
    })),
  }),
}));

describe('RecivosPage - Correlativo y Firma Criptográfica Hash', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-123',
          email: 'tesoreria@resmex.com',
        },
      },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    });

    mockLimit.mockResolvedValue({
      data: [{ hash: 'prev_hash_1234567890abcdef' }],
      error: null,
    });

    mockInsert.mockResolvedValue({ error: null });
  });

  it('renderiza el campo de correlativo y NO muestra campos de hash o prev_hash al usuario', async () => {
    render(<RecivosPage />);

    expect(await screen.findByLabelText(/nº correlativo \/ recibo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/concepto \/ descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cantidad \(\$\)/i)).toBeInTheDocument();

    // Validar que los hashes están ocultos y no existen como inputs
    expect(screen.queryByLabelText(/hash/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/prev_hash/i)).not.toBeInTheDocument();
  });

  it('al enviar el formulario, obtiene prev_hash, genera el hash firmado e inserta en Supabase', async () => {
    render(<RecivosPage />);

    const correlativoInput = await screen.findByLabelText(/nº correlativo \/ recibo/i);
    const conceptoInput = screen.getByLabelText(/concepto \/ descripción/i);
    const cantidadInput = screen.getByLabelText(/cantidad \(\$\)/i);

    fireEvent.change(correlativoInput, { target: { value: 'REC-2026-045' } });
    fireEvent.change(conceptoInput, { target: { value: 'Cuota de seguridad comunitaria' } });
    fireEvent.change(cantidadInput, { target: { value: '35.50' } });

    const submitButtons = screen.getAllByRole('button', { name: /registrar ingreso/i });
    const submitBtn = submitButtons.find((btn) => btn.getAttribute('type') === 'submit') || submitButtons[1];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });

    const insertedData = mockInsert.mock.calls[0][0][0];
    expect(insertedData.correlativo).toBe('REC-2026-045');
    expect(insertedData.concepto).toBe('Cuota de seguridad comunitaria');
    expect(insertedData.cantidad).toBe(35.5);
    expect(insertedData.prev_hash).toBe('prev_hash_1234567890abcdef');
    expect(insertedData.hash).toBeDefined();
    expect(insertedData.hash.length).toBe(64); // SHA-256 hex string
  });
});
