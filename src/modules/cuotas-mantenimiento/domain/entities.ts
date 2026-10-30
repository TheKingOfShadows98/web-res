/**
 * @file entities.ts
 * @description Entidades e interfaces de dominio para el módulo de Cuotas.
 */

import { TipoSubdivisionEnum, QuincenaEnum, EstadoCuotaEnum, EstadoVisualCasaEnum } from './enums';

export interface IZona {
  id: string; // UUIDv7
  nombre: string;
  descripcion?: string | null;
  created_at?: string;
}

export interface ISubdivision {
  id: string; // UUIDv7
  zonaId: string;
  tipo: TipoSubdivisionEnum;
  nombre: string;
  created_at?: string;
}

export interface ICasa {
  id: string; // UUIDv7
  subdivisionId: string;
  numero: string;
  cuota: number; // Por defecto 10.00
  quincena: QuincenaEnum; // Quincena habitual de pago: PRIMERA o SEGUNDA
  activo: boolean;
  created_at?: string;
}

export interface ICuotaPeriodo {
  id: string; // UUIDv7
  casaId: string;
  year: number;
  mes: number; // 1 a 12
  quincena: QuincenaEnum;
  montoEsperado: number;
  estado: EstadoCuotaEnum;
  created_at?: string;
}

export interface IPagoCuota {
  id: string; // UUIDv7
  cuotaPeriodoId: string;
  correlativoRecibo: string;
  montoPagado: number;
  fechaPago: string;
  recolectorUserId: string;
  metodoPago: string;
  refMovimientoFinanciero?: string | null;
  observaciones?: string | null;
  created_at?: string;
}

/**
 * Representa la vista procesada de una casa para el tablero de cobranza del mes actual.
 */
export interface ICasaCuotaView {
  casaId: string;
  casaNumero: string;
  cuotaMonto: number;
  quincenaAsignada: QuincenaEnum;
  subdivisionId: string;
  subdivisionNombre: string;
  subdivisionTipo: TipoSubdivisionEnum;
  zonaId: string;
  zonaNombre: string;
  // Estado del período evaluado
  cuotaPeriodoId?: string | null;
  estadoCuota?: EstadoCuotaEnum;
  estadoVisual: EstadoVisualCasaEnum;
  // Datos del pago (si ya fue liquidado)
  correlativoRecibo?: string | null;
  fechaPago?: string | null;
  montoPagado?: number | null;
}
