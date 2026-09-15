-- ==============================================================================
-- MIGRACIÓN: Soporte de Rol Predefinido en Invitaciones de Usuario
-- Permite que el trigger handle_new_user asigne automáticamente el rol
-- configurado en raw_user_meta_data al momento de invitar al usuario.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuario (id, nombre, correo, rol, telefono)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario Nuevo'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'rol')::int, 0),
    COALESCE(new.raw_user_meta_data->>'telefono', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET correo = EXCLUDED.correo,
      rol = CASE 
        WHEN public.usuario.rol = 0 AND EXCLUDED.rol <> 0 THEN EXCLUDED.rol
        ELSE public.usuario.rol
      END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
