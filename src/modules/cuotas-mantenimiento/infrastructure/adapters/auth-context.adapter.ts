/**
 * @file auth-context.adapter.ts
 * @description Adaptador que implementa IAuthGateway contra el repositorio de usuarios y Supabase Auth.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { usuariosRepository } from '@/repositories/usuarios.repository';
import { UserRole } from '@/app/entities/Recivos';
import { IAuthGateway, IAuthGatewayUser } from '../../gateways/IAuthGateway';

export class AuthContextAdapter implements IAuthGateway {
  private client?: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client;
  }

  private getClient(): SupabaseClient {
    return this.client || createClient();
  }

  async getCurrentUser(): Promise<IAuthGatewayUser | null> {
    const supabase = this.getClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const profile = await usuariosRepository.getUserProfile(user.id, supabase);
    const role = profile ? Number(profile.rol) : UserRole.MIEMBRO;

    return {
      id: user.id,
      nombre: profile?.nombre || user.email || 'Usuario',
      rol: role,
    };
  }

  async canCollectFees(userId: string): Promise<boolean> {
    const supabase = this.getClient();
    const role = await usuariosRepository.getUserRole(userId, supabase);

    // Roles con autorización de cobranza: Tesorería (6), Presidencia (5), Administrador (2), Owner (4) o Colaborador (1)
    return (
      role === UserRole.TESORERIA ||
      role === UserRole.PRESIDENCIA ||
      role === UserRole.COLABORADOR ||
      role === UserRole.ADMINISTRADOR ||
      role === UserRole.OWNER
    );
  }

  async canManageStructure(userId: string): Promise<boolean> {
    const supabase = this.getClient();
    const role = await usuariosRepository.getUserRole(userId, supabase);

    // Solo el Rol OWNER posee privilegios para crear/modificar Zonas, Subdivisiones y Casas
    return role === UserRole.OWNER;
  }
}

export const authGateway = new AuthContextAdapter();
