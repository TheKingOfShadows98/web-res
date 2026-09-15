import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { UserRole } from '@/app/entities/Recivos';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await context.params;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID de usuario no proporcionado.' },
        { status: 400 }
      );
    }

    // 1. Verificar autenticación del usuario solicitante
    const supabase = await createClient();
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return NextResponse.json(
        { error: 'No autorizado. Debe iniciar sesión.' },
        { status: 401 }
      );
    }

    // No permitir auto-eliminación por seguridad
    if (callerUser.id === targetUserId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta activa.' },
        { status: 400 }
      );
    }

    // 2. Obtener rol del solicitante
    const { data: callerProfile, error: callerProfileErr } = await supabase
      .from('usuario')
      .select('rol')
      .eq('id', callerUser.id)
      .single();

    if (callerProfileErr || !callerProfile) {
      return NextResponse.json(
        { error: 'No se pudo verificar el perfil del solicitante.' },
        { status: 403 }
      );
    }

    const callerRole = Number(callerProfile.rol);

    // 3. Obtener rol del usuario objetivo a eliminar
    const adminClient = createAdminClient();
    const { data: targetProfile, error: targetProfileErr } = await adminClient
      .from('usuario')
      .select('rol, nombre, correo')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetProfileErr) {
      return NextResponse.json(
        { error: 'Error al consultar datos del usuario a eliminar.' },
        { status: 500 }
      );
    }

    const targetRole = targetProfile ? Number(targetProfile.rol) : UserRole.MIEMBRO;

    // 4. Validar Jerarquía de Roles
    // Regla:
    // - Owner (4): Puede eliminar Administradores (2), Auditores (3), Colaboradores (1) y Miembros (0).
    // - Administrador (2): Solo puede eliminar Miembros (0) y Colaboradores (1).
    // - Otros roles: No tienen permisos.
    let isAllowed = false;

    if (callerRole === UserRole.OWNER) {
      // Owner puede eliminar cualquier rol inferior a Owner
      isAllowed = targetRole < UserRole.OWNER;
    } else if (callerRole === UserRole.ADMINISTRADOR) {
      // Administrador solo puede eliminar Miembros y Colaboradores
      isAllowed = targetRole === UserRole.MIEMBRO || targetRole === UserRole.COLABORADOR;
    }

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            'Permisos insuficientes. La jerarquía de roles no te autoriza a eliminar a este usuario.',
        },
        { status: 403 }
      );
    }

    // 5. Proceder a eliminar de public.usuario y auth.users
    // Borrar de la tabla pública
    await adminClient.from('usuario').delete().eq('id', targetUserId);

    // Borrar de Supabase Auth
    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteAuthErr) {
      console.error('Error al eliminar usuario en auth.admin:', deleteAuthErr);
      return NextResponse.json(
        { error: deleteAuthErr.message || 'Error al eliminar el usuario de Supabase Auth.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Usuario ${targetProfile?.correo || targetUserId} eliminado exitosamente.`,
    });
  } catch (err) {
    console.error('Error no controlado en DELETE /api/admin/users/[id]:', err);
    const errorMsg = err instanceof Error ? err.message : 'Error interno del servidor.';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
