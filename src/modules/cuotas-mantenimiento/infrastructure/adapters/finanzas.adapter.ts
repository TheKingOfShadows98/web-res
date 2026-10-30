/**
 * @file finanzas.adapter.ts
 * @description Adaptador que implementa IFinancialGateway contra FinanzasRepository y cálculo de hashes criptográficos.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { finanzasRepository } from '@/repositories/finanzas.repository';
import { generateReceiptHash } from '@/utils/crypto';
import {
  IFinancialGateway,
  RegisterFeeIncomePayload,
  FinancialMovementResult,
} from '../../gateways/IFinancialGateway';

export class FinanzasAdapter implements IFinancialGateway {
  private client?: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client;
  }

  private getClient(): SupabaseClient {
    return this.client || createClient();
  }

  async registerFeeIncome(
    payload: RegisterFeeIncomePayload
  ): Promise<FinancialMovementResult> {
    const supabase = this.getClient();

    // 1. Obtener el hash del último ingreso registrado para encadenamiento
    let prevHash = '';
    try {
      prevHash = await finanzasRepository.getLastMovementHash('ingresos', supabase);
    } catch (e) {
      console.warn('No se pudo obtener el último hash de ingresos, iniciando nueva cadena:', e);
      prevHash = '';
    }

    // 2. Generar el hash determinista SHA-256 del comprobante
    const hash = await generateReceiptHash({
      correlativo: payload.correlativo,
      concepto: payload.concepto,
      cantidad: payload.cantidad,
      comprobante: payload.comprobanteUrl || null,
      fecha: payload.fechaPago,
      prev_hash: prevHash,
    });

    // 3. Insertar el movimiento en finanzas para actualizar balance
    await finanzasRepository.createIngreso(
      {
        correlativo: payload.correlativo,
        concepto: payload.concepto,
        cantidad: payload.cantidad,
        comprobante: payload.comprobanteUrl || null,
        fecha: payload.fechaPago,
        hash,
        prev_hash: prevHash,
      },
      supabase
    );

    return {
      transactionId: payload.correlativo,
      hash,
    };
  }
}

export const financialGateway = new FinanzasAdapter();
