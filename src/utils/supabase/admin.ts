import { createClient } from '@supabase/supabase-js';

/**
 * Crea un cliente administrativo de Supabase con permisos de Service Role.
 * EXCLUSIVO PARA USO EN EL SERVIDOR (API routes, Server Components, Server Actions).
 * Nunca debe exponerse al cliente web.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Faltan variables de entorno para el cliente administrativo: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
