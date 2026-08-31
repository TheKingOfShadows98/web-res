import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

async function testSupabase() {
  console.log('================================================');
  console.log('DIAGNÓSTICO DE CONEXIÓN CON SUPABASE');
  console.log('================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  // 1. Probar variables de entorno
  console.log('1. Verificando variables de entorno...');
  if (!supabaseUrl) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL está vacía o no definida.');
  } else {
    console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  }

  if (!supabaseKey) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY está vacía o no definida.');
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: configurada.');
  }

  if (!dbUrl) {
    console.error('❌ ERROR: DIRECT_URL/DATABASE_URL no está configurada.');
  } else {
    console.log('✅ Connection String de la Base de Datos: configurada.');
  }
  console.log('');

  // 2. Probar API REST de Supabase (Client)
  if (supabaseUrl && supabaseKey) {
    console.log('2. Probando conexión a la API REST de Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
      // Intentar una consulta básica a la tabla 'ingreso'
      const { error } = await supabase.from('ingreso').select('id').limit(1);
      
      if (error) {
        // RLS o permisos pueden arrojar error, pero si responde es que hay conexión exitosa
        console.log(`⚠️ Conectado a la API, pero retornó un mensaje del servidor: ${error.message}`);
      } else {
        console.log('✅ Conexión con la API REST exitosa. Consulta ejecutada correctamente.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('❌ ERROR al conectar con la API REST:', errorMsg);
    }
  }
  console.log('');

  // 3. Probar conexión directa TCP a la base de datos (PostgreSQL)
  if (dbUrl) {
    console.log('3. Probando conexión directa TCP a PostgreSQL (Base de Datos)...');
    const pgClient = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pgClient.connect();
      console.log('✅ Conexión directa a PostgreSQL exitosa.');
      const res = await pgClient.query('SELECT NOW()');
      console.log(`✅ Hora del servidor de base de datos: ${res.rows[0].now}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('❌ ERROR de conexión directa a PostgreSQL:', errorMsg);
    } finally {
      await pgClient.end();
    }
  }
  console.log('\n================================================');
}

testSupabase();
