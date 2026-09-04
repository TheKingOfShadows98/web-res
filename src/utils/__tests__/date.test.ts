import { describe, it, expect } from 'vitest';
import { getGMT6MonthRange, getGMT6DayAndDate } from '@/utils/date';

describe('Date GMT-6 Utilities', () => {
  it('calcula correctamente el rango mensual en GMT-6 para Febrero 2026 (28 días)', () => {
    const range = getGMT6MonthRange(2026, 1); // Febrero (1)
    expect(range.lastDay).toBe(28);
    expect(range.startIso).toBe('2026-02-01T06:00:00.000Z');
    expect(range.endIso).toBe('2026-03-01T05:59:59.999Z');
  });

  it('calcula correctamente el rango mensual en GMT-6 para Septiembre 2026 (30 días)', () => {
    const range = getGMT6MonthRange(2026, 8); // Septiembre (8)
    expect(range.lastDay).toBe(30);
    expect(range.startIso).toBe('2026-09-01T06:00:00.000Z');
    expect(range.endIso).toBe('2026-10-01T05:59:59.999Z');
  });

  it('convierte una hora nocturna UTC a su día calendario local en GMT-6', () => {
    // 1 de Octubre a las 02:00:00 UTC corresponde a las 20:00:00 del 30 de Septiembre en GMT-6
    const info = getGMT6DayAndDate('2026-10-01T02:00:00.000Z');
    expect(info.day).toBe(30);
    expect(info.dateString).toBe('2026-09-30');
    expect(info.formattedDisplay).toBe('30/09/2026');
  });

  it('convierte una hora matutina UTC a su día calendario local en GMT-6', () => {
    // 1 de Septiembre a las 06:00:00 UTC corresponde a las 00:00:00 del 1 de Septiembre en GMT-6
    const info = getGMT6DayAndDate('2026-09-01T06:00:00.000Z');
    expect(info.day).toBe(1);
    expect(info.dateString).toBe('2026-09-01');
    expect(info.formattedDisplay).toBe('01/09/2026');
  });

  it('maneja fechas inválidas retornando un valor por defecto seguro', () => {
    const info = getGMT6DayAndDate('invalid-date');
    expect(info.day).toBe(1);
    expect(info.dateString).toBe('1970-01-01');
  });
});
