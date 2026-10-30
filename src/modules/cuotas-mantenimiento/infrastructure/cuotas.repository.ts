/**
 * @file cuotas.repository.ts
 * @description Repositorio centralizado para el acceso a datos del módulo de Cuotas en Supabase.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import {
  IZona,
  ISubdivision,
  ICasa,
  ICuotaPeriodo,
  IPagoCuota,
} from '../domain/entities';
import { QuincenaEnum, EstadoCuotaEnum } from '../domain/enums';

export interface CuotasViewRecord {
  cuota_id: string;
  year: number;
  mes: number;
  quincena_periodo: QuincenaEnum;
  monto_esperado: number;
  estado_cuota: EstadoCuotaEnum;
  cuota_creada_el: string;
  casa_id: string;
  casa_numero: string;
  casa_cuota_actual: number;
  casa_quincena_asignada: QuincenaEnum;
  casa_activa: boolean;
  subdivision_id: string;
  subdivision_nombre: string;
  subdivision_tipo: string;
  zona_id: string;
  zona_nombre: string;
  pago_id: string | null;
  correlativo_recibo: string | null;
  monto_pagado: number | null;
  fecha_pago: string | null;
  metodo_pago: string | null;
  recolector_user_id: string | null;
  recolector_nombre: string | null;
  ref_movimiento_financiero: string | null;
  pago_observaciones: string | null;
}

export class CuotasRepository {
  private defaultClient?: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.defaultClient = client;
  }

  private getClient(clientOverride?: SupabaseClient): SupabaseClient {
    return clientOverride || this.defaultClient || createClient();
  }

  /**
   * Obtiene la lista de Zonas disponibles.
   */
  async getZonas(clientOverride?: SupabaseClient): Promise<IZona[]> {
    const supabase = this.getClient(clientOverride);
    const { data, error } = await supabase
      .from('cuotas_zonas')
      .select('id, nombre, descripcion, created_at')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return (data || []) as IZona[];
  }

  /**
   * Obtiene las subdivisiones filtradas opcionalmente por Zona.
   */
  async getSubdivisiones(
    zonaId?: string,
    clientOverride?: SupabaseClient
  ): Promise<ISubdivision[]> {
    const supabase = this.getClient(clientOverride);
    let query = supabase
      .from('cuotas_subdivisiones')
      .select('id, zona_id, tipo, nombre, created_at')
      .order('nombre', { ascending: true });

    if (zonaId) {
      query = query.eq('zona_id', zonaId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      zonaId: item.zona_id,
      tipo: item.tipo,
      nombre: item.nombre,
      created_at: item.created_at,
    }));
  }

  /**
   * Obtiene las casas filtradas por Subdivisión.
   */
  async getCasas(
    subdivisionId: string,
    clientOverride?: SupabaseClient
  ): Promise<ICasa[]> {
    const supabase = this.getClient(clientOverride);
    const { data, error } = await supabase
      .from('cuotas_casas')
      .select('id, subdivision_id, numero, cuota, quincena, activo, created_at')
      .eq('subdivision_id', subdivisionId)
      .eq('activo', true)
      .order('numero', { ascending: true });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      subdivisionId: item.subdivision_id,
      numero: item.numero,
      cuota: Number(item.cuota) || 10,
      quincena: item.quincena,
      activo: item.activo,
      created_at: item.created_at,
    }));
  }

  /**
   * Consulta la vista v_cuotas para un período y subdivisión especificados.
   */
  async getCuotasView(
    params: {
      year: number;
      mes: number;
      zonaId?: string;
      subdivisionId?: string;
    },
    clientOverride?: SupabaseClient
  ): Promise<CuotasViewRecord[]> {
    const supabase = this.getClient(clientOverride);
    let query = supabase
      .from('v_cuotas')
      .select('*')
      .eq('year', params.year)
      .eq('mes', params.mes);

    if (params.zonaId) {
      query = query.eq('zona_id', params.zonaId);
    }
    if (params.subdivisionId) {
      query = query.eq('subdivision_id', params.subdivisionId);
    }

    const { data, error } = await query.order('casa_numero', { ascending: true });
    if (error) throw error;

    return (data || []) as CuotasViewRecord[];
  }

  /**
   * Verifica si un correlativo de recibo ya fue registrado previamente en cuotas.
   */
  async checkCorrelativoExists(
    correlativo: string,
    clientOverride?: SupabaseClient
  ): Promise<boolean> {
    const supabase = this.getClient(clientOverride);
    const { data, error } = await supabase
      .from('cuotas_pagos')
      .select('id')
      .eq('correlativo_recibo', correlativo.trim())
      .limit(1);

    if (error) throw error;
    return !!(data && data.length > 0);
  }

  /**
   * Busca o crea el período de cuota para una casa en un año, mes y quincena dados.
   */
  async ensurePeriodo(
    payload: {
      casaId: string;
      year: number;
      mes: number;
      quincena: QuincenaEnum;
      montoEsperado: number;
    },
    clientOverride?: SupabaseClient
  ): Promise<ICuotaPeriodo> {
    const supabase = this.getClient(clientOverride);

    // Buscar si ya existe
    const { data: existing, error: errSelect } = await supabase
      .from('cuotas_periodos')
      .select('id, casa_id, year, mes, quincena, monto_esperado, estado, created_at')
      .eq('casa_id', payload.casaId)
      .eq('year', payload.year)
      .eq('mes', payload.mes)
      .eq('quincena', payload.quincena)
      .maybeSingle();

    if (errSelect) throw errSelect;

    if (existing) {
      return {
        id: existing.id,
        casaId: existing.casa_id,
        year: existing.year,
        mes: existing.mes,
        quincena: existing.quincena,
        montoEsperado: Number(existing.monto_esperado),
        estado: existing.estado,
        created_at: existing.created_at,
      };
    }

    // Insertar nuevo período
    const { data: inserted, error: errInsert } = await supabase
      .from('cuotas_periodos')
      .insert([
        {
          casa_id: payload.casaId,
          year: payload.year,
          mes: payload.mes,
          quincena: payload.quincena,
          monto_esperado: payload.montoEsperado,
          estado: EstadoCuotaEnum.PENDIENTE,
        },
      ])
      .select('id, casa_id, year, mes, quincena, monto_esperado, estado, created_at')
      .single();

    if (errInsert) throw errInsert;

    return {
      id: inserted.id,
      casaId: inserted.casa_id,
      year: inserted.year,
      mes: inserted.mes,
      quincena: inserted.quincena,
      montoEsperado: Number(inserted.monto_esperado),
      estado: inserted.estado,
      created_at: inserted.created_at,
    };
  }

  /**
   * Registra el pago de una cuota y actualiza el período a PAGADA de forma atómica.
   */
  async recordPayment(
    payment: Omit<IPagoCuota, 'id' | 'created_at'>,
    clientOverride?: SupabaseClient
  ): Promise<IPagoCuota> {
    const supabase = this.getClient(clientOverride);

    // 1. Insertar el pago
    const { data, error: errPayment } = await supabase
      .from('cuotas_pagos')
      .insert([
        {
          cuota_periodo_id: payment.cuotaPeriodoId,
          correlativo_recibo: payment.correlativoRecibo.trim(),
          monto_pagado: payment.montoPagado,
          fecha_pago: payment.fechaPago,
          recolector_user_id: payment.recolectorUserId,
          metodo_pago: payment.metodoPago || 'EFECTIVO',
          ref_movimiento_financiero: payment.refMovimientoFinanciero || null,
          observaciones: payment.observaciones || null,
        },
      ])
      .select('*')
      .single();

    if (errPayment) throw errPayment;

    // 2. Actualizar el período a PAGADA
    const { error: errUpdate } = await supabase
      .from('cuotas_periodos')
      .update({ estado: EstadoCuotaEnum.PAGADA })
      .eq('id', payment.cuotaPeriodoId);

    if (errUpdate) throw errUpdate;

    return {
      id: data.id,
      cuotaPeriodoId: data.cuota_periodo_id,
      correlativoRecibo: data.correlativo_recibo,
      montoPagado: Number(data.monto_pagado),
      fechaPago: data.fecha_pago,
      recolectorUserId: data.recolector_user_id,
      metodoPago: data.metodo_pago,
      refMovimientoFinanciero: data.ref_movimiento_financiero,
      observaciones: data.observaciones,
      created_at: data.created_at,
    };
  }

  /**
   * Crea una nueva Zona en el sistema.
   */
  async createZona(
    payload: { nombre: string; descripcion?: string },
    clientOverride?: SupabaseClient
  ): Promise<IZona> {
    const supabase = this.getClient(clientOverride);
    const { data, error } = await supabase
      .from('cuotas_zonas')
      .insert([
        {
          nombre: payload.nombre.trim(),
          descripcion: payload.descripcion?.trim() || null,
        },
      ])
      .select('id, nombre, descripcion, created_at')
      .single();

    if (error) throw error;
    return data as IZona;
  }

  /**
   * Crea una nueva Subdivisión (Edificio, Pasaje o Calle) dentro de una Zona.
   */
  async createSubdivision(
    payload: { zonaId: string; tipo: string; nombre: string },
    clientOverride?: SupabaseClient
  ): Promise<ISubdivision> {
    const supabase = this.getClient(clientOverride);
    const { data, error } = await supabase
      .from('cuotas_subdivisiones')
      .insert([
        {
          zona_id: payload.zonaId,
          tipo: payload.tipo,
          nombre: payload.nombre.trim(),
        },
      ])
      .select('id, zona_id, tipo, nombre, created_at')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      zonaId: data.zona_id,
      tipo: data.tipo,
      nombre: data.nombre,
      created_at: data.created_at,
    };
  }

  /**
   * Registra una nueva Casa / Apartamento asociada a una Subdivisión.
   */
  async createCasa(
    payload: {
      subdivisionId: string;
      numero: string;
      cuota?: number;
      quincena?: QuincenaEnum;
    },
    clientOverride?: SupabaseClient
  ): Promise<ICasa> {
    const supabase = this.getClient(clientOverride);
    const { data, error } = await supabase
      .from('cuotas_casas')
      .insert([
        {
          subdivision_id: payload.subdivisionId,
          numero: payload.numero.trim(),
          cuota: payload.cuota !== undefined ? payload.cuota : 10.0,
          quincena: payload.quincena || QuincenaEnum.PRIMERA,
          activo: true,
        },
      ])
      .select('id, subdivision_id, numero, cuota, quincena, activo, created_at')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      subdivisionId: data.subdivision_id,
      numero: data.numero,
      cuota: Number(data.cuota),
      quincena: data.quincena,
      activo: data.activo,
      created_at: data.created_at,
    };
  }

  /**
   * Actualiza los datos de una Casa (cuota, número, quincena o estado activo).
   */
  async updateCasa(
    id: string,
    payload: Partial<Pick<ICasa, 'numero' | 'cuota' | 'quincena' | 'activo'>>,
    clientOverride?: SupabaseClient
  ): Promise<void> {
    const supabase = this.getClient(clientOverride);
    const { error } = await supabase
      .from('cuotas_casas')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Elimina una casa por su ID.
   */
  async deleteCasa(id: string, clientOverride?: SupabaseClient): Promise<void> {
    const supabase = this.getClient(clientOverride);
    const { error } = await supabase.from('cuotas_casas').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Elimina una subdivisión por su ID.
   */
  async deleteSubdivision(id: string, clientOverride?: SupabaseClient): Promise<void> {
    const supabase = this.getClient(clientOverride);
    const { error } = await supabase.from('cuotas_subdivisiones').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Elimina una zona por su ID.
   */
  async deleteZona(id: string, clientOverride?: SupabaseClient): Promise<void> {
    const supabase = this.getClient(clientOverride);
    const { error } = await supabase.from('cuotas_zonas').delete().eq('id', id);
    if (error) throw error;
  }
}

export const cuotasRepository = new CuotasRepository();
