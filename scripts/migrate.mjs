import { Client } from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Usar DIRECT_URL para la migración por ser conexión directa, fallback a DATABASE_URL
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: No se encontró la variable de entorno DIRECT_URL o DATABASE_URL.');
    process.exit(1);
  }

  console.log('Conectando a la base de datos de Supabase...');
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false, // Requerido para conexiones SSL de Supabase
    },
  });

  try {
    await client.connect();
    console.log('Conexión establecida con éxito.');

    const sqlFilePath = path.join(__dirname, '../supabase/migrations/create_tables.sql');
    console.log(`Leyendo archivo de migración desde: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Ejecutando migración SQL en la base de datos...');
    await client.query(sql);

    console.log('================================================');
    console.log('¡MIGRACIÓN COMPLETADA CON ÉXITO!');
    console.log('Las tablas ingreso, egreso, usuario y el trigger');
    console.log('de autenticación han sido creados correctamente.');
    console.log('================================================');
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
