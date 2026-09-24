/**
 * @file usuarios.repository.ts
 * @description Repositorio centralizado para el acceso a datos y gestión de usuarios y roles en Supabase.
 * @module repositories/usuarios
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { IUsuario, UserRole } from '@/app/entities/Recivos';

export class UsuariosRepository {
  private defaultClient?: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.defaultClient = client;
  }

  private getClient(clientOverride?: SupabaseClient): SupabaseClient {
    return clientOverride || this.defaultClient || createClient();
  }

  /**
   * Obtiene el perfil completo de un usuario por su ID.
   */
  async getUserProfile(
    userId: string,
    clientOverride?: SupabaseClient
  ): Promise<IUsuario | null> {
    const supabase = this.getClient(clientOverride);

    const query = supabase
      .from('usuario')
      .select('id, nombre, correo, rol, telefono')
      .eq('id', userId);

    const { data, error } = typeof query.maybeSingle === 'function'
      ? await query.maybeSingle()
      : await query.single();

    if (error) {
      console.error(`Error al consultar perfil del usuario ${userId}:`, error);
      throw error;
    }

    return data as IUsuario | null;
  }

  /**
   * Obtiene únicamente el rol numérico de un usuario.
   */
  async getUserRole(
    userId: string,
    clientOverride?: SupabaseClient
  ): Promise<number> {
    const supabase = this.getClient(clientOverride);

    try {
      const query = supabase
        .from('usuario')
        .select('rol')
        .eq('id', userId);

      const { data, error } = typeof query.maybeSingle === 'function'
        ? await query.maybeSingle()
        : await query.single();

      if (error || !data) {
        return UserRole.MIEMBRO;
      }

      return typeof data.rol === 'number' ? data.rol : UserRole.MIEMBRO;
    } catch {
      return UserRole.MIEMBRO;
    }
  }

  /**
   * Obtiene la lista completa de usuarios registrados en el sistema.
   */
  async getAllUsers(clientOverride?: SupabaseClient): Promise<IUsuario[]> {
    const supabase = this.getClient(clientOverride);

    const { data, error } = await supabase
      .from('usuario')
      .select('id, nombre, correo, rol, telefono')
      .order('id', { ascending: true });

    if (error) throw error;

    return (data || []) as IUsuario[];
  }

  /**
   * Actualiza los datos del perfil de un usuario.
   */
  async updateUserProfile(
    userId: string,
    data: Partial<Omit<IUsuario, 'id'>>,
    clientOverride?: SupabaseClient
  ): Promise<void> {
    const supabase = this.getClient(clientOverride);

    const { error } = await supabase
      .from('usuario')
      .update(data)
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Actualiza el rol asignado a un usuario.
   */
  async updateUserRole(
    userId: string,
    newRole: number,
    clientOverride?: SupabaseClient
  ): Promise<void> {
    const supabase = this.getClient(clientOverride);

    const { error } = await supabase
      .from('usuario')
      .update({ rol: newRole })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Inserta o actualiza un registro de usuario (Upsert).
   */
  async upsertUserProfile(
    data: Partial<IUsuario> & { id: string },
    clientOverride?: SupabaseClient
  ): Promise<void> {
    const supabase = this.getClient(clientOverride);

    const { error } = await supabase.from('usuario').upsert(data, { onConflict: 'id' });
    if (error) throw error;
  }

  /**
   * Elimina un usuario de la tabla pública usuario.
   */
  async deleteUserProfile(
    userId: string,
    clientOverride?: SupabaseClient
  ): Promise<void> {
    const supabase = this.getClient(clientOverride);

    const { error } = await supabase.from('usuario').delete().eq('id', userId);
    if (error) throw error;
  }
}

export const usuariosRepository = new UsuariosRepository();
