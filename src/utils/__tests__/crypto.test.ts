import { describe, it, expect } from 'vitest';
import { calculateSha256, generateReceiptHash } from '@/utils/crypto';

describe('Crypto Utility - SHA-256 and Receipt Hashing', () => {
  it('calcula hashes SHA-256 deterministas', async () => {
    const input = 'ADESCO_RESIDENCIAL_MEXICO_2026';
    const hash1 = await calculateSha256(input);
    const hash2 = await calculateSha256(input);

    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64); // 64 hex characters for SHA-256
    expect(hash1).toBe(hash2);
  });

  it('genera un hash diferente cuando cambian los campos del recibo', async () => {
    const receipt1 = {
      correlativo: 'REC-001',
      concepto: 'Pago de cuota mensual #1',
      cantidad: 25.0,
      comprobante: 'https://ejemplo.com/comprobante1.pdf',
      fecha: '2026-09-03T12:00:00.000Z',
      prev_hash: '',
    };

    const receipt2 = {
      ...receipt1,
      cantidad: 30.0,
    };

    const hash1 = await generateReceiptHash(receipt1);
    const hash2 = await generateReceiptHash(receipt2);

    expect(hash1).not.toBe(hash2);
  });

  it('encadena correctamente prev_hash en el cálculo del nuevo hash', async () => {
    const receipt1 = {
      correlativo: 'REC-001',
      concepto: 'Cuota de agua',
      cantidad: 15.0,
      comprobante: null,
      fecha: '2026-09-01T10:00:00.000Z',
      prev_hash: '',
    };

    const hash1 = await generateReceiptHash(receipt1);

    const receipt2 = {
      correlativo: 'REC-002',
      concepto: 'Mantenimiento de bomba',
      cantidad: 120.0,
      comprobante: null,
      fecha: '2026-09-02T11:00:00.000Z',
      prev_hash: hash1, // Encadenamiento
    };

    const hash2 = await generateReceiptHash(receipt2);

    expect(hash2).toBeDefined();
    expect(hash2.length).toBe(64);
    expect(hash2).not.toBe(hash1);
  });
});
