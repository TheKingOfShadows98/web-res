/**
 * @file cuotas-management.service.ts
 * @description Servicio de aplicación exclusivo para el rol Owner para dar de alta y administrar
 * Zonas, Subdivisiones (Edificios, Calles, Pasajes) y Casas.
 */

import { CuotasRepository, cuotasRepository } from '../infrastructure/cuotas.repository';
import { IAuthGateway } from '../gateways/IAuthGateway';
import { authGateway } from '../infrastructure/adapters/auth-context.adapter';
import { IZona, ISubdivision, ICasa } from '../domain/entities';
import { TipoSubdivisionEnum, QuincenaEnum } from '../domain/enums';

export class CuotasManagementService {
  private repo: CuotasRepository;
  private auth: IAuthGateway;

  constructor(
    repo: CuotasRepository = cuotasRepository,
    auth: IAuthGateway = authGateway
  ) {
    this.repo = repo;
    this.auth = auth;
  }

  private async assertOwner(userId: string): Promise<void> {
    const isOwner = await this.auth.canManageStructure(userId);
    if (!isOwner) {
      throw new Error('Permiso denegado: Solo el rol Owner puede gestionar la estructura de zonas y casas.');
    }
  }

  /**
   * Registra una nueva Zona en la residencial.
   */
  async createZona(userId: string, data: { nombre: string; descripcion?: string }): Promise<IZona> {
    await this.assertOwner(userId);
    if (!data.nombre.trim()) throw new Error('El nombre de la zona es obligatorio.');
    return this.repo.createZona(data);
  }

  /**
   * Registra una nueva Subdivisión (Edificio, Pasaje o Calle) vinculada a una Zona.
   */
  async createSubdivision(
    userId: string,
    data: { zonaId: string; tipo: TipoSubdivisionEnum; nombre: string }
  ): Promise<ISubdivision> {
    await this.assertOwner(userId);
    if (!data.zonaId) throw new Error('Debe seleccionar una zona.');
    if (!data.nombre.trim()) throw new Error('El nombre del edificio, calle o pasaje es obligatorio.');
    return this.repo.createSubdivision(data);
  }

  /**
   * Registra una nueva Casa o Apartamento.
   */
  async createCasa(
    userId: string,
    data: {
      subdivisionId: string;
      numero: string;
      cuota?: number;
      quincena?: QuincenaEnum;
    }
  ): Promise<ICasa> {
    await this.assertOwner(userId);
    if (!data.subdivisionId) throw new Error('Debe seleccionar una subdivisión.');
    if (!data.numero.trim()) throw new Error('El número o identificador de casa es obligatorio.');
    if (data.cuota !== undefined && data.cuota <= 0) {
      throw new Error('La cuota debe ser mayor a 0.');
    }
    return this.repo.createCasa(data);
  }

  /**
   * Actualiza los datos de una Casa existente.
   */
  async updateCasa(
    userId: string,
    casaId: string,
    data: Partial<Pick<ICasa, 'numero' | 'cuota' | 'quincena' | 'activo'>>
  ): Promise<void> {
    await this.assertOwner(userId);
    if (data.cuota !== undefined && data.cuota <= 0) {
      throw new Error('La cuota debe ser mayor a 0.');
    }
    await this.repo.updateCasa(casaId, data);
  }

  /**
   * Elimina una casa.
   */
  async deleteCasa(userId: string, casaId: string): Promise<void> {
    await this.assertOwner(userId);
    await this.repo.deleteCasa(casaId);
  }

  /**
   * Elimina una subdivisión.
   */
  async deleteSubdivision(userId: string, subdivisionId: string): Promise<void> {
    await this.assertOwner(userId);
    await this.repo.deleteSubdivision(subdivisionId);
  }

  /**
   * Elimina una zona.
   */
  async deleteZona(userId: string, zonaId: string): Promise<void> {
    await this.assertOwner(userId);
    await this.repo.deleteZona(zonaId);
  }
}

export const cuotasManagementService = new CuotasManagementService();
