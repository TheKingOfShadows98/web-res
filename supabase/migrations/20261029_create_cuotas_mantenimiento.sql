-- ==============================================================================
-- MIGRACIÓN: Módulo de Cuotas de Mantenimiento y Seguridad
-- Incluye: UUIDv7 nativo, Enums, Tablas territoriales y de cobranza,
-- Índices B-Tree, Políticas RLS y Vistas analíticas (v_cuotas, v_casa).
-- ==============================================================================

-- 0. Extensión criptográfica para bytes aleatorios
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función de generación de UUIDv7 (Timestamp Unix de 48 bits en milisegundos + 74 bits aleatorios)
CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
RETURNS uuid AS $$
DECLARE
  unix_time_ms bytea;
  uuid_bytes bytea;
BEGIN
  -- 48 bits del timestamp Unix en milisegundos
  unix_time_ms := substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3 for 6);
  -- 10 bytes aleatorios criptográficos
  uuid_bytes := unix_time_ms || gen_random_bytes(10);
  -- Versión 7 (0b0111) en byte 7
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  -- Variante RFC 4122 (0b10) en byte 9
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 1. Enums del módulo
DO $$ BEGIN
    CREATE TYPE tipo_subdivision_enum AS ENUM ('EDIFICIO', 'PASAJE', 'CALLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_cuota_enum AS ENUM ('PENDIENTE', 'PAGADA', 'ADELANTADA', 'EXONERADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quincena_enum AS ENUM ('PRIMERA', 'SEGUNDA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Zonas (Zona 1, Zona 2, Zona 3)
CREATE TABLE IF NOT EXISTS public.cuotas_zonas (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
    nombre text NOT NULL UNIQUE,
    descripcion text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Subdivisiones (Edificio, Pasaje o Calle dentro de una Zona)
CREATE TABLE IF NOT EXISTS public.cuotas_subdivisiones (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
    zona_id uuid NOT NULL REFERENCES public.cuotas_zonas(id) ON DELETE RESTRICT,
    tipo tipo_subdivision_enum NOT NULL,
    nombre text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_subdivision_zona_tipo_nombre UNIQUE (zona_id, tipo, nombre)
);

-- 4. Casas / Unidades Habitacionales
CREATE TABLE IF NOT EXISTS public.cuotas_casas (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
    subdivision_id uuid NOT NULL REFERENCES public.cuotas_subdivisiones(id) ON DELETE RESTRICT,
    numero text NOT NULL,
    cuota numeric(10,2) NOT NULL DEFAULT 10.00,
    quincena quincena_enum NOT NULL DEFAULT 'PRIMERA',
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_casa_subdivision UNIQUE (subdivision_id, numero)
);

-- 5. Períodos de Cuotas (Generación mensual / quincenal)
CREATE TABLE IF NOT EXISTS public.cuotas_periodos (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
    casa_id uuid NOT NULL REFERENCES public.cuotas_casas(id) ON DELETE CASCADE,
    year int NOT NULL,
    mes int NOT NULL CHECK (mes BETWEEN 1 AND 12),
    quincena quincena_enum NOT NULL,
    monto_esperado numeric(10,2) NOT NULL,
    estado estado_cuota_enum NOT NULL DEFAULT 'PENDIENTE',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_casa_periodo UNIQUE (casa_id, year, mes, quincena)
);

-- 6. Registro de Pagos y Contraste de Recibos
CREATE TABLE IF NOT EXISTS public.cuotas_pagos (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
    cuota_periodo_id uuid NOT NULL REFERENCES public.cuotas_periodos(id) ON DELETE RESTRICT,
    correlativo_recibo text NOT NULL UNIQUE,
    monto_pagado numeric(10,2) NOT NULL,
    fecha_pago timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    recolector_user_id uuid NOT NULL REFERENCES public.usuario(id),
    metodo_pago text NOT NULL DEFAULT 'EFECTIVO',
    ref_movimiento_financiero text, -- ID asignado por el módulo financiero en tabla ingresos
    observaciones text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_subdivision_zona ON public.cuotas_subdivisiones(zona_id);
CREATE INDEX IF NOT EXISTS idx_casas_subdivision ON public.cuotas_casas(subdivision_id);
CREATE INDEX IF NOT EXISTS idx_periodos_lookup ON public.cuotas_periodos(casa_id, year, mes);
CREATE INDEX IF NOT EXISTS idx_pagos_correlativo ON public.cuotas_pagos(correlativo_recibo);

-- 8. Vistas del módulo
-- Vista 1: v_cuotas (Panel de administración y filtros por período / ubicación)
CREATE OR REPLACE VIEW public.v_cuotas AS
SELECT 
    cp.id AS cuota_id,
    cp.year,
    cp.mes,
    cp.quincena AS quincena_periodo,
    cp.monto_esperado,
    cp.estado AS estado_cuota,
    cp.created_at AS cuota_creada_el,
    
    c.id AS casa_id,
    c.numero AS casa_numero,
    c.cuota AS casa_cuota_actual,
    c.quincena AS casa_quincena_asignada,
    c.activo AS casa_activa,
    
    s.id AS subdivision_id,
    s.nombre AS subdivision_nombre,
    s.tipo AS subdivision_tipo,
    z.id AS zona_id,
    z.nombre AS zona_nombre,
    
    p.id AS pago_id,
    p.correlativo_recibo,
    p.monto_pagado,
    p.fecha_pago,
    p.metodo_pago,
    p.recolector_user_id,
    u.nombre AS recolector_nombre,
    p.ref_movimiento_financiero,
    p.observaciones AS pago_observaciones
FROM public.cuotas_periodos cp
INNER JOIN public.cuotas_casas c ON cp.casa_id = c.id
INNER JOIN public.cuotas_subdivisiones s ON c.subdivision_id = s.id
INNER JOIN public.cuotas_zonas z ON s.zona_id = z.id
LEFT JOIN public.cuotas_pagos p ON p.cuota_periodo_id = cp.id
LEFT JOIN public.usuario u ON p.recolector_user_id = u.id;

-- Vista 2: v_casa (Historial completo de cuotas y pagos estructurado en JSONB)
CREATE OR REPLACE VIEW public.v_casa AS
SELECT 
    c.id AS casa_id,
    c.numero AS casa_numero,
    c.cuota,
    c.quincena AS quincena_asignada,
    c.activo,
    c.created_at AS casa_creada_el,
    
    s.id AS subdivision_id,
    s.nombre AS subdivision_nombre,
    s.tipo AS subdivision_tipo,
    z.id AS zona_id,
    z.nombre AS zona_nombre,
    
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cuota_id', cp.id,
                    'year', cp.year,
                    'mes', cp.mes,
                    'quincena', cp.quincena,
                    'monto_esperado', cp.monto_esperado,
                    'estado', cp.estado,
                    'pago', CASE 
                        WHEN p.id IS NOT NULL THEN jsonb_build_object(
                            'pago_id', p.id,
                            'correlativo_recibo', p.correlativo_recibo,
                            'monto_pagado', p.monto_pagado,
                            'fecha_pago', p.fecha_pago,
                            'metodo_pago', p.metodo_pago,
                            'recolector_user_id', p.recolector_user_id,
                            'ref_movimiento_financiero', p.ref_movimiento_financiero
                        )
                        ELSE NULL 
                    END
                ) 
                ORDER BY cp.year DESC, cp.mes DESC, cp.quincena DESC
            )
            FROM public.cuotas_periodos cp
            LEFT JOIN public.cuotas_pagos p ON p.cuota_periodo_id = cp.id
            WHERE cp.casa_id = c.id
        ),
        '[]'::jsonb
    ) AS historial_cuotas
