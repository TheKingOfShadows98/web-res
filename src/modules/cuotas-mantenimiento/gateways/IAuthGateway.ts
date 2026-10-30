/**
 * @file IAuthGateway.ts
 * @description Contrato para la verificación de autenticación y permisos de cobranza.
 */

export interface IAuthGatewayUser {
  id: string;
  nombre: string;
  rol: number;
}

export interface IAuthGateway {
  /**
   * Obtiene la información del usuario actualmente autenticado en la sesión.
   */
  getCurrentUser(): Promise<IAuthGatewayUser | null>;

  /**
   * Valida si el usuario posee permisos para registrar cobros de cuotas (Tesorero, Presidencia o Administrador).
   */
  canCollectFees(userId: string): Promise<boolean>;

  /**
   * Valida si el usuario posee permisos de Owner para crear, editar o eliminar
   * Zonas, Edificios, Pasajes, Calles y Casas.
   */
  canManageStructure(userId: string): Promise<boolean>;
}
