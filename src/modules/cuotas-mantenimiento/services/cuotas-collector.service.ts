/**
 * @file cuotas-collector.service.ts
 * @description Servicio de aplicación que coordina la recolección de cuotas, validación de permisos,
 * registro del comprobante y reflejo en el balance financiero general.
 */

import { CuotasRepository, cuotasRepository } from '../infrastructure/cuotas.repository';
import { IAuthGateway } from '../gateways/IAuthGateway';
import { authGateway } from '../infrastructure/adapters/auth-context.adapter';
import { IFinancialGateway } from '../gateways/IFinancialGateway';
import { financialGateway } from '../infrastructure/adapters/finanzas.adapter';
import { IPagoCuota } from '../domain/entities';
import { QuincenaEnum } from '../domain/enums';

export interface RecordFeePaymentParams {
  casaId: string;
  casaNumero: string;
  subdivisionNombre?: string;
  year: number;
  mes: number;
  quincena: QuincenaEnum;
  monto: number;
  correlativoRecibo: string;
  metodoPago?: string;
  observaciones?: string;
  recolectorUserId: string;
  fechaPago?: string;
}

export class CuotasCollectorService {
  private repo: CuotasRepository;
  private auth: IAuthGateway;
  private finanzas: IFinancialGateway;

  constructor(
    repo: CuotasRepository = cuotasRepository,
    auth: IAuthGateway = authGateway,
    finanzas: IFinancialGateway = financialGateway
  ) {
    this.repo = repo;
    this.auth = auth;
    this.finanzas = finanzas;
  }

  /**
   * Ejecuta el cobro de una cuota de mantenimiento y seguridad:
   * 1. Valida permisos del recolector.
   * 2. Valida unicidad del correlativo del recibo.
   * 3. Asegura el período de la cuota en la base de datos.
   * 4. Registra el ingreso en el balance financiero central.
   * 5. Almacena el pago y marca la cuota como pagada.
   */
  async recordFeePayment(params: RecordFeePaymentParams): Promise<IPagoCuota> {
    const correlativoLimpio = params.correlativoRecibo.trim();
    if (!correlativoLimpio) {
      throw new Error('El correlativo del recibo es obligatorio para contrastar el pago.');
    }

    // 1. Validar autorización del usuario
    const canCollect = await this.auth.canCollectFees(params.recolectorUserId);
    if (!canCollect) {
      throw new Error('El usuario no posee permisos de recolección de cuotas (Tesorero/Presidencia).');
    }

    // 2. Validar que el correlativo no haya sido registrado previamente
    const exists = await this.repo.checkCorrelativoExists(correlativoLimpio);
    if (exists) {
      throw new Error(`El correlativo de recibo "${correlativoLimpio}" ya fue utilizado.`);
    }

    // 3. Asegurar que exista el período para esa casa
    const periodo = await this.repo.ensurePeriodo({
      casaId: params.casaId,
      year: params.year,
      mes: params.mes,
      quincena: params.quincena,
      montoEsperado: params.monto,
    });

    const fechaPagoEfectiva = params.fechaPago || new Date().toISOString();
    const concepto = `Cuota Mantenimiento y Seguridad - Casa ${params.casaNumero}${
      params.subdivisionNombre ? ` (${params.subdivisionNombre})` : ''
    } - ${params.quincena} Quincena ${params.mes}/${params.year}`;

    // 4. Registrar en el balance financiero general a través del Gateway
    const finMovement = await this.finanzas.registerFeeIncome({
      correlativo: correlativoLimpio,
      cantidad: params.monto,
      concepto,
      fechaPago: fechaPagoEfectiva,
      comprobanteUrl: null,
    });

    // 5. Almacenar el pago en el módulo de cuotas
    const payment = await this.repo.recordPayment({
      cuotaPeriodoId: periodo.id,
      correlativoRecibo: correlativoLimpio,
      montoPagado: params.monto,
      fechaPago: fechaPagoEfectiva,
      recolectorUserId: params.recolectorUserId,
      metodoPago: params.metodoPago || 'EFECTIVO',
      refMovimientoFinanciero: String(finMovement.transactionId),
      observaciones: params.observaciones || null,
    });

    return payment;
  }
}

export const cuotasCollectorService = new CuotasCollectorService();
