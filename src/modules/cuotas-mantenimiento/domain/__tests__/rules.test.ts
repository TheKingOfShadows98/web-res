import { describe, it, expect } from 'vitest';
import { getActiveQuincena, determineVisualStatus } from '../rules';
import { QuincenaEnum, EstadoCuotaEnum, EstadoVisualCasaEnum } from '../enums';

describe('Reglas de Dominio: Cuotas de Mantenimiento', () => {
  describe('getActiveQuincena', () => {
    it('debe retornar PRIMERA quincena para días del 1 al 14', () => {
      const day1 = new Date(2026, 9, 1); // 1 de Octubre
      const day14 = new Date(2026, 9, 14); // 14 de Octubre

      expect(getActiveQuincena(day1)).toBe(QuincenaEnum.PRIMERA);
      expect(getActiveQuincena(day14)).toBe(QuincenaEnum.PRIMERA);
    });

    it('debe retornar SEGUNDA quincena para días a partir del 15', () => {
      const day15 = new Date(2026, 9, 15); // 15 de Octubre
      const day30 = new Date(2026, 9, 30); // 30 de Octubre

      expect(getActiveQuincena(day15)).toBe(QuincenaEnum.SEGUNDA);
      expect(getActiveQuincena(day30)).toBe(QuincenaEnum.SEGUNDA);
    });
  });

  describe('determineVisualStatus', () => {
    it('debe retornar AL_DIA (Verde) si el estado es PAGADA o ADELANTADA', () => {
      const resPagada = determineVisualStatus({
        quincenaAsignada: QuincenaEnum.PRIMERA,
        quincenaEvaluada: QuincenaEnum.PRIMERA,
        estadoCuota: EstadoCuotaEnum.PAGADA,
      });

      const resAdelantada = determineVisualStatus({
        quincenaAsignada: QuincenaEnum.SEGUNDA,
        quincenaEvaluada: QuincenaEnum.PRIMERA,
        estadoCuota: EstadoCuotaEnum.ADELANTADA,
      });

      expect(resPagada).toBe(EstadoVisualCasaEnum.AL_DIA);
      expect(resAdelantada).toBe(EstadoVisualCasaEnum.AL_DIA);
    });

    it('debe retornar OTRA_QUINCENA (Azul) si la casa no corresponde a la quincena evaluada', () => {
      const status = determineVisualStatus({
        quincenaAsignada: QuincenaEnum.SEGUNDA,
        quincenaEvaluada: QuincenaEnum.PRIMERA,
        estadoCuota: EstadoCuotaEnum.PENDIENTE,
      });

      expect(status).toBe(EstadoVisualCasaEnum.OTRA_QUINCENA);
    });

    it('debe retornar PENDIENTE (Ámbar) si la casa corresponde a la quincena activa y no ha pagado', () => {
      const status = determineVisualStatus({
        quincenaAsignada: QuincenaEnum.PRIMERA,
        quincenaEvaluada: QuincenaEnum.PRIMERA,
        estadoCuota: EstadoCuotaEnum.PENDIENTE,
      });

      expect(status).toBe(EstadoVisualCasaEnum.PENDIENTE);
    });
  });
});
