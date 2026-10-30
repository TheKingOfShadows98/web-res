import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CuotasCollectorService } from '../cuotas-collector.service';
import { QuincenaEnum, EstadoCuotaEnum } from '../../domain/enums';
import { CuotasRepository } from '../../infrastructure/cuotas.repository';
import { IAuthGateway } from '../../gateways/IAuthGateway';
import { IFinancialGateway } from '../../gateways/IFinancialGateway';

describe('CuotasCollectorService', () => {
  let mockRepo: Partial<CuotasRepository>;
  let mockAuth: Partial<IAuthGateway>;
  let mockFinanzas: Partial<IFinancialGateway>;
  let service: CuotasCollectorService;

  beforeEach(() => {
    mockRepo = {
      checkCorrelativoExists: vi.fn(),
      ensurePeriodo: vi.fn(),
      recordPayment: vi.fn(),
    };

    mockAuth = {
      canCollectFees: vi.fn(),
      getCurrentUser: vi.fn(),
    };

    mockFinanzas = {
      registerFeeIncome: vi.fn(),
    };

    service = new CuotasCollectorService(
      mockRepo as CuotasRepository,
      mockAuth as IAuthGateway,
      mockFinanzas as IFinancialGateway
    );
  });

  it('debe lanzar error si el usuario no tiene permisos de cobranza', async () => {
    vi.mocked(mockAuth.canCollectFees!).mockResolvedValue(false);

    await expect(
      service.recordFeePayment({
        casaId: 'casa-1',
        casaNumero: '101',
        year: 2026,
        mes: 10,
        quincena: QuincenaEnum.PRIMERA,
        monto: 10,
        correlativoRecibo: 'REC-001',
        recolectorUserId: 'user-sin-permisos',
      })
    ).rejects.toThrow('El usuario no posee permisos de recolección de cuotas');
  });

  it('debe lanzar error si el correlativo de recibo está vacío o duplicado', async () => {
    vi.mocked(mockAuth.canCollectFees!).mockResolvedValue(true);
    vi.mocked(mockRepo.checkCorrelativoExists!).mockResolvedValue(true);

    await expect(
      service.recordFeePayment({
        casaId: 'casa-1',
        casaNumero: '101',
        year: 2026,
        mes: 10,
        quincena: QuincenaEnum.PRIMERA,
        monto: 10,
        correlativoRecibo: 'REC-YA-EXISTE',
        recolectorUserId: 'user-admin',
      })
    ).rejects.toThrow('ya fue utilizado');
  });

  it('debe registrar el pago con éxito, llamar al gateway financiero y actualizar el período', async () => {
    vi.mocked(mockAuth.canCollectFees!).mockResolvedValue(true);
    vi.mocked(mockRepo.checkCorrelativoExists!).mockResolvedValue(false);
    vi.mocked(mockRepo.ensurePeriodo!).mockResolvedValue({
      id: 'periodo-123',
      casaId: 'casa-1',
      year: 2026,
      mes: 10,
      quincena: QuincenaEnum.PRIMERA,
      montoEsperado: 10,
      estado: EstadoCuotaEnum.PENDIENTE,
    });
    vi.mocked(mockFinanzas.registerFeeIncome!).mockResolvedValue({
      transactionId: 'REC-2026-99',
      hash: 'hash-abc-123',
    });
    vi.mocked(mockRepo.recordPayment!).mockResolvedValue({
      id: 'pago-uuid-1',
      cuotaPeriodoId: 'periodo-123',
      correlativoRecibo: 'REC-2026-99',
      montoPagado: 10,
      fechaPago: '2026-10-29T12:00:00Z',
      recolectorUserId: 'user-admin',
      metodoPago: 'EFECTIVO',
      refMovimientoFinanciero: 'REC-2026-99',
    });

    const result = await service.recordFeePayment({
      casaId: 'casa-1',
      casaNumero: '101',
      subdivisionNombre: 'Edificio A',
      year: 2026,
      mes: 10,
      quincena: QuincenaEnum.PRIMERA,
      monto: 10,
      correlativoRecibo: 'REC-2026-99',
      metodoPago: 'EFECTIVO',
      recolectorUserId: 'user-admin',
      fechaPago: '2026-10-29T12:00:00Z',
    });

    expect(mockAuth.canCollectFees).toHaveBeenCalledWith('user-admin');
    expect(mockRepo.checkCorrelativoExists).toHaveBeenCalledWith('REC-2026-99');
    expect(mockRepo.ensurePeriodo).toHaveBeenCalledWith({
      casaId: 'casa-1',
      year: 2026,
      mes: 10,
      quincena: QuincenaEnum.PRIMERA,
      montoEsperado: 10,
    });
    expect(mockFinanzas.registerFeeIncome).toHaveBeenCalledWith({
      correlativo: 'REC-2026-99',
      cantidad: 10,
      concepto: 'Cuota Mantenimiento y Seguridad - Casa 101 (Edificio A) - PRIMERA Quincena 10/2026',
      fechaPago: '2026-10-29T12:00:00Z',
      comprobanteUrl: null,
    });
    expect(mockRepo.recordPayment).toHaveBeenCalled();
    expect(result.id).toBe('pago-uuid-1');
    expect(result.correlativoRecibo).toBe('REC-2026-99');
  });
});
