/**
 * @file cuotas-query.service.ts
 * @description Servicio de aplicación para la consulta y cálculo de estados de recolección en el tablero mensual.
 */

import { CuotasRepository, cuotasRepository } from '../infrastructure/cuotas.repository';
import { IZona, ISubdivision, ICasaCuotaView } from '../domain/entities';
import { QuincenaEnum, TipoSubdivisionEnum, EstadoCuotaEnum } from '../domain/enums';
import { getActiveQuincena, determineVisualStatus } from '../domain/rules';

export class CuotasQueryService {
  private repo: CuotasRepository;

  constructor(repo: CuotasRepository = cuotasRepository) {
    this.repo = repo;
  }

  /**
   * Obtiene la lista completa de zonas.
   */
  async getZonas(): Promise<IZona[]> {
    return this.repo.getZonas();
  }

  /**
   * Obtiene las subdivisiones (Edificios, Pasajes, Calles) asociadas a una zona.
   */
  async getSubdivisiones(zonaId?: string): Promise<ISubdivision[]> {
    return this.repo.getSubdivisiones(zonaId);
  }

  /**
   * Obtiene las casas procesadas para una subdivisión específica en el mes y año actual,
   * calculando su estado visual (Verde: Al día, Azul: Otra quincena, Ámbar: Pendiente de cobro).
   */
  async getCasasTablero(params: {
    year: number;
    mes: number;
    subdivisionId: string;
    targetQuincena?: QuincenaEnum;
    zonaId?: string;
  }): Promise<{
    activeQuincena: QuincenaEnum;
    casas: ICasaCuotaView[];
    resumen: {
      total: number;
      alDia: number;
      otraQuincena: number;
      pendientes: number;
      totalRecaudado: number;
    };
  }> {
    const activeQuincena = params.targetQuincena || getActiveQuincena(new Date());

    // 1. Obtener todas las casas de la subdivisión
    const casas = await this.repo.getCasas(params.subdivisionId);

    // 2. Obtener los registros de la vista v_cuotas para el período
    const viewRecords = await this.repo.getCuotasView({
      year: params.year,
      mes: params.mes,
      subdivisionId: params.subdivisionId,
      zonaId: params.zonaId,
    });

    // Mapear registros de cuotas por casa_id y quincena
    const cuotasMap = new Map<string, typeof viewRecords[0]>();
    for (const record of viewRecords) {
      if (record.quincena_periodo === activeQuincena) {
        cuotasMap.set(record.casa_id, record);
      }
    }

    // 3. Procesar cada casa asignando su estado visual
    let alDia = 0;
    let otraQuincena = 0;
    let pendientes = 0;
    let totalRecaudado = 0;

    const processedCasas: ICasaCuotaView[] = casas.map((casa) => {
      const match = cuotasMap.get(casa.id);

      const estadoCuota = match ? match.estado_cuota : EstadoCuotaEnum.PENDIENTE;
      const estadoVisual = determineVisualStatus({
        quincenaAsignada: casa.quincena,
        quincenaEvaluada: activeQuincena,
        estadoCuota: match ? match.estado_cuota : null,
      });

      if (estadoVisual === 'AL_DIA') {
        alDia++;
        totalRecaudado += Number(match?.monto_pagado || match?.monto_esperado || casa.cuota);
      } else if (estadoVisual === 'OTRA_QUINCENA') {
        otraQuincena++;
      } else {
        pendientes++;
      }

      return {
        casaId: casa.id,
        casaNumero: casa.numero,
        cuotaMonto: casa.cuota,
        quincenaAsignada: casa.quincena,
        subdivisionId: casa.subdivisionId,
        subdivisionNombre: match?.subdivision_nombre || '',
        subdivisionTipo: (match?.subdivision_tipo as TipoSubdivisionEnum) || TipoSubdivisionEnum.EDIFICIO,
        zonaId: match?.zona_id || '',
        zonaNombre: match?.zona_nombre || '',
        cuotaPeriodoId: match?.cuota_id || null,
        estadoCuota,
        estadoVisual,
        correlativoRecibo: match?.correlativo_recibo || null,
        fechaPago: match?.fecha_pago || null,
        montoPagado: match?.monto_pagado ? Number(match.monto_pagado) : null,
      };
    });

    return {
      activeQuincena,
      casas: processedCasas,
      resumen: {
        total: processedCasas.length,
        alDia,
        otraQuincena,
        pendientes,
        totalRecaudado,
      },
    };
  }
}

export const cuotasQueryService = new CuotasQueryService();
