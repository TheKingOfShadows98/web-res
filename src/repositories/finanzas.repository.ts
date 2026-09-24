/**
 * @file finanzas.repository.ts
 * @description Repositorio centralizado para el acceso a datos y operaciones financieras en Supabase.
 * Proporciona métodos tipados para consultar ingresos, egresos, balances históricos, métricas mensuales y creación de recibos.
 * @module repositories/finanzas
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { IIngreso, IEgreso } from '@/app/entities/Recivos';
import { getGMT6MonthRange } from '@/utils/date';

export interface FinancialGlobalMetrics {
  totalIngresos: number;
  totalEgresos: number;
  balanceTotal: number;
}

export interface FinancialMonthSummary {
  ingresosMes: number;
  gastosMes: number;
  balanceMes: number;
}

export interface TransactionRecord {
  id: number | string;
  tipo: 'ingresos' | 'egresos';
  correlativo: string;
  concepto: string;
  cantidad: number;
  comprobante?: string | null;
  hash: string;
  prev_hash?: string;
  fecha: string;
}

export class FinanzasRepository {
  private defaultClient?: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.defaultClient = client;
  }

  private getClient(clientOverride?: SupabaseClient): SupabaseClient {
    return clientOverride || this.defaultClient || createClient();
  }

  /**
   * Obtiene las métricas globales acumuladas en todo el histórico (Total Ingresos, Total Egresos y Fondo Disponible).
   */
  async getGlobalMetrics(clientOverride?: SupabaseClient): Promise<FinancialGlobalMetrics> {
    const supabase = this.getClient(clientOverride);

    const { data: ingresos, error: errIng } = await supabase.from('ingresos').select('cantidad');
    const { data: egresos, error: errEgr } = await supabase.from('egresos').select('cantidad');

    if (errIng) throw errIng;
    if (errEgr) throw errEgr;

    const totalIngresos = (ingresos || []).reduce(
      (sum, item) => sum + (Number(item.cantidad) || 0),
      0
    );
    const totalEgresos = (egresos || []).reduce(
      (sum, item) => sum + (Number(item.cantidad) || 0),
      0
    );

    return {
      totalIngresos,
      totalEgresos,
      balanceTotal: totalIngresos - totalEgresos,
    };
  }

  /**
   * Obtiene los movimientos de ingresos registrados en un rango de fechas ISO.
   */
  async getIngresosByRange(
    startIso: string,
    endIso: string,
    clientOverride?: SupabaseClient
  ): Promise<TransactionRecord[]> {
    const supabase = this.getClient(clientOverride);

    const { data, error } = await supabase
      .from('ingresos')
      .select('id, correlativo, concepto, cantidad, comprobante, fecha, hash, prev_hash')
      .gte('fecha', startIso)
      .lte('fecha', endIso);

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tipo: 'ingresos',
      correlativo: item.correlativo || '',
      concepto: item.concepto || 'Ingreso sin concepto',
      cantidad: Number(item.cantidad) || 0,
      comprobante: item.comprobante || null,
      hash: item.hash || '',
      prev_hash: item.prev_hash || '',
      fecha: item.fecha,
    }));
  }

  /**
   * Obtiene los movimientos de egresos registrados en un rango de fechas ISO.
   */
  async getEgresosByRange(
    startIso: string,
    endIso: string,
    clientOverride?: SupabaseClient
  ): Promise<TransactionRecord[]> {
    const supabase = this.getClient(clientOverride);

    const { data, error } = await supabase
      .from('egresos')
      .select('id, correlativo, concepto, cantidad, comprobante, fecha, hash, prev_hash')
      .gte('fecha', startIso)
      .lte('fecha', endIso);

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tipo: 'egresos',
      correlativo: item.correlativo || '',
      concepto: item.concepto || 'Egreso sin concepto',
      cantidad: Number(item.cantidad) || 0,
      comprobante: item.comprobante || null,
      hash: item.hash || '',
      prev_hash: item.prev_hash || '',
      fecha: item.fecha,
    }));
  }

  /**
   * Obtiene el resumen del mes en curso (ingresos, gastos y balance neto).
   */
  async getCurrentMonthSummary(
    now: Date = new Date(),
    clientOverride?: SupabaseClient
  ): Promise<FinancialMonthSummary> {
    const supabase = this.getClient(clientOverride);
    const { startIso, endIso } = getGMT6MonthRange(now.getFullYear(), now.getMonth());

    const { data: ingresosMes, error: errIng } = await supabase
      .from('ingresos')
      .select('cantidad, fecha')
      .gte('fecha', startIso)
      .lte('fecha', endIso);

    const { data: egresosMes, error: errEgr } = await supabase
      .from('egresos')
      .select('cantidad, fecha')
      .gte('fecha', startIso)
      .lte('fecha', endIso);

    if (errIng) throw errIng;
    if (errEgr) throw errEgr;

    const ingresos = (ingresosMes || []).reduce(
      (sum, item) => sum + (Number(item.cantidad) || 0),
      0
    );
    const gastos = (egresosMes || []).reduce(
      (sum, item) => sum + (Number(item.cantidad) || 0),
      0
    );

    return {
      ingresosMes: ingresos,
      gastosMes: gastos,
      balanceMes: ingresos - gastos,
    };
  }

  /**
   * Obtiene el hash del último movimiento registrado para encadenamiento criptográfico.
   */
  async getLastMovementHash(
    tipo: 'ingresos' | 'egresos',
    clientOverride?: SupabaseClient
  ): Promise<string> {
    const supabase = this.getClient(clientOverride);
    const table = tipo === 'ingresos' ? 'ingresos' : 'egresos';

    const { data, error } = await supabase
      .from(table)
      .select('hash')
      .order('id', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data && data.length > 0 && data[0].hash ? String(data[0].hash) : '';
  }

  /**
   * Inserta un nuevo movimiento de ingreso en la base de datos.
   */
  async createIngreso(
    payload: Omit<IIngreso, 'id'>,
    clientOverride?: SupabaseClient
  ): Promise<void> {
    const supabase = this.getClient(clientOverride);
    const { error } = await supabase.from('ingreso').insert([payload]);
    if (error) throw error;
  }

  /**
   * Inserta un nuevo movimiento de egreso en la base de datos.
   */
  async createEgreso(
    payload: Omit<IEgreso, 'id'>,
    clientOverride?: SupabaseClient
  ): Promise<void> {
    const supabase = this.getClient(clientOverride);
    const { error } = await supabase.from('egreso').insert([payload]);
    if (error) throw error;
  }
}

export const finanzasRepository = new FinanzasRepository();
