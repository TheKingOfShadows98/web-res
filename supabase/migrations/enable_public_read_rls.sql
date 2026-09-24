-- ==============================================================================
-- MIGRACIÓN: Habilitar Políticas RLS de Lectura Pública para ADESCO Finanzas
-- Permite que cualquier usuario anónimo (anon) o autenticado (authenticated)
-- pueda consultar (SELECT) los registros de ingreso y egreso con fines de auditoría.
-- La inserción, edición y eliminación permanecen protegidas para usuarios autenticados.
-- ==============================================================================

-- 1. Asegurar que RLS esté habilitado en las tablas financieras
ALTER TABLE public.ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.egresos ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas SELECT previas si existiesen
DROP POLICY IF EXISTS "Permitir lectura publica en ingreso" ON public.ingresos;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en ingreso" ON public.ingresos;
DROP POLICY IF EXISTS "Allow public read access to ingreso" ON public.ingresos;

DROP POLICY IF EXISTS "Permitir lectura publica en egreso" ON public.egresos;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en egreso" ON public.egresos;
DROP POLICY IF EXISTS "Allow public read access to egreso" ON public.egresos;

-- 3. Crear Políticas de Lectura Pública (SELECT) para anon y authenticated
CREATE POLICY "Permitir lectura publica en ingreso" ON public.ingresos
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Permitir lectura publica en egreso" ON public.egresos
    FOR SELECT TO anon, authenticated USING (true);

-- 4. Crear Políticas de Modificación Protegida (INSERT, UPDATE, DELETE) solo para authenticated
CREATE POLICY "Permitir todo a usuarios autenticados en ingreso" ON public.ingresos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados en egreso" ON public.egresos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
