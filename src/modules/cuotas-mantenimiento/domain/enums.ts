/**
 * @file enums.ts
 * @description Enumeraciones de dominio para el módulo de Cuotas de Mantenimiento y Seguridad.
 */

export enum TipoSubdivisionEnum {
  EDIFICIO = 'EDIFICIO',
  PASAJE = 'PASAJE',
  CALLE = 'CALLE',
}

export enum QuincenaEnum {
  PRIMERA = 'PRIMERA',
  SEGUNDA = 'SEGUNDA',
}

export enum EstadoCuotaEnum {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  ADELANTADA = 'ADELANTADA',
  EXONERADA = 'EXONERADA',
}

export enum EstadoVisualCasaEnum {
  AL_DIA = 'AL_DIA',                   // Verde / Desactivado (ya pagada esta quincena)
  OTRA_QUINCENA = 'OTRA_QUINCENA',     // Azul (no corresponde a la quincena activa)
  PENDIENTE = 'PENDIENTE',             // Naranja/Ámbar (debe pagar en esta quincena activa)
}
