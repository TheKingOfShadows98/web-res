/**
 * @file IFinancialGateway.ts
 * @description Contrato para la inserción de ingresos y actualización del balance en el módulo financiero.
 */

export interface RegisterFeeIncomePayload {
  correlativo: string;
  cantidad: number;
  concepto: string; // ej: "Cuota Mantenimiento y Seguridad - Casa 12, Edificio A"
  fechaPago: string;
  comprobanteUrl?: string | null;
}

export interface FinancialMovementResult {
  transactionId: string | number;
  hash?: string;
}

export interface IFinancialGateway {
  /**
   * Inserta un nuevo ingreso en el módulo financiero, garantizando la trazabilidad
   * con su correlativo de recibo, concepto y reflejo inmediato en el balance global.
   */
  registerFeeIncome(payload: RegisterFeeIncomePayload): Promise<FinancialMovementResult>;
}
