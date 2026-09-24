import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { UserRole } from '@/app/entities/Recivos';
import { usuariosRepository } from '@/repositories/usuarios.repository';

export async function POST(request: NextRequest) {
  try {
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

    // 2. Verificar rol administrativo del solicitante
    const callerRole = await usuariosRepository.getUserRole(callerUser.id, supabase);

    if (callerRole !== UserRole.ADMINISTRADOR && callerRole !== UserRole.OWNER) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de Administrador u Owner.' },
        { status: 403 }
      );
    }

    // 3. Obtener y validar el cuerpo de la petición
    const body = await request.json();
    const { email, rol } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Correo electrónico no válido.' },
        { status: 400 }
      );
    }

    const targetRole = typeof rol === 'number' ? rol : UserRole.MIEMBRO;

    // Solo el Owner puede invitar a otro Owner
    if (targetRole === UserRole.OWNER && callerRole !== UserRole.OWNER) {
      return NextResponse.json(
        { error: 'Solo el Owner principal puede invitar a otro usuario con rol de Owner.' },
        { status: 403 }
      );
    }

    // 4. Determinar la URL de redirección
    const origin =
      request.headers.get('origin') ||
      (request.headers.get('x-forwarded-host')
        ? `https://${request.headers.get('x-forwarded-host')}`
        : request.nextUrl.origin);

    const redirectTo = `${origin}/completar-registro`;

    // 5. Enviar la invitación con el cliente administrativo
    const adminClient = createAdminClient();
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
        data: {
          rol: targetRole,
          invitado_por: callerUser.id,
        },
        redirectTo,
      });

    if (inviteError) {
      console.error('Error al enviar invitación con Supabase Admin:', inviteError);
      return NextResponse.json(
        { error: inviteError.message || 'Error al enviar la invitación por correo.' },
        { status: 400 }
      );
    }

    // 6. Asegurar sincronización en la tabla public.usuario
    if (inviteData?.user) {
      await usuariosRepository.upsertUserProfile(
        {
          id: inviteData.user.id,
          correo: email.trim().toLowerCase(),
          rol: targetRole,
          nombre: 'Usuario Invitado',
          telefono: '',
        },
        adminClient
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invitación enviada exitosamente a ${email}. El enlace vencerá en 15 minutos.`,
      user: inviteData?.user,
    });
  } catch (err) {
    console.error('Error no controlado en /api/admin/invite:', err);
    const errorMsg = err instanceof Error ? err.message : 'Error interno del servidor.';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