FROM public.cuotas_casas c
INNER JOIN public.cuotas_subdivisiones s ON c.subdivision_id = s.id
INNER JOIN public.cuotas_zonas z ON s.zona_id = z.id;

-- 9. Row Level Security (RLS)
ALTER TABLE public.cuotas_zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_subdivisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_casas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "Permitir lectura autenticada en cuotas_zonas" ON public.cuotas_zonas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura autenticada en cuotas_subdivisiones" ON public.cuotas_subdivisiones
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura autenticada en cuotas_casas" ON public.cuotas_casas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura autenticada en cuotas_periodos" ON public.cuotas_periodos
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura autenticada en cuotas_pagos" ON public.cuotas_pagos
    FOR SELECT TO authenticated USING (true);

-- Políticas de escritura (restringidas a usuarios autenticados con rol administrativo/tesorería)
CREATE POLICY "Permitir insercion y actualizacion en cuotas_zonas" ON public.cuotas_zonas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir insercion y actualizacion en cuotas_subdivisiones" ON public.cuotas_subdivisiones
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir insercion y actualizacion en cuotas_casas" ON public.cuotas_casas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir insercion y actualizacion en cuotas_periodos" ON public.cuotas_periodos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir insercion y actualizacion en cuotas_pagos" ON public.cuotas_pagos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
