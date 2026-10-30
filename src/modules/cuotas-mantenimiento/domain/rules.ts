/**
 * @file rules.ts
 * @description Reglas de negocio puras para el cálculo de quincenas y estados visuales de recolección.
 */

import { QuincenaEnum, EstadoCuotaEnum, EstadoVisualCasaEnum } from './enums';

/**
 * Obtiene la quincena activa correspondiente a una fecha determinada.
 * - Del día 1 al 14: PRIMERA quincena.
 * - Del día 15 en adelante: SEGUNDA quincena.
 */
export function getActiveQuincena(date: Date = new Date()): QuincenaEnum {
  const day = date.getDate();
  return day >= 15 ? QuincenaEnum.SEGUNDA : QuincenaEnum.PRIMERA;
}

/**
 * Calcula el estado visual para el tablero de recolección:
 * - AL_DIA (Verde): La cuota ya está pagada o adelantada en el ciclo actual.
 * - OTRA_QUINCENA (Azul): La casa está configurada para pagar en la otra quincena (no requerida en este corte).
 * - PENDIENTE (Naranja/Ámbar): La casa corresponde a esta quincena activa y su cuota aún no ha sido pagada.
 */
export function determineVisualStatus(params: {
  quincenaAsignada: QuincenaEnum;
  quincenaEvaluada: QuincenaEnum;
  estadoCuota?: EstadoCuotaEnum | null;
}): EstadoVisualCasaEnum {
  const { quincenaAsignada, quincenaEvaluada, estadoCuota } = params;

  // Si ya fue pagada o adelantada para este período
  if (estadoCuota === EstadoCuotaEnum.PAGADA || estadoCuota === EstadoCuotaEnum.ADELANTADA) {
    return EstadoVisualCasaEnum.AL_DIA;
  }

  // Si la casa no corresponde a la quincena evaluada
  if (quincenaAsignada !== quincenaEvaluada) {
    return EstadoVisualCasaEnum.OTRA_QUINCENA;
  }

  // Corresponde a esta quincena y está pendiente
  return EstadoVisualCasaEnum.PENDIENTE;
}
